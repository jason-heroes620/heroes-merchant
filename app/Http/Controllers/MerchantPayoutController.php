<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\MerchantSlotPayout;
use App\Models\MerchantPayoutRequest;
use App\Services\MerchantPayoutService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class MerchantPayoutController extends Controller
{
    protected MerchantPayoutService $payoutService;

    public function __construct(MerchantPayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        $query = MerchantSlotPayout::with([
            'slot.event',
            'slot.event.dates',
            'merchant.user',
        ])->orderByDesc('calculated_at');

        if ($user->role === 'admin' && $request->merchant_id) {
            $query->where('merchant_id', $request->merchant_id);
        }

        if ($user->role === 'merchant') {
            $query->where('merchant_id', $user->merchant->id);
        }

        $payouts = $query->paginate(20);

        $payouts->getCollection()->transform(function ($p) use ($user) {
            $slot = $p->slot;
            $event = $slot->event;

            $displayStart = $slot->display_start ?? null;
            $displayEnd = $slot->display_end ?? null;

            // Fallback for one-time events
            if (!$displayStart || !$displayEnd) {
                $eventDate = $slot->date;
                if ($eventDate) {
                    $startDate = $eventDate->start_date?->format('Y-m-d');
                    $endDate = $eventDate->end_date?->format('Y-m-d');

                    $startTime = $slot->start_time?->format('H:i:s') ?? '00:00:00';
                    $endTime = $slot->end_time?->format('H:i:s') ?? '23:59:59';

                    $displayStart = $startDate
                        ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur')
                        : null;
                    $displayEnd = $endDate
                        ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur')
                        : null;
                }
            }

            $displayDate = '-';
            if ($displayStart) {
                $startDateOnly = $displayStart->format('Y-m-d');
                $endDateOnly = $displayEnd ? $displayEnd->format('Y-m-d') : null;

                if ($endDateOnly && $startDateOnly !== $endDateOnly) {
                    $displayDate = $displayStart->format('Y-m-d H:i') . ' → ' . $displayEnd->format('Y-m-d H:i');
                } else {
                    $displayDate = $displayStart->format('Y-m-d H:i');
                    if ($displayEnd) {
                        $displayDate .= ' - ' . $displayEnd->format('H:i');
                    }
                }
            }

            // Parse meta for booking details
            $meta = json_decode($p->meta, true) ?? [];
            $bookingDetails = [];

            foreach ($meta as $bookingMeta) {
                $items = [];
                
                if ($user->role === 'admin') {
                    // Admin sees full details including credits
                    $internalItems = $bookingMeta['internal']['credit_items'] ?? [];
                    foreach ($internalItems as $item) {
                        $pricePerUnit = isset($bookingMeta['internal']['rm']['gross']) && $item['quantity'] > 0
                            ? $bookingMeta['internal']['rm']['gross'] / array_sum(array_column($internalItems, 'quantity'))
                            : 0;

                        $items[] = [
                            'age_group' => $item['age_group_label'] ?? 'Unknown',
                            'quantity' => $item['quantity'] ?? 0,
                            'attended' => $item['attended'] ?? 0,
                            'price_per_unit' => round($pricePerUnit, 2),
                            'paid_credits' => $item['paid_total'] ?? 0,
                            'free_credits' => $item['free_total'] ?? 0,
                        ];
                    }
                } else {
                    // Merchant sees basic details without credits
                    $merchantItems = $bookingMeta['items'] ?? [];
                    $totalQuantity = array_sum(array_column($merchantItems, 'quantity'));
                    $bookingGross = $bookingMeta['internal']['rm']['gross'] ?? 0;

                    foreach ($merchantItems as $item) {
                        $pricePerUnit = $totalQuantity > 0 ? $bookingGross / $totalQuantity : 0;

                        $items[] = [
                            'age_group' => $item['age_group'] ?? 'Unknown',
                            'quantity' => $item['quantity'] ?? 0,
                            'attended' => $item['attended'] ?? 0,
                            'price_per_unit' => round($pricePerUnit, 2),
                        ];
                    }
                }

                $bookingDetails[] = [
                    'booking_id' => $bookingMeta['booking_id'] ?? '',
                    'booking_code' => $bookingMeta['booking_code'] ?? '',
                    'items' => $items,
                ];
            }

            $base = [
                'id' => $p->id,
                'event_title' => $event->title ?? '-',
                'date_display' => $displayDate,
                'total_amount' => number_format($p->net_amount_in_rm, 2),
                'total_bookings' => $p->total_bookings, 
                'status' => $p->status,
                'available_at' => $p->available_at ? $p->available_at->format('Y-m-d H:i') : '-',
                'booking_details' => $bookingDetails,
            ];

            if ($user->role === 'admin') {
                $base += [
                    'merchant_name' => $p->merchant->user->full_name ?? 'Unknown',
                    'merchant_id' => $p->merchant_id,
                    'total_paid_credits' => $p->total_paid_credits,
                ];
            }

            return $base;
        });

        $summary = null;
        if ($user->role === 'merchant') {
            $merchantId = $user->merchant->id;
            $summaryQuery = MerchantSlotPayout::where('merchant_id', $merchantId);

            $summary = [
                'total_amount' => number_format($summaryQuery->sum('net_amount_in_rm'), 2),
                'pending' => number_format($summaryQuery->where('status', 'pending')->sum('net_amount_in_rm'), 2),
                'paid' => number_format($summaryQuery->where('status', 'paid')->sum('net_amount_in_rm'), 2),
            ];
        } elseif ($user->role === 'admin') {
            $summaryQuery = MerchantSlotPayout::query();
            if ($request->merchant_id) {
                $summaryQuery->where('merchant_id', $request->merchant_id);
            }

            $summary = [
                'total_amount' => number_format($summaryQuery->sum('net_amount_in_rm'), 2),
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

    public function exportSlotPayoutPdf(Request $request)
    {
        \Log::info('PDF Export Started', [
            'user_role' => $request->user()->role,
            'merchant_id' => $request->merchant_id,
            'payout_ids' => $request->input('payout_ids', []),
        ]);

        $user = $request->user();
        $mode = $user->role === 'admin' ? 'admin' : 'merchant';

        $merchantId = null;
        if ($mode === 'merchant') {
            $merchantId = $user->merchant->id ?? null;
        } elseif ($request->merchant_id) {
            $merchantId = $request->merchant_id;
        }

        $payoutIds = $request->input('payout_ids', []);

        $query = MerchantSlotPayout::with(['slot.event', 'merchant.user']);

        if ($merchantId) {
            $query->where('merchant_id', $merchantId);
        }

        if (!empty($payoutIds)) {
            $query->whereIn('id', $payoutIds);
        }

        // Get last 6 months data grouped by month
        $sixMonthsAgo = Carbon::now()->subMonths(6)->startOfMonth();
        $query->where('calculated_at', '>=', $sixMonthsAgo);

        $payouts = $query->orderBy('calculated_at', 'desc')->get();
        
        \Log::info('Payouts Found', [
            'count' => $payouts->count(),
        ]);

        // Group by month
        $groupedByMonth = $payouts->groupBy(function ($payout) {
            return Carbon::parse($payout->calculated_at)->format('Y-m');
        });

        $monthlyData = [];
        foreach ($groupedByMonth as $month => $monthPayouts) {
            $monthName = Carbon::parse($month . '-01')->format('F Y');
            
            $payoutList = $monthPayouts->map(function($p) use ($mode) {
                $meta = json_decode($p->meta, true) ?? [];
                
                \Log::info('Processing Payout', [
                    'payout_id' => $p->id,
                    'meta_is_array' => is_array($meta),
                    'meta_count' => count($meta),
                ]);
                
                $bookingDetails = [];

                foreach ($meta as $bookingMeta) {
                    $items = [];
                    
                    if ($mode === 'admin') {
                        $internalItems = $bookingMeta['internal']['credit_items'] ?? [];
                        $bookingGross = $bookingMeta['internal']['rm']['gross'] ?? 0;
                        $totalQuantity = array_sum(array_column($internalItems, 'quantity'));
                        
                        foreach ($internalItems as $item) {
                            $pricePerUnit = $totalQuantity > 0 ? $bookingGross / $totalQuantity : 0;
                            
                            $items[] = [
                                'age_group' => $item['age_group_label'] ?? 'Unknown',
                                'quantity' => $item['quantity'] ?? 0,
                                'price_per_unit' => round($pricePerUnit, 2),
                                'paid_credits' => $item['paid_total'] ?? 0,
                                'free_credits' => $item['free_total'] ?? 0,
                            ];
                        }
                    } else {
                        $merchantItems = $bookingMeta['items'] ?? [];
                        $bookingGross = $bookingMeta['internal']['rm']['gross'] ?? 0;
                        $totalQuantity = array_sum(array_column($merchantItems, 'quantity'));
                        
                        foreach ($merchantItems as $item) {
                            $pricePerUnit = $totalQuantity > 0 ? $bookingGross / $totalQuantity : 0;
                            
                            $items[] = [
                                'age_group' => $item['age_group'] ?? 'Unknown',
                                'quantity' => $item['quantity'] ?? 0,
                                'price_per_unit' => round($pricePerUnit, 2),
                            ];
                        }
                    }

                    $bookingDetails[] = [
                        'booking_code' => $bookingMeta['booking_code'] ?? 'N/A',
                        'items' => $items,
                    ];
                }

                return [
                    'id' => $p->id,
                    'event_title' => $p->slot->event->title ?? '-',
                    'date' => $p->slot->date ?? optional($p->slot->event->dates->first())->start_date,
                    'total_bookings' => $p->total_bookings,
                    'total_paid_credits' => $p->total_paid_credits,
                    'total_amount' => $p->net_amount_in_rm,
                    'status' => $p->status,
                    'booking_details' => $bookingDetails,
                ];
            })->toArray();

            $monthlyData[$monthName] = [
                'payouts' => $payoutList,
                'total_amount' => $monthPayouts->sum('net_amount_in_rm'),
                'total_bookings' => $monthPayouts->sum('total_bookings'),
            ];
        }

        $merchant = $merchantId ? Merchant::with('user')->find($merchantId) : null;

        \Log::info('PDF Data Prepared', [
            'monthly_data_count' => count($monthlyData),
            'merchant' => $merchant ? $merchant->company_name : 'All',
        ]);

        try {
            $pdf = Pdf::loadView('merchant_payout_report', [
                'monthlyData' => $monthlyData,
                'mode' => $mode,
                'merchant' => $merchant,
                'generatedAt' => now()->format('Y-m-d H:i:s'),
            ])->setPaper('a4', 'portrait');

            $filename = 'merchant_payout_report_' . now()->format('Ymd_His') . '.pdf';
            
            \Log::info('PDF Generated Successfully', ['filename' => $filename]);
            
            // Use the same pattern as your working customer transaction export
            return $pdf->download($filename);
        } catch (\Exception $e) {
            \Log::error('PDF Generation Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return back()->withErrors(['message' => 'Failed to generate PDF: ' . $e->getMessage()]);
        }
    }

    public function requestPayouts(Request $request)
    {
        $user = $request->user();
        $payoutIds = $request->input('payout_ids', []);

        if ($user->role === 'merchant') {
            $merchant = $user->merchant;
            
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
            MerchantPayoutRequest::create([
                'id' => Str::uuid(),
                'merchant_id' => $merchant->id,
                'amount_requested' => round($amount, 2),
                'requested_at' => now(),
                'status' => 'pending',
                'payout_ids' => $payouts->pluck('id')->toArray(),
            ]);

            // Update the payouts to "requested"
            MerchantSlotPayout::whereIn('id', $payouts->pluck('id'))->update([
                'status' => 'requested',
            ]);

            return redirect()->back()->with('success', 'Payout request submitted successfully.');
        } elseif ($user->role === 'admin') {
            // Admin can directly mark as requested or process
            $payouts = MerchantSlotPayout::whereIn('id', $payoutIds)
                ->where('status', 'pending')
                ->get();

            if ($payouts->isEmpty()) {
                return back()->withErrors(['message' => 'No eligible payouts']);
            }

            MerchantSlotPayout::whereIn('id', $payouts->pluck('id'))->update([
                'status' => 'requested',
            ]);

            return redirect()->back()->with('success', 'Payouts marked as requested.');
        }

        return back()->withErrors(['message' => 'Unauthorized action']);
    }

    public function markPaid(Request $request, $payoutId)
    {
        $payout = MerchantSlotPayout::findOrFail($payoutId);
        
        // Update payout status
        $payout->status = 'paid';
        $payout->save();

        // Find and update the related payout request if exists
        $payoutRequest = MerchantPayoutRequest::where('payout_ids', 'like', '%"' . $payoutId . '"%')
            ->where('status', 'pending')
            ->first();

        if ($payoutRequest) {
            // Check if all payouts in this request are now paid
            $allPayoutIds = $payoutRequest->payout_ids;
            $allPaid = MerchantSlotPayout::whereIn('id', $allPayoutIds)
                ->where('status', '!=', 'paid')
                ->count() === 0;

            if ($allPaid) {
                $payoutRequest->status = 'paid';
                $payoutRequest->paid_at = now();
                $payoutRequest->save();
            }
        }

        return redirect()->back()->with('success', 'Payout marked as paid');
    }
}