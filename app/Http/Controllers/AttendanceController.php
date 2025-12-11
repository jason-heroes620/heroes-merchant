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

        $booking = Booking::with('event')->find($payload['booking_id']);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if (!$booking->event || $booking->event->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Booking does not belong to this merchant'], 403);
        }

        $attendance = Attendance::updateOrCreate(
            ['booking_id' => $booking->id, 'slot_id' => $booking->slot_id],
            [
                'customer_id' => $booking->customer_id,
                'event_id' => $booking->event_id,
                'status' => 'attended',
                'scanned_at' => now(),
            ]
        );

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

        $booking = Booking::with('slot.event', 'items')->find($bookingId);

        if (
            !$booking || 
            !$booking->slot || 
            !$booking->slot->event || 
            $booking->slot->event->merchant_id !== $merchant->id
        ) {
            return response()->json(['message' => 'Booking not found or unauthorized'], 404);
        }

        $data = $request->validate([
            'status' => 'required|in:pending,attended,absent',
            'booking_item_id' => 'required|exists:booking_items,id',
            'quantity' => 'nullable|integer|min:0', // ✅ Allow 0 for no-shows
        ]);

        $bookingItem = $booking->items->firstWhere('id', $data['booking_item_id']);

        if (!$bookingItem) {
            return response()->json(['message' => 'Booking item not found'], 404);
        }

        // Prevent merchant tampering with other booking's items
        if ($bookingItem->booking_id !== $booking->id) {
            return response()->json(['message' => 'Invalid booking item'], 400);
        }

        // ✅ Find existing Attendance record regardless of current status
        // This allows toggling between attended/pending/absent
        $attendance = Attendance::where('booking_item_id', $bookingItem->id)
            ->where('slot_id', $booking->slot_id)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No attendance record found'], 404);
        }

        \DB::transaction(function () use ($bookingItem, $attendance, $data) {
            // Update attendance status and scanned_at
            $attendance->status = $data['status'];
            $attendance->scanned_at = $data['status'] === 'attended' ? now() : null;
            $attendance->save();

            // Update quantity_attended based on status
            if ($data['status'] === 'attended') {
                // ✅ Use provided quantity (can be 0), default to full quantity if not provided
                $bookingItem->quantity_attended = isset($data['quantity'])
                    ? min($data['quantity'], $bookingItem->quantity)
                    : $bookingItem->quantity;
            } else {
                // ✅ Reset to 0 for pending or absent
                $bookingItem->quantity_attended = 0;
            }
            
            $bookingItem->save();
        });

        \Log::info('Attendance updated', [
            'merchant_id' => $merchant->id ?? null,
            'booking_id' => $booking->id,
            'slot_id' => $booking->slot_id,
            'event_id' => $booking->slot->event->id ?? null,
            'customer_id' => $booking->customer_id,
            'booking_item_id' => $bookingItem->id,
            'status' => $data['status'],
            'quantity_provided' => $data['quantity'] ?? null,
            'quantity_attended_after' => $bookingItem->quantity_attended,
            'quantity_total' => $bookingItem->quantity,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'booking_item_id' => $bookingItem->id,
                'status' => $attendance->status,
                'quantity_attended' => $bookingItem->quantity_attended,
                'quantity_total' => $bookingItem->quantity,
            ],
        ]);
    }

    public function getSlotAttendances(Request $request, $slotId)
    {
        $user = $request->user();
        $merchant = $user->merchant ?? null;

        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        $slot = EventSlot::where('id', $slotId)
            ->whereHas('event', fn($q) => $q->where('merchant_id', $merchant->id))
            ->with(['event', 'bookings.customer.user', 'bookings.items.ageGroup'])
            ->first();

        if (!$slot) {
            return response()->json(['message' => 'Slot not found'], 404);
        }

        // Build attendance array from booking items
        $attendance = $slot->bookings->flatMap(function($booking) use ($slot) {
            return $booking->items->map(function($item) use ($booking, $slot) {
                // Find or create attendance record for this booking item
                $attendanceRecord = Attendance::where([
                    'booking_id' => $booking->id,
                    'slot_id' => $slot->id,
                    'booking_item_id' => $item->id,
                ])->first();

                return [
                    'id' => $attendanceRecord?->id ?? null,
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'customer_name' => $booking->customer->user->full_name ?? 'Unknown',
                    'status' => $attendanceRecord?->status ?? 'pending',
                    'scanned_at' => $attendanceRecord?->scanned_at?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
                    'booking_item_id' => $item->id,
                    'age_group_label' => $item->ageGroup?->label ?? 'General',
                    'quantity' => $item->quantity,
                ];
            });
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'slot_id' => $slot->id,
                'event_title' => $slot->event->title,
                'slot_start' => optional($slot->display_start)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
                'slot_end' => optional($slot->display_end)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
                'attendance' => $attendance,
            ],
        ]);
    }

    public function getAttendances(Request $request)
    {
        $user = $request->user();
        $merchant = $user->merchant ?? null;

        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        $bookings = Booking::with([
                'slot.event',
                'items.ageGroup',
                'customer.user',
                'attendance',
            ])
            ->whereHas('event', fn($q) => $q->where('merchant_id', $merchant->id))
            ->where('status', 'confirmed') 
            ->get();

        $grouped = $bookings->map(fn($booking) => [
            'booking_id' => $booking->id,
            'booking_code' => $booking->booking_code,
            'event_id' => $booking->event->id,
            'event_title' => $booking->event->title,
            'event_media' => $booking->event->media ?? null,
            'event_location' => $booking->event->location ?? null,
            'slot_id' => $booking->slot->id,
            'slot_start' => optional($booking->slot->display_start)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
            'slot_end' => optional($booking->slot->display_end)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
            'customer' => [
                'id' => $booking->customer->id,
                'name' => $booking->customer->user->full_name,
                'email' => $booking->customer->user->email,
            ],
            'booking_items' => $booking->items->map(fn($item) => [
                'item_id' => $item->id,
                'age_group' => $item->ageGroup?->label,
                'quantity' => $item->quantity,
                'attendances' => $booking->attendance
                    ->where('booking_item_id', $item->id)
                    ->map(fn($a) => [
                        'status' => $a->status,
                        'scanned_at' => optional($a->scanned_at)?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
                    ])->values(),
            ]),
            'attendance_status' => $booking->attendance->pluck('status')->first() ?? 'pending', 
        ]);

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }
}