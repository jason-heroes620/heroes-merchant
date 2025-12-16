<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\BookingAdminResource;
use App\Models\Booking;
use App\Models\Event;
use Carbon\Carbon;
use Inertia\Inertia;

class MerchantBookingController extends Controller
{
    public function main(Request $request)
    {
        $user = $request->user();
        $status = $request->query('status', 'all');
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $query = Booking::with([
            'slot.date', 
            'event.location',
            'event.media',
            'items.ageGroup',
            'customer.user',
            'attendance',
        ]);

        if ($user->role === 'merchant') {
            $query->whereHas('event', fn($q) => $q->where('merchant_id', $user->merchant->id));
        }

        $allBookings = $query->get();

        // Calculate display_start/display_end for each booking's slot
        $bookingsWithTimes = $allBookings->map(function($booking) use ($now) {
            $slot = $booking->slot;
            if (!$slot) return null;

            $displayStart = $slot->display_start;
            $displayEnd = $slot->display_end;

            // Fallback for one-time events
            if (!$displayStart || !$displayEnd) {
                $eventDate = $slot->date;
                if ($eventDate) {
                    $startDate = $eventDate->start_date instanceof \DateTimeInterface
                        ? $eventDate->start_date->format('Y-m-d')
                        : null;

                    $endDate = $eventDate->end_date instanceof \DateTimeInterface
                        ? $eventDate->end_date->format('Y-m-d')
                        : null;
                    $startTime = $slot->start_time?->format('H:i:s') ?? '00:00:00';
                    $endTime = $slot->end_time?->format('H:i:s') ?? '23:59:59';

                    $displayStart = $startDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur') : null;
                    $displayEnd = $endDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur') : null;
                }
            }

            $booking->_display_start = $displayStart;
            $booking->_display_end = $displayEnd;
            $booking->_is_completed = $displayEnd && $displayEnd->lt($now);
            $booking->_is_upcoming = $displayStart && $displayStart->gte($now);

            return $booking;
        })->filter();

        // Apply status filter
        $filteredBookings = $bookingsWithTimes;
        
        if ($status !== 'all') {
            $filteredBookings = $bookingsWithTimes->filter(function($booking) use ($status) {
                switch ($status) {
                    case 'upcoming':
                        return !in_array($booking->status, ['cancelled', 'refunded']) && $booking->_is_upcoming;
                        
                    case 'completed':
                        return !in_array($booking->status, ['cancelled', 'refunded']) && $booking->_is_completed;
                        
                    case 'cancelled':
                        return in_array($booking->status, ['cancelled', 'refunded']);
                        
                    default:
                        return true;
                }
            });
        }

        // Calculate stats
        $stats = [
            'total' => $bookingsWithTimes->count(),
            'confirmed' => $bookingsWithTimes->filter(fn($b) => 
                !in_array($b->status, ['cancelled', 'refunded'])
            )->count(),
            'cancelled' => $bookingsWithTimes->filter(fn($b) =>
                in_array($b->status, ['cancelled', 'refunded'])
            )->count(),
        ];

        // Group bookings by event
        $eventSummaries = [];
        
        foreach ($filteredBookings->groupBy('event_id') as $eventId => $eventBookings) {
            $event = $eventBookings->first()->event;
            if (!$event) continue;

            $slotSummaries = [];
            
            // Group by slot
            foreach ($eventBookings->groupBy('slot_id') as $slotId => $slotBookings) {
                $firstBooking = $slotBookings->first();
                $slot = $firstBooking->slot;
                if (!$slot) continue;

                $displayStart = $firstBooking->_display_start;
                $displayEnd = $firstBooking->_display_end;
                $isCompleted = $firstBooking->_is_completed;
                
                $confirmedBookings = $slotBookings->filter(fn($b) => 
                    !in_array($b->status, ['cancelled', 'refunded'])
                );
                
                $cancelledBookings = $slotBookings->filter(fn($b) =>
                    in_array($b->status, ['cancelled', 'refunded'])
                );

                $slotSummaries[] = [
                    'slot_id' => $slot->id,
                    'date' => $displayStart?->format('d M Y'),
                    'start_time' => $displayStart?->format('h:i A'),
                    'end_time' => $displayEnd?->format('h:i A'),
                    'display_start' => $displayStart,
                    'display_end' => $displayEnd,
                    'is_completed' => $isCompleted,
                    'confirmed_count' => $confirmedBookings->count(),
                    'expected_attendees' => $confirmedBookings->sum('quantity'),
                    'cancelled_count' => $cancelledBookings->count(),
                    'actual_attendees' => $isCompleted ? $confirmedBookings->sum(fn($b) => 
                        $b->attendance?->where('status', 'attended')->count() ?? 0
                    ) : null,
                    'absent_count' => $isCompleted ? $confirmedBookings->sum(fn($b) =>
                        $b->attendance?->where('status', 'absent')->count() ?? 0
                    ) : null,
                ];
            }

            // Sort slots by display_start (newest first for better visibility)
            usort($slotSummaries, function($a, $b) {
                return $b['display_start'] <=> $a['display_start'];
            });

            $totalConfirmed = collect($slotSummaries)->sum('confirmed_count');
            $totalExpected = collect($slotSummaries)->sum('expected_attendees');
            $totalCancelled = collect($slotSummaries)->sum('cancelled_count');

            $eventSummaries[] = [
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'type' => $event->type,
                    'category' => $event->category,
                    'location' => $event->location?->location_name,
                    'media' => $event->media?->first()?->url,
                ],
                'slots' => array_map(function($slot) {
                    unset($slot['display_start'], $slot['display_end']);
                    return $slot;
                }, $slotSummaries),
                'summary' => [
                    'total_slots' => count($slotSummaries),
                    'confirmed' => $totalConfirmed,
                    'expected' => $totalExpected,
                    'cancelled' => $totalCancelled,
                ],
            ];
        }

        return Inertia::render('Bookings/MainBookingPage', [
            'eventSummaries' => $eventSummaries,
            'stats' => $stats,
            'currentFilter' => $status,
        ]);
    }

    public function bookingsByEvent(Request $request, $eventId)
    {
        $user = $request->user();
        $event = Event::with(['slots', 'media', 'location'])->findOrFail($eventId);

        $query = Booking::with([
            'slot.date',
            'event.media',
            'items.ageGroup',
            'customer.user',
            'transactions',
            'attendance'
        ])->whereHas('slot', function($q) use ($eventId) {
            $q->where('event_id', $eventId);
        });

        $allBookings = $query->get();
        $now = Carbon::now('Asia/Kuala_Lumpur');

        // Calculate display times for each booking
        $bookingsWithTimes = $allBookings->map(function($booking) use ($now) {
            $slot = $booking->slot;
            if (!$slot) return null;

            $displayStart = $slot->display_start;
            $displayEnd = $slot->display_end;

            // Fallback for one-time events
            if (!$displayStart || !$displayEnd) {
                $eventDate = $slot->date;
                if ($eventDate) {
                    $startDate = $eventDate->start_date instanceof \DateTimeInterface
                    ? $eventDate->start_date->format('Y-m-d')
                    : null;
                    $endDate = $eventDate->end_date instanceof \DateTimeInterface
                    ? $eventDate->end_date->format('Y-m-d')
                    : null;
                    $startTime = $slot->start_time?->format('H:i:s') ?? '00:00:00';
                    $endTime = $slot->end_time?->format('H:i:s') ?? '23:59:59';

                    $displayStart = $startDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur') : null;
                    $displayEnd = $endDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur') : null;
                }
            }

            $booking->_is_upcoming = $displayStart && $displayStart->gte($now);
            $booking->_is_completed = $displayEnd && $displayEnd->lt($now);

            return $booking;
        })->filter();

        // Apply status filter
        if ($status = $request->query('status')) {
            $bookingsWithTimes = $bookingsWithTimes->filter(function($booking) use ($status) {
                switch ($status) {
                    case 'upcoming':
                        return !in_array($booking->status, ['cancelled', 'refunded']) && $booking->_is_upcoming;
                        
                    case 'completed':
                        return !in_array($booking->status, ['cancelled', 'refunded']) && $booking->_is_completed;
                        
                    case 'cancelled':
                        return in_array($booking->status, ['cancelled', 'refunded']);
                        
                    default:
                        return true;
                }
            });
        }

        return Inertia::render('Bookings/EventBookingPage', [
            'event' => $event,
            'bookings' => BookingAdminResource::collection($bookingsWithTimes)->resolve(),
        ]);
    }

    public function apiBookingsByEvent(Request $request, $eventId)
    {
        $user = $request->user();
        $event = Event::with(['slots', 'media'])->findOrFail($eventId);

        $query = Booking::with(['slot', 'customer', 'attendances'])
            ->whereHas('slot', fn($q) => $q->where('event_id', $eventId))
            ->whereHas('event', fn($q) => $q->where('merchant_id', $user->merchant->id));

        $bookings = $query->orderBy('slot_id')->get();

        return response()->json([
            'success' => true,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
            ],
            'slots' => $event->slots,
            'bookings' => $bookings->map(fn($b) => [
                'id' => $b->id,
                'customer_name' => $b->customer->user->full_name ?? null,
                'slot_date' => $b->slot->date ?? null,
                'slot_start_time' => $b->slot->start_time ?? null,
                'status' => $b->status,
                'attendance_status' => $b->attendances->first()->status ?? 'pending',
            ]),
        ]);
    }
}
