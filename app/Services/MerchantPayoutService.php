<?php

namespace App\Services;

use App\Models\EventSlot;
use App\Services\CreditPayoutCalculator;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MerchantPayoutService
{

     public function __construct(
        protected CreditPayoutCalculator $calculator
    ) {}
    /**
     * Calculate payouts for all eligible slots (ended, confirmed bookings, no payout)
     */
    public function calculateAllEligibleSlots(): array
    {
        $processed = [];

        $slots = EventSlot::with(['event', 'prices.conversion', 'bookings.items.ageGroup', 'payout', 'event.dates'])
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
                $payout = DB::transaction(fn() =>
                    $this->calculator->calculateForSlot($slot)
                );
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
}