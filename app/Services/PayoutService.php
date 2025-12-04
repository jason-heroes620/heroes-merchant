<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\MerchantPayout;
use Carbon\Carbon;

class MerchantPayoutService
{
    /**
     * Generate payouts for all merchants in a given month.
     */
    public function generateMonthlyPayout(string $month, string $year)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Get merchants who had bookings this month
        $merchantIds = Booking::whereBetween('created_at', [$startDate, $endDate])
            ->distinct()
            ->pluck('merchant_id');

        foreach ($merchantIds as $merchantId) {
            $this->processMerchantPayout($merchantId, $startDate, $endDate);
        }
    }

    /**
     * Process payout for a single merchant.
     */
    private function processMerchantPayout($merchantId, $startDate, $endDate)
    {
        $bookings = Booking::with('slot', 'transactions')
            ->where('merchant_id', $merchantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $ticketsSold = 0;
        $gross = 0;
        $adminFee = 0;

        foreach ($bookings as $booking) {
            $bookingTransactions = $booking->transactions;

            // Calculate total refunded tickets
            $refundPaidCredits = $bookingTransactions
                ->where('type', 'refund')
                ->sum(fn($t) => abs($t->delta_paid));

            $refundFreeCredits = $bookingTransactions
                ->where('type', 'refund')
                ->sum(fn($t) => abs($t->delta_free));

            $totalRefundCredits = $refundPaidCredits + $refundFreeCredits;

            // Determine if booking was fully refunded
            $totalCreditsUsed = $bookingTransactions
                ->where('type', 'booking')
                ->sum(fn($t) => $t->delta_paid + $t->delta_free);

            $remainingTickets = max(0, 1 * ($totalCreditsUsed - $totalRefundCredits) / $totalCreditsUsed);

            if ($remainingTickets <= 0) continue; // fully refunded

            // Update tickets sold and gross
            $ticketsSold += $remainingTickets;
            $gross += $booking->slot->price_in_rm * $remainingTickets;

            // Calculate admin fee / platform fee
            foreach ($bookingTransactions as $t) {
                $rmPerCredit = $t->amount_in_rm / max(abs($t->delta_paid + $t->delta_free), 1);

                if ($t->type === 'booking') {
                    $adminFee += $rmPerCredit * $t->delta_paid * $remainingTickets;
                } elseif ($t->type === 'refund') {
                    $adminFee -= $rmPerCredit * abs($t->delta_paid);
                }
            }
        }

        $merchantNet = $gross - $adminFee;

        MerchantPayout::updateOrCreate(
            [
                'merchant_id' => $merchantId,
                'month' => $startDate->format('Y-m'),
            ],
            [
                'tickets_sold' => $ticketsSold,
                'gross_in_rm' => $gross,
                'admin_fee_in_rm' => $adminFee,
                'merchant_net_in_rm' => $merchantNet,
                'status' => 'pending',
            ]
        );
    }
}
