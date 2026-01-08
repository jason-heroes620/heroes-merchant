<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EventSlot;
use App\Models\Booking;
use App\Models\Claim;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ClaimController extends Controller
{

     public function scanPreview(Request $request)
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
        if (!isset($payload['code'])) {
            return response()->json(['message' => 'Invalid QR code'], 422);
        }

        // Fetch booking
        $booking = Booking::with('event')->where('booking_code', $payload['code'])->first();
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        // Ensure booking belongs to this merchant
        if (!$booking->event || $booking->event->merchant_id !== $merchant->id) {
            return response()->json(['message' => 'Booking does not belong to this merchant'], 403);
        }

        $totalQuantity = $booking->items->sum('quantity');
        $claimedQuantity = $booking->items->sum('quantity_claimed');

        $claimStatus =
            $claimedQuantity === 0
                ? 'not_claimed'
                : ($claimedQuantity < $totalQuantity
                    ? 'partially_claimed'
                    : 'fully_claimed');

        $media = $booking->event->media->map(fn($m) => [
            'id' => $m->id,
            'type' => $m->type,
            'file_path' => $m->url,
        ]);

        $displayStart = $booking->slot->display_start;
        $displayEnd = $booking->slot->display_end;

        if (!$displayStart || !$displayEnd) {
            $eventDate = $booking->slot->date;
            if ($eventDate) {
                $startDate = $eventDate->start_date ? Carbon::parse($eventDate->start_date)->format('Y-m-d') : null;
                $endDate = $eventDate->end_date ? Carbon::parse($eventDate->end_date)->format('Y-m-d') : null;

                $startTime = $booking->slot->start_time?->format('H:i:s') ?? '00:00:00';
                $endTime = $booking->slot->end_time?->format('H:i:s') ?? '23:59:59';

                $displayStart = $startDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur') : null;
                $displayEnd = $endDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur') : null;
            }
        }

        return response()->json([
            'booking' => [
                'booking_id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'customer_name' => $booking->customer->user->full_name,
                'slot_id' => $booking->slot_id,
                'slot_start' => $displayStart?->toDateTimeString(),
                'slot_end' => $displayEnd?->toDateTimeString(),
                'items' => $booking->items->map(fn ($item) => [
                    'id' => $item->id,
                    'label' => $item->ageGroup?->label ?? 'General',
                    'quantity' => $item->quantity,
                    'quantity_claimed' => $item->quantity_claimed ?? 0,
                ]),
                'media' => $media,
            ],
            'claim' => [
                'status' => $claimStatus,
                'claimed_quantity' => $claimedQuantity,
                'total_quantity' => $totalQuantity,
            ],
        ]);
    }

    public function claimStatus(Request $request)
    {
        $user = $request->user();
        $merchant = $user->merchant;

        if (!$merchant) {
            return response()->json(['message' => 'Merchant record not found'], 404);
        }

        $data = $request->validate([
            'booking_id' => 'required|uuid',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|uuid|exists:booking_items,id',
            'items.*.quantity_claimed' => 'required|integer|min:0',
        ]);

        $booking = Booking::with(['slot.event', 'items'])
            ->find($data['booking_id']);

        if (
            !$booking ||
            !$booking->slot ||
            !$booking->slot->event ||
            $booking->slot->event->merchant_id !== $merchant->id
        ) {
            return response()->json(['message' => 'Booking not found or unauthorized'], 404);
        }

        DB::transaction(function () use ($booking, $data) {
            foreach ($data['items'] as $itemData) {
                $bookingItem = $booking->items->firstWhere('id', $itemData['id']);

                if (!$bookingItem) {
                    continue;
                }

                $claimedQty = min(
                    $itemData['quantity_claimed'],
                    $bookingItem->quantity
                );

                $bookingItem->update([
                    'quantity_claimed' => $claimedQty,
                ]);

                Claim::updateOrCreate(
                    [
                        'booking_id' => $booking->id,
                        'slot_id' => $booking->slot_id,
                        'booking_item_id' => $bookingItem->id,
                    ],
                    [
                        'customer_id' => $booking->customer_id,
                        'event_id' => $booking->event_id,
                        'status' => $claimedQty > 0 ? 'claimed' : 'expired',
                        'scanned_at' => $claimedQty > 0 ? now() : null,
                    ]
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Successfully claimed',
        ]);
    }

    public function manualClaim(Request $request, $bookingId)
    {
        $user = $request->user();
        $merchant = $user->merchant;

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
            'status' => 'required|in:pending,claimed,expired',
            'booking_item_id' => 'required|exists:booking_items,id',
            'quantity' => 'nullable|integer|min:0',
        ]);

        $bookingItem = $booking->items->firstWhere('id', $data['booking_item_id']);

        if (!$bookingItem) {
            return response()->json(['message' => 'Booking item not found'], 404);
        }

        DB::transaction(function () use ($booking, $bookingItem, $data) {

            $claim = Claim::updateOrCreate(
                [
                    'booking_id' => $booking->id,
                    'slot_id' => $booking->slot_id,
                    'booking_item_id' => $bookingItem->id,
                ],
                [
                    'customer_id' => $booking->customer_id,
                    'event_id' => $booking->event_id,
                ]
            );

            if ($data['status'] === 'claimed') {
                $qty = isset($data['quantity'])
                    ? min($data['quantity'], $bookingItem->quantity)
                    : $bookingItem->quantity;

                $bookingItem->quantity_claimed = $qty;
                $claim->scanned_at = now();
            } else {
                $bookingItem->quantity_claimed = 0;
                $claim->scanned_at = null;
            }

            $claim->status = $data['status'];

            $bookingItem->save();
            $claim->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Claim submitted',
        ]);
    }

    public function getSlotClaims(Request $request, $slotId)
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

        // Build claim array from booking items
        $claim = $slot->bookings->flatMap(function($booking) use ($slot) {
            return $booking->items->map(function($item) use ($booking, $slot) {
                // Find or create claim record for this booking item
                $claimRecord = Claim::where([
                    'booking_id' => $booking->id,
                    'slot_id' => $slot->id,
                    'booking_item_id' => $item->id,
                ])->first();

                return [
                    'id' => $claimRecord?->id ?? null,
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'customer_name' => $booking->customer->user->full_name ?? 'Unknown',
                    'status' => $claimRecord?->status ?? 'pending',
                    'scanned_at' => $claimRecord?->scanned_at?->setTimezone('Asia/Kuala_Lumpur')->toDateTimeString(),
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
                'claim' => $claim,
            ],
        ]);
    }
}