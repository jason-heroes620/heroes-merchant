<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerWallet;
use App\Models\CustomerCreditTransaction;
use App\Models\WalletCreditGrant;
use App\Models\PurchasePackage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

    public function hasEnoughCredits(CustomerWallet $wallet, int $paidNeeded, int $freeNeeded = 0, int $quantity = 1): bool
    {
        $totalPaid = $paidNeeded * $quantity;
        $totalFree = $freeNeeded * $quantity;

        return ($wallet->cached_paid_credits >= $totalPaid)
            && ($wallet->cached_free_credits >= $totalFree);
    }

    public function canBookWithCredits(CustomerWallet $wallet, int $paidNeeded, int $freeNeeded, int $quantity = 1, bool $allowFallback = false): bool
    {
        $totalPaid = $paidNeeded * $quantity;
        $totalFree = $freeNeeded * $quantity;

        // Step 1: paid credits must always be enough
        if ($wallet->cached_paid_credits < $totalPaid) {
            throw new \Exception("Insufficient paid credits. Booking failed.");
        }

        // Step 2: check free credits
        if ($wallet->cached_free_credits >= $totalFree) {
            return true; // enough free credits, no fallback needed
        }

        $shortfall = $totalFree - $wallet->cached_free_credits;

        if ($allowFallback && $wallet->cached_paid_credits >= $totalPaid + $shortfall) {
            return true; // enough paid credits to cover remaining free
        }

        // Not enough free, fallback not allowed or paid insufficient
        throw new \Exception("Insufficient free credits. You can use paid credits to cover missing free credits.");
    }

    public function deductCredits(CustomerWallet $wallet, int $paidNeeded, int $freeNeeded, string $desc = '', ?string $bookingId = null, int $quantity = 1, bool $allowFallback = false)
    {
        $totalPaid = $paidNeeded * $quantity;
        $totalFree = $freeNeeded * $quantity;

        $beforePaid = $wallet->cached_paid_credits;
        $beforeFree = $wallet->cached_free_credits;

        // Deduct free first
        $deductFree = min($totalFree, $wallet->cached_free_credits);
        $remainingFree = $totalFree - $deductFree;

        // Deduct remaining free from paid if allowed
        $deductPaid = $totalPaid;
        if ($remainingFree > 0) {
            if (!$allowFallback) {
                throw new \Exception("Insufficient free credits. Cannot proceed without using paid credits.");
            }
            $deductPaid += $remainingFree;
        }

        if ($deductPaid > $wallet->cached_paid_credits) {
            throw new \Exception("Insufficient paid credits to cover free credit shortfall.");
        }

        try {
            if ($deductFree > 0) $wallet->decrement('cached_free_credits', $deductFree);
            if ($deductPaid > 0) $wallet->decrement('cached_paid_credits', $deductPaid);

            CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'booking',
                'before_paid_credits' => $beforePaid,
                'before_free_credits' => $beforeFree,
                'delta_paid' => -$deductPaid,
                'delta_free' => -$deductFree,
                'description' => $desc,
                'booking_id' => $bookingId,
            ]);

            Log::info("Credits deducted for wallet {$wallet->id}", [
                'paid' => $deductPaid,
                'free' => $deductFree,
                'beforePaid' => $beforePaid,
                'beforeFree' => $beforeFree,
                'bookingId' => $bookingId
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to deduct credits for wallet {$wallet->id}", [
                'error' => $e->getMessage(),
                'paid' => $deductPaid,
                'free' => $deductFree,
                'bookingId' => $bookingId,
            ]);
            throw $e;
        }
    }
}