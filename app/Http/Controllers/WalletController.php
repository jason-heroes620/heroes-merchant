<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\CustomerWallet;
use App\Models\CustomerCreditTransaction;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /** Show wallet balance and latest transactions */
    public function show()
    {
        $user = Auth::user();

        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'wallet_balance' => 0,
                'transactions' => [],
            ]);
        }

        $wallet = $user->customer->wallet;

        return response()->json([
            'wallet_balance' => [
                'free_credits' => $wallet?->cached_free_credits ?? 0,
                'paid_credits' => $wallet?->cached_paid_credits ?? 0,
            ],
            'transactions' => $wallet?->transactions()
                ->latest()
                ->take(10) 
                ->get(['id', 'type', 'delta_free', 'delta_paid', 'description', 'created_at']) ?? [],
        ]);
    }

    /** Add a wallet transaction and update balance safely */
    public function addWalletTransaction(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json(['error' => 'Only customers have wallets.'], 403);
        }

        $wallet = $user->customer->wallet ?? CustomerWallet::create([
            'customer_id' => $user->customer->id,
            'cached_free_credits' => 0,
            'cached_paid_credits' => 0,
        ]);

        $validated = $request->validate([
            'type' => ['required', Rule::in(['purchase', 'booking', 'refund', 'bonus'])],
            'delta_free' => 'nullable|integer',
            'delta_paid' => 'nullable|integer',
            'description' => 'nullable|string|max:255',
            'transaction_id' => 'nullable|uuid',
        ]);

        DB::transaction(function () use ($wallet, $validated, &$transaction) {
            $transaction = CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $validated['type'],
                'before_free_credits' => $wallet->cached_free_credits,
                'before_paid_credits' => $wallet->cached_paid_credits,
                'delta_free' => $validated['delta_free'] ?? 0,
                'delta_paid' => $validated['delta_paid'] ?? 0,
                'description' => $validated['description'] ?? null,
                'transaction_id' => $validated['transaction_id'] ?? null,
            ]);

            // Update wallet cached credits
            $wallet->cached_free_credits += $validated['delta_free'] ?? 0;
            $wallet->cached_paid_credits += $validated['delta_paid'] ?? 0;

            $wallet->save();
        });

        return response()->json([
            'message' => 'Wallet updated successfully',
            'wallet_balance' => [
                'free_credits' => $wallet->cached_free_credits,
                'paid_credits' => $wallet->cached_paid_credits,
            ],
            'transaction' => $transaction,
        ]);
    }
}