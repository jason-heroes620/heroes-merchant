<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Event;
use App\Models\Booking;
use App\Models\Merchant;
use App\Models\Customer;
use App\Models\Conversion;
use App\Models\PurchasePackage;
use App\Models\CustomerCreditTransaction;
use App\Models\MerchantSlotPayout;

class AdminDashboardService
{
    protected $today;
    protected $weekStart;
    protected $monthStart;

    public function __construct()
    {
        $this->today = Carbon::today('Asia/Kuala_Lumpur');
        $this->weekStart = Carbon::now('Asia/Kuala_Lumpur')->startOfWeek();
        $this->monthStart = Carbon::now('Asia/Kuala_Lumpur')->startOfMonth();
    }

    /**
     * MAIN ENTRY
     */
    public function getDashboardData()
    {
        return [
            'currentConversions' => $this->getActiveConversions(),
            'currentPackages' => $this->getActivePackages(),

            'period' => [
                'today' => $this->getPeriodStats($this->today),
                'week'  => $this->getPeriodStats($this->weekStart),
                'month' => $this->getPeriodStats($this->monthStart),
            ],

            'charts' => $this->getCharts(),
            'tables' => $this->getTables(),
            'merchantStats' => $this->getMerchantStats(),
            'customerStats' => $this->getCustomerStats(),
            'packageSales' => $this->getPackageSales(),
        ];
    }

    /* ---------------------------------------------
     * ACTIVE CONVERSIONS & PACKAGES
     * --------------------------------------------- */
    protected function getActiveConversions()
    {
        return Conversion::where('status', 'active')
            ->where('effective_from', '<=', $this->today)
            ->where(fn($q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $this->today))
            ->get();
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
     * USER STATS - Updated with newReferrals
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

        $payouts = MerchantSlotPayout::where('calculated_at', '>=', $startDate)
            ->sum('gross_amount_in_rm');

        return [
            'totalPurchases' => $purchases,
            'totalPayouts' => $payouts,
            'netRevenue' => $purchases - $payouts,
        ];
    }

    /* ---------------------------------------------
     * CHARTS - Updated for 7-day payout trend
     * --------------------------------------------- */
    protected function getCharts()
    {
        return [
            'bookingsOverTime' => Booking::selectRaw("
                    DATE(booked_at) as date,
                    COUNT(*) as count
                ")
                ->where('status', 'confirmed')
                ->where('booked_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),

            'purchasesOverTime' => CustomerCreditTransaction::selectRaw("
                    DATE(created_at) as date,
                    SUM(amount_in_rm) as amount
                ")
                ->where('type', 'purchase')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),

            'payoutTrend' => MerchantSlotPayout::selectRaw("
                    DATE(calculated_at) as date,
                    SUM(net_amount_in_rm) as amount
                ")
                ->where('calculated_at', '>=', now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ];
    }

    /* ---------------------------------------------
     * TABLES - Updated with merchant info in activity
     * --------------------------------------------- */
    protected function getTables()
    {
        return [
            'payoutRequests' => MerchantSlotPayout::where('status', 'requested')
                ->with(['merchant.user'])
                ->orderBy('available_at')
                ->get(),

            'topEvents' => Event::withCount(['bookings' => fn($q) => $q->where('status', 'confirmed')])
                ->having('bookings_count', '>', 0)
                ->orderBy('bookings_count', 'desc')
                ->with(['merchant.user', 'media', 'location'])
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
                  ->withSum('payouts', 'net_amount_in_rm');
            }])
            ->get()
            ->map(fn($u) => [
                'merchant_id' => $u->merchant->id,
                'name' => $u->full_name,
                'email' => $u->email,
                'total_events' => (int) ($u->merchant->events_count ?? 0),
                'total_earned' => (float) ($u->merchant->payouts_sum_net_amount_in_rm ?? 0),
            ])
            ->sortByDesc('total_earned')
            ->take(10)
            ->values();
    }

    /* ---------------------------------------------
     * CUSTOMER ENGAGEMENT
     * --------------------------------------------- */
    protected function getCustomerStats()
    {
        $totalCustomers = User::where('role', 'customer')->count();

        $activeCustomers = User::where('role', 'customer')
            ->where(function ($q) {
                $q->whereHas('customer.bookings', fn($b) =>
                    $b->where('status', 'confirmed')
                    ->where('booked_at', '>=', now()->subDays(30))
                )
                ->orWhereHas('customer.likedEvents', fn($l) =>
                    $l->where('event_likes.created_at', '>=', now()->subDays(30))
                );
            })
            ->count();

        $totalConfirmedBookings = Booking::where('status', 'confirmed')->count();
        $uniqueCustomers = Booking::where('status', 'confirmed')->distinct('customer_id')->count('customer_id');

        return [
            'totalCustomers' => $totalCustomers,
            'activeCustomers' => $activeCustomers,
            'averageBookingsPerCustomer' =>
                $uniqueCustomers > 0 ? round($totalConfirmedBookings / $uniqueCustomers, 2) : 0,
        ];
    }

    /* ---------------------------------------------
     * PACKAGE SALES
     * --------------------------------------------- */
    protected function getPackageSales()
    {
        return PurchasePackage::withCount('transactions')
            ->withSum('transactions', 'amount_in_rm')
            ->get()
            ->map(fn($p) => [
                'package_name' => $p->name,
                'price_in_rm' => $p->price_in_rm,
                'paid_credits' => $p->paid_credits,
                'free_credits' => $p->free_credits,
                'total_sold' => $p->purchase_transactions_count ?? 0,
                'revenue' => $p->purchase_transactions_sum_amount_in_rm ?? 0,
            ]);
    }
}