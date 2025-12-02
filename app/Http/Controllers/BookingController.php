<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BookingService;
use App\Models\Booking;
use App\Models\EventSlot;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    protected BookingService $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /**
     * List bookings for the authenticated customer
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $bookings = Booking::with(['slot', 'event', 'transactions'])
            ->where('customer_id', $user->id)
            ->get();

        return response()->json($bookings);
    }

    /**
     * Create a booking
     */
    public function book(Request $request)
    {
        $data = $request->validate([
            'slot_id' => 'required|uuid|exists:event_slots,id',
            'quantities_by_age_group' => 'required|array',
            'quantities_by_age_group.*' => 'integer|min:1',
            'allow_paid_fallback' => 'sometimes|boolean',
        ]);

        $allowFallback = $data['allow_paid_fallback'] ?? false;

        $customer = $request->user()->customer ?? throw new \Exception('Customer record not found for this user.');
        $slot = EventSlot::findOrFail($data['slot_id']);
        $event = $slot->event->load('ageGroups');

        $quantitiesByAgeGroup = $data['quantities_by_age_group'];

        // Validate age groups
        if ($event->is_suitable_for_all_ages) {
            $quantity = $quantitiesByAgeGroup['general'] ?? 0;
            if ($quantity < 1) {
                return response()->json(['message' => 'Please select at least one ticket.'], 422);
            }
            $quantitiesByAgeGroup = ['general' => $quantity];
        } else {
            $validIds = $event->ageGroups->pluck('id')->toArray();
            foreach ($quantitiesByAgeGroup as $ageGroupId => $quantity) {
                if ($quantity < 1) continue;
                if (!in_array($ageGroupId, $validIds)) {
                    return response()->json(['message' => "Invalid age group ID: $ageGroupId"], 422);
                }
            }
        }

        try {
            $booking = $this->bookingService->bookSlot($customer, $slot, $quantitiesByAgeGroup, $allowFallback);
            return response()->json($booking, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Cancel a booking
     */
    public function cancel(Request $request, string $bookingId)
    {
        $customer = $request->user();

        $booking = Booking::where('id', $bookingId)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        try {
            Log::info('Attempting booking cancellation', [
                'booking_id' => $booking->id,
                'customer_id' => $customer->id,
            ]);

            $booking = $this->bookingService->cancelBooking($booking);

            Log::info('Booking cancelled', [
                'booking_id' => $booking->id,
                'customer_id' => $customer->id,
            ]);

            return response()->json($booking);
        } catch (\Exception $e) {
            Log::error('Booking cancellation failed', [
                'booking_id' => $booking->id,
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
