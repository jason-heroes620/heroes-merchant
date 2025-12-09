<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BookingService;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\EventSlot;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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
        $customer = $user->customer ?? null;
        if (! $customer) {
            return response()->json(['message' => 'Customer record not found.'], 404);
        }
        
        $status = $request->query('status', 'upcoming'); 
        $perPage = (int) $request->query('per_page', 12);
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $query = Booking::with(['slot', 'event.location', 'event.media', 'items.ageGroup', 'transactions'])
                        ->forCustomer($customer->id)
                        ->orderBy('booked_at', 'desc');

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

            default:
                break;
        }

        $page = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => BookingResource::collection($page->items()),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
        ]);
    }

    /**
     * Endpoint to return the QR image file or URL
     */
    public function qr(Request $request, $id)
    {
        $user = $request->user();
        $customer = $user->customer ?? null;
        if (! $customer) return response()->json(['message' => 'Customer not found'], 404);

        $booking = Booking::forCustomer($customer->id)->findOrFail($id);

        if (! $booking->qr_code_path) {
            return response()->json(['message' => 'QR code not available'], 404);
        }

        return response()->json([
            'qr_url' => asset($booking->qr_code_path)
        ]);
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
    public function cancel(Request $request, Booking $booking)
    {
        $user = $request->user();
        $customer = $user->customer ?? null;

        Log::info("Cancel request received", [
            'booking_id' => $booking->id,
            'user_id' => $user->id ?? null,
            'customer_id' => $customer->id ?? null,
            'request_data' => $request->all(),
        ]);

        if (!$customer) {
            Log::warning("Customer record not found for user {$user->id}");
            return response()->json(['message' => 'Customer record not found.'], 404);
        }

        try {
            $result = $this->bookingService->cancelBooking($booking);

            // If not refunded, calculate forfeited credits
            if (!$result['refunded']) {
                $freeCredits = $booking->items->sum('free_credits');
                $paidCredits = $booking->items->sum('paid_credits');

                $result['message'] = "Free credits ({$freeCredits}) and total credits ({$paidCredits}) will be forfeited. Are you sure you want to cancel?";
            }

            Log::info("Cancel result prepared", ['result' => $result]);

            return response()->json($result, 200);
        } catch (\Exception $e) {
            Log::error("Cancel booking failed", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}   