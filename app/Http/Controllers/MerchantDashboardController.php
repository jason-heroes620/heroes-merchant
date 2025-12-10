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
        $events = Event::where('merchant_id', $merchant->id)
            ->where('status', 'active')
            ->with(['dates', 'media', 'slots', 'ageGroups', 'location'])
            ->orderBy('created_at', 'desc')
            ->get();

        $activeEvents = collect();
        $pastEvents = collect();

        foreach ($events as $event) {
            $isActive = false;

            // --- Non-recurring events ---
            if (!$event->is_recurring) {
                $date = $event->dates->first();

                if ($date && Carbon::parse($date->end_date)->gte($today)) {
                    $isActive = true;
                }
            }

            // --- Recurring events (use slot date + end_time) ---
            else {
                foreach ($event->slots as $slot) {
                    if (!$slot->date || !$slot->end_time) {
                        continue;
                    }

                    try {
                        $normalizedDate = Carbon::parse($slot->date)
                            ->setTimezone('Asia/Kuala_Lumpur')
                            ->format('Y-m-d');

                        $normalizedTime = Carbon::parse($slot->end_time)
                            ->format('H:i:s');

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
        // Bookings
        // -----------------------------
        $startOfToday = $today->copy()->startOfDay();
        $endOfToday   = $today->copy()->endOfDay();

        $startOfWeek = $today->copy()->subDays(7)->startOfDay();

        $allBookings = Booking::where('status', 'confirmed')
            ->whereHas('slot', fn($q) => $q->whereIn('event_id', $merchantEventIds))
            ->with(['event.media', 'attendance.customer', 'customer.user', 'event.ageGroups', 'slot'])
            ->orderBy('booked_at', 'desc')
            ->get();

        $allBookings->transform(function ($booking) {
            $attendance = $booking->attendance
                ->firstWhere('customer_id', $booking->customer_id);
            $booking->attendance_status = $attendance->status ?? 'pending';
            return $booking;
        });

        $allBookings->transform(function ($booking) {
            $slot = $booking->slot;

            if ($slot) {
                $booking->slot_start = optional($slot->display_start)->toDateTimeString();
                $booking->slot_end = optional($slot->display_end)->toDateTimeString();
            }

            return $booking;
        });

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
        $monthlySales = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->whereBetween('calculated_at', [$startOfMonth, $endOfMonth])
            ->sum('gross_amount_in_rm');

        $lastMonthStart = $startOfMonth->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $startOfMonth->copy()->subMonth()->endOfMonth();

        $lastMonthSales = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->whereBetween('calculated_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('gross_amount_in_rm');

        $monthlyPercentageIncrease = $lastMonthSales > 0
            ? (($monthlySales - $lastMonthSales) / $lastMonthSales) * 100
            : null;

        $startOfWeek = $today->copy()->startOfWeek(); // Monday start
        $endOfWeek = $today->copy()->endOfWeek();

        $weeklySales = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->whereBetween('calculated_at', [$startOfWeek, $endOfWeek])
            ->sum('gross_amount_in_rm');

        $lastWeekStart = $startOfWeek->copy()->subWeek();       
        $lastWeekEnd = $startOfWeek->copy()->subWeek()->endOfWeek();

        $lastWeekSales = MerchantSlotPayout::where('merchant_id', $merchant->id)
            ->where('status', 'pending')
            ->whereBetween('calculated_at', [$lastWeekStart, $lastWeekEnd])
            ->sum('gross_amount_in_rm');

        $weeklyPercentageIncrease = $lastWeekSales > 0
            ? (($weeklySales - $lastWeekSales) / $lastWeekSales) * 100
            : null;

        $totalBookingsThisMonth = Booking::where('status', 'confirmed')
            ->whereHas('slot', fn($q) => $q->whereIn('event_id', $merchantEventIds))
            ->whereBetween('booked_at', [$startOfMonth, $endOfMonth])
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
            'weeklySales' => $weeklySales,
            'lastMonthSales' => $lastMonthSales,
            'monthlyPercentageIncrease' => $monthlyPercentageIncrease,
            'weeklyPercentageIncrease' => $weeklyPercentageIncrease,
            'availablePayouts' => $availablePayouts,
            'pendingPayouts' => $pendingPayouts,
            'totalBookingsThisMonth' => $totalBookingsThisMonth,
            'userRole' => $request->user()->role,
        ]);
    }
}

