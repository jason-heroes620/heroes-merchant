<?php

namespace App\Http\Controllers;

use App\Models\{
    Customer,
    Event,
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
        $today = now('Asia/Kuala_Lumpur'); 

        $events = Event::with([
            'location',
            'prices',
            'ageGroups',
            'frequencies',
            'slots' => fn($q) =>
                $q->whereDate('date', '>=', $today->toDateString()) 
                ->orderBy('date'),
            'media',
        ])
        ->where('status', 'active')
        ->where(function ($query) use ($today) {

            // --- Non-recurring events ---
            $query->where(function ($q) use ($today) {
                $q->where('is_recurring', false)
                ->whereHas('dates', function ($dateQ) use ($today) {
                    $dateQ->whereDate('end_date', '>=', $today->toDateString());
                });
            })

            // --- Recurring events ---
            ->orWhere(function ($q) use ($today) {
                $q->where('is_recurring', true)
                ->whereHas('slots', function ($slotQ) use ($today) {
                    $slotQ->where(function ($q) use ($today) {

                        // future slots (date is after today)
                        $q->whereDate('date', '>', $today->toDateString())

                        // OR today's slot but end_time is still upcoming
                        ->orWhere(function ($q2) use ($today) {
                            $q2->whereDate('date', '=', $today->toDateString())
                            ->whereTime('end_time', '>=', $today->format('H:i:s'));
                        });
                    });
                });
            });
        })
        ->orderByDesc('featured')
        ->orderBy('created_at', 'desc')
        ->get();

        // --- Transform events ---
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
            'dates',
        ]);

        $now = now()->setTimezone('Asia/Kuala_Lumpur');

        // Filter slots that have not ended yet
        $filteredSlots = $event->slots->filter(function ($slot) use ($now) {
            return $slot->display_end && $slot->display_end->gte($now);
        })->values();

        $event->setRelation('slots', $filteredSlots);

        // Transform slots
        $event->slots->transform(function ($slot) {
            $slot->available_seats = $slot->is_unlimited
                ? null
                : $slot->capacity - $slot->booked_quantity;

            $slot->makeHidden('event'); // hide nested event to avoid duplication

            return $slot;
        });

        // Transform media URLs
        $event->media->transform(function ($media) {
            $media->file_path = $media->url ?? $media->file_path;
            return $media;
        });

        // Build dates array
        if ($event->is_recurring) {
            $dates = $event->slots->map(function ($slot) {
                return [
                    'start_date' => $slot->date,
                    'end_date'   => $slot->date,
                ];
            })->unique('start_date')->values();
        } else {
            $dates = $event->dates->filter(function ($date) use ($event, $now) {
                return $event->slots->contains(function ($slot) use ($date, $now) {
                    return $slot->event_date_id === $date->id
                        && $slot->display_end
                        && $slot->display_end->gte($now);
                });
            })->map(function ($date) {
                return [
                    'start_date' => $date->start_date,
                    'end_date'   => $date->end_date,
                ];
            })->values();
        }

        // Collect all slot prices
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
