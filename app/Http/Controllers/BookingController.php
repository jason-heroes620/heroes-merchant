<?php

namespace App\Http\Controllers;

use App\Models\{
    Booking,
    Customer,
    CustomerWallet,
    CustomerCreditTransaction,
    EventSlot
};
use App\Services\ExpoNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class BookingController extends Controller
{
    /**
     * Book an event slot using credits
     */
    public function bookSlot(Request $request)
    {
        $request->validate([
            'slot_id' => 'required|uuid|exists:event_slots,id',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $user = Auth::user();
        $customer = Customer::where('user_id', $user->id)->firstOrFail();
        $wallet = CustomerWallet::where('customer_id', $customer->id)->firstOrFail();
        $slot = EventSlot::with('event')->findOrFail($request->slot_id);
        $quantity = $request->quantity ?? 1;
        $totalCredits = $slot->price_in_credits * $quantity;

        // Validate slot capacity
        if (!$slot->is_unlimited && ($slot->booked + $quantity) > $slot->capacity) {
            return response()->json(['error' => 'Not enough available slots.'], 400);
        }

        // Validate wallet balance
        if ($wallet->balance < $totalCredits) {
            return response()->json(['error' => 'Insufficient credits.'], 400);
        }

        return DB::transaction(function () use ($wallet, $slot, $customer, $totalCredits, $quantity) {
            // Deduct credits from wallet
            $wallet->balance -= $totalCredits;
            $wallet->save();

            // Update slot booked count
            if (!$slot->is_unlimited) {
                $slot->booked += $quantity;
                $slot->save();
            }

            // Log transaction
            CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'booking',
                'amount_in_credits' => -$totalCredits,
                'description' => "Booking for event {$slot->event->title}",
            ]);

            // Create booking
            $booking = Booking::create([
                'customer_id' => $customer->id,
                'event_id' => $slot->event_id,
                'slot_id' => $slot->id,
                'wallet_id' => $wallet->id,
                'credits_spent' => $totalCredits,
                'quantity' => $quantity,
                'status' => 'confirmed',
                'booked_at' => now(),
            ]);

            // Generate QR code for this booking (e.g. containing booking ID or a check-in token)
            $qrContent = json_encode([
                'booking_id' => $booking->id,
                'event' => $slot->event->title,
                'customer' => $customer->id,
            ]);
            $qrImage = QrCode::format('png')->size(300)->generate($qrContent);

            // Store QR code in storage
            $filename = 'qrcodes/' . $booking->id . '.png';
            Storage::disk('public')->put($filename, $qrImage);

            $booking->update(['qr_code_path' => $filename]);

            // $expoToken = $customer->user->expo_push_token;

            // if ($expoToken) {
            //     $expo->sendPush(
            //         $pushToken->expo_push_token,
            //         'Booking Confirmed!',
            //         "You’ve successfully booked {$slot->event->title}",
            //         ['booking_id' => $booking->id]
            //     );
            // }
            return response()->json(['message' => 'Booking confirmed and notification sent.', 'booking_id' => $booking->id, 'qr_code_path' => $filename]);
        });
    }

    /**
     * Cancel a booking if more than 24 hours before event start time
     */
    public function cancelBooking($id)
    {
        $user = Auth::user();
        $customer = Customer::where('user_id', $user->id)->firstOrFail();
        $booking = Booking::with(['slot', 'wallet'])
            ->where('customer_id', $customer->id)
            ->findOrFail($id);

        $eventStart = Carbon::parse($booking->slot->date . ' ' . $booking->slot->start_time);

        if ($eventStart->diffInHours(now()) < 24) {
            return response()->json(['error' => 'Cancellations not allowed within 24 hours.'], 400);
        }

        DB::transaction(function () use ($booking) {
            $wallet = $booking->wallet;

            // Refund credits
            $wallet->balance += $booking->credits_spent;
            $wallet->save();

            // Add refund transaction
            CustomerCreditTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'refund',
                'amount_in_credits' => $booking->credits_spent,
                'description' => "Refund for cancelled booking {$booking->id}",
            ]);

            // Update booking
            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            // Optionally reduce slot's booked count
            if (!$booking->slot->is_unlimited && $booking->slot->booked > 0) {
                $booking->slot->decrement('booked', $booking->quantity);
            }

            $expoToken = $customer->user->expo_push_token;

            if ($expoToken) {
                $expo->sendPush(
                    $pushToken->expo_push_token,
                    'Booking Confirmed!',
                    "You’ve successfully booked {$slot->event->title}",
                    ['booking_id' => $booking->id]
                );
            }
            return response()->json(['message' => 'Booking cancelled and credits refunded.']);
        });
    }

    /**
     * View all bookings for logged-in customer
     */
    public function showBookings()
    {
        $user = Auth::user();
        $customer = Customer::where('user_id', $user->id)->firstOrFail();

        $bookings = Booking::with(['event', 'slot'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('booked_at')
            ->get();

        return response()->json(['bookings' => $bookings]);
    }
}
