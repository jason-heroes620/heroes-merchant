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
        
        // Time ranges
        $startOfToday = $today->copy()->startOfDay();
        $endOfToday = $today->copy()->endOfDay();
        
        $startOfWeek = $today->copy()->startOfWeek();
        $endOfWeek = $today->copy()->endOfWeek();
        
        $startOfMonth = $today->copy()->startOfMonth();
        $endOfMonth = $today->copy()->endOfMonth();
        
        // Previous periods for comparison
        $startOfYesterday = $today->copy()->subDay()->startOfDay();
        $endOfYesterday = $today->copy()->subDay()->endOfDay();
        
        $startOfLastWeek = $today->copy()->subWeek()->startOfWeek();
        $endOfLastWeek = $today->copy()->subWeek()->endOfWeek();
        
        $startOfLastMonth = $today->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $today->copy()->subMonth()->endOfMonth();

        $merchantEventIds = $merchant->events()->pluck('id')->toArray();

        // -----------------------------
        // Active & Past Events
        // -----------------------------
        $events = Event::where('merchant_id', $merchant->id)
            ->where('status', 'active')
            ->with(['dates', 'media', 'slots', 'ageGroups', 'location'])
            ->orderBy('created_at', 'desc')
            ->get();

        $activeEvents = collect();
        $pastEvents = collect();

        foreach ($events as $event) {
            $isActive = false;

            if (!$event->is_recurring) {
                $date = $event->dates->first();
                if ($date && Carbon::parse($date->end_date)->gte($today)) {
                    $isActive = true;
                }
            } else {
                foreach ($event->slots as $slot) {
                    if (!$slot->date || !$slot->end_time) continue;

                    try {
                        $normalizedDate = Carbon::parse($slot->date)
                            ->setTimezone('Asia/Kuala_Lumpur')
                            ->format('Y-m-d');
                        $normalizedTime = Carbon::parse($slot->end_time)->format('H:i:s');
                        $slotEnd = Carbon::parse("{$normalizedDate} {$normalizedTime}", 'Asia/Kuala_Lumpur');
                    } catch (\Exception $e) {
                        continue;
                    }

                    if ($slotEnd->gte($today)) {
                        $isActive = true;
                        break;
                    }
                }
            }

            if ($isActive) {
                $activeEvents->push($event);
            } else {
                $pastEvents->push($event);
            }
        }

        // -----------------------------
        // All Bookings
        // -----------------------------
        $allBookings = Booking::where('status', 'confirmed')
            ->whereHas('slot', fn($q) => $q->whereIn('event_id', $merchantEventIds))
            ->with(['event.media', 'claim.customer', 'customer.user', 'event.ageGroups', 'slot'])
            ->orderBy('booked_at', 'desc')
            ->get();

        $allBookings->transform(function ($booking) {
            $claim = $booking->claim->firstWhere('customer_id', $booking->customer_id);
            $booking->claim_status = $claim->status ?? 'pending';
            
            $slot = $booking->slot;
            if ($slot) {
                $booking->slot_start = optional($slot->display_start)->toDateTimeString();
                $booking->slot_end = optional($slot->display_end)->toDateTimeString();
            }
            
            return $booking;
        });

        // -----------------------------
        // Bookings by Period
        // -----------------------------
        $todayBookings = $allBookings->filter(function($b) use ($startOfToday, $endOfToday) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfToday, $endOfToday);
        })->values();

        $weekBookings = $allBookings->filter(function($b) use ($startOfWeek, $endOfWeek) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfWeek, $endOfWeek);
        })->values();

        $monthBookings = $allBookings->filter(function($b) use ($startOfMonth, $endOfMonth) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfMonth, $endOfMonth);
        })->values();

        // -----------------------------
        // Revenue Calculations
        // -----------------------------
        $todayRevenue = $todayBookings->sum('total_amount_in_rm');
        $yesterdayRevenue = $allBookings->filter(function($b) use ($startOfYesterday, $endOfYesterday) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfYesterday, $endOfYesterday);
        })->sum('total_amount_in_rm');
        
        $weekRevenue = $weekBookings->sum('total_amount_in_rm');
        $lastWeekRevenue = $allBookings->filter(function($b) use ($startOfLastWeek, $endOfLastWeek) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfLastWeek, $endOfLastWeek);
        })->sum('total_amount_in_rm');
        
        $monthRevenue = $monthBookings->sum('total_amount_in_rm');
        $lastMonthRevenue = $allBookings->filter(function($b) use ($startOfLastMonth, $endOfLastMonth) {
            $bookedAt = Carbon::parse($b->booked_at);
            return $bookedAt->between($startOfLastMonth, $endOfLastMonth);
        })->sum('total_amount_in_rm');

        // Percentage increases
        $todayPercentage = $yesterdayRevenue > 0 
            ? (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100 
            : 0;
            
        $weekPercentage = $lastWeekRevenue > 0 
            ? (($weekRevenue - $lastWeekRevenue) / $lastWeekRevenue) * 100 
            : 0;
            
        $monthPercentage = $lastMonthRevenue > 0 
            ? (($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : 0;

        // -----------------------------
        // This Month Payout (Pending payouts for current month)
        // -----------------------------
        $thisMonthPayout = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('total_amount_in_rm');

        // Payout date (last day of current month)
        $payoutDate = $endOfMonth->format('F j, Y');

        // -----------------------------
        // Render Inertia
        // -----------------------------
        return Inertia::render('Merchant/Dashboard', [
            'activeEvents' => $activeEvents,
            'pastEvents' => $pastEvents,
            'allBookings' => $allBookings,
            'todayBookings' => $todayBookings,
            'weekBookings' => $weekBookings,
            'monthBookings' => $monthBookings,
            
            // Revenue data
            'todayRevenue' => $todayRevenue,
            'weekRevenue' => $weekRevenue,
            'monthRevenue' => $monthRevenue,
            'todayPercentage' => $todayPercentage,
            'weekPercentage' => $weekPercentage,
            'monthPercentage' => $monthPercentage,
            
            // Payout data
            'thisMonthPayout' => $thisMonthPayout,
            'payoutDate' => $payoutDate,
            
            'userRole' => $request->user()->role,
        ]);
    }
}
