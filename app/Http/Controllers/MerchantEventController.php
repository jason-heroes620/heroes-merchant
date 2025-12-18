<?php

namespace App\Http\Controllers;

use App\Models\{
    Merchant,
    Event,
};
use Illuminate\Http\Request;

class MerchantEventController extends Controller
{
    public function merchantEvents(Request $request)
    {
        $today = now('Asia/Kuala_Lumpur'); 
        $user = $request->user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        $status = $request->query('status', 'upcoming'); 

        $query = Event::with([
            'location',
            'prices',
            'ageGroups',
            'frequencies',
            'slots' => fn($q) => $q->orderBy('date'),
            'media',
        ])
        ->where('status', 'active')
        ->where('merchant_id', $merchant->id);

        if ($status === 'upcoming') {
            $query->where(function ($q) use ($today) {
                $q->whereHas('slots', fn($slotQ) =>
                    $slotQ->whereDate('date', '>=', $today->toDateString())
                )
                ->orWhereHas('dates', fn($dateQ) =>
                    $dateQ->whereDate('end_date', '>=', $today->toDateString())
                );
            });
        } elseif ($status === 'past') {
            $query->where(function ($q) use ($today) {
                $q->whereHas('slots', fn($slotQ) =>
                    $slotQ->whereDate('date', '<', $today->toDateString())
                )
                ->orWhereHas('dates', fn($dateQ) =>
                    $dateQ->whereDate('end_date', '<', $today->toDateString())
                );
            });
        }

        $events = $query->orderByDesc('featured')
                        ->orderBy('created_at', 'desc')
                        ->get();

        $events->transform(function ($event) {
            $event->slots->transform(function ($slot) {
                $slot->available_seats = $slot->is_unlimited
                    ? null
                    : $slot->capacity - $slot->booked_quantity;
                return $slot;
            });

            $event->slotPrices = $event->slots->flatMap(fn($slot) => $slot->prices)->values();
            $event->media->transform(function ($media) {
                $media->file_path = $media->url;
                return $media;
            });

            return $event;
        });

        return response()->json([
            'success' => true,
            'count' => $events->count(),
            'events' => $events,
        ]);
    }
}