<?php

namespace App\Services;

use App\Models\EventSlot;
use App\Models\MerchantSlotPayout;
use App\Models\Conversion;
use Carbon\Carbon;
use Illuminate\Support\Str;

class CreditPayoutCalculator
{
    public function calculateForSlot(EventSlot $slot): MerchantSlotPayout
    {
        $bookings = $slot->bookings()
            ->where('status', 'confirmed')
            ->with([
                'items.ageGroup',
                'items.booking',
            ])
            ->get();

        $conversion = $this->resolveConversion($slot);

        $totalPaidCredits = 0;
        $totalFreeCredits = 0;
        $totalBookingsCount = 0;
        $totalGrossRm = 0.00;
        $bookingIds = [];
        $meta = [];

        foreach ($bookings as $booking) {
            $bookingIds[] = (string) $booking->id;

            $breakdown = $booking->creditBreakdown();

            $paidCredits = $breakdown['paid'];
            $freeCredits = $breakdown['free'];

            $totalPaidCredits += $paidCredits;
            $totalFreeCredits += $freeCredits;

            $bookingGrossRm = 0.0;

            foreach ($booking->items as $item) {
                $itemRm = $item->grossRm();
                $bookingGrossRm += $itemRm;

                $totalGrossRm += $itemRm;
                $totalBookingsCount += $item->quantity;
            }

            $meta[] = [
                'booking_id' => (string) $booking->id,
                'booking_code' => $booking->booking_code,

                // Merchant-safe
                'items' => $booking->itemsForMerchantMeta(),

                // Admin-only
                'internal' => [
                    'credits' => [
                        'paid' => $paidCredits,
                        'free' => $freeCredits,
                    ],
                    'rm' => [
                        'gross' => $bookingGrossRm,
                        'rate' => $conversion->credits_per_rm,
                    ],
                    'credit_items' => $breakdown['items'],
                ],
            ];
        }

        // [$platformFee, $netAmount] = $this->calculatePlatformFee(
        //     $totalPaidCredits,
        //     $totalGrossRm,
        //     $conversion
        // );

        [$platformFee, $netAmount] = $this->calculatePlatformFee($totalGrossRm);

        $availableAt = $this->resolveAvailableAt($slot);

        return MerchantSlotPayout::create([
            'id' => Str::uuid()->toString(),
            'slot_id' => $slot->id,
            'merchant_id' => $slot->event->merchant_id,
            'total_paid_credits' => $totalPaidCredits,
            'total_free_credits' => $totalFreeCredits,
            'gross_amount_in_rm' =>  $totalGrossRm,      
            'platform_fee_in_rm' => $platformFee,
            'net_amount_in_rm' => $netAmount,
            'total_bookings' => $totalBookingsCount,
            'booking_ids' => json_encode($bookingIds),
            'meta' => json_encode($meta),
            'calculated_at' => Carbon::now(),
            'available_at' => $availableAt,
            'status' => $availableAt->isPast() ? 'pending' : 'locked',
        ]);
    }

   private function resolveConversion(EventSlot $slot): Conversion
    {
        // 1️⃣ Prefer slot-specific conversion (locked pricing)
        $slotPrice = $slot->prices()
            ->whereNotNull('conversion_id')
            ->first();

        if ($slotPrice && $slotPrice->conversion) {
            if ($slotPrice->conversion->credits_per_rm <= 0) {
                throw new \Exception("Invalid slot conversion for slot {$slot->id}");
            }

            return $slotPrice->conversion;
        }

        // 2️⃣ Fallback to active system conversion
        $conversion = Conversion::where('status', 'active')
            ->where('effective_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('valid_until')
                ->orWhere('valid_until', '>=', now());
            })
            ->orderByDesc('effective_from')
            ->first();

        if (! $conversion || $conversion->credits_per_rm <= 0) {
            throw new \Exception("No valid active conversion found for slot {$slot->id}");
        }

        return $conversion;
    }

    private function calculatePlatformFee(
    float $grossRm
    ): array {
        $platformFee = 0.00;

        $netAmount = ceil(($grossRm - $platformFee) * 10) / 10;

        return [$platformFee, $netAmount];
    }

    // private function calculatePlatformFee(
    //     int $totalPaidCredits,
    //     float $grossRm,
    //     Conversion $conversion
    // ): array {
    //     if ($totalPaidCredits <= 0) {
    //         return [0.0, $grossRm];
    //     }

    //     if ($conversion->credits_per_rm <= 0) {
    //         throw new \Exception('Invalid conversion rate');
    //     }

    //     $platformFeeRm = round(
    //         $totalPaidCredits / $conversion->credits_per_rm,
    //         2
    //     );

    //     $netAmount = max(
    //         round($grossRm - $platformFeeRm, 2),
    //         0
    //     );

    //     return [$platformFeeRm, $netAmount];
    // }

    private function resolveAvailableAt(EventSlot $slot): Carbon
    {
        $date = $slot->date ?? optional($slot->event->dates->first())->end_date;
        $endTime = $slot->end_time;

        if (! $date || ! $endTime) {
            throw new \Exception("Cannot determine slot end {$slot->id}");
        }

        $dateStr = $date instanceof Carbon ? $date->format('Y-m-d') : $date;
        $timeStr = $endTime instanceof Carbon ? $endTime->format('H:i:s') : $endTime;

        return Carbon::parse(
            "$dateStr $timeStr",
            'Asia/Kuala_Lumpur'
        )->addHour();
    }
}
