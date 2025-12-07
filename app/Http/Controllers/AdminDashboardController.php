<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Conversion;
use App\Models\Event;
use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\CustomerCreditTransaction;
use App\Models\MerchantSlotPayout;
use App\Models\MerchantPayoutRequest;
use App\Models\PurchasePackage;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today('Asia/Kuala_Lumpur'); 
        $startOfMonth = Carbon::now('Asia/Kuala_Lumpur')->startOfMonth();
        $endOfMonth = Carbon::now('Asia/Kuala_Lumpur')->endOfMonth();

         /*
        |--------------------------------------------------------------------------
        | Active Conversion Rate
        |--------------------------------------------------------------------------
        */
        $activeConversionRate = Conversion::where('status', 'active');
        /*
        |--------------------------------------------------------------------------
        | Stats: Events
        |--------------------------------------------------------------------------
        */

        $activeEvents = Event::where(function ($q) use ($today) {
            $q->whereHas('dates', fn($d) =>
                    $d->where('end_date', '>=', $today)
            )
            ->orWhereHas('slots', function ($s) use ($today) {
                $s->whereRaw("STR_TO_DATE(CONCAT(date,' ',end_time), '%Y-%m-%d %H:%i:%s') >= ?", [$today]);
            });
        })
        ->distinct('events.id')
        ->count('events.id');


        // Pending verification for merchants
        $pendingEvents = Event::where('status', 'pending')->count();

        /*
        |--------------------------------------------------------------------------
        | Stats: Users
        |--------------------------------------------------------------------------
        */
        $newSignups7 = User::where('created_at', '>=', now()->subDays(7))->count();
        $newSignups30 = User::where('created_at', '>=', now()->subDays(30))->count();

        /*
        |--------------------------------------------------------------------------
        | Stats: Bookings & Purchases
        |--------------------------------------------------------------------------
        */
        $totalBookings = Booking::where('status', 'confirmed')->count();

        $totalCredits = BookingItem::whereHas('booking', function ($q) {
                $q->where('status', 'confirmed');
            })
            ->selectRaw('
                SUM(free_credits) as total_free_credits,
                SUM(paid_credits) as total_paid_credits
            ')
            ->first();

        $totalFreeCredits = $totalCredits->total_free_credits ?? 0;
        $totalPaidCredits = $totalCredits->total_paid_credits ?? 0;

        // RM purchases based on wallet spend (paid credits only)
        $totalPurchasesRm = CustomerCreditTransaction::where('type', 'purchase')
            ->whereNotNull('amount_in_rm')
            ->sum('amount_in_rm');

        /*
        |--------------------------------------------------------------------------
        | Stats: Payouts
        |--------------------------------------------------------------------------
        */
        $payoutPending = MerchantPayoutRequest::where('status', 'pending')->sum('amount_requested');
        $payoutPaid = MerchantSlotPayout::where('status', 'paid')->sum('net_amount_in_rm');
        $payoutTotal = MerchantSlotPayout::sum('net_amount_in_rm');

        /*
        |--------------------------------------------------------------------------
        | Net Earnings = Customer Purchases - Gross Merchant payouts
        |--------------------------------------------------------------------------
        */
        $grossPayouts = MerchantSlotPayout::sum('gross_amount_in_rm');
        $netEarnings = $totalPurchasesRm - $grossPayouts;

        /*
        |--------------------------------------------------------------------------
        | Charts: Bookings Over Time (last 30 days)
        |--------------------------------------------------------------------------
        */
        $bookingsOverTime = Booking::selectRaw("
                DATE(booked_at) as date,
                COUNT(*) as count
            ")
            ->where('status', 'confirmed')
            ->where('booked_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Charts: Purchases Over Time (last 30 days)
        |--------------------------------------------------------------------------
        */
        $purchasesOverTime = CustomerCreditTransaction::selectRaw("
                DATE(created_at) as date,
                SUM(amount_in_rm) as amount
            ")
            ->where('type', 'purchase') 
            ->whereNotNull('purchase_package_id') 
            ->where('amount_in_rm', '>', 0)
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Charts: Payout Trend (last 30 days)
        |--------------------------------------------------------------------------
        */
        $payoutTrend = MerchantSlotPayout::selectRaw("
                DATE(calculated_at) as date,
                SUM(net_amount_in_rm) as amount
            ")
            ->where('calculated_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Table: Payout Requests List
        |--------------------------------------------------------------------------
        */
        $payoutRequests = MerchantSlotPayout::where('status', 'requested')
            ->with(['merchant.user'])
            ->orderBy('available_at', 'asc')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Top Performing Events
        |--------------------------------------------------------------------------
        */
        $topEvents = Event::withCount(['bookings' => fn($q) => $q->where('status', 'confirmed')])
            ->having('bookings_count', '>', 0)
            ->orderBy('bookings_count', 'desc')
            ->limit(5)
            ->with(['merchant.user', 'media', 'location'])
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Recent Activity Feed
        |--------------------------------------------------------------------------
        */
        $recentActivity = collect()
            ->merge(
                Event::whereIn('status', ['pending', 'active', 'inactive', 'rejected'])
                    ->latest()
                    ->limit(5)
                    ->with(['merchant.user'])
                    ->get()
                    ->map(fn($e) => [
                        'type' => "event_{$e->status}",
                        'data' => $e,
                        'timestamp' => $e->created_at->toISOString(),
                    ])
            )
            ->merge(
                Booking::whereIn('status', ['confirmed', 'cancelled', 'refunded'])
                    ->latest('booked_at')
                    ->limit(5)
                    ->with(['event', 'customer.user'])
                    ->get()
                    ->map(fn($b) => [
                        'type' => "booking_{$b->status}",
                        'data' => $b,
                        'timestamp' => Carbon::parse($b->booked_at)->toISOString()
                    ])
            )
            ->sortByDesc('timestamp')
            ->take(10)
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Merchant Performance - FIXED VERSION
        |--------------------------------------------------------------------------
        */
        $merchantStats = User::where('role', 'merchant')
            ->whereHas('merchant') 
            ->with(['merchant' => function($q) {
                $q->withCount('events')
                  ->withSum('payouts', 'net_amount_in_rm');
            }])
            ->get()
            ->filter(fn($u) => $u->merchant !== null) 
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

        /*
        |--------------------------------------------------------------------------
        | Customer Engagement
        |--------------------------------------------------------------------------
        */
        $totalCustomers = User::where('role', 'customer')->count();
        $activeCustomers = User::where('role', 'customer')
            ->where(function ($q) {
                $q->whereHas('customer.bookings', fn($q2) =>
                    $q2->where('status', 'confirmed')
                    ->where('booked_at', '>=', now()->subDays(30))
                )
                ->orWhereHas('customer.likedEvents', fn($q3) =>
                    $q3->where('event_likes.created_at', '>=', now()->subDays(30))
                );
            })
            ->count();


        // Calculate average bookings per customer
        $totalConfirmedBookings = Booking::where('status', 'confirmed')->count();
        $totalUniqueCustomers = Booking::where('status', 'confirmed')
            ->distinct('customer_id')
            ->count('customer_id');
        
        $averageBookingsPerCustomer = $totalUniqueCustomers > 0 
            ? round($totalConfirmedBookings / $totalUniqueCustomers, 2) 
            : 0;

        $customerStats = [
            'totalCustomers' => $totalCustomers,
            'activeCustomers' => $activeCustomers,
            'averageBookingsPerCustomer' => $averageBookingsPerCustomer,
        ];

        /*
        |--------------------------------------------------------------------------
        | Credit Package Analytics
        |--------------------------------------------------------------------------
        */
        $packageSales = PurchasePackage::withCount('transactions')
            ->withSum('transactions', 'amount_in_rm')
            ->get()
            ->map(fn($p) => [
                'package_name' => $p->package_name,
                'total_sold' => $p->transactions_count ?? 0,
                'revenue' => $p->transactions_sum_amount_in_rm ?? 0,
            ]);

        /*
        |--------------------------------------------------------------------------
        | Render Inertia
        |--------------------------------------------------------------------------
        */
        return Inertia::render('Admin/Dashboard', [
            'activeConversionRate' => $activeConversionRate,
            'stats' => [
                'activeEvents' => $activeEvents,
                'pendingEvents' => $pendingEvents,
                'newSignups7' => $newSignups7,
                'newSignups30' => $newSignups30,
                'totalPurchasesRm' => $totalPurchasesRm,
                'totalBookings' => $totalBookings,
                'totalFreeCredits' => $totalFreeCredits,
                'totalPaidCredits' => $totalPaidCredits,
                'payoutPending' => $payoutPending,
                'payoutPaid' => $payoutPaid,
                'payoutTotal' => $payoutTotal,
                'netEarnings' => $netEarnings,
            ],
            'charts' => [
                'bookingsOverTime' => $bookingsOverTime,
                'purchasesOverTime' => $purchasesOverTime,
                'payoutTrend' => $payoutTrend,
            ],
            'payoutRequests' => $payoutRequests,
            'topEvents' => $topEvents,
            'recentActivity' => $recentActivity,
            'merchantStats' => $merchantStats,
            'customerStats' => $customerStats,
            'packageSales' => $packageSales,
            'userRole' => $request->user()->role,
        ]);
    }
}