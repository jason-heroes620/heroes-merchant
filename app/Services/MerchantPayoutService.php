<?php

namespace App\Services;

use App\Models\EventSlot;
use App\Models\MerchantSlotPayout;
use App\Models\CustomerCreditTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MerchantPayoutService
{
    /**
     * Calculate payouts for all eligible slots (ended, confirmed bookings, no payout)
     */
    public function calculateAllEligibleSlots(): array
    {
        $processed = [];

        $slots = EventSlot::with(['event', 'prices.conversion', 'bookings.items', 'payout', 'event.dates'])
            ->whereHas('bookings', fn($q) => $q->where('status', 'confirmed'))
            ->get();

        foreach ($slots as $slot) {
            $slotId = (string)$slot->id;

            Log::info('Processing slot', [
                'slot_id' => $slotId,
                'slot_date' => $slot->date,
                'slot_end_time' => $slot->end_time,
                'existing_payout' => $slot->payout ? true : false,
            ]);

            if ($slot->payout) {
                Log::info('Skipping slot, payout already exists', ['slot_id' => $slotId]);
                continue;
            }

            if (! $this->slotHasEnded($slot)) {
                Log::info('Skipping slot, slot has not ended yet', ['slot_id' => $slotId]);
                continue;
            }

            try {
                $payout = DB::transaction(fn() => $this->calculatePayoutForSlot($slot));
                $processed[] = [
                    'slot_id' => $slotId,
                    'payout_id' => $payout->id,
                ];
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
     * Calculate payout for a single slot and persist
     */
    public function calculatePayoutForSlot(EventSlot $slot): MerchantSlotPayout
    {
        $slotId = (string)$slot->id;

        Log::info('Calculating payout', [
            'slot_id' => $slotId,
            'slot_date' => $slot->date,
            'slot_end_time' => $slot->end_time,
            'event_dates' => $slot->event->dates->map(fn($d) => [
                'start_date' => $d->start_date,
                'end_date' => $d->end_date
            ]),
        ]);

        // Collect confirmed bookings
        $bookings = $slot->bookings()->where('status', 'confirmed')->with('items')->get();

        $totalPaidCredits = 0;
        $totalBookingsCount = 0;
        $bookingIds = [];
        $meta = [];
        $totalGross = 0.0;

        foreach ($bookings as $booking) {
            $bookingIds[] = (string)$booking->id;
            $paidCreditsForBooking = $booking->items->sum(fn($item) => ($item->paid_credits ?? 0) * ($item->quantity ?? 1));
            $totalPaidCredits += $paidCreditsForBooking;
            $totalBookingsCount += $booking->items->sum('quantity');

            $txs = CustomerCreditTransaction::where('booking_id', $booking->id)->where('type', 'booking')->get();
            $bookingAmount = $txs->sum(fn($t) => (float)($t->amount_in_rm ?? 0));
            $totalGross += $bookingAmount;

            $meta[] = [
                'booking_id' => (string)$booking->id,
                'paid_credits' => $paidCreditsForBooking,
                'amount_in_rm' => round($bookingAmount, 2),
                'transactions' => $txs->map(fn($t) => [
                    'id' => $t->id,
                    'amount_in_rm' => $t->amount_in_rm,
                    'conversion_id' => $t->conversion_id
                ])->toArray(),
            ];
        }

        if ($totalGross <= 0 && $totalPaidCredits > 0) {
            $slotPrice = $slot->prices()->first();
            $conversion = $slotPrice->conversion ?? \App\Models\Conversion::where('status', 'active')->orderByDesc('effective_from')->first();
            if (!$conversion) {
                throw new \Exception('No active conversion for slot ' . $slotId);
            }
            $totalGross = round($totalPaidCredits / $conversion->credits_per_rm, 2);
        }

        $adminCommission = round($totalGross * (float)config('platform_fee_in_rm', 0), 2);
        $netAmount = round($totalGross - $adminCommission, 2);

        // Determine slot end datetime
        $event = $slot->event;
        $date = $slot->date ?? optional($event->dates->first())->end_date;
        $endTime = $slot->end_time;

        if (!$date || !$endTime) {
            throw new \Exception("Cannot determine slot end for slot $slotId");
        }

        $dateStr = $date instanceof Carbon ? $date->format('Y-m-d') : $date;
        $endTimeStr = $endTime instanceof Carbon ? $endTime->format('H:i:s') : $endTime;
        $slotEnd = Carbon::parse("$dateStr $endTimeStr", 'Asia/Kuala_Lumpur');

        Log::info('Slot end calculated', ['slot_id' => $slotId, 'slotEnd' => $slotEnd]);

        $availableAt = $slotEnd->copy()->addHours(72);

        $payout = MerchantSlotPayout::create([
            'id' => Str::uuid()->toString(),
            'slot_id' => $slot->id,
            'merchant_id' => $slot->event->merchant_id,
            'total_paid_credits' => $totalPaidCredits,
            'gross_amount_in_rm' => $totalGross,
            'platform_fee_in_rm' => $adminCommission,
            'net_amount_in_rm' => $netAmount,
            'total_bookings' => $totalBookingsCount,
            'booking_ids' => json_encode($bookingIds),
            'meta' => json_encode($meta),
            'calculated_at' => Carbon::now(),
            'available_at' => $availableAt,
            'status' => $availableAt->isPast() ? 'pending' : 'locked',
        ]);

        Log::info('Payout created', [
            'slot_id' => $slotId,
            'payout_id' => $payout->id,
            'available_at' => $availableAt->toDateTimeString(),
        ]);

        return $payout;
    }

    private function slotHasEnded(EventSlot $slot): bool
    {
        $event = $slot->event;
        $date = $slot->date ?? optional($event->dates->first())->end_date;
        $endTime = $slot->end_time;

        if (!$date || !$endTime) return false;

        $dateStr = $date instanceof Carbon ? $date->format('Y-m-d') : $date;
        $endTimeStr = $endTime instanceof Carbon ? $endTime->format('H:i:s') : $endTime;
        $end = Carbon::parse("$dateStr $endTimeStr", 'Asia/Kuala_Lumpur');

        Log::info('slotHasEnded check', [
            'slot_id' => $slot->id,
            'slotEnd' => $end,
            'now' => Carbon::now('Asia/Kuala_Lumpur'),
            'hasEnded' => Carbon::now('Asia/Kuala_Lumpur')->gt($end),
        ]);

        return Carbon::now('Asia/Kuala_Lumpur')->gt($end);
    }

    public function getSummary(Request $request, $merchantId)
    {
        $query = MerchantSlotPayout::where('merchant_id', $merchantId);

        if ($request->date) {
            $query->whereDate('calculated_at', $request->date);
        }

        if ($request->month) {
            $query->whereMonth('calculated_at', substr($request->month, 5, 2))
                ->whereYear('calculated_at', substr($request->month, 0, 4));
        }

        return [
            'total_gross' => (clone $query)->sum('gross_amount_in_rm'),
            'total_net' => (clone $query)->sum('net_amount_in_rm'),
            'pending' => (clone $query)->where('status', 'pending')->sum('net_amount_in_rm'),
            'paid' => (clone $query)->where('status', 'paid')->sum('net_amount_in_rm'),
        ];
    }
}