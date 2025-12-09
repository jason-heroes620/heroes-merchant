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
        $perPage = (int) $request->query('per_page', 12);
        $status = $request->query('status');
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $query = Booking::with([
            'slot',
            'slot.date',
            'event.location',
            'event.media',
            'items.ageGroup',
            'transactions',
            'customer.user',
            'attendances'
        ]);

        // Merchant filter
        if ($user->role === 'merchant') {
            $query->whereHas('event', fn($q) => $q->where('merchant_id', $user->merchant->id));
        }

        \Log::info('Merchant bookings query debug', [
            'user_id' => $user->id,
            'role' => $user->role,
            'status' => $status,
            'bookings_count' => $query->count(),
            'sample_bookings' => $query->take(5)->get()->map(function ($b) {
                return [
                    'booking_id' => $b->id,
                    'status' => $b->status,
                    'customer_id' => $b->customer?->id,
                    'customer_name' => $b->customer?->user?->full_name,
                    'slot_display_start' => $b->slot?->display_start?->toDateTimeString(),
                    'slot_display_end' => $b->slot?->display_end?->toDateTimeString(),
                    'event_id' => $b->event_id,
                ];
            }),
        ]);

        // Status filters
        if ($status) {
            switch ($status) {
                case 'upcoming':
                    $query->whereNotIn('status', ['cancelled', 'refunded'])
                        ->where(function ($q) use ($now) {
                            $q->whereHas('slot', fn($sq) => 
                                $sq->whereRaw("STR_TO_DATE(CONCAT(date, ' ', start_time), '%Y-%m-%d %H:%i:%s') >= ?", [$now])
                            )
                            ->orWhereHas('event.dates', fn($dq) => 
                                $dq->whereRaw("STR_TO_DATE(end_date, '%Y-%m-%d') >= ?", [$now->format('Y-m-d')])
                            );
                        });
                    break;

                case 'completed':
                    $query->whereNotIn('status', ['cancelled', 'refunded'])
                        ->where(function ($q) use ($now) {
                            $q->whereHas('slot', fn($sq) => 
                                $sq->whereRaw("STR_TO_DATE(CONCAT(date, ' ', end_time), '%Y-%m-%d %H:%i:%s') < ?", [$now])
                            )
                            ->orWhereHas('event.dates', fn($dq) => 
                                $dq->whereRaw("STR_TO_DATE(end_date, '%Y-%m-%d') < ?", [$now->format('Y-m-d')])
                            );
                        });
                    break;

                case 'cancelled':
                    $query->whereIn('status', ['cancelled', 'refunded']);
                    break;
            }
        }

        $page = $query->orderBy('booked_at', 'desc')->paginate($perPage)->withQueryString();

        \Log::info('Merchant bookings after status filter', [
            'user_id' => $user->id,
            'role' => $user->role,
            'status_filter' => $status,
            'bookings_count' => $page->total(),
            'sample_bookings' => $page->take(5)->map(function ($b) {
                return [
                    'booking_id' => $b->id,
                    'status' => $b->status,
                    'customer_id' => $b->customer?->id,
                    'customer_name' => $b->customer?->user?->full_name,
                    'slot_display_start' => $b->slot?->display_start?->toDateTimeString(),
                    'slot_display_end' => $b->slot?->display_end?->toDateTimeString(),
                    'event_id' => $b->event_id,
                ];
            }),
        ]);

        return Inertia::render('Bookings/MainBookingPage', [
            'bookings' => BookingAdminResource::collection($page),
            'pagination' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    public function bookingsByEvent(Request $request, $eventId)
    {
        $user = $request->user();
        $event = Event::with(['slots', 'media'])->findOrFail($eventId);

        $query = Booking::with([
            'slot',
            'slot.date',
            'event.media',
            'items.ageGroup',
            'customer.user',
            'transactions',
            'attendances'
        ])->whereHas('slot', function($q) use ($eventId) {
            $q->where('event_id', $eventId);
        });

        if ($status = $request->query('status')) {
            $now = Carbon::now('Asia/Kuala_Lumpur');

            switch ($status) {
                case 'upcoming':
                    $query->whereNotIn('status', ['cancelled', 'refunded'])
                        ->where(function($q) use ($now) {
                            // Recurring slots
                            $q->whereHas('slot', function($sq) use ($now) {
                                $sq->whereRaw("STR_TO_DATE(CONCAT(date, ' ', start_time), '%Y-%m-%d %H:%i:%s') >= ?", [$now]);
                            })
                            // One-time events
                            ->orWhereHas('event.dates', function($dq) use ($now) {
                                $dq->whereRaw("STR_TO_DATE(end_date, '%Y-%m-%d') >= ?", [$now->format('Y-m-d')]);
                            });
                        });
                    break;

                case 'completed':
                    $query->whereNotIn('status', ['cancelled', 'refunded'])
                        ->where(function($q) use ($now) {
                            // Recurring slots
                            $q->whereHas('slot', function($sq) use ($now) {
                                $sq->whereRaw("STR_TO_DATE(CONCAT(date, ' ', end_time), '%Y-%m-%d %H:%i:%s') < ?", [$now]);
                            })
                            // One-time events
                            ->orWhereHas('event.dates', function($dq) use ($now) {
                                $dq->whereRaw("STR_TO_DATE(end_date, '%Y-%m-%d') < ?", [$now->format('Y-m-d')]);
                            });
                        });
                    break;

                case 'cancelled':
                    $query->whereIn('status', ['cancelled', 'refunded']);
                    break;
            }
        }

        $bookings = $query->orderBy('slot_id')->get();

        return Inertia::render('Bookings/EventBookingPage', [
            'event' => $event,
            'bookings' => BookingAdminResource::collection($bookings)->resolve(), 
            'slots' => $event->slots()->with('date')->get(),
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
