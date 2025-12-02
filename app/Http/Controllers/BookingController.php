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
        ]);

        \Log::info('Booking payload received', $data);

        $customer = $request->user()->customer ?? throw new \Exception('Customer record not found for this user.');
        $slot = EventSlot::findOrFail($data['slot_id']);
        $event = $slot->event;

        $event->load('ageGroups');
        $ageGroupsCollection = $event->ageGroups;

        // If event is suitable for all ages
        if ($event->is_suitable_for_all_ages) {
            $quantity = $data['quantities_by_age_group']['general'] ?? 0;

            if ($quantity < 1) {
                return response()->json([
                    'message' => 'Please select at least one ticket.'
                ], 422);
            }

            try {
                Log::info('Attempting booking', [
                    'customer_id' => $customer->id,
                    'slot_id' => $slot->id,
                    'age_group_id' => null,
                    'quantity' => $quantity,
                ]);

                $booking = $this->bookingService->bookSlot($customer, $slot, null, $quantity);

                Log::info('Booking successful', [
                    'booking_id' => $booking->id,
                    'customer_id' => $customer->id,
                ]);

                return response()->json($booking, 201);
            } catch (\Exception $e) {
                Log::error('Booking failed', [
                    'customer_id' => $customer->id,
                    'slot_id' => $slot->id,
                    'age_group_id' => null,
                    'quantity' => $quantity,
                    'error' => $e->getMessage(),
                ]);

                return response()->json(['message' => $e->getMessage()], 400);
            }
        }
        // Otherwise, event has age groups
        \Log::info('Event age group IDs', $ageGroupsCollection->pluck('id')->toArray());

        foreach ($data['quantities_by_age_group'] as $ageGroupId => $quantity) {
            if ($quantity < 1) continue;

            if (!in_array($ageGroupId, $ageGroupsCollection->pluck('id')->toArray())) {
                return response()->json([
                    'message' => 'Invalid age group for this event.'
                ], 422);
            }

            try {
                Log::info('Attempting booking', [
                    'customer_id' => $customer->id,
                    'slot_id' => $slot->id,
                    'age_group_id' => $ageGroupId,
                    'quantity' => $quantity,
                ]);

                $booking = $this->bookingService->bookSlot($customer, $slot, $ageGroupId, $quantity);

                Log::info('Booking successful', [
                    'booking_id' => $booking->id,
                    'customer_id' => $customer->id,
                    'age_group_id' => $ageGroupId,
                    'quantity' => $quantity,
                ]);
            } catch (\Exception $e) {
                Log::error('Booking failed', [
                    'customer_id' => $customer->id,
                    'slot_id' => $slot->id,
                    'age_group_id' => $ageGroupId,
                    'quantity' => $quantity,
                    'error' => $e->getMessage(),
                ]);

                return response()->json(['message' => $e->getMessage()], 400);
            }
        }

        return response()->json(['message' => 'Bookings completed successfully.'], 201);
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
