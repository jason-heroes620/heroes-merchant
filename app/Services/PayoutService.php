<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\MerchantPayout;

class PayoutService
{
    public function createPayout(Booking $booking, float $adminFeePercent = 0.1)
    {
        $gross = $booking->amount_paid_in_rm;
        $adminFee = $gross * $adminFeePercent;
        $net = $gross - $adminFee;

        return MerchantPayout::create([
            'merchant_id' => $booking->event->merchant_id,
            'booking_id' => $booking->id,
            'gross_in_rm' => $gross,
            'admin_fee_in_rm' => $adminFee,
            'merchant_net_in_rm' => $net,
            'status' => 'pending',
        ]);
    }
}
