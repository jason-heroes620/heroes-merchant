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

        // Fetch all attendances for this slot
        $attendances = Attendance::with(['customer'])
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

    public function getAttendances(Request $request, $slotId)
    {
        $user = $request->user();
        $merchant = $user->merchant ?? null;

        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        // Ensure this slot belongs to this merchant
        $slot = EventSlot::where('id', $slotId)
            ->whereHas('event', fn($q) => $q->where('merchant_id', $merchant->id))
            ->firstOrFail();

        $attendances = Attendance::with('customer')
            ->where('slot_id', $slot->id)
            ->orderBy('scanned_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'slot_id' => $slot->id,
            'attendances' => $attendances->map(fn($a) => [
                'customer_name' => $a->customer->full_name,
                'status' => $a->status,
                'scanned_at' => $a->scanned_at,
            ]),
        ]);
    }
}