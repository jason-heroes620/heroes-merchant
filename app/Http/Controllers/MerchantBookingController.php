<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\BookingAdminResource;
use App\Models\Booking;
use App\Models\Attendance;
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

        if ($user->role === 'merchant') {
            $query->whereHas('event', fn($q) => $q->where('merchant_id', $user->merchant->id));
        }

        switch ($status) {
            case 'upcoming':
                $query->whereNotIn('status', ['cancelled', 'refunded'])
                    ->whereHas('slot', function($q) use ($now) {
                    $q->whereRaw("
                            STR_TO_DATE(CONCAT(date, ' ', start_time, ':00'), '%Y-%m-%d %H:%i:%s') >= ?
                        ", [$now]);
                    });
                break;

            case 'completed':
                $query->whereNotIn('status', ['cancelled', 'refunded'])
                    ->whereHas('slot', function($q) use ($now) {
                        $q->whereRaw("
                            STR_TO_DATE(CONCAT(date, ' ', end_time, ':00'), '%Y-%m-%d %H:%i:%s') < ?
                        ", [$now]);
                    });
                break;

            case 'cancelled':
                $query->whereIn('status', ['cancelled', 'refunded']);
                break;

            default:
                break;
        }

        $page = $query->orderBy('booked_at', 'desc')->paginate($perPage)->withQueryString();

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
                        ->whereHas('slot', function($q) use ($now) {
                            $q->whereRaw("STR_TO_DATE(CONCAT(date, ' ', start_time), '%Y-%m-%d %H:%i:%s') >= ?", [$now]);
                        });
                    break;

                case 'completed':
                    $query->whereNotIn('status', ['cancelled', 'refunded'])
                        ->whereHas('slot', function($q) use ($now) {
                            $q->whereRaw("STR_TO_DATE(CONCAT(date, ' ', end_time), '%Y-%m-%d %H:%i:%s') < ?", [$now]);
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

    public function scanQr(Request $request)
    {
        $user = $request->user();

        $merchant = $user->merchant ?? null;
        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        $data = $request->validate([
            'qr_code_content' => 'required|string',
        ]);

        $payload = json_decode($data['qr_code_content'], true);
        if (!isset($payload['booking_id'])) {
            return response()->json(['message' => 'Invalid QR code'], 422);
        }

        $booking = Booking::where('id', $payload['booking_id'])
            ->where('merchant_id', $merchant->id)
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Booking not found for this merchant'], 404);
        }

        // Update or create attendance
        $attendance = Attendance::updateOrCreate(
            ['booking_id' => $booking->id, 'slot_id' => $booking->slot_id],
            [
                'customer_id' => $booking->customer_id,
                'event_id' => $booking->event_id,
                'status' => 'attended',
                'scanned_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Attendance recorded',
            'attendance_status' => $attendance->status,
            'scanned_at' => $attendance->scanned_at,
        ]);
    }
}
