<?php

namespace App\Http\Controllers;

use App\Models\{
    Merchant,
    Event,
    EventMedia,
    EventPrice,
    EventAgeGroup,
    EventFrequency,
    EventDate,
    EventSlotPrice,
    EventLocation,
};
use App\Services\EventSlotService;
use App\Services\ConversionService;
use App\Notifications\EventStatusNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EventController extends Controller
{
    protected EventSlotService $slotService;

    public function __construct(
        EventSlotService $slotService,
        ConversionService $conversionService
    ) {
        $this->slotService = $slotService;
        $this->conversionService = $conversionService;
    }

    /** Display a listing of events */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Event::with([
            'merchant:id,company_name',
            'location',
            'ageGroups',
            'slots.prices',
            'frequencies',
            'dates',
            'slots',
            'media'
        ])->orderByDesc('created_at');

        if ($user->role === 'admin') {
            if ($request->merchant_id) {
                Log::info('Applying merchant filter', [
                    'merchant_id' => $request->merchant_id
                ]);
                $query->where('merchant_id', $request->merchant_id);
            }
        }

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();
            Log::info('Merchant user detected', [
                'merchant_id' => $merchant->id
            ]);
            $query->where('merchant_id', $merchant->id);
        }

        $events = $query->paginate(15);

        $events->getCollection()->transform(function ($event) {
            $event->media->transform(function ($media) {
                $media->file_path = $media->url;
                return $media;
            });

            $event->slots->transform(function ($slot) {
                $slot->available_seats = $slot->is_unlimited
                    ? null
                    : $slot->capacity - $slot->booked_quantity;
                return $slot;
            });

            $event->frequency = $event->frequencies->first();
            $event->slotPrices = $event->slots->flatMap(fn($slot) => $slot->prices)->values();

            if ($event->is_recurring && $event->slots->count() > 0) {
                $slot = $event->slots->sortBy('date')->first();
                $event->slot = $slot; 
            } else {
                $date = $event->dates->first();
                if ($date) {
                    $event->slot = (object) [
                        'date' => $date->start_date,
                        'start_time' => $date->start_time ?? null,
                        'end_time' => $date->end_date ?? null,
                    ];
                } else {
                    $event->slot = null;
                }
            }

            return $event;
        });

        $sorted = $events->getCollection()->sortByDesc(function ($ev) {
            return $ev->slot?->date ? strtotime($ev->slot->date) : 0;
        });

        $events->setCollection($sorted->values());

        $merchants = Merchant::select('id', 'company_name')->orderBy('company_name')->get();

        Log::info('Loaded Merchants:', $merchants->toArray());

        $first = $events->first();
        if ($first) {
            Log::info('First Event Merchant', [
                'event_id' => $first->id,
                'merchant_id' => $first->merchant_id,
                'merchant_relation' => $first->merchant ? $first->merchant->toArray() : null,
            ]);
        }

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
            'bookings' => [], 
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

        return Inertia::render('Events/Create', [
            'merchant_id' => $merchant?->id,
            'userRole' => Auth::user()->role,
        ]);
    }

    public function store(Request $request, EventSlotService $slotService)
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
                        Log::info("✅ AgeGroup created", ['id'=>$ag->id, 'label'=>$g['label']]);
                    } catch (\Throwable $e) {
                        Log::error("❌ Failed to create AgeGroup", ['error'=>$e->getMessage(), 'data'=>$g]);
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
                        'fixed_price_in_rm' => isset($group['fixed_price_in_rm']) ? (float)$group['fixed_price_in_rm'] : 0,
                        'weekday_price_in_rm' => isset($group['weekday_price_in_rm']) ? (float)$group['weekday_price_in_rm'] : 0,
                        'weekend_price_in_rm' => isset($group['weekend_price_in_rm']) ? (float)$group['weekend_price_in_rm'] : 0,
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

            return redirect()->route('merchant.events.index')
                ->with('success', 'Event created successfully!');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Event creation failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Event creation failed: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function update(Request $request, EventSlotService $slotService, $id)
    {
        Log::info('🔴 DEBUG: Raw Content', ['raw' => $request->getContent()]);
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        $event = Event::with(['location', 'ageGroups', 'prices', 'frequencies', 'dates'])
            ->where('merchant_id', $merchant->id)
            ->findOrFail($id);

        $decoded = [
            'location'     => json_decode($request->input('location', '[]'), true),
            'prices'       => json_decode($request->input('prices', '[]'), true),
            'frequencies'  => json_decode($request->input('frequencies', '[]'), true),
            'event_dates'  => json_decode($request->input('event_dates', '[]'), true),
            'age_groups'   => json_decode($request->input('age_groups', '[]'), true),
        ];

        $request->merge($decoded);

        Log::info('🧾 Normalized After Decode:', $decoded);

        $frequencies = $decoded['frequencies'] ?? [];
        $hasCustomFreq = collect($frequencies)
            ->contains(fn($f) => ($f['type'] ?? '') === 'custom');

        // 2️⃣ Validate
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
            'media.*.id' => 'nullable|string',
            'media.*.file_path' => 'nullable|string',
            'media.*.file_type' => 'nullable|string',
            'media_files.*' => 'file|mimes:jpeg,jpg,png,gif,mp4,mov|max:10240',

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
        ]);

        DB::beginTransaction();
        try {
            // Update main event
            $isRecurring = !empty($validated['frequencies']) && $validated['frequencies'][0]['type'] !== 'one_time';
            $event->update([
                'type' => $validated['type'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'] ?? null,
                'is_suitable_for_all_ages' => $validated['is_suitable_for_all_ages'],
                'is_recurring' => $isRecurring,
            ]);

            // Delete old dependent records
            $event->ageGroups()->delete();
            $event->prices()->delete();
            $event->frequencies()->delete();
            $event->dates()->delete();
            $event->media()->delete();
            $event->location()->delete();

            // 1️⃣ Location
            $locationData = $validated['location'] ?? [];
            if (isset($locationData['raw_place'])) {
                $locationData['raw_place'] = json_encode($locationData['raw_place']);
            }
            $locationData['event_id'] = $event->id;
            EventLocation::create($locationData);

            // 2️⃣ Media
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

            // 3️⃣ Age Groups + Prices
            $ageGroupModels = [];
            if (!empty($validated['age_groups'])) {
                foreach ($validated['age_groups'] as $i => $g) {
                    $ag = EventAgeGroup::create([
                        'event_id' => $event->id,
                        'label' => $g['label'],
                        'min_age' => (int) $g['min_age'],
                        'max_age' => (int) $g['max_age'],
                    ]);
                    $ageGroupModels[] = $ag;

                    if (in_array($validated['pricing_type'], ['age_based', 'mixed'])) {
                        EventPrice::create([
                            'event_id' => $event->id,
                            'event_age_group_id' => $ag->id,
                            'pricing_type' => $validated['pricing_type'],
                            'fixed_price_in_rm' => $g['fixed_price_in_rm'] ?? 0,
                            'weekday_price_in_rm' => $g['weekday_price_in_rm'] ?? 0,
                            'weekend_price_in_rm' => $g['weekend_price_in_rm'] ?? 0,
                        ]);
                    }
                }
            }

            // Fixed / Day Type prices
            if (in_array($validated['pricing_type'], ['fixed', 'day_type'])) {
                foreach ($validated['prices'] as $p) {
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

            // 4️⃣ Frequencies + Event Dates
            $frequencyModels = [];
            if (!empty($validated['frequencies'])) {
                foreach ($validated['frequencies'] as $freq) {
                    $frequency = EventFrequency::create([
                        'event_id' => $event->id,
                        'type' => $freq['type'],
                        'days_of_week' => $freq['days_of_week'] ?? null,
                        'selected_dates' => $freq['selected_dates'] ?? null,
                    ]);
                    $frequencyModels[] = $frequency;
                }
            }

            // Custom frequency handling
            if ($hasCustomFreq) {
                foreach ($frequencyModels as $freqModel) {
                    if ($freqModel->type !== 'custom') continue;

                    $selectedDates = $freqModel->selected_dates ?? [];
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
            } else {
                // Regular event dates
                foreach ($validated['event_dates'] as $date) {
                    $eventDate = EventDate::create([
                        'event_id' => $event->id,
                        'event_frequency_id' => $isRecurring ? ($frequencyModels[0]->id ?? null) : null,
                        'start_date' => $date['start_date'],
                        'end_date' => $date['end_date'],
                    ]);

                    foreach ($date['slots'] ?? [] as $slotPayload) {
                        $slotService->createSlotForDate($event, $eventDate, $date['start_date'], $slotPayload);
                    }

                    if ($isRecurring) {
                        $slotService->generateSlotsForEvent($event);
                    }
                }
            }

            DB::commit();

            return redirect()->route('merchant.events.index')
                ->with('success', 'Event updated successfully!');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Event update failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Event update failed: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function edit(Event $event)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        $event->load([
            'location',
            'ageGroups.prices',
            'prices',
            'frequencies',
            'dates.slots',
            'media',
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

        $frequencies = $event->frequencies->map(function ($freq) {
            return [
                'id' => $freq->id,
                'type' => $freq->type,
                'days_of_week' => $freq->days_of_week ?? [],
                'selected_dates' => $freq->selected_dates ?? [],
            ];
        })->toArray();

        $eventDates = $event->dates->map(function ($date) {
            return [
                'id' => $date->id,
                'event_frequency_id' => $date->event_frequency_id,
                'start_date' => $date->start_date,
                'end_date' => $date->end_date,
                'slots' => $date->slots->map(function ($slot) {
                    return [
                        'id' => $slot->id,
                        'start_time' => $slot->start_time,
                        'end_time' => $slot->end_time,
                        'capacity' => $slot->capacity,
                        'is_unlimited' => $slot->is_unlimited,
                    ];
                })->toArray(),
            ];
        })->toArray();

        // Media
        $media = $event->media->map(function ($m) {
            return [
                'id' => $m->id,
                'file_path' => $m->file_path,
                'file_type' => $m->file_type,
                'file_size' => $m->file_size,
            ];
        })->toArray();

        return Inertia::render('Events/Edit', [
            'event' => [
                'id' => $event->id,
                'merchant_id' => $event->merchant_id,
                'title' => $event->title,
                'description' => $event->description,
                'type' => $event->type,
                'category' => $event->category,
                'is_suitable_for_all_ages' => $event->is_suitable_for_all_ages,
                'status' => $event->status,
                'location' => $location,
                'age_groups' => $ageGroups,
                'frequencies' => $frequencies,
                'event_dates' => $eventDates,
                'media' => $media,
                'prices' => $prices, 
            ],
            'merchant_id' => $merchant->id,
            'userRole' => $user->role ?? 'merchant',
        ]);
    }

    public function updateStatus(Request $request, Event $event)
    {
        $user = Auth::user();
        Log::info('updateStatus called', [
        'user_id' => $user->id,
        'user_role' => $user->role,
        'event_id' => $event->id,
        'current_status' => $event->status,
        'request' => $request->all()
    ]);

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
                    Log::info('Processing slot price', ['slot' => $slot->toArray(), 'submitted' => $sp]);

                    $recommended = app(ConversionService::class)->calculateCredits($slot->price_in_rm, $conversion);

                    if ($sp['paid_credits'] < $recommended['paid_credits']) {
                        throw new \Exception("Paid credits for slot #{$sp['id']} cannot be lower than minimum ({$recommended['paid_credits']}) to prevent loss.");
                    }

                    EventSlotPrice::where('id', $sp['id'])->update([
                        'paid_credits' => $sp['paid_credits'],
                        'free_credits' => $sp['free_credits'] ?? $recommended['free_credits'],
                    ]);

                    $updatedSlot = EventSlotPrice::find($sp['id']);
                    Log::info('Slot price updated', ['slot' => $updatedSlot->toArray()]);
                }
            }

            if ($event->merchant) {
                $event->merchant?->notify(new EventStatusNotification($event, $validated['status']));
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