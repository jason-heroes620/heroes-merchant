<?php

namespace App\Services;

use App\Models\EventSlot;
use App\Models\MerchantSlotPayout;
use App\Models\MerchantSlotPayoutItem;
use App\Models\EventSlotPrice;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MerchantPayoutService
{
    /**
     * Calculate payouts for all eligible slots (ended slots with confirmed bookings)
     *
     * Returns an array of processed payout info.
     */
    public function calculateAllEligibleSlots(): array
    {
        $processed = [];

        // Load slots with confirmed bookings
        $slots = EventSlot::with(['bookings.items.eventSlotPrice', 'event', 'event.dates'])
            ->whereHas('bookings', fn($q) => $q->where('status', 'confirmed'))
            ->get();

        foreach ($slots as $slot) {
            $slotId = (string) $slot->id;

            if ($slot->payout) {
                Log::info('Skipping slot, payout already exists', ['slot_id' => $slotId]);
                continue;
            }

            if (!$this->slotHasEnded($slot)) {
                Log::info('Skipping slot, slot has not ended yet', ['slot_id' => $slotId]);
                continue;
            }

            try {
                $payoutResult = DB::transaction(fn() => $this->calculateSlotPayout($slot));

                $processed[] = [
                    'slot_id' => $slotId,
                    'payout_id' => $payoutResult['payout']->id,
                    'subtotal' => $payoutResult['subtotal'],
                    'booking_breakdown' => $payoutResult['booking_breakdown'],
                    'status' => $payoutResult['payout']->status,
                ];

                Log::info('Slot payout calculated', [
                    'slot_id' => $slotId,
                    'subtotal' => $payoutResult['subtotal'],
                ]);
            } catch (\Throwable $e) {
                Log::error('Payout calculation failed', [
                    'slot_id' => $slotId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $processed;
    }

    /**
     * Calculate payout for a single slot and return subtotal + booking breakdown
     */
    public function calculateSlotPayout(EventSlot $slot): array
    {
        if ($slot->payout) {
            throw new \RuntimeException("Payout already exists for slot {$slot->id}");
        }

        $eligibleBookings = $slot->bookings->filter(fn ($b) => $b->status === 'confirmed');

        if ($eligibleBookings->isEmpty()) {
            throw new \RuntimeException("No eligible confirmed bookings for slot {$slot->id}");
        }

        $subtotal = 0;
        $payoutItemsPayload = [];
        $bookingBreakdown = [];

        foreach ($eligibleBookings as $booking) {
            foreach ($booking->items as $item) {
                // Resolve slot price
                $slotPrice = $item->eventSlotPrice
                    ?? EventSlotPrice::query()
                        ->where('event_slot_id', $booking->slot_id)
                        ->when(
                            $item->age_group_id,
                            fn ($q) => $q->where('event_age_group_id', $item->age_group_id)
                        )
                        ->first();

                if (!$slotPrice) {
                    Log::warning('Missing slot price for booking item', [
                        'booking_item_id' => $item->id,
                        'slot_id' => $slot->id,
                    ]);
                    continue;
                }

                $lineAmount = $slotPrice->price_in_rm * $item->quantity;
                $subtotal += $lineAmount;

                $payoutItemsPayload[] = [
                    'booking_item_id' => $item->id,
                    'event_slot_price_id' => $slotPrice->id,
                    'amount_in_rm' => $lineAmount,
                ];

                $bookingBreakdown[] = [
                    'age_group_id' => $item->age_group_id,
                    'age_group_label' => $item->ageGroup->label ?? 'General',
                    'quantity' => $item->quantity,
                    'price_in_rm' => $slotPrice->price_in_rm,
                    'total_amount' => $lineAmount,
                ];
            }
        }

        if ($subtotal <= 0) {
            throw new \RuntimeException("Calculated subtotal is zero for slot {$slot->id}");
        }

        $firstBooking = $eligibleBookings->first();

        /** @var MerchantSlotPayout $payout */
        $payout = $slot->payout()->create([
            'merchant_id' => $slot->event->merchant_id,
            'booking_id' => $firstBooking->id,
            'slot_id' => $slot->id,
            'total_amount_in_rm' => $subtotal,
            'status' => 'pending',
            'paid_at' => null,
        ]);

        // Create payout items
        foreach ($payoutItemsPayload as $payload) {
            MerchantSlotPayoutItem::create([
                'payout_id' => $payout->id,
                ...$payload,
            ]);
        }

        return [
            'payout' => $payout,
            'subtotal' => $subtotal,
            'booking_breakdown' => $bookingBreakdown,
        ];
    }

    /**
     * Check if a slot has ended
     */
    private function slotHasEnded(EventSlot $slot): bool
    {
        $slotEnd = $slot->display_end;

        if (! $slotEnd) {
            Log::warning('Slot has no display_end', [
                'slot_id' => $slot->id,
            ]);
            return false;
        }

        $now = Carbon::now('Asia/Kuala_Lumpur');
        $hasEnded = $now->gt($slotEnd);

        Log::info('slotHasEnded check', [
            'slot_id' => $slot->id,
            'slot_end' => $slotEnd->toDateTimeString(),
            'now' => $now->toDateTimeString(),
            'hasEnded' => $hasEnded,
        ]);

        return $hasEnded;
    }

     public function getAllPayouts(): array
    {
        $payouts = MerchantSlotPayout::with(['slot.event', 'slot.event.dates', 'items'])->get();

        $processed = [];

        foreach ($payouts as $payout) {
            $slot = $payout->slot;

            $displayStart = $slot->display_start;
            $displayEnd = $slot->display_end;

            if (!$displayStart || !$displayEnd) {
                $eventDate = $slot->date; // or $slot->event->dates->first() depending on relationships
                if ($eventDate) {
                    $startDate = $eventDate->start_date;
                    $endDate = $eventDate->end_date; 

                    $startTime = $slot->start_time?->format('H:i:s') ?? '00:00:00';
                    $endTime = $slot->end_time?->format('H:i:s') ?? '23:59:59';

                    $displayStart = $startDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur') : null;
                    $displayEnd = $endDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur') : null;
                }
            }

            $processed[] = [
                'payout' => $payout,
                'subtotal' => $payout->total_amount_in_rm,
                'booking_breakdown' => $payout->items->map(fn($item) => [
                    'age_group_id' => $item->bookingItem->age_group_id ?? null,
                    'age_group_label' => $item->bookingItem->ageGroup?->label ?? 'N/A',
                    'quantity' => $item->bookingItem->quantity ?? 0,
                    'claimed' => $item->bookingItem->quantity_claimed ?? null,
                    'price_in_rm' => $item->bookingItem->eventSlotPrice?->price_in_rm ?? 0,
                    'total_amount' => $item->amount_in_rm,
                ])->toArray(),
                'slot_start' => $displayStart,
                'slot_end' => $displayEnd,
                'status' => $payout->status,
            ];
        }

        Log::info('All payouts from service', ['allPayouts' => $processed]);

        return $processed;
    }
}