<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\WalletCreditGrant;
use App\Models\CustomerCreditTransaction;

class ExpireWalletCredits extends Command
{
    protected $signature = 'wallet:expire-credits';
    protected $description = 'Expire unused wallet credits after expiry date';

    public function handle()
    {
        $now = Carbon::now();

        $grants = WalletCreditGrant::where('expires_at', '<=', $now)
            ->where(function ($q) {
                $q->where('free_credits_remaining', '>', 0)
                  ->orWhere('paid_credits_remaining', '>', 0);
            })
            ->with('wallet')
            ->get();

        foreach ($grants as $grant) {
            DB::transaction(function () use ($grant) {
                $wallet = $grant->wallet;

                $expiredFree = $grant->free_credits_remaining;
                $expiredPaid = $grant->paid_credits_remaining;

                // Deduct from cached wallet balances
                $wallet->cached_free_credits -= $expiredFree;
                $wallet->cached_paid_credits -= $expiredPaid;
                $wallet->save();

                // Log transaction
                CustomerCreditTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'expiry',
                    'before_free_credits' => $wallet->cached_free_credits + $expiredFree,
                    'before_paid_credits' => $wallet->cached_paid_credits + $expiredPaid,
                    'delta_free' => -$expiredFree,
                    'delta_paid' => -$expiredPaid,
                    'description' => "Expired {$grant->grant_type} credits",
                    'purchase_package_id' => $grant->purchase_package_id,
                ]);

                // Zero out grant
                $grant->update([
                    'free_credits_remaining' => 0,
                    'paid_credits_remaining' => 0,
                ]);
            });
        }

        $this->info("Expired {$grants->count()} wallet credit grants.");
    }
}

