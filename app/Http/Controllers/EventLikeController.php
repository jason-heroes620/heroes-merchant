<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Event;
use App\Models\EventLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EventLikeController extends Controller
{
    public function toggleLike(Request $request, $eventId)
    {
        $user = Auth::user();

        if ($user->role !== 'customer') {
            return response()->json(['success' => false, 'message' => 'Only customers can like events.'], 403);
        }
        Log::info("Fetching liked events for user", ['user_id' => $user->id, 'role' => $user->role]);

        $customer = Customer::where('user_id', $user->id)->firstOrFail();
        $event = Event::findOrFail($eventId);

        // Check if the like already exists
        $existing = EventLike::where('event_id', $eventId)
            ->where('customer_id', $customer->id)
            ->first();

        if ($existing) {
            // Unlike
            $existing->delete();
            $event->decrement('like_count');
            $liked = false;
        } else {
            // Like
            EventLike::create([
                'event_id' => $eventId,
                'customer_id' => $customer->id,
            ]);
            $event->increment('like_count');
            $liked = true;
        }

        return response()->json([
            'success' => true,
            'liked' => $liked,
            'like_count' => $event->like_count,
        ]);
    }
}
