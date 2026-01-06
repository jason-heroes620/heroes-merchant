<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BookingService;
use App\Services\WalletService;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Claim;
use App\Models\EventSlot;
use App\Models\Conversion;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingController extends Controller
{
    protected BookingService $bookingService;
    protected WalletService $walletService;

    public function __construct(BookingService $bookingService, WalletService $walletService)
    {
        $this->bookingService = $bookingService;
        $this->walletService = $walletService;
    }

    /**
     * List bookings for the authenticated customer
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer ?? null;
        if (!$customer) {
            return response()->json(['message' => 'Customer record not found.'], 404);
        }
        
        $status = $request->query('status', 'upcoming'); 
        $perPage = (int) $request->query('per_page', 12);
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $query = Booking::with([
            'slot.date',
            'event.location',
            'event.media',
            'items.ageGroup',
            'transactions'
        ])->forCustomer($customer->id);

        $allBookings = $query->get();

        $bookingsWithTimes = $allBookings->map(function($booking) use ($now) {
            $slot = $booking->slot;
            if (!$slot) return null;

            $displayStart = $slot->display_start;
            $displayEnd = $slot->display_end;

            if (!$displayStart || !$displayEnd) {
                $eventDate = $slot->date;
                if ($eventDate) {
                    $startDate = $eventDate->start_date ? Carbon::parse($eventDate->start_date)->format('Y-m-d') : null;
                    $endDate = $eventDate->end_date ? Carbon::parse($eventDate->end_date)->format('Y-m-d') : null;

                    $startTime = $slot->start_time?->format('H:i:s') ?? '00:00:00';
                    $endTime = $slot->end_time?->format('H:i:s') ?? '23:59:59';

                    $displayStart = $startDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur') : null;
                    $displayEnd = $endDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur') : null;
                }
            }

            $booking->_is_upcoming = $displayEnd && $displayEnd->gte($now);
            $booking->_is_completed = $displayEnd && $displayEnd->lt($now);

            return $booking;
        })->filter();


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
        })->sortByDesc('booked_at');

        $page = (int) $request->query('page', 1);
        $offset = ($page - 1) * $perPage;
        $items = $filteredBookings->slice($offset, $perPage)->values();
        $total = $filteredBookings->count();
        $lastPage = (int) ceil($total / $perPage);

        return response()->json([
            'data' => BookingResource::collection($items),
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
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
            $conversion = Conversion::first(); // or whatever logic applies
            if (!$conversion) {
                return response()->json(['message' => 'Conversion settings not found.'], 500);
            }

            $bookingResponse = $this->bookingService->bookSlot(
                $customer,
                $slot,
                $quantitiesByAgeGroup,
                $conversion,
                $allowFallback
            );

            $bookingModel = $bookingResponse['booking'];

            foreach ($bookingModel->items as $item) {
                Claim::create([
                    'id' => Str::uuid(),
                    'booking_id' => $bookingModel->id,
                    'booking_item_id' => $item->id,
                    'slot_id' => $slot->id,
                    'event_id' => $slot->event_id,
                    'customer_id' => $customer->id,
                    'status' => 'pending',
                ]);
            }

            return response()->json($bookingResponse, 201);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Insufficient free credits')) {
                $additionalPaidInfo = $this->walletService->calculateAdditionalPaid(
                    $customer->wallet,
                    $slot->prices()->first()->paid_credits,
                    $conversion,
                    array_sum($quantitiesByAgeGroup)
                );

                return response()->json([
                    'message' => $e->getMessage(),
                    'paid_to_free_ratio' => $additionalPaidInfo['paidToFreeRatio'],
                    'additional_paid_needed' => $additionalPaidInfo['shortfallFree'],
                ], 422); 
            }
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

            Claim::where('booking_id', $booking->id)->delete();

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