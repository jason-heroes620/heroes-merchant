<?php

namespace App\Http\Controllers;

use App\Models\Merchant;
use App\Models\MerchantSlotPayout;
use App\Services\MerchantPayoutService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MerchantPayoutController extends Controller
{
    protected MerchantPayoutService $payoutService;

    public function __construct(MerchantPayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
    }
    /**
     * Display a listing of merchant payouts.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $merchantId = null;

         if (!$isAdmin) {
            $merchant = $user->merchant
                ?? Merchant::where('user_id', $user->id)->firstOrFail();
            $merchantId = $merchant->id;
        } elseif ($request->merchant_id) {
            $merchantId = $request->merchant_id;
        }

        $selectedMonth = $request->month ?? now('Asia/Kuala_Lumpur')->format('Y-m');

        $allPayouts = $this->payoutService->getAllPayouts();

       if ($merchantId) {
            $allPayouts = array_filter(
                $allPayouts,
                fn ($p) => $p['payout']->merchant_id === $merchantId
            );
        }

        $allPayouts = array_filter($allPayouts, function ($p) use ($selectedMonth) {
            if (empty($p['slot_start'])) {
                return false;
            }

            return $p['slot_start']->format('Y-m') === $selectedMonth;
        });

        $monthEndTotal = collect($allPayouts)->sum('subtotal');
        
        if ($isAdmin) {
        $grouped = collect($allPayouts)->groupBy(
            fn ($p) => $p['payout']->merchant_id
        );

        $rows = $grouped->map(function ($items) {
            $first = $items->first();
            $merchant = $first['payout']->merchant;

            return [
                'id' => $merchant->id,
                'merchant_company' => $merchant->company_name,
                'total_payout' => $items->sum('subtotal'),
                'status' => $items->every(
                    fn ($i) => $i['status'] === 'paid'
                ) ? 'paid' : 'pending',
                // keep for navigation / actions
                'payout_ids' => $items->pluck('payout.id')->all(),
            ];
        })->values()->all();
        } else {
            $grouped = collect($allPayouts)->groupBy(
                fn ($p) => $p['payout']->slot->event_id
            );

            $rows = $grouped->map(function ($items) {
                $first = $items->first();
                $event = $first['payout']->slot->event;

                return [
                    'id' => $event->id,
                    'event_title' => $event->title,
                    'total_payout' => $items->sum('subtotal'),
                    'status' => $items->every(
                        fn ($i) => $i['status'] === 'paid'
                    ) ? 'paid' : 'pending',
                    // keep for navigation / actions
                    'payout_ids' => $items->pluck('payout.id')->all(),
                ];
            })->values()->all();
        }

        /**
         * STEP 5: Return index data
         */
        return Inertia::render('MerchantSlotPayout/Index', [
            'rows' => $rows,
            'role' => $user->role,
            'month' => $selectedMonth,
            'month_end_total' => $monthEndTotal,
        ]);
    }

    /**
     * Display a specific payout.
     */
    public function show(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';

        $id = $request->id;
        $selectedMonth = $request->month ?? now('Asia/Kuala_Lumpur')->format('Y-m');

        if (!$id) {
            abort(404);
        }

        if (!$isAdmin) {
            $merchant = $user->merchant;
            if (!$merchant) {
                abort(403);
            }
        }

        $allPayouts = collect($this->payoutService->getAllPayouts())
            ->map(function ($p) {
                // Ensure relationships are loaded
                if (isset($p['payout']) && $p['payout'] instanceof MerchantSlotPayout) {
                    $p['payout']->loadMissing('merchant', 'slot.event');
                }
                return $p;
            });

        // Log all payouts to inspect
        Log::info('All Payouts Loaded', ['all_payouts' => $allPayouts->toArray()]);

        if ($isAdmin) {
            $merchantPayouts = $allPayouts
                ->filter(fn ($p) =>
                    $p['payout']->merchant_id === $id &&
                    $p['slot_start']?->format('Y-m') === $selectedMonth
                )
                ->groupBy(fn ($p) => $p['payout']->slot->event->id);

            if ($merchantPayouts->isEmpty()) {
                abort(404);
            }

            $events = $merchantPayouts->map(function ($eventPayouts) {
                $firstPayout = $eventPayouts->first()['payout'];
                $event = $firstPayout->slot->event;
                $merchant = $firstPayout->merchant;

                // Log first payout details
                Log::info('First Payout for Event', [
                    'payout_id' => $firstPayout->id,
                    'merchant' => $merchant ? $merchant->toArray() : null,
                    'event' => $event->toArray(),
                ]);

                return [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'merchant_company' => $merchant->company_name ?? 'N/A',
                    'total_amount' => $eventPayouts->sum('subtotal'),
                    'slots' => $eventPayouts->map(function ($p) {
                        return [
                            'slot_start' => $p['slot_start']?->format('Y-m-d H:i:s'),
                            'slot_end' => $p['slot_end']?->format('Y-m-d H:i:s'),
                            'subtotal' => $p['subtotal'],
                            'booking_breakdown' => $this->mapBookingBreakdown($p),
                        ];
                    })->values(),
                ];
            })->values();

            return Inertia::render('MerchantSlotPayout/Show', [
                'role' => 'admin',
                'month' => $selectedMonth,
                'events' => $events,
            ]);
        }

        // MERCHANT VIEW
        $eventPayouts = $allPayouts
            ->filter(fn ($p) =>
                $p['payout']->merchant_id === $merchant->id &&
                $p['payout']->slot->event->id === $id &&
                $p['slot_start']?->format('Y-m') === $selectedMonth
            );

        if ($eventPayouts->isEmpty()) {
            abort(404);
        }

        $event = $eventPayouts->first()['payout']->slot->event;

        // Log merchant view details
        Log::info('Merchant Event Payouts', [
            'merchant' => $merchant->toArray(),
            'event' => $event->toArray(),
            'payouts' => $eventPayouts->toArray(),
        ]);

        return Inertia::render('MerchantSlotPayout/Show', [
            'role' => 'merchant',
            'month' => $selectedMonth,
            'event' => [
                'event_id' => $event->id,
                'event_title' => $event->title,
                'merchant_company' => $merchant->company_name ?? 'N/A',
                'total_amount' => $eventPayouts->sum('subtotal'),
                'slots' => $eventPayouts->map(function ($p) {
                    return [
                        'slot_start' => $p['slot_start']?->format('Y-m-d H:i:s'),
                        'slot_end' => $p['slot_end']?->format('Y-m-d H:i:s'),
                        'subtotal' => $p['subtotal'],
                        'booking_breakdown' => $this->mapBookingBreakdown($p),
                    ];
                })->values(),
            ],
        ]);
    }

    private function mapBookingBreakdown(array $p)
    {
        return array_map(function ($item) {
            $quantity = $item['quantity'] ?? 1;

            return [
                'age_group_id' => $item['age_group_id'] ?? null,
                'age_group_label' => $item['age_group_label'] ?? 'General',
                'quantity' => $quantity,
                'price_in_rm' => $quantity
                    ? ($item['total_amount'] / $quantity)
                    : $item['total_amount'],
                'total_amount' => $item['total_amount'] ?? 0,
            ];
        }, $p['booking_breakdown'] ?? []);
    }

    public function markAsPaid(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $payoutIds = $request->input('payout_ids', []);
        $updated = 0;

        foreach ($payoutIds as $id) {
            $payout = MerchantSlotPayout::find($id);
            if ($payout && $payout->status !== 'paid') {
                $payout->status = 'paid';
                $payout->paid_at = now('Asia/Kuala_Lumpur');
                $payout->save();
                $updated++;
                Log::info('Payout marked as paid by admin', [
                    'payout_id' => $payout->id,
                    'admin_user_id' => $user->id,
                    'paid_at' => $payout->paid_at,
                ]);
            }
        }

        if ($updated === 0) {
            return back()->with('error', 'No payouts were marked as paid.');
        }

        return back()->with('success', "$updated payout(s) marked as paid successfully.");
    }

    /**
     * Export payouts to PDF.
     */
    public function exportSlotPayoutPdf(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $merchant = null;
        $merchantId = null;

        if (!$isAdmin) {
            $merchant = $user->merchant
                ?? Merchant::where('user_id', $user->id)->firstOrFail();
            $merchantId = $merchant->id;
        } elseif ($request->merchant_id) {
            $merchantId = $request->merchant_id;
        }

        $month = $request->input(
            'month',
            Carbon::now('Asia/Kuala_Lumpur')->format('Y-m')
        );

        $allPayouts = collect($this->payoutService->getAllPayouts())
            ->map(function ($p) {
                if (isset($p['payout']) && $p['payout'] instanceof MerchantSlotPayout) {
                    $p['payout']->loadMissing('merchant', 'slot.event');
                }
                return $p;
            })
            ->filter(function ($p) use ($month, $merchantId, $isAdmin, $user, &$merchant) {
                // Filter by merchant
                if (!$isAdmin && $p['payout']->merchant_id !== $merchant?->id) {
                    return false;
                }
                if ($isAdmin && $merchantId && $p['payout']->merchant_id !== $merchantId) {
                    return false;
                }

                // Filter by month
                return $p['slot_start']?->format('Y-m') === $month;
            });

        $monthData = [];
        // Filter by month and merchant
        $filtered = collect($allPayouts)
            ->filter(function ($p) use ($merchantId, $month) {
                if (empty($p['slot_start'])) return false;
                return $p['slot_start']->format('Y-m') === $month
                    && (!$merchantId || $p['payout']->merchant_id === $merchantId);
            });

        if ($isAdmin) {
            // Admin: group by merchant, then events and slots
            $groupedByMerchant = $filtered->groupBy(fn($p) => $p['payout']->merchant_id);

            $payouts = $groupedByMerchant->map(function ($items, $mId) {
                $merchant = $items->first()['payout']->merchant;
                $events = $items->groupBy(fn($p) => $p['payout']->slot->event->id)
                    ->map(function ($eventPayouts) {
                        $event = $eventPayouts->first()['payout']->slot->event;
                        $slots = $eventPayouts->map(function ($p) {
                            return [
                                'slot_start' => $p['slot_start']?->format('Y-m-d H:i:s'),
                                'slot_end' => $p['slot_end']?->format('Y-m-d H:i:s'),
                                'subtotal' => $p['subtotal'],
                                'total_bookings' => count($p['booking_breakdown'] ?? []),
                                'booking_breakdown' => $this->mapBookingBreakdown($p),
                            ];
                        })->values();

                        return [
                            'event_title' => $event->title,
                            'total_amount' => $eventPayouts->sum('subtotal'),
                            'total_bookings' => $eventPayouts->sum(fn($s) => count($s['booking_breakdown'] ?? [])),
                            'slots' => $slots,
                        ];
                    })->values();

                return [
                    'merchant_company' => $merchant->company_name ?? 'N/A',
                    'total_amount' => $items->sum('subtotal'),
                    'total_bookings' => $items->sum(fn($i) => count($i['booking_breakdown'] ?? [])),
                    'events' => $events,
                ];
            })->values();
        } else {
            // Merchant: group by event only
            $groupedByEvent = $filtered->groupBy(fn($p) => $p['payout']->slot->event->id);

            $payouts = $groupedByEvent->map(function ($eventPayouts) use ($merchant) {
                $event = $eventPayouts->first()['payout']->slot->event;

                $slots = $eventPayouts->map(function ($p) {
                    return [
                        'slot_start' => $p['slot_start']?->format('Y-m-d H:i:s'),
                        'slot_end' => $p['slot_end']?->format('Y-m-d H:i:s'),
                        'subtotal' => $p['subtotal'],
                        'booking_breakdown' => $this->mapBookingBreakdown($p),
                    ];
                })->values();

                return [
                    'event_title' => $event->title,
                    'total_amount' => $eventPayouts->sum('subtotal'),
                    'slots' => $slots,
                ];
            })->values();
        }

        $monthData = [
            'total_amount' => $filtered->sum('subtotal'),
            'payouts' => $payouts,
        ];

        $pdf = Pdf::loadView('merchant_slot_payouts', [
            'month'       => Carbon::createFromFormat('Y-m', $month)->format('F Y'),
            'monthData'   => $monthData,
            'merchant'    => $merchant,
            'generatedAt' => now('Asia/Kuala_Lumpur')->format('l, F j, Y \a\t g:i A'),
            'mode'        => $isAdmin ? 'admin' : 'merchant',
        ]);

        return $pdf->download("merchant_slot_payouts_{$month}.pdf");
    }
}