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

    public function showMerchantEvent(Event $event)
    {
        $status = request()->query('status', 'upcoming');
        $event->load([
            'location',
            'prices',
            'ageGroups',
            'slots.prices',
            'frequencies',
            'media',
            'dates',
        ]);

        $now = now()->setTimezone('Asia/Kuala_Lumpur');

        $filteredSlots = $event->slots->filter(function ($slot) use ($now, $status) {
            if ($status === 'upcoming') {
                return $slot->display_end && $slot->display_end->gte($now);
            } elseif ($status === 'past') {
                return $slot->display_end && $slot->display_end->lt($now);
            }
            return true;
        })->values();

        $event->setRelation('slots', $filteredSlots);

       $event->slots->transform(function ($slot) use ($event) {
            $slot->available_seats = $slot->is_unlimited
                ? null
                : $slot->capacity - $slot->booked_quantity;

            if ($event->is_suitable_for_all_ages) {
                $slot->booked_quantity_by_age_group = [
                    'general' => $slot->booked_quantity ?? 0
                ];
            } else {
                $slot->booked_quantity_by_age_group = $slot->prices
                    ->groupBy('event_age_group_id')
                    ->map(fn($prices) => $prices->sum('booked_quantity'))
                    ->toArray();
            }

            return $slot;
        });

        $event->media->transform(function ($media) {
                $media->file_path = $media->url;
                return $media;
            });

        if ($event->is_recurring) {
            $dates = $filteredSlots->map(fn($slot) => [
                'start_date' => $slot->date,
                'end_date' => $slot->date,
            ])->unique('start_date')->values();
        } else {
            $dates = $event->dates->filter(fn($date) =>
                $filteredSlots->contains(fn($slot) => $slot->event_date_id === $date->id)
            )->map(fn($date) => [
                'start_date' => $date->start_date,
                'end_date' => $date->end_date,
            ])->values();
        }

        $slotPrices = $filteredSlots->flatMap(fn($slot) => $slot->prices)->values();

        return response()->json([
            'success' => true,
            'event' => $event,
            'dates' => $dates,
            'slotPrices' => $slotPrices,
        ]);
    }
}