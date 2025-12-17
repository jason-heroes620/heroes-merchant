<?php

namespace App\Services;

use App\Models\User;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\EventSlot;
use App\Models\Reminder;
use App\Models\Setting;
use App\Models\Conversion;
use App\Jobs\SendPushNotification;
use App\Jobs\SendReminder;
use App\Services\WalletService;
use App\Services\SlotAvailabilityService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\WalletTransactionNotification;
use App\Notifications\MerchantBookingNotification;

class BookingService
{
    protected WalletService $walletService;
    protected SlotAvailabilityService $slotAvailability;

    public function __construct(WalletService $walletService, SlotAvailabilityService $slotAvailability)
    {
        $this->walletService = $walletService;
        $this->slotAvailability = $slotAvailability;
    }

    public function bookSlot($customer, EventSlot $slot, array $quantitiesByAgeGroup, Conversion $conversion, bool $allowFallback = false)
    {
        return DB::transaction(function () use ($customer, $slot, $quantitiesByAgeGroup, $conversion, $allowFallback) {
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
            $bookingItemsData = [];
            $totalPaid = 0;
            $totalFree = 0;

            foreach ($quantitiesByAgeGroup as $ageGroupId => $quantity) {
                if ($quantity < 1) continue;

                $ageGroupIdForQuery = $ageGroupId === 'general' ? null : $ageGroupId;
                $slotPrice = $slot->prices()
                    ->when($ageGroupIdForQuery, fn($q) => $q->where('event_age_group_id', $ageGroupIdForQuery))
                    ->first();

                $requiredPaid = $slotPrice->paid_credits ?? 0;

                // Step 1: Calculate additional paid needed
                $additionalPaidInfo = $this->walletService->calculateAdditionalPaid(
                    $wallet,
                    $requiredPaid,
                    $conversion,
                    $quantity
                );

                $requiredFree = (int) ceil($requiredPaid / $additionalPaidInfo['paidToFreeRatio']);

                Log::info('Credit calculation', [
                    'paid_needed_per_ticket' => $requiredPaid,
                    'quantity' => $quantity,
                    'wallet_paid' => $wallet->cached_paid_credits,
                    'wallet_free' => $wallet->cached_free_credits,
                    'paid_to_free_ratio' => $additionalPaidInfo['paidToFreeRatio'],
                    'shortfall_free' => $additionalPaidInfo['shortfallFree'],
                ]);

                $this->walletService->canBookWithCredits($wallet, $requiredPaid, $conversion, $quantity, $allowFallback);

                $bookingItemsData[] = [
                    'age_group_id' => $ageGroupIdForQuery,
                    'quantity' => $quantity,
                    'paid_credits' => $requiredPaid,
                    'free_credits' => $requiredFree,
                    'additional_paid' => $additionalPaidInfo['shortfallFree'], // pass to frontend
                ];

                $totalPaid += $requiredPaid * $quantity;
                $totalFree += $requiredFree * $quantity;
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
            foreach ($bookingItemsData as $item) {
                BookingItem::create(array_merge($item, [
                    'booking_id' => $booking->id
                ]));
            }

            $slotDate = $slot->date
                ? $slot->date->format('Y-m-d')
                : optional($slot->event->dates->first())->start_date?->format('Y-m-d');

            $slotTime = $slot->start_time instanceof Carbon
                ? $slot->start_time->format('H:i:s')
                : $slot->start_time;

            $desc = "Booking Code {$booking->booking_code}:\nBooking Confirmed for '{$slot->event->title}' on {$slotDate} at {$slotTime}";

            // Step 4: Deduct credits
            $this->walletService->deductCredits(
                $wallet,
                $totalPaid,
                $conversion, 
                 $desc,
                $booking->id,
                1,
                $allowFallback
            );

            // Step 5: Notifications (same as before)
            $transaction = $booking->transactions()->where('type', 'booking')->first();
            if ($transaction) {
                Notification::send(
                    User::where('role', 'admin')->get(),
                    new WalletTransactionNotification(
                        $transaction,
                        $customer->user->full_name,
                        $customer->id,
                        $slot->event->title,
                        $slot->date?->format('Y-m-d'),
                        $slot->start_time instanceof Carbon ? $slot->start_time->format('H:i:s') : $slot->start_time
                    )
                );
            }

            $merchantUser = $slot->event->merchant->user ?? null;
            if ($merchantUser) {
                Notification::send(
                    $merchantUser,
                    new MerchantBookingNotification(
                        $customer->user->full_name,
                        $booking->booking_code,
                        $slot->event->title,
                        $slotDate,
                        $slotTime,
                        'confirmed'
                    )
                );

                SendPushNotification::dispatch(
                    (string) $merchantUser->id,
                    (string) $merchantUser->id,
                    "New Booking: {$booking->booking_code}",
                    "{$customer->user->full_name} booked '{$slot->event->title}' on {$slotDate} at {$slotTime}.",
                    ['booking_id' => $booking->id]
                );
            }

            $this->sendConfirmationAndReminder($customer, $slot, $booking);

            // Step 6: Return booking with calculated credits for frontend
            return [
                'booking' => $booking->load('items'),
                'total_paid_credits' => $totalPaid,
                'total_free_credits' => $totalFree,
                'items' => $bookingItemsData,
                'paid_to_free_ratio' => $conversion->paid_to_free_ratio, 
                'additional_paid_needed' => array_sum(array_column($bookingItemsData, 'additional_paid')),
            ];
        });
    }

    /**
     * 4️⃣ Send push notification and schedule reminder
     */
    private function sendConfirmationAndReminder($customer, $slot, $booking)
    {
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

        $eventTitle = $event->title;

        SendPushNotification::dispatch(
            (string) $customer->id,
            "", // merchantId
            "Booking Confirmed: {$booking->booking_code}", 
            "Your booking for '{$eventTitle}' on {$slotDate} at {$slotTime} is confirmed.",
            [
                'booking_id' => $booking->booking_id, 
            ]
        );

        if (!$slotDate || !$slotTime) {
            Log::warning('No slot date or start time found', [
                'slot_id' => $slot->id,
                'event_id' => $event->id,
                'slot_date' => $slotDate,
                'start_time' => $slotTime,
            ]);
            return;
        }

        $slotStart = Carbon::createFromFormat('Y-m-d H:i:s', "{$slotDate} {$slotTime}", 'Asia/Kuala_Lumpur');
        Log::info("Slot start datetime:", ['slotStart' => $slotStart->toDateTimeString()]);

        // 24 hrs before event
        $reminderAt = $slotStart->copy()->subHours(24);

        if ($reminderAt->isPast()) {
            $reminderAt = now('Asia/Kuala_Lumpur')->addMinute();
        }

        $reminder = Reminder::create([
            'booking_id' => $booking->id,
            'scheduled_at' => $reminderAt,
        ]);

        SendReminder::dispatch($reminder->id)
            ->delay($reminderAt);
    }

    public function cancelBooking(Booking $booking, bool $force = false)
    {
        return DB::transaction(function () use ($booking, $force) {

            // Already cancelled?
            if ($booking->status === 'cancelled') {
                Log::info("Booking {$booking->id} already cancelled.");
                return [
                    'booking_id' => (string)$booking->id,
                    'refunded' => false,
                    'message' => 'Booking is already cancelled.'
                ];
            }

            // Only block cancellation if status is not confirmed and not forced
            if ($booking->status !== 'confirmed' && !$force) {
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

            $cancellationHours = (int) Setting::get('cancellation_policy_hours', 24);

            $eligibleForRefund =
                now('Asia/Kuala_Lumpur')->lt(
                    $slotStart->copy()->subHours($cancellationHours)
                ) || $force;

            $transaction = $booking->transactions()->where('type', 'booking')->first();

            if (!$transaction && !$force) {
                throw new \Exception('No credit transaction found for this booking.');
            }

            if ($transaction && $eligibleForRefund) {
                $this->walletService->refundCredits($transaction, $booking->wallet_id);
            }

            $totalSeats = $booking->items->sum('quantity');

            $booking->status = 'cancelled';
            $booking->cancelled_at = now();
            $booking->save();

            Log::info("Booking {$booking->id} cancelled", [
                'refunded' => $eligibleForRefund,
                'seats_restored' => $totalSeats,
                'force' => $force
            ]);

            // Send notification if transaction exists
            if ($transaction) {
                $typeLabel = $eligibleForRefund ? 'Booking Refund' : 'Booking Cancellation (Credits Forfeited)';
                $creditsText = $eligibleForRefund
                    ? "{$transaction->delta_free} free credits and {$transaction->delta_paid} paid credits refunded"
                    : "{$transaction->delta_free} free credits and {$transaction->delta_paid} paid credits forfeited";

                Notification::send(
                    User::where('role', 'admin')->get(),
                    new WalletTransactionNotification(
                        $transaction,
                        $booking->customer->user->full_name,
                        $booking->customer->id,
                        $slot->event->title,
                        $slotDate,
                        $slotTime,
                        $booking->booking_code,
                        $eligibleForRefund
                    )
                );
            }

            $merchantUser = $booking->slot->event->merchant->user ?? null;

            if ($merchantUser) {
                $status = $eligibleForRefund ? 'refunded' : 'cancelled';

                Notification::send(
                    $merchantUser,
                    new MerchantBookingNotification(
                        $booking->customer->user->full_name,
                        $booking->booking_code,
                        $booking->slot->event->title,
                        $slotDate,
                        $slotTime,
                        $status
                    )
                );

                SendPushNotification::dispatch(
                    (string) $merchantUser->id,
                    (string) $merchantUser->id,
                    "Booking {$status}: {$booking->booking_code}",
                    "{$booking->customer->user->full_name}'s booking '{$booking->booking_code}' for '{$booking->slot->event->title}' on {$slotDate} at {$slotTime} has been {$status}.",
                    [
                        'booking_id' => $booking->id,
                    ]
                );
            }

            return [
                'booking_id' => (string)$booking->id,
                'refunded' => $eligibleForRefund,
                'message' => $transaction
                    ? ($eligibleForRefund 
                        ? 'Booking successfully cancelled and credits refunded.'
                        : 'Booking successfully cancelled. Credits forfeited (within 24 hours).')
                    : 'Booking cancelled without transaction.'
            ];
        });
    }
}
