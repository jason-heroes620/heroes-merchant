<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\CustomerWallet;
use App\Models\CustomerCreditTransaction;
use App\Models\WalletCreditGrant;
use App\Models\PurchasePackage;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Notification;
use App\Notifications\WalletTransactionNotification;

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
                'current_package' => null,
            ]);
        }

        $wallet = $user->customer->wallet;

        // Recent transactions
        $transactions = $wallet?->transactions()
            ->latest()
            ->take(10)
            ->with('grant:id,wallet_id,expires_at,purchase_package_id,free_credits_remaining,paid_credits_remaining')
            ->get(['id', 'type', 'delta_free', 'delta_paid', 'description', 'created_at', 'wallet_id']);

        $transactions = $transactions->map(fn($t) => [
            'id' => $t->id,
            'type' => $t->type,
            'delta_free' => $t->delta_free,
            'delta_paid' => $t->delta_paid,
            'description' => $t->description,
            'created_at' => $t->created_at,
            'expires_at' => $t->grant?->expires_at,
        ]);

        // Determine current active purchase package
        $activeGrant = $wallet?->creditGrants()
            ->whereNotNull('purchase_package_id')
            ->where('free_credits_remaining', '>', 0)
            ->where('paid_credits_remaining', '>', 0)
            ->where('expires_at', '>=', now())
            ->with('purchasePackage')
            ->orderBy('expires_at', 'desc')
            ->first();

        $currentPackage = $activeGrant ? [
            'id' => $activeGrant->purchasePackage->id,
            'name' => $activeGrant->purchasePackage->name,
            'free_credits_remaining' => $activeGrant->free_credits_remaining,
            'paid_credits_remaining' => $activeGrant->paid_credits_remaining,
            'expires_at' => $activeGrant->expires_at,
        ] : null;

        return response()->json([
            'wallet_balance' => [
                'free_credits' => $wallet?->cached_free_credits ?? 0,
                'paid_credits' => $wallet?->cached_paid_credits ?? 0,
            ],
            'transactions' => $transactions,
            'current_package' => $currentPackage,
        ]);
    }

    public function addWalletTransaction(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json(['error' => 'Only customers have wallets.'], 403);
        }

        // Ensure wallet exists
        $wallet = $user->customer->wallet ?? CustomerWallet::create([
            'customer_id' => $user->customer->id,
            'cached_free_credits' => 0,
            'cached_paid_credits' => 0,
        ]);

        $validated = $request->validate([
            'type' => ['required', Rule::in(['purchase', 'booking', 'refund', 'bonus', 'expiry'])],
            'delta_free' => 'nullable|integer',
            'delta_paid' => 'nullable|integer',
            'amount_in_rm' => 'nullable|numeric',
            'description' => 'nullable|string|max:255',
            'transaction_id' => 'nullable|uuid',
            'purchase_package_id' => 'nullable|uuid|exists:purchase_packages,id',
        ]);

        $transaction = null;

        DB::transaction(function () use ($wallet, $validated, &$transaction) {
            $deltaFree = $validated['delta_free'] ?? 0;
            $deltaPaid = $validated['delta_paid'] ?? 0;
            $amountInRm = $validated['amount_in_rm'] ?? 0;

            $transaction = CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $validated['type'],
                'before_free_credits' => $wallet->cached_free_credits,
                'before_paid_credits' => $wallet->cached_paid_credits,
                'delta_free' => $deltaFree,
                'delta_paid' => $deltaPaid,
                'amount_in_rm' => $amountInRm,
                'description' => $validated['description'] ?? null,
                'transaction_id' => $validated['transaction_id'] ?? null,
                'purchase_package_id' => $validated['purchase_package_id'] ?? null,
            ]);

            // Update wallet cached credits
            $wallet->cached_free_credits += $deltaFree;
            $wallet->cached_paid_credits += $deltaPaid;

            $wallet->save();

            $expiresAt = null;
            if ($validated['type'] === 'registration') {
                $validityDays = (int) Setting::get('registration_bonus_validity', 180);
                $expiresAt = now()->addDays($validityDays);
            } elseif ($validated['type'] === 'referral') {
                $validityDays = (int) Setting::get('referral_bonus_validity', 180);
                $expiresAt = now()->addDays($validityDays);
            } elseif (!empty($validated['purchase_package_id'])) {
                $package = PurchasePackage::find($validated['purchase_package_id']);
                $expiresAt = now()->addDays($package->validity_days);
            } else {
                $expiresAt = now()->addMonths(6);
            }

            if (in_array($validated['type'], ['registration', 'referral', 'purchase']) && ($deltaFree > 0 || $deltaPaid > 0)) {
                WalletCreditGrant::create([
                    'wallet_id' => $wallet->id,
                    'grant_type' => in_array($validated['type'], ['registration', 'referral', 'purchase']) ? $validated['type']: 'other',
                    'free_credits' => $deltaFree,
                    'paid_credits' => $deltaPaid,
                    'free_credits_remaining' => $deltaFree,
                    'paid_credits_remaining' => $deltaPaid,
                    'expires_at' => $expiresAt,
                    'purchase_package_id' => $validated['purchase_package_id'] ?? null,
                    'reference_id' => null,
                    'free_credits_per_rm' => $deltaFree > 0 && $amountInRm > 0 ? $deltaFree / $amountInRm : null,
                    'paid_credits_per_rm' => $deltaPaid > 0 && $amountInRm > 0 ? $deltaPaid / $amountInRm : null,
                ]);
            }
        });

        Notification::send(
            User::where('role', 'admin')->get(),
            new WalletTransactionNotification($transaction, $user->full_name, $user->id)
        );

        return response()->json([
            'message' => 'Wallet updated successfully',
            'wallet_balance' => [
                'free_credits' => $wallet->cached_free_credits,
                'paid_credits' => $wallet->cached_paid_credits,
            ],
            'transaction' => $transaction,
        ], 201);
    }
}