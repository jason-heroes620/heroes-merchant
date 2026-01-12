<?php

namespace App\Services;

use App\Models\User;
use App\Models\Customer;
use App\Models\CustomerWallet;
use App\Models\CustomerCreditTransaction;
use App\Models\WalletCreditGrant;
use App\Models\Setting;
use App\Services\ConversionService;
use Illuminate\Support\Facades\Notification;
use App\Notifications\WalletTransactionNotification;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class InsufficientCreditsException extends \Exception
{
    public int $shortfallFree;
    public float $paidToFreeRatio;

    public function __construct(string $message, int $shortfallFree, float $paidToFreeRatio)
    {
        parent::__construct($message);
        $this->shortfallFree = $shortfallFree;
        $this->paidToFreeRatio = $paidToFreeRatio;
    }
}

class WalletService
    {
    protected ConversionService $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

     public function registrationBonus(Customer $customer)
    {
        $wallet = $customer->wallet ?? CustomerWallet::create([
            'customer_id' => $customer->id,
            'cached_free_credits' => 0,
            'cached_paid_credits' => 0,
        ]);

        $deltaFree = (int) Setting::get('registration_bonus', 0);
        $deltaPaid = 0;

        if ($deltaFree <= 0) {
            return; 
        }

        $registrationValidity = (int) Setting::get('registration_bonus_validity', 180);
        $expiresAt = Carbon::now()->addDays($registrationValidity);

        $wallet->increment('cached_free_credits', $deltaFree);

        WalletCreditGrant::create([
            'wallet_id' => $wallet->id,
            'grant_type' => 'registration',
            'free_credits' => $deltaFree,
            'paid_credits' => 0,
            'free_credits_remaining' => $deltaFree,
            'paid_credits_remaining' => 0,
            'expires_at' => $expiresAt,
        ]);

        $transaction = CustomerCreditTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'bonus',
            'delta_free' => $deltaFree,
            'delta_paid' => 0,
            'description' => 'Free credits on registration',
        ]);

        Notification::send(
            User::where('role', 'admin')->get(),
            new WalletTransactionNotification(
                $transaction,
                $customer->user->full_name,
                $customer->id
            )
        );
    }

    public function referralBonus(Customer $referredCustomer)
    {
        $referrer = $referredCustomer->referrer;
        if (!$referrer) return;

        $threshold = (int) Setting::get('referral_threshold', 0);
        $bonus = (int) Setting::get('referral_bonus', 0);

        if ($threshold <= 0 || $bonus <= 0) {
            return; 
        }

        $referralCount = $referrer->referees()->count();

        if ($referralCount % $threshold !== 0) return;

        $wallet = CustomerWallet::firstOrCreate(
            ['customer_id' => $referrer->id],
            ['cached_free_credits' => 0, 'cached_paid_credits' => 0]
        );

        $referralValidity = (int) Setting::get('referral_bonus_validity', 180);
        $expiresAt = Carbon::now()->addDays($referralValidity);

        $wallet->increment('cached_free_credits', $bonus);

        WalletCreditGrant::create([
            'wallet_id' => $wallet->id,
            'grant_type' => 'referral',
            'free_credits' => $bonus,
            'paid_credits' => 0,
            'free_credits_remaining' => $bonus,
            'paid_credits_remaining' => 0,
            'expires_at' => $expiresAt,
            'reference_id' => $referredCustomer->id,
        ]);

        $transaction = CustomerCreditTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => '',
            'delta_free' => $bonus,
            'delta_paid' => 0,
            'description' => "Referral bonus for {$threshold} successful referrals",
        ]);

        Notification::send(
            User::where('role', 'admin')->get(),
            new WalletTransactionNotification(
                $transaction,
                $referrer->user->full_name,
                $referrer->id
            )
        );
    }
    public function hasEnoughCredits(CustomerWallet $wallet, int $freePerTicket, int $quantity = 1): bool
    {
        $additionalInfo = $this->calculateAdditionalPaid($wallet, $freePerTicket, $quantity);
        return $additionalInfo['canCoverWithPaid'];
    }

    public function canBookWithCredits(
        CustomerWallet $wallet,
        int $freePerTicket,
        int $quantity = 1,
        bool $allowFallback = false
    ): bool {
        $additionalInfo = $this->calculateAdditionalPaid($wallet, $freePerTicket, $quantity);

        if ($wallet->cached_free_credits >= $freePerTicket * $quantity) {
            return true;
        }

        if ($allowFallback && $additionalInfo['canCoverWithPaid']) {
            return true;
        }

        throw new InsufficientCreditsException(
            "Insufficient credits. You can use paid credits to cover the remaining free credits.",
            $additionalInfo['shortfallFree'],
            $additionalInfo['paidToFreeRatio']
        );
    }

    public function calculateAdditionalPaid(CustomerWallet $wallet, int $freePerTicket, int $quantity = 1): array
    {
        $conversion = $this->conversionService->getActiveConversion();
        if (!$conversion) {
            throw new \Exception('No active conversion available.');
        }

        $paidToFreeRatio = max(1, $conversion->paid_to_free_ratio);

        $totalFreeNeeded = $freePerTicket * $quantity;
        $shortfallFree = max(0, $totalFreeNeeded - $wallet->cached_free_credits);

        $totalPaidNeeded = $shortfallFree * $paidToFreeRatio;

        return [
            'shortfallFree' => $shortfallFree,
            'paidToFreeRatio' => $paidToFreeRatio,
            'totalPaidNeeded' => $totalPaidNeeded,
            'canCoverWithPaid' => $wallet->cached_paid_credits >= $totalPaidNeeded
        ];
    }

    public function deductCredits(
        CustomerWallet $wallet,
        int $freePerTicket,
        int $paidPerTicket = 0,
        string $desc = '',
        ?string $bookingId = null,
        int $quantity = 1,
        bool $allowFallback = false
    ): array {
        // Step 1: total free required
        $totalFreeNeeded = $freePerTicket * $quantity;
        $deductFree = min($totalFreeNeeded, $wallet->cached_free_credits);
        $shortfallFree = $totalFreeNeeded - $deductFree;

        // Step 2: calculate total paid
        $totalPaidFromTicket = $paidPerTicket * $quantity;

        $conversion = $this->conversionService->getActiveConversion();
        if (!$conversion) {
            throw new \Exception('No active conversion available.');
        }
        $paidToFreeRatio = max(1, $conversion->paid_to_free_ratio);

        $totalPaid = $totalPaidFromTicket + ($shortfallFree * $paidToFreeRatio);

        // Step 3: handle insufficient paid credits
        if ($totalPaid > $wallet->cached_paid_credits) {
            if ($allowFallback) {
                $totalPaid = $wallet->cached_paid_credits;
            } else {
                throw new InsufficientCreditsException(
                    "Not enough paid credits to cover free credit shortfall.",
                    $shortfallFree,
                    $paidToFreeRatio
                );
            }
        }

        // Step 4: store before balances
        $beforePaid = $wallet->cached_paid_credits;
        $beforeFree = $wallet->cached_free_credits;

        // Step 5: decrement wallet
        if ($deductFree > 0) $wallet->decrement('cached_free_credits', $deductFree);
        if ($totalPaid > 0) $wallet->decrement('cached_paid_credits', $totalPaid);

        // Step 6: record transaction
        CustomerCreditTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'booking',
            'before_paid_credits' => $beforePaid,
            'before_free_credits' => $beforeFree,
            'delta_paid' => -$totalPaid,
            'delta_free' => -$deductFree,
            'description' => $desc,
            'booking_id' => $bookingId,
            'transaction_id' => Str::uuid()->toString(),
        ]);

        Log::info("Credits deducted for wallet {$wallet->id}", [
            'deductFree' => $deductFree,
            'deductPaid' => $totalPaid,
            'paidPerTicket' => $paidPerTicket,
            'freePerTicket' => $freePerTicket,
            'quantity' => $quantity,
            'shortfallFree' => $shortfallFree,
            'paidToFreeRatio' => $paidToFreeRatio,
            'beforePaid' => $beforePaid,
            'beforeFree' => $beforeFree,
            'bookingId' => $bookingId,
            'allowFallback' => $allowFallback
        ]);

        return [
            'deducted_free' => $deductFree,
            'deducted_paid' => $totalPaid,
        ];
    }

    public function refundCredits($transaction, string $walletId)
    {
        $wallet = CustomerWallet::findOrFail($walletId);

        $refundPaid = abs($transaction->delta_paid);
        $refundFree = abs($transaction->delta_free);

        $beforePaid = $wallet->cached_paid_credits;
        $beforeFree = $wallet->cached_free_credits;

        try {
            if ($refundPaid > 0) {
                $wallet->increment('cached_paid_credits', $refundPaid);
            }

            if ($refundFree > 0) {
                $wallet->increment('cached_free_credits', $refundFree);
            }

            CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'refund',
                'before_paid_credits' => $beforePaid,
                'before_free_credits' => $beforeFree,
                'delta_paid' => $refundPaid,
                'delta_free' => $refundFree,
                'description' => "Refund for cancelled booking {$transaction->booking_id}",
                'booking_id' => $transaction->booking_id,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to refund credits for wallet {$wallet->id}", [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}