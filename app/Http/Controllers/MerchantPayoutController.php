<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\MerchantSlotPayout;
use App\Models\MerchantPayoutRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MerchantPayoutController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Base query
        $query = MerchantSlotPayout::with([
            'slot.event',
            'slot.event.dates',
            'merchant.user',
        ])->orderByDesc('calculated_at');

        // Admin merchant filter
        if ($user->role === 'admin' && $request->merchant_id) {
            $query->where('merchant_id', $request->merchant_id);
        }

        // Merchant sees only their payouts
        if ($user->role === 'merchant') {
            $query->where('merchant_id', $user->merchant->id);
        }

        $payouts = $query->paginate(20);

        // Transform data
        $payouts->getCollection()->transform(function ($p) use ($user) {
        $slot = $p->slot;
        $event = $slot->event;

        // --- Date display ---
        if ($slot->date) {
            $displayDate = $slot->date->format('Y-m-d');
        } else {
            $range = optional($event->dates->first());
            if ($range && $range->start_date) {
                $displayDate = ($range->start_date == $range->end_date)
                    ? $range->start_date->format('Y-m-d')
                    : $range->start_date->format('Y-m-d') . ' → ' . $range->end_date->format('Y-m-d');
            } else {
                $displayDate = '-';
            }
        }

        $base = [
            'id' => $p->id,
            'event_title' => $event->title ?? '-',
            'date_display' => $displayDate,
            'gross_rm' => number_format($p->gross_amount_in_rm, 2),
            'net_rm' => number_format($p->net_amount_in_rm, 2),
            'platform_fee_in_rm' => number_format($p->platform_fee_in_rm, 2),
            'status' => $p->status,
            'available_at' => $p->available_at ? $p->available_at->format('Y-m-d H:i') : '-',
        ];

        if ($user->role === 'admin') {
            $base += [
                'merchant_name' => $p->merchant->user->name ?? 'Unknown',
                'merchant_id' => $p->merchant_id,
                'total_paid_credits' => $p->total_paid_credits,
                'credits_per_rm' => $p->credits_per_rm,
            ];
        }

        return $base;
    });

        // Summary for merchant
        $summary = null;
        if ($user->role === 'merchant') {
            $merchantId = $user->merchant->id;

            $summaryQuery = MerchantSlotPayout::where('merchant_id', $merchantId);

            $summary = [
                'total_gross' => number_format($summaryQuery->sum('gross_amount_in_rm'), 2),
                'total_net' => number_format($summaryQuery->sum('net_amount_in_rm'), 2),
                'pending' => number_format($summaryQuery->where('status', 'pending')->sum('net_amount_in_rm'), 2),
                'paid' => number_format($summaryQuery->where('status', 'paid')->sum('net_amount_in_rm'), 2),
            ];
        }

        return Inertia::render('MerchantPayouts/Index', [
            'payouts' => $payouts,
            'summary' => $summary,
            'role' => $user->role,
            'merchants' => Merchant::select('id', 'company_name')->orderBy('company_name')->get(),
            'selectedMerchant' => $request->merchant_id,
        ]);
    }


    public function requestPayouts(Request $request)
    {
        $merchant = $request->user()->merchant;
        $payoutIds = $request->input('payout_ids', []);

        $payouts = MerchantSlotPayout::whereIn('id', $payoutIds)
            ->where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->where('available_at', '<=', now())
            ->get();

        if ($payouts->isEmpty()) {
            return back()->withErrors(['message' => 'No eligible payouts']);
        }

        $amount = $payouts->sum('net_amount_in_rm');

        // Create a new payout request
        $requestRecord = MerchantPayoutRequest::create([
            'id' => Str::uuid(),
            'merchant_id' => $merchant->id,
            'amount_requested' => $amount,
            'requested_at' => now(),
            'status' => 'pending',
            'payout_ids' => $payouts->pluck('id')->toArray(),
        ]);

        // Update the payouts to "requested"
        MerchantSlotPayout::whereIn('id', $payouts->pluck('id'))->update([
            'status' => 'requested',
        ]);

        // Redirect with a friendly message
        return redirect()->back()->with('success', 'Payout request submitted. Your request is now waiting for admin approval.');
    }

    public function markPaid(Request $request, $payoutId)
    {
        $payout = MerchantSlotPayout::findOrFail($payoutId);
        $payout->status = 'paid';
        $payout->save();

        return redirect()->back()->with('success', 'Marked as paid');
    }
}
