<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\EventSlot;
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
                    'free_credits' => $slotPrice->free_credits ?? 0,                ]);
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
     * 3️⃣ Generate QR Code
     */
    private function generateQrCode($booking)
    {
        try {
            $content = json_encode(['booking_id' => (string)$booking->id]);

            $dir = public_path('qrcodes');
            File::ensureDirectoryExists($dir);

            $file = $dir . "/{$booking->id}.svg";

            QrCode::format('svg')
                ->size(300)
                ->generate($content, $file);

            $booking->qr_code_path = "qrcodes/{$booking->id}.svg";
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

        $slotDate = $slot->date 
        ? $slot->date->format('Y-m-d') 
        : (optional($event->dates->first())->start_date 
            ? optional($event->dates->first())->start_date->format('Y-m-d') 
            : null
        );

    $slotTime = $slot->start_time instanceof Carbon
        ? $slot->start_time->format('H:i:s')
        : $slot->start_time;

    if (!$slotDate || !$slotTime) {
        \Log::warning('No slot date or start time found', [
            'slot_id' => $slot->id,
            'event_id' => $event->id,
            'slot_date' => $slotDate,
            'start_time' => $slotTime,
        ]);
        return;
    }

    $slotStart = Carbon::createFromFormat('Y-m-d H:i:s', "{$slotDate} {$slotTime}", 'Asia/Kuala_Lumpur');
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

    public function cancelBooking(Booking $booking)
    {
        return DB::transaction(function () use ($booking) {

            if ($booking->status !== 'confirmed') {
                throw new \Exception('This booking cannot be cancelled.');
            }

            $slot = $booking->slot;
            $event = $slot->event;

            // Determine slot start datetime
            $slotDate = $slot->date 
                ? $slot->date->format('Y-m-d') 
                : optional($event->dates->first())->start_date?->format('Y-m-d');

            $slotTime = $slot->start_time instanceof Carbon
                ? $slot->start_time->format('H:i:s')
                : $slot->start_time;

            if (!$slotDate || !$slotTime) {
                throw new \Exception('Unable to determine event start time. Cancellation blocked.');
            }

            $slotStart = Carbon::createFromFormat('Y-m-d H:i:s', "{$slotDate} {$slotTime}", 'Asia/Kuala_Lumpur');

            // 24-hour cutoff
            $eligibleForRefund = now('Asia/Kuala_Lumpur')->lt($slotStart->copy()->subHours(24));

            // Fetch the original credit transaction for the booking
            $transaction = $booking->transactions()
                ->where('type', 'booking')
                ->first();

            if (!$transaction) {
                throw new \Exception('No credit transaction found for this booking.');
            }

            // Refund credits (only if before 24hr cutoff)
            if ($eligibleForRefund) {
                $this->walletService->refundCredits($transaction, $booking->wallet_id);
            }

           $totalSeats = $booking->items->sum('quantity');

            // Mark booking cancelled
            $booking->status = 'cancelled';
            $booking->cancelled_at = now();
            $booking->save();

            Log::info("Booking {$booking->id} cancelled", [
                'refunded' => $eligibleForRefund,
                'seats_restored' => $totalSeats,
            ]);

            // Mark booking cancelled
            $booking->status = 'cancelled';
            $booking->cancelled_at = now();
            $booking->save();

            Log::info("Booking {$booking->id} cancelled", [
                'refunded' => $eligibleForRefund,
                'seats_restored' => true,
            ]);

            return [
                'booking_id' => (string)$booking->id,
                'refunded' => $eligibleForRefund,
                'message' => $eligibleForRefund 
                    ? 'Booking cancelled and credits refunded.'
                    : 'Booking cancelled. Credits forfeited (within 24 hours).'
            ];
        });
    }
}
