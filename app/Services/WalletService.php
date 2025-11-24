<?php

namespace App\Services;

use App\Models\CustomerWallet;
use App\Models\CustomerCreditTransaction;

class WalletService
{
    public function hasEnoughCredits(CustomerWallet $wallet, int $paidNeeded, int $freeNeeded = 0): bool
    {
        return ($wallet->cached_paid_credits >= $paidNeeded)
            && ($wallet->cached_free_credits >= $freeNeeded);
    }

    public function deductCredits(CustomerWallet $wallet, int $paid, int $free, string $desc = '', ?string $bookingId = null)
    {
        $beforePaid = $wallet->cached_paid_credits;
        $beforeFree = $wallet->cached_free_credits;

        $wallet->decrement('cached_paid_credits', $paid);
        $wallet->decrement('cached_free_credits', $free);

        CustomerCreditTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'booking',
            'before_paid_credits' => $beforePaid,
            'before_free_credits' => $beforeFree,
            'delta_paid' => -$paid,
            'delta_free' => -$free,
            'description' => $desc,
            'booking_id' => $bookingId,
        ]);
    }
}
