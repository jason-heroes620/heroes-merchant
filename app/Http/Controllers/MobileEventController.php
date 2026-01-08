<?php

namespace App\Http\Controllers;

use App\Models\{
    Customer,
    Event,
    EventSlotPrice,
    EventLike
};
use App\Services\ConversionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
    public function index()
    {
        $today = now('Asia/Kuala_Lumpur');
        $user = Auth::guard('sanctum')->user();

        $events = Event::with([
            'merchant:id,company_name',
            'location',
            'ageGroups',
            'frequencies',
            'media',
            'slots' => fn($q) =>
                $q->whereDate('date', '>=', $today->toDateString()) 
                ->orderBy('date'),
            'slots.prices.ageGroup',
        ])
        ->where('status', 'active')
        ->where(function ($query) use ($today) {
            // Non-recurring events
            $query->where(function ($q) use ($today) {
                $q->where('is_recurring', false)
                ->whereHas('dates', function ($dateQ) use ($today) {
                    $dateQ->whereDate('end_date', '>=', $today->toDateString());
                });
            })
            // Recurring events
            ->orWhere(function ($q) use ($today) {
                $q->where('is_recurring', true)
                ->whereHas('slots', function ($slotQ) use ($today) {
                    $slotQ->where(function ($q) use ($today) {
                        $q->whereDate('date', '>', $today->toDateString())
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

        // Get customer if authenticated
        $customer = null;
        if ($user && $user->role === 'customer') {
            $customer = Customer::where('user_id', $user->id)->first();
        }

        // Get event IDs for bulk price loading
        $eventIds = $events->pluck('id');
        
        // Load representative prices
        $allEventPrices = DB::table('event_slot_prices')
            ->join('event_slots', 'event_slot_prices.event_slot_id', '=', 'event_slots.id')
            ->whereIn('event_slots.event_id', $eventIds)
            ->select(
                'event_slots.event_id',
                'event_slot_prices.*',
                DB::raw('ROW_NUMBER() OVER (PARTITION BY event_slots.event_id, event_slot_prices.event_age_group_id ORDER BY event_slot_prices.free_credits, event_slot_prices.paid_credits, event_slot_prices.price_in_rm) as rn')
            )
            ->get()
            ->where('rn', 1)
            ->groupBy('event_id');

        // Get all liked event IDs for this customer (bulk query)
        $likedEventIds = [];
        if ($customer) {
            $likedEventIds = EventLike::where('customer_id', $customer->id)
                ->whereIn('event_id', $eventIds)
                ->pluck('event_id')
                ->toArray();
        }

        // Transform events
        $events = $events->map(function ($event) use ($allEventPrices, $likedEventIds) {
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

            $slotPrices = $event->slots
                ->flatMap(fn($slot) => $slot->prices)
                ->values();

            if ($slotPrices->isEmpty() && isset($allEventPrices[$event->id])) {
                $slotPrices = collect($allEventPrices[$event->id])->map(function($price) {
                    return EventSlotPrice::with('ageGroup')->find($price->id);
                })->filter();
            }

            $eventArray = $event->toArray();
            $eventArray['slotPrices'] = $slotPrices->toArray();
            
            // Check if this event is in the liked events array
            $eventArray['liked'] = in_array($event->id, $likedEventIds);

            return $eventArray;
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
            'merchant:id,company_name',
            'location',
            'prices',
            'ageGroups',
            'slots.prices.ageGroup',
            'frequencies',
            'media',
            'dates',
        ]);

        $now = now()->setTimezone('Asia/Kuala_Lumpur');

        $filteredSlots = $event->slots;

        if ($event->is_recurring) {
            $filteredSlots = $filteredSlots->filter(function ($slot) use ($now) {
                return $slot->display_end && $slot->display_end->gte($now);
            });
        }

        $event->setRelation('slots', $filteredSlots->values());

        // Transform slots
        $event->slots->transform(function ($slot) {
            $slot->available_seats = $slot->is_unlimited
                ? null
                : $slot->capacity - $slot->booked_quantity;
            $slot->makeHidden('event');
            return $slot;
        });

        // Transform media URLs
        $event->media->transform(function ($media) {
            $media->file_path = $media->url ?? $media->file_path;
            return $media;
        });

        if ($event->is_recurring) {
            $dates = $event->slots->map(function ($slot) {
                return [
                    'start_date' => $slot->date,
                    'end_date'   => $slot->date,
                ];
            })->unique('start_date')->values();
        } else {
            $dates = collect();

            if ($event->dates) {
                $slotExists = $event->slots->contains(function ($slot) use ($event) {
                    return $slot->event_date_id === $event->dates->id;
                });

                if ($slotExists) {
                    $dates->push([
                        'start_date' => $event->dates->start_date,
                        'end_date'   => $event->dates->end_date,
                    ]);
                }
            }
        }

        $slotPrices = $event->slots->flatMap(fn($slot) => $slot->prices)->values();

        $user = Auth::guard('sanctum')->user();
        $liked = false;
        
        if ($user && $user->role === 'customer') {
            $customer = Customer::where('user_id', $user->id)->first();
            if ($customer) {
                $liked = EventLike::where('event_id', $event->id)
                    ->where('customer_id', $customer->id)
                    ->exists();
            }
        }

        $eventArray = $event->toArray();
        $eventArray['liked'] = $liked;

        return response()->json([
            'success' => true,
            'event' => $eventArray,
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

        $events->transform(function ($event) use ($customer) {
            $event->slotPrices = $event->slots
                ->flatMap(fn($slot) => $slot->prices)
                ->values();

            $event->media->transform(function ($media) {
                $media->file_path = $media->url;
                return $media;
            });

            $event->liked = true; 

            return $event;
        });

        return response()->json([
            'events' => $events
        ]);
    }
}
