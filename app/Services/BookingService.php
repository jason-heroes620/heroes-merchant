<?php

namespace App\Services;

use App\Models\User;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\EventSlot;
use App\Models\Reminder;
use App\Models\Setting;
use App\Jobs\SendPushNotification;
use App\Jobs\SendReminder;
use App\Services\WalletService;
use App\Services\ConversionService;
use App\Services\SlotAvailabilityService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\WalletTransactionNotification;
use App\Notifications\MerchantBookingNotification;

class BookingService
{
    protected WalletService $walletService;
    protected ConversionService $conversionService;
    protected SlotAvailabilityService $slotAvailability;

    public function __construct(WalletService $walletService, ConversionService $conversionService, SlotAvailabilityService $slotAvailability)
    {
        $this->walletService = $walletService;
        $this->conversionService = $conversionService;
        $this->slotAvailability = $slotAvailability;
    }

    public function bookSlot(
        $customer,
        EventSlot $slot,
        array $quantitiesByAgeGroup,
        bool $allowFallback = false
    ) {
        return DB::transaction(function () use ($customer, $slot, $quantitiesByAgeGroup, $allowFallback) {

            $totalQuantity = array_sum($quantitiesByAgeGroup);
            if ($totalQuantity < 1) {
                throw new \Exception('Please select at least one ticket.');
            }

            // Lock slot
            $slot = EventSlot::where('id', $slot->id)->lockForUpdate()->firstOrFail();

            if (!$this->slotAvailability->isAvailable($slot, $totalQuantity)) {
                throw new \Exception('Not enough seats available for this slot.');
            }

            $wallet = $customer->wallet ?? throw new \Exception('Wallet not found.');

            $schedule = $this->buildSlotSchedule($slot);

            $slotDateDisplay = $schedule['date_display'];
            $slotTimeDisplay = $schedule['time_display'];

            $desc = sprintf(
                "Booking for '%s' (%s, %s)",
                $slot->event->title,
                $slotDateDisplay,
                $slotTimeDisplay
            );

            $desc = sprintf(
                "Booking for '%s' (%s, %s)",
                $slot->event->title,
                $slotDateDisplay,
                $slotTimeDisplay
            );

            $bookingItemsData = [];
            $totalPaidCredits = 0;
            $totalFreeCredits = 0;

            foreach ($quantitiesByAgeGroup as $ageGroupId => $quantity) {
                if ($quantity < 1) continue;

                $ageGroupIdForQuery = $ageGroupId === 'general' ? null : $ageGroupId;

                $slotPrice = $slot->prices()
                    ->when($ageGroupIdForQuery, fn($q) => $q->where('event_age_group_id', $ageGroupIdForQuery))
                    ->firstOrFail();

                $activationMode = $slotPrice->activation_mode;

                // --- CREDIT BOOKING ---
                if ($activationMode === 'convert_credits') {
                    $freePerTicket = $slotPrice->free_credits ?? 0;
                    $paidPerTicket = $slotPrice->paid_credits ?? 0;

                    // Validate wallet can cover booking
                    $this->walletService->canBookWithCredits(
                        $wallet,
                        $freePerTicket,
                        $quantity,
                        $allowFallback
                    );

                    // Deduct credits and get actual spent
                    $deductionResult = $this->walletService->deductCredits(
                        $wallet,
                        $freePerTicket,
                        $paidPerTicket,
                        $desc,
                        null, // bookingId added later
                        $quantity,
                        $allowFallback
                    );

                    $actualFreeSpent = $deductionResult['deducted_free'];
                    $actualPaidSpent = $deductionResult['deducted_paid'];

                    // Add booking item
                    $bookingItemsData[] = [
                        'age_group_id' => $ageGroupIdForQuery,
                        'quantity' => $quantity,
                        'free_credits' => $actualFreeSpent,
                        'paid_credits' => $actualPaidSpent,
                        'activation_mode' => $activationMode,
                        'additional_paid' => max(0, $actualPaidSpent - $paidPerTicket * $quantity),
                    ];

                    $totalFreeCredits += $actualFreeSpent;
                    $totalPaidCredits += $actualPaidSpent;
                }
                // --- RM-BASED BOOKING ---
                else {
                    $bookingItemsData[] = [
                        'age_group_id' => $ageGroupIdForQuery,
                        'quantity' => $quantity,
                        'paid_credits' => 0,
                        'free_credits' => $activationMode === 'custom_free_credits'
                            ? $slotPrice->free_credits ?? 0
                            : 0,
                        'activation_mode' => $activationMode,
                        'price_in_rm' => $slotPrice->price_in_rm ?? 0,
                        'additional_paid' => 0,
                    ];

                    if ($activationMode === 'custom_free_credits') {
                        $wallet->increment('cached_free_credits', $slotPrice->free_credits * $quantity);
                    }
                }
            }

            // --- Create main booking ---
            $booking = Booking::create([
                'customer_id' => $customer->id,
                'event_id' => $slot->event_id,
                'slot_id' => $slot->id,
                'wallet_id' => $wallet->id,
                'status' => 'confirmed',
                'booked_at' => now(),
                'quantity' => $totalQuantity,
            ]);

            // --- Save booking items ---
            foreach ($bookingItemsData as $item) {
                BookingItem::create(array_merge($item, ['booking_id' => $booking->id]));
            }

            // --- Notifications ---
            $transaction = $booking->transactions()->where('type', 'booking')->first();

            if ($transaction) {
                Notification::send(
                    User::where('role', 'admin')->get(),
                    new WalletTransactionNotification(
                        $transaction,
                        $customer->user->full_name,
                        $customer->id,
                        $slot->event->title,
                        $slotDateDisplay,
                        $slotTimeDisplay
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
                        $slotDateDisplay,
                        $slotTimeDisplay,
                        'confirmed'
                    )
                );

                SendPushNotification::dispatch(
                    (string) $merchantUser->id,
                    (string) $merchantUser->id,
                    "New Booking: {$booking->booking_code}",
                    "{$customer->user->full_name} booked '{$slot->event->title}' ({$slotDateDisplay}, {$slotTimeDisplay}).",
                    ['booking_id' => $booking->id]
                );
            }

            $this->sendConfirmationAndReminder($customer, $slot, $booking);

            return [
                'booking' => $booking->load('items'),
                'total_paid_credits' => $totalPaidCredits,
                'total_free_credits' => $totalFreeCredits,
                'items' => $bookingItemsData,
                'additional_paid_needed' => array_sum(array_column($bookingItemsData, 'additional_paid')),
            ];
        });
    }

    /**
     * 4️⃣ Send push notification and schedule reminder
     */
    private function sendConfirmationAndReminder($customer, EventSlot $slot, Booking $booking): void
    {
        $schedule = $this->buildSlotSchedule($slot);

        $dateDisplay   = $schedule['date_display'];
        $timeDisplay   = $schedule['time_display'];
        $startDateTime = $schedule['start_datetime'];

        $eventTitle = $slot->event->title;

        // --- Customer confirmation ---
        SendPushNotification::dispatch(
            (string) $customer->id,
            "",
            "Booking Confirmed: {$booking->booking_code}",
            "Your booking for '{$eventTitle}' ({$dateDisplay}, {$timeDisplay}) is confirmed.",
            ['booking_id' => $booking->id]
        );

        // --- Merchant notification ---
        $merchantUser = $slot->event->merchant->user ?? null;
        if ($merchantUser) {
            SendPushNotification::dispatch(
                (string) $merchantUser->id,
                (string) $merchantUser->id,
                "New Booking: {$booking->booking_code}",
                "{$customer->user->full_name} booked '{$eventTitle}' ({$dateDisplay}, {$timeDisplay}).",
                ['booking_id' => $booking->id]
            );
        }

        // --- Reminder (24 hours before start) ---
        if ($startDateTime) {
            $reminderAt = $startDateTime->copy()->subHours(24);

            if ($reminderAt->isPast()) {
                $reminderAt = now('Asia/Kuala_Lumpur')->addMinute();
            }

            $reminder = Reminder::create([
                'booking_id'   => $booking->id,
                'scheduled_at' => $reminderAt,
            ]);

            SendReminder::dispatch($reminder->id)->delay($reminderAt);
        }
    }

    public function cancelBooking(Booking $booking, bool $force = false)
    {
        return DB::transaction(function () use ($booking, $force) {

            if ($booking->status === 'cancelled') {
                return [
                    'booking_id' => (string) $booking->id,
                    'refunded'   => false,
                    'message'    => 'Booking is already cancelled.',
                ];
            }

            if ($booking->status !== 'confirmed' && !$force) {
                throw new \Exception('This booking cannot be cancelled.');
            }

            $slot   = $booking->slot;
            $event  = $slot->event;
            $wallet = $booking->customer->wallet;

            $schedule = $this->buildSlotSchedule($slot);

            $dateDisplay   = $schedule['date_display'];
            $timeDisplay   = $schedule['time_display'];
            $startDateTime = $schedule['start_datetime'];

            if (!$startDateTime && !$force) {
                throw new \Exception('Unable to determine event start time. Cancellation blocked.');
            }

            $cancellationHours = (int) Setting::get('cancellation_policy_hours', 24);

            $eligibleForRefund = $force ||
                now('Asia/Kuala_Lumpur')->lt($startDateTime->copy()->subHours($cancellationHours));

            // --- Refund logic ---
            $transaction = $booking->transactions()->where('type', 'booking')->first();

            foreach ($booking->items as $item) {
                switch ($item->activation_mode) {
                    case 'convert_credits':
                        if ($eligibleForRefund && $transaction) {
                            $this->walletService->refundCredits($transaction, $wallet->id);
                        }
                        break;

                    case 'custom_free_credits':
                        if ($eligibleForRefund) {
                            $wallet->increment('cached_free_credits', $item->free_credits * $item->quantity);
                        }
                        break;

                    case 'keep_rm':
                        break;
                }
            }

            $booking->update([
                'status'        => 'cancelled',
                'cancelled_at'  => now(),
            ]);

            // --- Notifications ---

            // Admins
            if ($transaction) {
                Notification::send(
                    User::where('role', 'admin')->get(),
                    new WalletTransactionNotification(
                        $transaction,
                        $booking->customer->user->full_name,
                        $booking->customer->id,
                        $event->title,
                        $dateDisplay,
                        $timeDisplay,
                        $booking->booking_code,
                        $eligibleForRefund
                    )
                );
            }

            // Customer
            SendPushNotification::dispatch(
                (string) $booking->customer->id,
                "",
                "Booking Cancelled: {$booking->booking_code}",
                "Your booking for '{$event->title}' ({$dateDisplay}, {$timeDisplay}) has been cancelled" .
                    ($eligibleForRefund ? ' and credits refunded.' : '.'),
                ['booking_id' => $booking->id]
            );

            // Merchant
            $merchantUser = $event->merchant->user ?? null;
            if ($merchantUser) {
                $status = $eligibleForRefund ? 'refunded' : 'cancelled';

                SendPushNotification::dispatch(
                    (string) $merchantUser->id,
                    (string) $merchantUser->id,
                    "Booking {$status}: {$booking->booking_code}",
                    "{$booking->customer->user->full_name}'s booking '{$booking->booking_code}' for '{$event->title}' ({$dateDisplay}, {$timeDisplay}) has been {$status}.",
                    ['booking_id' => $booking->id]
                );
            }

            return [
                'booking_id' => (string) $booking->id,
                'refunded'   => $eligibleForRefund,
                'message'    => $eligibleForRefund
                    ? 'Booking cancelled and credits refunded.'
                    : 'Booking cancelled. Credits forfeited.',
            ];
        });
    }

    private function buildSlotSchedule(EventSlot $slot): array
    {
        $event = $slot->event;

        $startDate = $slot->date
            ? Carbon::parse($slot->date)
            : ($event->dates?->start_date ? Carbon::parse($event->dates->start_date) : null);

        $endDate = $event->dates?->end_date
            ? Carbon::parse($event->dates->end_date)
            : null;

        // Date display
        if ($startDate && $endDate && $startDate->eq($endDate)) {
            $dateDisplay = $startDate->format('Y-m-d');
        } elseif ($startDate && $endDate) {
            $dateDisplay = "{$startDate->format('Y-m-d')} - {$endDate->format('Y-m-d')}";
        } elseif ($startDate) {
            $dateDisplay = $startDate->format('Y-m-d');
        } else {
            $dateDisplay = 'Date TBC';
        }

        $startTime = $slot->start_time instanceof Carbon
            ? $slot->start_time->format('H:i')
            : (is_string($slot->start_time) ? $slot->start_time : null);

        $endTime = $slot->end_time instanceof Carbon
            ? $slot->end_time->format('H:i')
            : (is_string($slot->end_time) ? $slot->end_time : null);

        if ($startTime && $endTime && $startTime !== $endTime) {
            $timeDisplay = "{$startTime} - {$endTime}";
        } elseif ($startTime) {
            $timeDisplay = $startTime;
        } else {
            $timeDisplay = 'Time TBC';
        }

        $startDateTime = ($startDate && $startTime)
            ? Carbon::createFromFormat('Y-m-d H:i', "{$startDate->format('Y-m-d')} {$startTime}", 'Asia/Kuala_Lumpur')
            : null;

        return [
            'date_display' => $dateDisplay,
            'time_display' => $timeDisplay,
            'start_datetime' => $startDateTime,
        ];
    }
}
