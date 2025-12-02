<?php

namespace App\Http\Controllers;

use App\Models\{
    Customer,
    Event,
    EventMedia,
    EventPrice,
    EventAgeGroup,
    EventFrequency,
    EventLocation
};
use App\Services\ConversionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class MobileEventController extends Controller
{
    protected ConversionService $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    /**
     * List all active events for mobile.
     */
    public function index(Request $request)
    {
        $events = Event::with([
            'location',
            'prices',
            'ageGroups',
            'frequencies',
            'slots' => fn($q) => $q->whereDate('date', '>=', now())->orderBy('date'),
            'media',
        ])->where('status', 'active')
        ->orderByDesc('featured')
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

    /**
     * Show single event details for mobile.
     */
    public function show(Event $event)
    {
        $event->load([
            'location',
            'prices',
            'ageGroups',
            'slots.prices',
            'frequencies',
            'media',
        ]);

        $event->slots->transform(function ($slot) {
            $slot->available_seats = $slot->is_unlimited
                ? null
                : $slot->capacity - $slot->booked_quantity;
            return $slot;
        });

        $event->media->transform(function ($media) {
            $media->file_path = $media->url;
            return $media;
        });

        $dates = collect();

        if ($event->is_recurring) {
            // Use slot dates for recurring events
            $dates = $event->slots->map(function ($slot) {
                return [
                    'start_date' => $slot->date,
                    'end_date'   => $slot->date,
                ];
            })->unique();
        } else {
            // Use event dates for one-time events
            $dates = $event->dates->map(function ($date) {
                return [
                    'start_date' => $date->start_date,
                    'end_date'   => $date->end_date,
                ];
            });
        }

        $slotPrices = $event->slots->flatMap(fn($slot) => $slot->prices)->values();

        return response()->json([
            'success' => true,
            'event' => $event,
            'dates' => $dates,
            'slotPrices' => $slotPrices,
        ]);
    }

    /**
     * Increment event click count.
     */
    public function incrementClickCount($id)
    {
        $event = Event::findOrFail($id);
        $event->increment('click_count');

        return response()->json([
            'success' => true,
            'message' => 'Click count incremented.',
            'click_count' => $event->click_count,
        ]);
    }

    public function likedEvents()
    {
        $user = Auth::user();

        if ($user->role !== 'customer') {
            return response()->json(['events' => []]);
        }

        $customer = Customer::where('user_id', $user->id)->firstOrFail();

        $events = $customer->likedEvents()
            ->with([
            'location',
            'prices',
            'ageGroups',
            'frequencies',
            'slots' => fn($q) => $q->whereDate('date', '>=', now())
                                   ->orderBy('date'),
            'media'
            ])
            ->where('status', 'active')
            ->get();

        $events->transform(function ($event) {
            $event->slotPrices = $event->slots
                ->flatMap(fn($slot) => $slot->prices)
                ->values();

            $event->media->transform(function ($media) {
                $media->file_path = $media->url;
                return $media;
            });

            return $event;
        });

        return response()->json([
            'events' => $events
        ]);
    }
}
