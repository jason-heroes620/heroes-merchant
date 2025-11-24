<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\EventSlot;
use App\Models\CustomerWallet;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    public function bookSlot(CustomerWallet $wallet, EventSlot $slot, int $quantity = 1): Booking
    {
        if (!$this->walletService->hasEnoughCredits($wallet, $slot->paid_credits, $slot->free_credits)) {
            throw new \Exception("Insufficient credits");
        }

        return DB::transaction(function () use ($wallet, $slot, $quantity) {
            $this->walletService->deductCredits(
                $wallet,
                $slot->paid_credits * $quantity,
                $slot->free_credits * $quantity,
                'Booking slot ' . $slot->id
            );

            $booking = Booking::create([
                'customer_id' => $wallet->customer_id,
                'slot_id' => $slot->id,
                'event_id' => $slot->event_id,
                'wallet_id' => $wallet->id,
                'quantity' => $quantity,
                'free_credits_spent' => $slot->free_credits * $quantity,
                'paid_credits_spent' => $slot->paid_credits * $quantity,
                'amount_paid_in_rm' => $slot->price_in_rm * $quantity,
                'status' => 'confirmed',
            ]);

            return $booking;
        });
    }
}
