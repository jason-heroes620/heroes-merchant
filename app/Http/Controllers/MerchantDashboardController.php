<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Booking;
use App\Models\MerchantSlotPayout;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MerchantDashboardController extends Controller
{
    public function index(Request $request)
    {
        $merchant = $request->user()->merchant;
        $today = Carbon::today('Asia/Kuala_Lumpur'); 
        $startOfMonth = Carbon::now('Asia/Kuala_Lumpur')->startOfMonth();
        $endOfMonth = Carbon::now('Asia/Kuala_Lumpur')->endOfMonth();

        $merchantEventIds = $merchant->events()->pluck('id')->toArray();

        // -----------------------------
        // Active & Past Events
        // -----------------------------
        $activeEvents = Event::where('merchant_id', $merchant->id)
            ->whereHas('dates', fn($q) => $q->where('end_date', '>=', $today))
            ->with(['dates', 'media'])
            ->orderBy('created_at', 'desc')
            ->get();

        $pastEvents = Event::where('merchant_id', $merchant->id)
            ->whereDoesntHave('dates', fn($q) => $q->where('end_date', '>=', $today))
            ->with('media')
            ->orderBy('created_at', 'desc')
            ->get();

        // -----------------------------
        // Bookings
        // -----------------------------
        $startOfToday = $today->copy()->startOfDay();
        $endOfToday   = $today->copy()->endOfDay();

        $startOfWeek = $today->copy()->subDays(7)->startOfDay();

        $allBookings = Booking::where('status', 'confirmed')
            ->whereHas('slot', fn($q) => $q->whereIn('event_id', $merchantEventIds))
            ->with(['event.media', 'slot', 'customer.user'])
            ->orderBy('booked_at', 'desc')
            ->get();

        $todayBookings = $allBookings->filter(function($b) use ($startOfToday, $endOfToday) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfToday, $endOfToday);
        })->values();

        $weekBookings = $allBookings->filter(function($b) use ($startOfWeek, $endOfToday) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfWeek, $endOfToday);
        })->values();
        
        // -----------------------------
        // Payouts
        // -----------------------------
        $availablePayouts = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->where('available_at', '<=', now())
            ->sum('net_amount_in_rm');

        $pendingPayouts = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'requested')
            ->sum('net_amount_in_rm');

        // -----------------------------
        // Dashboard stats
        // -----------------------------
        $monthlySales = $allBookings
            ->filter(fn($b) => Carbon::parse($b->booked_at)->between($startOfMonth, $endOfMonth))
            ->sum('quantity');

        $lastMonthStart = $startOfMonth->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $startOfMonth->copy()->subMonth()->endOfMonth();

        $lastMonthSales = $allBookings
            ->filter(fn($b) => Carbon::parse($b->booked_at)->between($lastMonthStart, $lastMonthEnd))
            ->sum('quantity');

        $percentageIncrease = $lastMonthSales > 0
            ? (($monthlySales - $lastMonthSales) / $lastMonthSales) * 100
            : null;

        $totalBookingsThisMonth = $allBookings
            ->filter(fn($b) => Carbon::parse($b->booked_at)->between($startOfMonth, $endOfMonth))
            ->count();

        // -----------------------------
        // Render Inertia
        // -----------------------------
        return Inertia::render('Merchant/Dashboard', [
            'activeEvents' => $activeEvents,
            'pastEvents' => $pastEvents,
            'allBookings' => $allBookings,
            'todayBookings' => $todayBookings,
            'weekBookings' => $weekBookings,
            'monthlySales' => $monthlySales,
            'lastMonthSales' => $lastMonthSales,
            'percentageIncrease' => $percentageIncrease,
            'availablePayouts' => $availablePayouts,
            'pendingPayouts' => $pendingPayouts,
            'totalBookingsThisMonth' => $totalBookingsThisMonth,
            'userRole' => $request->user()->role,
        ]);
    }
}

