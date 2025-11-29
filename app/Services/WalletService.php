<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerWallet;
use App\Models\CustomerCreditTransaction;
use App\Models\WalletCreditGrant;
use App\Models\PurchasePackage;
use Carbon\Carbon;

class WalletService
{
     public function registrationBonus(Customer $customer)
    {
        $wallet = $customer->wallet ?? CustomerWallet::create([
            'customer_id' => $customer->id,
            'cached_free_credits' => 0,
            'cached_paid_credits' => 0,
        ]);

        $deltaFree = 50;
        $deltaPaid = 0;
        $expiresAt = Carbon::now()->addMonths(6);

        // Increment wallet cached credits
        $wallet->increment('cached_free_credits', $deltaFree);
        $wallet->increment('cached_paid_credits', $deltaPaid);

        // Record wallet grant
        WalletCreditGrant::create([
            'wallet_id' => $wallet->id,
            'grant_type' => 'bonus',
            'free_credits' => $deltaFree,
            'paid_credits' => $deltaPaid,
            'free_credits_remaining' => $deltaFree,
            'paid_credits_remaining' => $deltaPaid,
            'expires_at' => $expiresAt,
            'reference_id' => null,
            'free_credits_per_rm' => null,
            'paid_credits_per_rm' => null,
        ]);

        // Record transaction
        CustomerCreditTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'bonus',
            'delta_free' => $deltaFree,
            'delta_paid' => 0,
            'description' => 'Free credits on registration',
        ]);
    }

    public function referralBonus(Customer $referredCustomer)
    {
        $referrer = $referredCustomer->referrer;
        if (!$referrer) return;

        $referralCount = $referrer->referees()->count();

        // Apply bonus only for every 3 referrals
        if ($referralCount % 3 !== 0) return;

        $wallet = CustomerWallet::firstOrCreate(
            ['customer_id' => $referrer->id],
            ['cached_free_credits' => 0, 'cached_paid_credits' => 0]
        );

        $freeBonus = 50;
        $paidBonus = 0;
        $expiresAt = Carbon::now()->addMonths(6);

        $wallet->increment('cached_free_credits', $freeBonus);
        $wallet->increment('cached_paid_credits', $paidBonus);

        WalletCreditGrant::create([
            'wallet_id' => $wallet->id,
            'grant_type' => 'bonus',
            'free_credits' => $freeBonus,
            'paid_credits' => $paidBonus,
            'free_credits_remaining' => $freeBonus,
            'paid_credits_remaining' => $paidBonus,
            'expires_at' => $expiresAt,
            'purchase_package_id' => null,
            'reference_id' => $referredCustomer->id,
        ]);

        CustomerCreditTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'bonus',
            'delta_free' => $freeBonus,
            'delta_paid' => $paidBonus,
            'description' => 'Referral bonus for 3 successful referrals',
        ]);
    }

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
