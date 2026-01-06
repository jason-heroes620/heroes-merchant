<?php

namespace App\Http\Controllers;

use App\Models\{
    User,
    Merchant,
    Event,
    EventMedia,
    EventPrice,
    EventAgeGroup,
    EventFrequency,
    EventDate,
    EventSlot,
    EventSlotPrice,
    EventLocation,
};
use App\Services\EventSlotService;
use App\Services\ConversionService;
use App\Services\ClaimConfigurationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Notifications\EventNotification;
use App\Notifications\EventStatusNotification;
use Carbon\Carbon;

class EventController extends Controller
{
    protected EventSlotService $slotService;
    protected ConversionService $conversionService;
    protected ClaimConfigurationService $claimConfigService;

    public function __construct(
        EventSlotService $slotService,
        ConversionService $conversionService,
        ClaimConfigurationService $claimConfigService
    ) {
        $this->slotService = $slotService;
        $this->conversionService = $conversionService;
        $this->claimConfigService = $claimConfigService;
    }

    /** Display a listing of events */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Event::with([
            'merchant',
            'location',
            'ageGroups',
            'slots.prices',
            'frequencies',
            'dates',
            'slots',
            'media'
        ])->orderByDesc('created_at');

        if ($user->role === 'admin' && $request->merchant_id) {
            $query->where('merchant_id', $request->merchant_id);
        }

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();
            $query->where('merchant_id', $merchant->id);
        }

        $events = $query->paginate(15);
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $events->getCollection()->transform(function ($event) use ($now) {

            $event->media->transform(fn($m) => tap($m, fn() => $m->file_path = $m->url));

            $event->slots->transform(fn($slot) => tap($slot, function ($s) {
                $s->available_seats = $s->is_unlimited ? null : $s->capacity - $s->booked_quantity;
            }));

            $event->frequency = $event->frequencies->first();
            $event->slotPrices = $event->slots->flatMap(fn($slot) => $slot->prices)->values();

            // ---------------------------
            // Build all_slots for display
            // ---------------------------
            $all = $event->slots->map(function ($s) {
                $displayStart = $s->display_start;
                $displayEnd = $s->display_end;

                // Fallback for one-time events
                if (!$displayStart || !$displayEnd) {
                    $eventDate = $s->date; // related EventDate
                    if ($eventDate) {
                        $startDate = $eventDate->start_date?->format('Y-m-d');
                        $endDate = $eventDate->end_date?->format('Y-m-d');

                        $startTime = $s->start_time?->format('H:i:s') ?? '00:00:00';
                        $endTime = $s->end_time?->format('H:i:s') ?? '23:59:59';

                        $displayStart = $startDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", 'Asia/Kuala_Lumpur') : null;
                        $displayEnd = $endDate ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", 'Asia/Kuala_Lumpur') : null;
                    }
                }

                return (object)[
                    'display_start' => $displayStart,
                    'display_end' => $displayEnd,
                    'raw' => $s,
                ];
            });

            // Filter out nulls and sort
            $all = $all->filter(fn($s) => $s->display_start && $s->display_end)
                ->sortBy('display_start')
                ->values();

            $event->all_slots = $all;
            $event->next_active_slot = $all->first(fn($s) => $s->display_end->greaterThanOrEqualTo($now));

            $event->is_upcoming = $event->next_active_slot !== null;
            $event->is_past = $event->next_active_slot === null;

            return $event;
        });

        $merchants = Merchant::select('id', 'company_name')->orderBy('company_name')->get();

        return Inertia::render('Events/Index', [
            'events' => $events,
            'role' => $user->role,
            'merchants' => $merchants,
            'selectedMerchant' => $request->merchant_id,
        ]);
    }

    /** Display a specific event */
    public function show(Event $event)
    {
        $user = Auth::user();

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

            if ($event->merchant_id !== $merchant->id) {
                abort(403, 'Unauthorized access to this event.');
            }
        }

        $event->load(['location', 'ageGroups', 'slots.prices', 'frequencies', 'dates', 'media']);

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
            // Use event_dates for one-time events
            $dates = $event->dates->map(function ($date) {
                return [
                    'start_date' => $date->start_date,
                    'end_date'   => $date->end_date,
                ];
            });
        }

        $frequency = $event->frequencies->first() ?? null;

        $activeConversion = app(ConversionService::class)->getActiveConversion();

        $eventData = [
            'event' => $event,
            'media' => $event->media,
            'ageGroups' => $event->ageGroups,
            'prices' => $event->prices,
            'frequency' => $frequency,
            'dates' => $dates,
            'slots' => $event->slots,
            'slotPrices' => $event->slots->flatMap(fn($slot) => $slot->prices)->values(),
            'bookings' => $event->bookings,
            'conversion' => $activeConversion,
            'location' => $event->location,
        ];

        return Inertia::render('Events/Show', [
            'eventData' => $eventData,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**Show the form for creating a new event.*/
    public function create()
    {
        $merchant = Merchant::where('user_id', Auth::id())->first();

        // Check if merchant exists and is verified
        if (!$merchant || $merchant->business_status !== 'verified') {
            return redirect()->back()->with('error', 'Only verified merchants can create events.');
        }

        return Inertia::render('Events/Create', [
            'merchant_id' => $merchant->id,
            'userRole' => Auth::user()->role,
        ]);
    }

    public function store(Request $request, EventSlotService $slotService, Event $event)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        Log::info('🧾 Raw Request Data:', $request->all());

        // 1️⃣ Normalize FormData JSON → arrays
        foreach (['age_groups', 'prices', 'frequencies', 'event_dates', 'location'] as $field) {
            if ($request->has($field) && is_string($request->$field)) {
                $request->merge([
                    $field => json_decode($request->$field, true)
                ]);
            }
        }

        $hasCustomFreq = false;

        foreach ($request->input('frequencies', []) as $freq) {
            if (($freq['type'] ?? '') === 'custom') {
                $hasCustomFreq = true;
                break;
            }
        }

        // 2️⃣ Validate with corrected rules
        $validated = $request->validate([
            'type' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'is_suitable_for_all_ages' => 'required|boolean',

            'age_groups' => 'nullable|array',
            'age_groups.*.label' => 'required_with:age_groups|string',
            'age_groups.*.min_age' => 'required_with:age_groups|integer|min:0',
            'age_groups.*.max_age' => 'required_with:age_groups|integer|min:0',
            'age_groups.*.fixed_price_in_rm' => 'nullable|numeric',
            'age_groups.*.weekday_price_in_rm' => 'nullable|numeric',
            'age_groups.*.weekend_price_in_rm' => 'nullable|numeric',

            'location' => 'required|array',
            'location.location_name' => 'required|string|max:255',
            'location.latitude' => 'nullable|numeric|between:-90,90',
            'location.longitude' => 'nullable|numeric|between:-180,180',
            'location.viewport' => 'nullable|array',
            'location.raw_place' => 'nullable|array',

            'location.how_to_get_there' => 'nullable|string',

            'media' => 'nullable|array',
            'media.*' => 'file|mimes:jpeg,jpg,png,gif,mp4,mov|max:10240',

            'pricing_type' => 'required|string|in:fixed,day_type,age_based,mixed',
            'prices' => [
                function ($attribute, $value, $fail) use ($request) {
                    $pricingType = $request->input('pricing_type');
                    if (in_array($pricingType, ['fixed', 'day_type']) && empty($value)) {
                        $fail('The prices field is required for fixed or day_type pricing.');
                    }
                },
                'nullable',
                'array',
                'min:1',
            ],
            'prices.*.pricing_type' => 'required|string|in:fixed,day_type,age_based,mixed',
            'prices.*.event_age_group_id' => 'nullable|uuid',
            'prices.*.fixed_price_in_rm' => 'nullable|numeric',
            'prices.*.weekday_price_in_rm' => 'nullable|numeric',
            'prices.*.weekend_price_in_rm' => 'nullable|numeric',

            'frequencies' => 'nullable|array|min:1',
            'frequencies.*.type' => 'required|string|in:one_time,daily,weekly,biweekly,monthly,annually,custom',
            'frequencies.*.days_of_week' => 'nullable|array',
            'frequencies.*.selected_dates' => 'nullable|array',

            'event_dates' => [
                $hasCustomFreq ? 'nullable' : 'required',
                'array',
                'min:1',
            ],
            'event_dates.*.start_date' => [
                $hasCustomFreq ? 'nullable' : 'required',
                'date',
            ],

            'event_dates.*.end_date' => [
                $hasCustomFreq ? 'nullable' : 'required',
                'date',
                function ($attribute, $value, $fail) use ($request, $hasCustomFreq) {
                    if ($hasCustomFreq) return;

                    $index = explode('.', $attribute)[1];
                    $start = $request->input("event_dates.$index.start_date");

                    if ($start && $value < $start) {
                        $fail("The end date must be after or equal to the start date.");
                    }
                }
            ],

            'event_dates.*.slots' => 'nullable|array',
            'event_dates.*.slots.*.start_time' => 'required_with:event_dates.*.slots|string',
            'event_dates.*.slots.*.end_time' => 'required_with:event_dates.*.slots|string',
            'event_dates.*.slots.*.capacity' => 'nullable|integer',
            'event_dates.*.slots.*.is_unlimited' => 'boolean',
            'claim_configuration' => 'nullable|array', 
        ]);

        DB::beginTransaction();

        try {
            // recurring check fix
            $isRecurring = !empty($validated['frequencies']) &&
                $validated['frequencies'][0]['type'] !== 'one_time';

            $event = Event::create([
                'merchant_id' => $merchant->id,
                'type' => $validated['type'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'] ?? null,
                'is_suitable_for_all_ages' => $validated['is_suitable_for_all_ages'],
                'is_recurring' => $isRecurring,
                'status' => 'pending',
            ]);

            if (!empty($validated['claim_configuration'])) {
                $this->claimConfigService->saveConfiguration(
                    $event,
                    $validated['claim_configuration']
                );
                Log::info('💾 ClaimConfiguration saved', [
                    'event_id' => $event->id,
                    'data' => $validated['claim_configuration'],
                ]);
            }

            // Age groups
            $ageGroupModels = [];

            if (!empty($validated['age_groups'])) {
                foreach ($validated['age_groups'] as $g) {
                    try {
                        $ag = EventAgeGroup::create([
                            'event_id' => $event->id,
                            'label' => $g['label'],
                            'min_age' => (int) $g['min_age'],
                            'max_age' => (int) $g['max_age'],
                        ]);
                        $ageGroupModels[] = $ag;
                        Log::info("✅ AgeGroup created", ['id' => $ag->id, 'label' => $g['label']]);
                    } catch (\Throwable $e) {
                        Log::error("❌ Failed to create AgeGroup", ['error' => $e->getMessage(), 'data' => $g]);
                    }
                }
            }

            // Location
            $locationData = $validated['location'] ?? [];
            if (isset($locationData['raw_place'])) {
                $locationData['raw_place'] = json_encode($locationData['raw_place']);
            }
            $locationData['event_id'] = $event->id;
            EventLocation::create($locationData);

            // Media
            if ($request->hasFile('media')) {
                foreach ($request->file('media') as $file) {
                    $filename = Str::uuid() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('event_media', $filename, 'public');
                    EventMedia::create([
                        'event_id' => $event->id,
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            $validated['prices'] = $validated['prices'] ?? [];

            // Prices
            if (in_array($validated['pricing_type'], ['age_based', 'mixed']) && !empty($validated['age_groups'])) {
                foreach ($validated['age_groups'] as $i => $group) {
                    $ageGroup = $ageGroupModels[$i] ?? null;
                    if (!$ageGroup) continue;

                    $price = EventPrice::create([
                        'event_id' => $event->id,
                        'event_age_group_id' => $ageGroup->id,
                        'pricing_type' => $validated['pricing_type'],
                        'fixed_price_in_rm' => $group['fixed_price_in_rm'] ?? 0,
                        'weekday_price_in_rm' => $group['weekday_price_in_rm'] ?? 0,
                        'weekend_price_in_rm' => $group['weekend_price_in_rm'] ?? 0,
                    ]);

                    if ($price) {
                        Log::info('✅ Price created successfully', ['id' => $price->id]);
                    } else {
                        Log::error('❌ Price creation returned null', ['data' => $group]);
                    }
                }
            } else {
                // fixed / day_type
                foreach ($validated['prices'] as $p) {
                    Log::info("Creating price for fixed/day_type", $p);

                    EventPrice::create([
                        'event_id' => $event->id,
                        'event_age_group_id' => null,
                        'pricing_type' => $p['pricing_type'],
                        'fixed_price_in_rm' => $p['fixed_price_in_rm'] ?? 0,
                        'weekday_price_in_rm' => $p['weekday_price_in_rm'] ?? 0,
                        'weekend_price_in_rm' => $p['weekend_price_in_rm'] ?? 0,
                    ]);
                }
            }

            // Frequencies 
            $frequencyIds = [];
            $frequencyModels = [];

            if (!empty($validated['frequencies'])) {
                foreach ($validated['frequencies'] as $freq) {
                    $frequency = EventFrequency::create([
                        'event_id' => $event->id,
                        'type' => $freq['type'],
                        'days_of_week' => $freq['days_of_week'] ?? null,
                        'selected_dates' => $freq['selected_dates'] ?? null,
                    ]);

                    $frequencyIds[] = $frequency->id;
                    $frequencyModels[] = $frequency;
                }
            }

            if ($hasCustomFreq) {
                Log::info("🔹 Handling custom frequency dates");

                foreach ($frequencyModels as $freqModel) {
                    if ($freqModel->type !== 'custom') continue;

                    $selectedDates = $freqModel->selected_dates ?? [];
                    if (empty($selectedDates)) {
                        Log::warning("No selected_dates found for custom frequency {$freqModel->id}");
                        continue;
                    }

                    foreach ($selectedDates as $dateEntry) {
                        $dateStr = is_array($dateEntry) ? ($dateEntry['date'] ?? null) : $dateEntry;
                        if (!$dateStr) continue;

                        $eventDate = EventDate::create([
                            'event_id' => $event->id,
                            'event_frequency_id' => $freqModel->id,
                            'start_date' => $dateStr,
                            'end_date' => $dateStr,
                        ]);

                        $templateSlots = $eventDate->slots()->get()->toArray();
                        if (empty($templateSlots) && !empty($validated['event_dates'][0]['slots'] ?? [])) {
                            $templateSlots = $validated['event_dates'][0]['slots'];
                        }

                        $slotService->generateSlotsForEventDate($event, $eventDate, $dateStr, $templateSlots);
                    }
                }

                DB::commit();
                return redirect()->route('merchant.events.index')
                    ->with('success', 'Event created successfully!');
            }

            // Event dates
            foreach ($validated['event_dates'] as $date) {
                $eventDate = EventDate::create([
                    'event_id' => $event->id,
                    'event_frequency_id' => $isRecurring ? ($frequencyIds[0] ?? null) : null,
                    'start_date' => $date['start_date'],
                    'end_date' => $date['end_date'],
                ]);

                foreach ($date['slots'] ?? [] as $slotPayload) {
                    $this->slotService->createSlotForDate($event, $eventDate, $date['start_date'], $slotPayload);
                }

                if ($isRecurring) {
                    $slotService->generateSlotsForEvent($event);
                }
            }

            DB::commit();

            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $admin->notify(new EventNotification($event, 'updated'));
            }

            return redirect()->route('merchant.events.index')
                ->with('success', 'Event created successfully!');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Event creation failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Event creation failed: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function edit(Event $event)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        // 1️⃣ Ensure the event belongs to this merchant
        if ($event->merchant_id !== $merchant->id) {
            abort(403, 'You are not allowed to edit this event.');
        }

        // 2️⃣ Ensure merchant is verified (event-related restriction)
        if ($merchant->business_status !== 'verified') {
            abort(403, 'Only verified merchants can edit events.');
        }

        $event->load([
            'location',
            'ageGroups.prices',
            'prices',
            'frequencies',
            'dates.slots',
            'media',
            'claimConfiguration'
        ]);

        $location = $event->location
            ? $event->location->toArray()
            : [
                'place_id' => null,
                'location_name' => '',
                'latitude' => null,
                'longitude' => null,
                'viewport' => null,
                'raw_place' => null,
                'how_to_get_there' => '',
            ];

        $ageGroups = $event->ageGroups->map(function ($group) {
            return [
                'id' => $group->id,
                'label' => $group->label,
                'min_age' => $group->min_age,
                'max_age' => $group->max_age,
                'fixed_price_in_rm' => optional($group->prices->first())->fixed_price_in_rm,
                'weekday_price_in_rm' => optional($group->prices->first())->weekday_price_in_rm,
                'weekend_price_in_rm' => optional($group->prices->first())->weekend_price_in_rm,
            ];
        })->toArray();

        $prices = $event->prices->map(function ($p) {
            return [
                'id' => $p->id,
                'pricing_type' => $p->pricing_type,
                'fixed_price_in_rm' => $p->fixed_price_in_rm,
                'weekday_price_in_rm' => $p->weekday_price_in_rm,
                'weekend_price_in_rm' => $p->weekend_price_in_rm,
                'event_age_group_id' => $p->event_age_group_id,
            ];
        })->toArray();

        $frequencies = $event->frequencies->map(function ($f) {
            $days = is_string($f->days_of_week) ? json_decode($f->days_of_week, true) : ($f->days_of_week ?? []);
            $dates = is_string($f->selected_dates) ? json_decode($f->selected_dates, true) : ($f->selected_dates ?? []);

            return [
                'id' => $f->id,
                'type' => $f->type,
                'days_of_week' => array_map('intval', $days),
                'selected_dates' => $dates,
            ];
        })->toArray();

        // Event dates and slots - ONLY GET UNIQUE TEMPLATE SLOTS
        $eventDates = $event->dates->map(function ($d) {
            // For recurring events, get only unique time slots (template slots)
            // Group by start_time and end_time to get unique combinations
            $uniqueSlots = $d->slots
                ->unique(function ($slot) {
                    return $slot->start_time . '-' . $slot->end_time;
                })
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'start_time' => $s->start_time ? date('H:i', strtotime($s->start_time)) : '',
                        'end_time' => $s->end_time ? date('H:i', strtotime($s->end_time)) : '',
                        'capacity' => $s->capacity,
                        'is_unlimited' => $s->is_unlimited,
                    ];
                })
                ->values() 
                ->toArray();

            return [
                'id' => $d->id,
                'event_frequency_id' => $d->event_frequency_id,
                'start_date' => $d->start_date->format('Y-m-d'),
                'end_date' => $d->end_date->format('Y-m-d'),
                'slots' => $uniqueSlots,
            ];
        })->toArray();

        // Media
        $media = $event->media->map(function ($m) {
            return [
                'id' => $m->id,
                'file_path' => $m->file_path,
                'url' => Storage::url($m->file_path),
                'file_type' => $m->file_type,
                'file_size' => $m->file_size,
            ];
        })->toArray();

        $claimConfiguration = null;
        if ($event->claimConfiguration) {
            $claimConfiguration = [
                'total_redemption_type' => $event->claimConfiguration->total_redemption_type,
                'total_redemption_limit' => $event->claimConfiguration->total_redemption_limit,
                'daily_redemption_type' => $event->claimConfiguration->daily_redemption_type,
                'daily_redemption_limit' => $event->claimConfiguration->daily_redemption_limit,
            ];
        } else {
            // Default values for new events or events without claim configuration
            $claimConfiguration = [
                'total_redemption_type' => 'limited',
                'total_redemption_limit' => 1,
                'daily_redemption_type' => 'once',
                'daily_redemption_limit' => 1,
            ];
        }

        return Inertia::render('Events/Edit', [
            'event' => [
                'id' => $event->id,
                'merchant_id' => $event->merchant_id,
                'type' => $event->type,
                'title' => $event->title,
                'description' => $event->description,  
                'category' => $event->category,
                'is_suitable_for_all_ages' => $event->is_suitable_for_all_ages,
                'is_recurring' => $event->is_recurring,
                'status' => $event->status,
                'location' => $location,
                'age_groups' => $ageGroups,
                'frequencies' => $frequencies,
                'event_dates' => $eventDates,
                'media' => $media,
                'prices' => $prices,
                'claim_configuration' => $claimConfiguration,
            ],
            'merchant_id' => $merchant->id,
            'userRole' => $user->role ?? 'merchant',
        ]);
    }

    public function update(Request $request, EventSlotService $slotService, Event $event)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        if ($event->merchant_id !== $merchant->id) {
            abort(403, 'Unauthorized');
        }

        Log::info('🧾 Update Request', $request->all());

        // Normalize JSON FormData
        foreach (['age_groups', 'prices', 'frequencies', 'event_dates', 'location'] as $field) {
            if ($request->has($field) && is_string($request->$field)) {
                $request->merge([
                    $field => json_decode($request->$field, true)
                ]);
            }
        }

        // Check for custom frequency
        $hasCustomFreq = false;
        foreach ($request->input('frequencies', []) as $freq) {
            if (($freq['type'] ?? '') === 'custom') {
                $hasCustomFreq = true;
                break;
            }
        }

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'is_suitable_for_all_ages' => 'sometimes|boolean',
            'is_recurring' => 'sometimes|boolean',

            'location' => 'sometimes|array',
            'location.location_name' => 'required_with:location|string',
            'location.latitude' => 'nullable|numeric|between:-90,90',
            'location.longitude' => 'nullable|numeric|between:-180,180',
            'location.viewport' => 'nullable|array',
            'location.raw_place' => 'nullable|array',

            'location.how_to_get_there' => 'nullable|string',

            'age_groups' => 'sometimes|array',
            'age_groups.*.id' => 'nullable|uuid',
            'age_groups.*.label' => 'required_with:age_groups|string',
            'age_groups.*.min_age' => 'required_with:age_groups|integer|min:0',
            'age_groups.*.max_age' => 'required_with:age_groups|integer|min:0',

            'prices' => 'sometimes|array',
            'prices.*.id' => 'nullable|uuid',
            'prices.*.pricing_type' => 'required_with:prices|string',
            'prices.*.fixed_price_in_rm' => 'nullable|numeric',
            'prices.*.weekday_price_in_rm' => 'nullable|numeric',
            'prices.*.weekend_price_in_rm' => 'nullable|numeric',

            'frequencies' => 'sometimes|array',
            'frequencies.*.id' => 'nullable|uuid',
            'frequencies.*.type' => 'required_with:frequencies|string',
            'frequencies.*.days_of_week' => 'nullable|array',
            'frequencies.*.selected_dates' => 'nullable|array',

            'event_dates' => 'sometimes|array|min:1',
            'event_dates.*.id' => 'nullable|uuid',
            'event_dates.*.start_date' => 'required_with:event_dates|date',
            'event_dates.*.end_date' => 'required_with:event_dates|date',

            'event_dates.*.slots' => 'nullable|array',
            'event_dates.*.slots.*.id' => 'nullable|uuid',
            'event_dates.*.slots.*.start_time' => 'required_with:event_dates.*.slots|string',
            'event_dates.*.slots.*.end_time' => 'required_with:event_dates.*.slots|string',
            'event_dates.*.slots.*.capacity' => 'nullable|integer',
            'event_dates.*.slots.*.is_unlimited' => 'boolean',
        ]);

        DB::beginTransaction();

        try {
            // Determine is_recurring
            $isRecurring = !empty($validated['frequencies']) &&
                $validated['frequencies'][0]['type'] !== 'one_time';

            /* =======================
            * EVENT CORE
            * ======================= */
            $event->update([
                'type' => $validated['type'] ?? $event->type,
                'title' => $validated['title'] ?? $event->title,
                'description' => $validated['description'] ?? $event->description,
                'category' => $validated['category'] ?? $event->category,
                'is_suitable_for_all_ages' => $validated['is_suitable_for_all_ages'] ?? $event->is_suitable_for_all_ages,
                'is_recurring' => $isRecurring,
            ]);

            /* =======================
            * LOCATION (UPSERT)
            * ======================= */
            if (!empty($validated['location'])) {
                $locationData = $validated['location'];

                if (isset($locationData['raw_place'])) {
                    $locationData['raw_place'] = json_encode($locationData['raw_place']);
                }

                $event->location()->updateOrCreate(
                    ['event_id' => $event->id],
                    $locationData
                );
            }

            /* =======================
            * AGE GROUPS (RESET)
            * ======================= */
            $existingAgeGroupIds = EventAgeGroup::where('event_id', $event->id)->pluck('id')->toArray();
            $sentAgeGroupIds = [];
            $ageGroupModels = [];

            foreach ($validated['age_groups'] ?? [] as $g) {
                if (!empty($g['id']) && in_array($g['id'], $existingAgeGroupIds)) {
                    $ageGroup = EventAgeGroup::find($g['id']);
                    $ageGroup->update([
                        'label' => $g['label'],
                        'min_age' => $g['min_age'],
                        'max_age' => $g['max_age'],
                    ]);
                    $sentAgeGroupIds[] = $g['id'];
                    $ageGroupModels[] = $ageGroup;
                } else {
                    $ageGroup = EventAgeGroup::create([
                        'event_id' => $event->id,
                        'label' => $g['label'],
                        'min_age' => $g['min_age'],
                        'max_age' => $g['max_age'],
                    ]);
                    $sentAgeGroupIds[] = $ageGroup->id;
                    $ageGroupModels[] = $ageGroup;
                }
            }

            EventAgeGroup::where('event_id', $event->id)
                ->whereNotIn('id', $sentAgeGroupIds)
                ->delete();

            /* =======================
            * PRICES (RESET)
            * ======================= */
            $existingPriceIds = EventPrice::where('event_id', $event->id)->pluck('id')->toArray();
            $sentPriceIds = [];

            foreach ($validated['prices'] ?? [] as $p) {
                if (!empty($p['id']) && in_array($p['id'], $existingPriceIds)) {
                    $price = EventPrice::find($p['id']);
                    $price->update([
                        'event_age_group_id' => $p['event_age_group_id'] ?? null,
                        'pricing_type' => $p['pricing_type'],
                        'fixed_price_in_rm' => $p['fixed_price_in_rm'] ?? 0,
                        'weekday_price_in_rm' => $p['weekday_price_in_rm'] ?? 0,
                        'weekend_price_in_rm' => $p['weekend_price_in_rm'] ?? 0,
                    ]);
                    $sentPriceIds[] = $p['id'];
                } else {
                    $price = EventPrice::create([
                        'event_id' => $event->id,
                        'event_age_group_id' => $p['event_age_group_id'] ?? null,
                        'pricing_type' => $p['pricing_type'],
                        'fixed_price_in_rm' => $p['fixed_price_in_rm'] ?? 0,
                        'weekday_price_in_rm' => $p['weekday_price_in_rm'] ?? 0,
                        'weekend_price_in_rm' => $p['weekend_price_in_rm'] ?? 0,
                    ]);
                    $sentPriceIds[] = $price->id;
                }
            }

            EventPrice::where('event_id', $event->id)
                ->whereNotIn('id', $sentPriceIds)
                ->delete();

            /* =======================
            * DELETE ALL EXISTING SLOTS & SLOT PRICES
            * ======================= */
            // Delete all slot prices first (foreign key constraint)
            EventSlotPrice::whereIn('event_slot_id', function($query) use ($event) {
                $query->select('id')
                    ->from('event_slots')
                    ->where('event_id', $event->id);
            })->delete();

            // Delete all slots
            EventSlot::where('event_id', $event->id)->delete();

            // Delete all event dates
            EventDate::where('event_id', $event->id)->delete();

            /* =======================
            * FREQUENCIES (RESET)
            * ======================= */
            EventFrequency::where('event_id', $event->id)->delete();

            $frequencyIds = [];
            $frequencyModels = [];

            if (!empty($validated['frequencies'])) {
                foreach ($validated['frequencies'] as $freq) {
                    $frequency = EventFrequency::create([
                        'event_id' => $event->id,
                        'type' => $freq['type'],
                        'days_of_week' => $freq['days_of_week'] ?? null,
                        'selected_dates' => $freq['selected_dates'] ?? null,
                    ]);

                    $frequencyIds[] = $frequency->id;
                    $frequencyModels[] = $frequency;
                }
            }

            /* =======================
            * CUSTOM FREQUENCY HANDLING
            * ======================= */
            if ($hasCustomFreq) {
                Log::info("🔹 Handling custom frequency dates in update");

                foreach ($frequencyModels as $freqModel) {
                    if ($freqModel->type !== 'custom') continue;

                    $selectedDates = $freqModel->selected_dates ?? [];
                    if (empty($selectedDates)) {
                        Log::warning("No selected_dates found for custom frequency {$freqModel->id}");
                        continue;
                    }

                    foreach ($selectedDates as $dateEntry) {
                        $dateStr = is_array($dateEntry) ? ($dateEntry['date'] ?? null) : $dateEntry;
                        if (!$dateStr) continue;

                        $eventDate = EventDate::create([
                            'event_id' => $event->id,
                            'event_frequency_id' => $freqModel->id,
                            'start_date' => $dateStr,
                            'end_date' => $dateStr,
                        ]);

                        $templateSlots = !empty($validated['event_dates'][0]['slots'] ?? [])
                            ? $validated['event_dates'][0]['slots']
                            : [];

                        $slotService->generateSlotsForEventDate($event, $eventDate, $dateStr, $templateSlots);
                    }
                }

                DB::commit();
                return redirect()->route('merchant.events.index')
                    ->with('success', 'Event updated successfully!');
            }

            /* =======================
            * EVENT DATES + SLOTS (REGENERATE)
            * ======================= */
            foreach ($validated['event_dates'] as $dateIndex => $date) {
                $eventDate = EventDate::create([
                    'event_id' => $event->id,
                    'event_frequency_id' => $isRecurring ? ($frequencyIds[$dateIndex] ?? $frequencyIds[0] ?? null) : null,
                    'start_date' => $date['start_date'],
                    'end_date' => $date['end_date'],
                ]);

                // Create template slots for this event date
                foreach ($date['slots'] ?? [] as $slotPayload) {
                    $slotService->createSlotForDate($event, $eventDate, $date['start_date'], $slotPayload);
                }

                // If recurring, generate all slots based on frequency
                if ($isRecurring) {
                    $slotService->generateSlotsForEvent($event);
                }
            }

            DB::commit();

            return redirect()
                ->route('merchant.events.index')
                ->with('success', 'Event updated successfully');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('❌ Event update failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return back()
                ->withErrors(['error' => $e->getMessage()])
                ->withInput();
        }
    }
    public function updateStatus(Request $request, Event $event)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'status' => 'required|in:draft,pending,active,inactive,rejected',
            'rejected_reason' => 'nullable|string',
            'slot_prices' => 'nullable|array',
            'slot_prices.*.id' => 'nullable|string|exists:event_slot_prices,id',
            'slot_prices.*.paid_credits' => 'nullable|integer|min:0',
            'slot_prices.*.free_credits' => 'nullable|integer|min:0',
        ]);

        Log::info('Validated request', ['validated' => $validated]);

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();
            if ($event->merchant_id !== $merchant->id) {
                Log::warning('Merchant unauthorized', ['merchant_id' => $merchant->id, 'event_merchant_id' => $event->merchant_id]);
                abort(403, 'Unauthorized action.');
            }

            if ($validated['status'] !== 'pending' && !($event->status === 'active' && $validated['status'] === 'inactive')) {
                Log::warning('Merchant cannot change this status', ['current_status' => $event->status, 'requested_status' => $validated['status']]);
                abort(403, 'Merchants cannot change this status.');
            }
        } elseif ($user->role !== 'admin') {
            Log::warning('Unauthorized user role', ['role' => $user->role]);
            abort(403, 'Unauthorized action.');
        }

        DB::beginTransaction();
        try {
            Log::info('Updating event status', ['status' => $validated['status']]);
            $updated = $event->update([
                'status' => $validated['status'],
                'rejected_reason' => $validated['rejected_reason'] ?? null,
            ]);
            Log::info('Event update result', ['updated' => $updated, 'event' => $event->fresh()->toArray()]);

            if ($validated['status'] === 'active' && isset($validated['slot_prices'])) {
                $conversion = app(ConversionService::class)->getActiveConversion();
                Log::info('Active conversion', ['conversion' => $conversion]);

                if (!$conversion) {
                    throw new \Exception('No active conversion found.');
                }

                foreach ($validated['slot_prices'] as $sp) {
                    $slot = EventSlotPrice::find($sp['id']);
                    $price = $slot->price_in_rm ? (float) $slot->price_in_rm : 0.00;
                    Log::info('Processing slot price', ['slot' => $slot->toArray(), 'submitted' => $sp]);

                    $recommended = app(ConversionService::class)->calculateCredits($price, $conversion);

                    if ($sp['paid_credits'] < $recommended['paid_credits']) {
                        throw new \Exception("Paid credits for slot #{$sp['id']} cannot be lower than minimum ({$recommended['paid_credits']}) to prevent loss.");
                    }

                    EventSlotPrice::where('id', $sp['id'])->update([
                        'paid_credits' => $sp['paid_credits'],
                        'free_credits' => $sp['free_credits'] ?? $recommended['free_credits'],
                        'conversion_id' => $conversion->id,
                    ]);

                    $updatedSlot = EventSlotPrice::find($sp['id']);
                    Log::info('Slot price updated', ['slot' => $updatedSlot->toArray()]);
                }
            }

            if ($event->merchant && $event->merchant->user) {
                $user = $event->merchant->user;

                Log::info('Sending EventStatusNotification to merchant user', [
                    'user_id' => $user->id,
                    'expo_push_token' => $user->expo_push_token ?? null,
                    'event_id' => $event->id,
                ]);

                $user->notify(
                    (new EventStatusNotification($event, $validated['status']))->delay(now())
                );

                Log::info('Notification dispatched to merchant user');
            } else {
                $merchantId = $event->merchant->id ?? 'unknown';
                Log::warning("Merchant {$merchantId} has no associated user");
            }

            DB::commit();
            Log::info('Transaction committed');
            return redirect()->back()->with('success', "Event status updated to '{$validated['status']}'");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event status update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withErrors([
                'error' => 'Event status update failed: ' . $e->getMessage()
            ]);
        }
    }

    public function updateFeaturedStatus(Request $request, Event $event)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'featured' => ['required', 'boolean'],
        ]);

        try {
            if ((bool) $event->featured === (bool) $validated['featured']) {
                return back()->with(
                    'error',
                    $validated['featured']
                        ? 'Event is already featured.'
                        : 'Event is already not featured.'
                );
            }

            $updated = $event->update([
                'featured' => $validated['featured'],
            ]);

            if (!$updated) {
                return back()->with('error', 'Failed to update event status.');
            }

            return back()->with(
                'success',
                $validated['featured']
                    ? 'Event has been featured successfully.'
                    : 'Event has been unfeatured successfully.'
            );

        } catch (\Throwable $e) {
            Log::error('Failed to update featured status', [
                'event_id' => $event->id,
                'target_state' => $validated['featured'],
                'error' => $e->getMessage(),
            ]);

            return back()->with(
                'error',
                'Something went wrong while updating the event status.'
            );
        }
    }

    /** Soft deactivate */
    public function deactivate(Event $event)
    {
        $user = Auth::user();

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

            // Ensure the merchant owns this event
            if ($event->merchant_id !== $merchant->id) {
                abort(403, 'Unauthorized action.');
            }
        }

        $event->update(['status' => 'inactive']);

        return redirect()->route('merchant.events.index')->with('success', 'Event deactivated successfully!');
    }
}
