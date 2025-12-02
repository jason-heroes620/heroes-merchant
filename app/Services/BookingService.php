<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\EventSlot;
use App\Models\EventSlotPrice;
use App\Models\CustomerWallet;
use App\Models\Reminder;
use App\Jobs\SendPushNotification;
use App\Jobs\SendReminder;
use App\Services\WalletService;
use App\Services\SlotAvailabilityService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class BookingService
{
    protected WalletService $walletService;
    protected SlotAvailabilityService $slotAvailability;

    public function __construct(WalletService $walletService, SlotAvailabilityService $slotAvailability)
    {
        $this->walletService = $walletService;
        $this->slotAvailability = $slotAvailability;
    }

    public function bookSlot($customer, EventSlot $slot, array $quantitiesByAgeGroup, bool $allowFallback = false)
    {
        return DB::transaction(function () use ($customer, $slot, $quantitiesByAgeGroup, $allowFallback) {
            $totalQuantity = array_sum($quantitiesByAgeGroup);
            if ($totalQuantity < 1) {
                throw new \Exception('Please select at least one ticket.');
            }

            // Lock slot
            $slot = EventSlot::where('id', $slot->id)->lockForUpdate()->firstOrFail();

            if (! $this->slotAvailability->isAvailable($slot, $totalQuantity)) {
                throw new \Exception('Not enough seats available for this slot.');
            }

            $wallet = $customer->wallet ?? throw new \Exception('Wallet not found.');

            // Step 1: Validate credits first
            foreach ($quantitiesByAgeGroup as $ageGroupId => $quantity) {
                if ($quantity < 1) continue;

                $ageGroupIdForQuery = $ageGroupId === 'general' ? null : $ageGroupId;
                $slotPrice = $slot->prices()
                    ->when($ageGroupIdForQuery, fn($q) => $q->where('event_age_group_id', $ageGroupIdForQuery))
                    ->first();

                $requiredPaid = $slotPrice->paid_credits ?? 0;
                $requiredFree = $slotPrice->free_credits ?? 0;

                $this->walletService->canBookWithCredits($wallet, $requiredPaid, $requiredFree, $quantity, $allowFallback);
            }

            // Step 2: Create main booking
            $booking = Booking::create([
                'customer_id' => $customer->id,
                'event_id' => $slot->event_id,
                'slot_id' => $slot->id,
                'wallet_id' => $wallet->id,
                'status' => 'confirmed',
                'booked_at' => now(),
                'quantity' => $totalQuantity,
            ]);

            // Step 3: Create booking items per age group
            foreach ($quantitiesByAgeGroup as $ageGroupId => $quantity) {
                if ($quantity < 1) continue;

                $ageGroupIdForQuery = $ageGroupId === 'general' ? null : $ageGroupId;
                $slotPrice = $slot->prices()
                    ->when($ageGroupIdForQuery, fn($q) => $q->where('event_age_group_id', $ageGroupIdForQuery))
                    ->first();

                Log::info("Creating BookingItem", [
                    'booking_id' => $booking->id,
                    'age_group_id' => $ageGroupIdForQuery,
                    'quantity' => $quantity,
                    'paid' => $slotPrice->paid_credits,
                    'free' => $slotPrice->free_credits,
                ]);

                BookingItem::create([
                    'booking_id' => $booking->id,
                    'age_group_id' => $ageGroupIdForQuery,
                    'quantity' => $quantity,
                    'paid_credits' => $slotPrice->paid_credits ?? 0,
                    'free_credits' => $slotPrice->free_credits ?? 0,
                    'price' => $slotPrice->price ?? 0,
                ]);
            }

            // Step 4: Deduct credits after booking items
            $totalPaid = 0;
            $totalFree = 0;

            foreach ($quantitiesByAgeGroup as $ageGroupId => $quantity) {
                if ($quantity < 1) continue;

                $ageGroupIdForQuery = $ageGroupId === 'general' ? null : $ageGroupId;
                $slotPrice = $slot->prices()
                    ->when($ageGroupIdForQuery, fn($q) => $q->where('event_age_group_id', $ageGroupIdForQuery))
                    ->first();
                $totalPaid += ($slotPrice->paid_credits ?? 0) * $quantity;
                $totalFree += ($slotPrice->free_credits ?? 0) * $quantity;
            }

            $this->walletService->deductCredits(
                $wallet,
                $totalPaid,
                $totalFree,
                "Booking for slot {$slot->id}",
                $booking->id,
                1,
                $allowFallback
            );

            // Step 5: Generate QR & send notifications
            $this->generateQrCode($booking);
            $this->sendConfirmationAndReminder($customer, $slot, $booking);

            return $booking;
        });
    }

    /**
     * 1️⃣ Create booking & validate everything
     */
    // private function createBooking($customer, $slot, $ageGroupId, $quantity)
    // {
    //     // Reload with lock
    //     $slot = EventSlot::where('id', $slot->id)
    //         ->lockForUpdate()
    //         ->firstOrFail();

    //     if (! $this->slotAvailability->isAvailable($slot, $quantity)) {
    //         throw new \Exception('Not enough seats available for this slot.');
    //     }

    //     $event = $slot->event;
    //     $ageGroups = $event->age_groups ?? collect([]);

    //     if ($event->is_suitable_for_all_ages || $ageGroups->count() === 0) {
    //         $slotPrice = $slot->prices()->first();
    //     } else {
    //         $slotPrice = $slot->prices()
    //             ->when($ageGroupId, fn($q) => $q->where('event_age_group_id', $ageGroupId))
    //             ->first();
    //     }

    //     $requiredFree = $slotPrice->free_credits ?? 0;
    //     $requiredPaid = $slotPrice->paid_credits ?? 0;

    //     $wallet = $customer->wallet ?? throw new \Exception('Wallet not found.');

    //     if (! $this->walletService->hasEnoughCredits($wallet, $requiredPaid, $requiredFree, $quantity)) {
    //         throw new \Exception('Insufficient credits for the requested quantity.');
    //     }

    //     $booking = Booking::create([
    //         'customer_id' => $customer->id,
    //         'event_id' => $slot->event_id,
    //         'slot_id' => $slot->id,
    //         'wallet_id' => $wallet->id,
    //         'age_group_id' => $ageGroupId,
    //         'status' => 'confirmed',
    //         'booked_at' => now(),
    //         'quantity' => $quantity,
    //     ]);

    //     return [$booking, $slot, $requiredFree, $requiredPaid];
    // }

    // /**
    //  * 2️⃣ Deduct credits + reduce slot capacity
    //  */
    // private function processCreditsAndCapacity($customer, $slot, $booking, $requiredFree, $requiredPaid, $quantity)
    // {
    //     $wallet = $customer->wallet;

    //     $this->walletService->deductCredits(
    //         $wallet,
    //         $requiredPaid,
    //         $requiredFree,
    //         "Booking: {$booking->id} for slot {$slot->id}",
    //         $booking->id,
    //         $quantity
    //     );
    // }

    /**
     * 3️⃣ Generate QR Code
     */
    private function generateQrCode($booking)
    {
        try {
            $content = json_encode(['booking_id' => (string)$booking->id]);

            $dir = public_path('qrcodes');
            File::ensureDirectoryExists($dir);

            $file = $dir . "/{$booking->id}.png";

            QrCode::format('svg')
                ->size(300)
                ->generate($content, $file);

            $booking->qr_code_path = "qrcodes/{$booking->id}.png";
            $booking->save();
        } catch (\Exception $e) {
            \Log::error('QR code generation failed', [
                'booking_id' => $booking->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception('QR code generation failed: ' . $e->getMessage());
        }
    }

    /**
     * 4️⃣ Send push notification and schedule reminder
     */
    private function sendConfirmationAndReminder($customer, $slot, $booking)
    {
        // Push
        SendPushNotification::dispatch(
            $customer->id,
            "Booking confirmed",
            "Your booking is confirmed.",
            ['booking_id' => (string)$booking->id]
        );

        $event = $slot->event;

        $rawDate = $slot->date ?? optional($event->dates->first())->start_date;

        if (!$rawDate) {
            \Log::warning('No slot or event date found', ['slot_id' => $slot->id, 'event_id' => $event->id]);
            return;
        }

        $slotDate = Carbon::parse($rawDate)->format('Y-m-d');
        $slotTime = Carbon::parse($slot->start_time)->format('H:i:s');
        $slotStart = Carbon::parse("{$slotDate} {$slotTime}", 'Asia/Kuala_Lumpur');
        \Log::info("Slot start datetime:", ['slotStart' => $slotStart->toDateTimeString()]);

        // 24 hrs before event
        $reminderAt = $slotStart->copy()->subHours(24);

        if ($reminderAt->isPast()) {
            $reminderAt = now('Asia/Kuala_Lumpur')->addMinute();
        }

        $reminder = Reminder::create([
            'booking_id' => $booking->id,
            'scheduled_at' => $reminderAt,
        ]);

        $delaySeconds = $reminderAt->diffInSeconds(now('Asia/Kuala_Lumpur'));

        SendReminder::dispatch($reminder->id)
            ->delay($reminderAt);
    }

    /**
     * Cancel booking
     */
    public function cancelBooking(Booking $booking)
    {
        return DB::transaction(function () use ($booking) {
            $slot = $booking->slot()->lockForUpdate()->firstOrFail();
            $wallet = $booking->wallet;

            // Booking time (GMT+8)
            $slotStart = Carbon::parse($slot->date . ' ' . $slot->start_time);
            $now = Carbon::now('Asia/Kuala_Lumpur');
            $hoursUntilStart = $now->diffInHours($slotStart, false); 

            // Mark booking as cancelled
            $booking->status = 'cancelled';
            $booking->cancelled_at = now();
            $booking->save();

            // Cancel reminder record (so job will do nothing)
            $reminder = Reminder::where('booking_id', $booking->id)->first();
            if ($reminder) {
                $reminder->status = 'cancelled';
                $reminder->save();
            }

            // If cancellation happens more than 24 hours before slot start -> refund, else forfeit
            if ($hoursUntilStart >= 24) {
                // refund: add credits back (negative deduction)
                $this->walletService->deductCredits(
                    $wallet,
                    "Refund for cancellation: {$booking->id}",
                    $booking->id
                );
            } else {
                // less than 24 hours -> credits forfeited (no refund)
            }

            // restore capacity
            if (! $slot->is_unlimited) {
                $slot->capacity += $booking->quantity;
                $slot->save();
            }

            // send push notification about cancellation
            SendPushNotification::dispatch($booking->customer->id, "Booking cancelled", "Your booking was cancelled.", ['booking_id' => (string)$booking->id]);

            return $booking;
        });
    }
}
