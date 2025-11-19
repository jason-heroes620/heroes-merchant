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
            return response()->json(['wallet_balance' => 0, 'transactions' => []]);
        }

        $wallet = $user->customer->wallet;

        return response()->json([
            'wallet_balance' => $wallet?->credits_balance ?? 0,
            'transactions' => $wallet?->transactions()->latest()->take(10)->get(),
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
            'credits_balance' => 0,
        ]);

        $validated = $request->validate([
            'type' => ['required', Rule::in(['purchase', 'booking', 'refund', 'bonus'])],
            'amount_in_credits' => 'required|integer|min:1',
            'description' => 'nullable|string|max:255',
            'transaction_id' => 'nullable|uuid',
        ]);

        DB::transaction(function () use ($wallet, $validated, &$transaction) {
            $transaction = CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $validated['type'],
                'amount_in_credits' => $validated['amount_in_credits'],
                'description' => $validated['description'] ?? null,
                'transaction_id' => $validated['transaction_id'] ?? null,
            ]);

            if (in_array($validated['type'], ['purchase', 'booking'])) {
                $wallet->credits_balance -= $validated['amount_in_credits'];
            } else { // refund, bonus
                $wallet->credits_balance += $validated['amount_in_credits'];
            }

            $wallet->save();
        });

        return response()->json([
            'message' => 'Wallet updated successfully',
            'wallet_balance' => $wallet->credits_balance,
            'transaction' => $transaction,
        ]);
    }
}
