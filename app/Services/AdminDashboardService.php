<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Event;
use App\Models\Booking;
use App\Models\Merchant;
use App\Models\Customer;
use App\Models\PurchasePackage;
use App\Models\CustomerCreditTransaction;
use App\Models\MerchantSlotPayout;
use App\Services\ConversionService;


class AdminDashboardService
{
    protected $today;
    protected $weekStart;
    protected $monthStart;
    protected $selectedMonth; 

    protected ConversionService $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
        $this->today = Carbon::today('Asia/Kuala_Lumpur');
        $this->weekStart = Carbon::now('Asia/Kuala_Lumpur')->startOfWeek();
        $this->monthStart = Carbon::now('Asia/Kuala_Lumpur')->startOfMonth();
    }
    public function getDashboardData(?string $month = null)
    {
        $this->selectedMonth = $month 
            ? Carbon::createFromFormat('Y-m', $month, 'Asia/Kuala_Lumpur')->startOfMonth()
            : Carbon::now('Asia/Kuala_Lumpur')->startOfMonth();

        return [
            'currentConversion' => $this->getActiveConversion(),
            'currentPackages' => $this->getActivePackages(),

            'period' => [
                'today' => $this->getPeriodStats($this->today),
                'week'  => $this->getPeriodStats($this->weekStart),
                'month' => $this->getPeriodStats($this->monthStart),
            ],

            'charts' => $this->getCharts(),
            'tables' => $this->getTables(),
            'merchantStats' => $this->getMerchantStats(),
            'packageSales' => $this->getPackageSales(),
        ];
    }

    /* ---------------------------------------------
     * ACTIVE CONVERSIONS
     * --------------------------------------------- */
    protected function getActiveConversion()
    {
        return $this->conversionService->getActiveConversion();
    }

    protected function getActivePackages()
    {
        return PurchasePackage::where('active', true)
            ->where('effective_from', '<=', $this->today)
            ->where(fn($q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $this->today))
            ->get();
    }

    /* ---------------------------------------------
     * PERIOD STATS (Today / Week / Month)
     * --------------------------------------------- */
    protected function getPeriodStats($startDate)
    {
        return [
            'events' => $this->getEventStats(),
            'users' => $this->getUserStats($startDate),
            'bookings' => $this->getBookingStats($startDate),
            'financials' => $this->getFinancialStats($startDate),
        ];
    }

    /* ---------------------------------------------
     * EVENT STATS
     * --------------------------------------------- */
    protected function getEventStats()
    {
        return [
            'active' => $this->countActiveEvents(),
            'pending' => Event::where('status', 'pending')->count(),
        ];
    }

    protected function countActiveEvents()
    {
        $today = $this->today;

        return Event::where(function ($q) use ($today) {
            $q->whereHas('dates', function ($d) use ($today) {
                $d->where('end_date', '>=', $today);
            })
            ->orWhereHas('slots', function ($s) use ($today) {
                $s->whereRaw(
                    "STR_TO_DATE(CONCAT(date, ' ', end_time), '%Y-%m-%d %H:%i:%s') >= ?",
                    [$today]
                );
            });
        })
        ->distinct('events.id')
        ->count('events.id');
    }

    /* ---------------------------------------------
     * USER STATS
     * --------------------------------------------- */
    protected function getUserStats($startDate)
    {
        return [
            'newRegistrations' => User::where('created_at', '>=', $startDate)->count(),
            'newReferrals' => Customer::where('created_at', '>=', $startDate)
                ->whereNotNull('referred_by')
                ->count(),
            'pendingMerchants' => Merchant::where('business_status', 'pending_verification')->count(),
        ];
    }

    /* ---------------------------------------------
     * BOOKING STATS
     * --------------------------------------------- */
    protected function getBookingStats($startDate)
    {
        return [
            'confirmed' => Booking::where('status', 'confirmed')->where('booked_at', '>=', $startDate)->count(),
            'cancelled' => Booking::where('status', 'cancelled')->where('booked_at', '>=', $startDate)->count(),
            'refunded' => Booking::where('status', 'refunded')->where('booked_at', '>=', $startDate)->count(),
        ];
    }

    /* ---------------------------------------------
     * FINANCIAL STATS
     * --------------------------------------------- */
    protected function getFinancialStats($startDate)
    {
        $purchases = CustomerCreditTransaction::where('type', 'purchase')
            ->where('created_at', '>=', $startDate)
            ->sum('amount_in_rm');

        $payouts = MerchantSlotPayout::where('created_at', '>=', $startDate)
            ->sum('total_amount_in_rm');

        return [
            'totalPurchases' => $purchases,
            'totalPayouts' => $payouts,
            'netRevenue' => $purchases - $payouts,
        ];
    }

   /* ---------------------------------------------
    * CHARTS
    * --------------------------------------------- */
    protected function getCharts()
    {
        $startOfMonth = $this->selectedMonth->copy()->startOfMonth();
        $endOfMonth = $this->selectedMonth->copy()->endOfMonth();
        $today = Carbon::today('Asia/Kuala_Lumpur');
        
        if ($startOfMonth->isAfter($today)) {
            return [
                'bookingsOverTime' => collect(),
            ];
        }
        
        if ($endOfMonth->isAfter($today)) {
            $endOfMonth = $today;
        }
        
        $allDays = collect();
        $currentDay = $startOfMonth->copy();
        
        while ($currentDay <= $endOfMonth) {
            $allDays->push($currentDay->format('Y-m-d'));
            $currentDay->addDay();
        }

        $bookings = Booking::selectRaw("
                DATE(booked_at) as date,
                COUNT(*) as count
            ")
            ->where('status', 'confirmed')
            ->whereBetween('booked_at', [$startOfMonth, $endOfMonth->copy()->endOfDay()])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $bookingsOverTime = $allDays->map(function ($day) use ($bookings) {
            return [
                'date' => $day,
                'count' => $bookings->get($day)?->count ?? 0,
            ];
        });

        return [
            'bookingsOverTime' => $bookingsOverTime->values(),
        ];
    }

    /* ---------------------------------------------
     * TABLES
     * --------------------------------------------- */
    protected function getTables()
    {
        return [
            'topEvents' => Event::withCount(['bookings' => fn($q) => $q->where('status', 'confirmed')])
                ->having('bookings_count', '>', 0)
                ->orderBy('bookings_count', 'desc')
                ->with(['merchant.user'])
                ->limit(5)
                ->get(),

            'recentActivity' => $this->getRecentActivity(),
        ];
    }

    protected function getRecentActivity()
    {
        return collect()
            ->merge(
                Event::latest()
                    ->limit(5)
                    ->with(['merchant.user'])
                    ->get()
                    ->map(fn($e) => [
                        'type' => "event_{$e->status}",
                        'data' => [
                            'title' => $e->title,
                            'merchant' => [
                                'user' => [
                                    'full_name' => $e->merchant->user->full_name ?? null
                                ]
                            ]
                        ],
                        'timestamp' => $e->created_at,
                    ])
            )
            ->merge(
                Booking::latest('booked_at')
                    ->limit(5)
                    ->with(['event', 'customer.user'])
                    ->get()
                    ->map(fn($b) => [
                        'type' => "booking_{$b->status}",
                        'data' => [
                            'event' => [
                                'title' => $b->event->title ?? null
                            ],
                            'customer' => [
                                'user' => [
                                    'full_name' => $b->customer->user->full_name ?? null
                                ]
                            ]
                        ],
                        'timestamp' => $b->booked_at,
                    ])
            )
            ->sortByDesc('timestamp')
            ->take(10)
            ->values();
    }

    /* ---------------------------------------------
     * MERCHANT PERFORMANCE
     * --------------------------------------------- */
    protected function getMerchantStats()
    {
        return User::where('role', 'merchant')
            ->whereHas('merchant')
            ->with(['merchant' => function($q) {
                $q->withCount('events')
                  ->withSum('payouts', 'total_amount_in_rm');
            }])
            ->get()
            ->map(fn($u) => [
                'merchant_id' => $u->merchant->id,
                'name' => $u->full_name,
                'email' => $u->email,
                'total_events' => (int) ($u->merchant->events_count ?? 0),
                'total_earned' => (float) ($u->merchant->payouts_sum_total_amount_in_rm ?? 0),
            ])
            ->sortByDesc('total_earned')
            ->take(10)
            ->values();
    }

    /* ---------------------------------------------
    * PACKAGE SALES
    * --------------------------------------------- */
    protected function getPackageSales()
    {
        $startOfMonth = $this->selectedMonth->copy()->startOfMonth();
        $endOfMonth = $this->selectedMonth->copy()->endOfMonth();
        $today = Carbon::today('Asia/Kuala_Lumpur');
        
        if ($startOfMonth->isAfter($today)) {
            return collect();
        }
        
        if ($endOfMonth->isAfter($today)) {
            $endOfMonth = $today;
        }

        return PurchasePackage::withCount([
                'transactions' => function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('created_at', [$startOfMonth, $endOfMonth->copy()->endOfDay()]);
                }
            ])
            ->withSum([
                'transactions' => function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('created_at', [$startOfMonth, $endOfMonth->copy()->endOfDay()]);
                }
            ], 'amount_in_rm')
            ->get()
            ->map(fn($p) => [
                'package_name' => $p->name,
                'price_in_rm' => $p->price_in_rm,
                'paid_credits' => $p->paid_credits,
                'free_credits' => $p->free_credits,
                'total_sold' => $p->transactions_count ?? 0,
                'revenue' => $p->transactions_sum_amount_in_rm ?? 0,
            ]);
    }
}