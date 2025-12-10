<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EventSlot;
use App\Models\Booking;
use App\Models\Attendance;

class AttendanceController extends Controller
{
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

        // Fetch booking
        $booking = Booking::with('event')->find($payload['booking_id']);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        // Ensure booking belongs to this merchant
        if (!$booking->event || $booking->event->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Booking does not belong to this merchant'], 403);
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

        // Fetch all attendances for this slot
        $attendances = Attendance::with('customer')
            ->where('slot_id', $booking->slot_id)
            ->orderBy('scanned_at', 'asc')
            ->get();

        return response()->json([
            'message' => 'Attendance recorded',
            'attendance_status' => $attendance->status,
            'scanned_at' => $attendance->scanned_at,
            'attendance_list' => $attendances->map(fn($a) => [
                'customer_name' => $a->customer->full_name,
                'status' => $a->status,
                'scanned_at' => $a->scanned_at,
            ]),
        ]);
    }

    public function markAttendance(Request $request, $bookingId)
    {
        $user = $request->user();
        $merchant = $user->merchant ?? null;

        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        $booking = Booking::with('slot.event')->find($bookingId);

        if (!$booking || $booking->event->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Booking not found or unauthorized'], 404);
        }

        $status = $request->input('status'); // e.g., 'present' or 'absent'

        $attendance = $booking->attendance()->firstOrCreate([
            'booking_id' => $booking->id,
        ]);

        $attendance->status = $status;
        $attendance->scanned_at = now();
        $attendance->save();

        return response()->json([
            'success' => true,
            'data' => $attendance,
        ]);
    }

    public function getAttendances(Request $request)
    {
        $user = $request->user();
        $merchant = $user->merchant ?? null;

        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        $slots = EventSlot::whereHas('event', fn($q) => $q->where('merchant_id', $merchant->id))
            ->with(['event', 'bookings.attendance.customer'])
            ->get();

        $grouped = $slots->map(fn($slot) => [
            'event_id' => $slot->event->id,
            'event_title' => $slot->event->title,
            'slot_id' => $slot->id,
            'slot_start' => optional($slot->display_start)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
            'slot_end' => optional($slot->display_end)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
            'attendance' => $slot->bookings->flatMap(fn($booking) => $booking->attendance)
                ->sortBy('scanned_at')
                ->map(fn($a) => [
                    'customer_name' => $a->customer->user->full_name,
                    'status' => $a->status,
                    'scanned_at' => optional($a->scanned_at)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
                ])
                ->values(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }
}