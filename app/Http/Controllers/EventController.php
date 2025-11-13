<?php

namespace App\Http\Controllers;

use App\Models\{
    Merchant,
    Admin,
    Event,
    EventMedia,
    EventPrice,
    EventAgeGroup,
    EventFrequency,
    EventLocation
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
    protected ConversionService $conversionService;

    public function __construct(EventSlotService $slotService, ConversionService $conversionService)
    {
        $this->slotService = $slotService;
        $this->conversionService = $conversionService;
    }

    /** Display a listing of events */
    public function index()
    {
        $user = Auth::user();

        $query = Event::with(['location', 'ageGroups', 'prices', 'frequencies', 'slots', 'media'])
            ->orderByDesc('created_at');

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();
            $query->where('merchant_id', $merchant->id);
        }

        $events = $query->paginate(15);

        $events->getCollection()->transform(function ($event) {
            $event->media->transform(function ($media) {
                $media->file_path = $media->url; 
                return $media;
            });
            return $event;
        });

        return Inertia::render('Events/Index', [
            'events' => $events,
            'role' => $user->role,
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

        $event->load(['location', 'ageGroups', 'prices', 'frequencies', 'slots', 'media']);

        $event->media->transform(function ($media) {
            $media->file_path = $media->url;
            return $media;
        });

        return Inertia::render('Events/Show', [
            'event' => $event,
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

    /** Store a newly created event */
    public function store(Request $request, EventSlotService $slotService)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        Log::info('🧾 Raw Request Data:', $request->all());

        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|max:100',
            'category' => 'nullable|string|max:100',
            'default_capacity' => 'nullable|integer|min:1',
            'is_unlimited_capacity' => 'boolean',
            'is_suitable_for_all_ages' => 'boolean',
            'is_recurring' => 'boolean',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'location' => 'required|array',
            'location.location_name' => 'required|string|max:255',
            'location.latitude' => 'nullable|numeric',
            'location.longitude' => 'nullable|numeric',
            'location.how_to_get_there' => 'nullable|string',

            'age_groups' => 'nullable|array',
            'age_groups.*.id' => 'nullable|uuid',
            'age_groups.*.label' => 'nullable|string|max:50',
            'age_groups.*.min_age' => 'nullable|integer|min:0',
            'age_groups.*.max_age' => 'nullable|integer|min:0',
            'age_groups.*.fixed_price_in_cents' => 'nullable|integer|min:0',
            'age_groups.*.weekday_price_in_cents' => 'nullable|integer|min:0',
            'age_groups.*.weekend_price_in_cents' => 'nullable|integer|min:0',

            'prices' => 'nullable|array',
            'prices.*.id' => 'nullable|uuid',
            'prices.*.age_group_label' => 'nullable|string|max:50',
            'prices.*.pricing_type' => 'required|string',
            'prices.*.fixed_price_in_cents' => 'nullable|integer|min:0',
            'prices.*.weekday_price_in_cents' => 'nullable|integer|min:0',
            'prices.*.weekend_price_in_cents' => 'nullable|integer|min:0',

            'frequencies' => 'nullable|array',
            'frequencies.*.id' => 'nullable|uuid',
            'frequencies.*.type' => 'required|string|in:one_time,daily,weekly,biweekly,monthly,annually,custom',
            'frequencies.*.start_date' => 'required_if:frequencies.*.type,!=,one_time|date',
            'frequencies.*.end_date' => 'nullable|date|after_or_equal:frequencies.*.start_date',
            'frequencies.*.start_time' => 'nullable|string',
            'frequencies.*.end_time' => 'nullable|string',
            'frequencies.*.capacity' => 'nullable|integer|min:1',
            'frequencies.*.days_of_week' => 'nullable|array',
            'frequencies.*.selected_dates' => 'nullable|array',

            'media' => 'nullable|array',
            'media.*' => 'file|mimes:jpeg,jpg,png,gif,mp4,mov|max:10240',
        ]);

        DB::beginTransaction();

        try {
            // 1️⃣ Create Event
            $event = Event::create([
                'id' => Str::uuid(),
                'merchant_id' => $merchant->id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'category' => $validated['category'] ?? null,
                'default_capacity' => $validated['is_unlimited_capacity'] ? null : ($validated['default_capacity'] ?? null),
                'is_unlimited_capacity' => $validated['is_unlimited_capacity'] ?? false,
                'is_suitable_for_all_ages' => $validated['is_suitable_for_all_ages'] ?? false,
                'status' => 'pending',
            ]);

            // 2️⃣ Location
            $event->location()->create($validated['location']);

            // 3️⃣ Sync Age Groups
            $submittedAgeGroupIds = [];
            $ageGroupsMap = [];
            foreach ($validated['age_groups'] ?? [] as $group) {
                $ag = $event->ageGroups()->create([
                    'label' => $group['label'],
                    'min_age' => $group['min_age'] ?? null,
                    'max_age' => $group['max_age'] ?? null,
                ]);
                $ageGroupsMap[$group['label']] = $ag->id;
            }

            // 4️⃣ Prices
            foreach ($validated['prices'] ?? [] as $price) {
                $ageGroupId = isset($price['age_group_label'])
                    ? ($ageGroupsMap[$price['age_group_label']] ?? null)
                    : null;

                if ($price['pricing_type'] === 'mixed' && $ageGroupId) {
                    $ageGroupData = collect($validated['age_groups'])
                        ->first(fn($ag) => ($ag['label'] ?? null) === $price['age_group_label']);

                    $weekday = $ageGroupData['weekday_price_in_cents'] ?? 0;
                    $weekend = $ageGroupData['weekend_price_in_cents'] ?? 0;
                } else {
                    $weekday = $price['weekday_price_in_cents'] ?? 0;
                    $weekend = $price['weekend_price_in_cents'] ?? 0;
                }

                if (!empty($price['id'])) {
                    $p = $event->prices()->find($price['id']);
                    if ($p) {
                        $p->update([
                            'event_age_group_id' => $ageGroupId,
                            'pricing_type' => $price['pricing_type'],
                            'fixed_price_in_cents' => $price['fixed_price_in_cents'] ?? 0,
                            'weekday_price_in_cents' => $weekday,
                            'weekend_price_in_cents' => $weekend,
                        ]);
                    }
                } else {
                    $p = $event->prices()->create([
                        'event_age_group_id' => $ageGroupId,
                        'pricing_type' => $price['pricing_type'],
                        'fixed_price_in_cents' => $price['fixed_price_in_cents'] ?? 0,
                        'weekday_price_in_cents' => $weekday,
                        'weekend_price_in_cents' => $weekend,
                    ]);
                }
                $submittedPriceIds[] = $p->id;
            }

            // 4️⃣ Frequencies & Slots
            $frequencies = [];

            if (!empty($validated['is_recurring']) && $validated['is_recurring'] === true) {
                // Recurring event
                $frequencies = $validated['frequencies'] ?? [];
            } else {
                // One-time event
                $frequencies[] = [
                    'type' => 'one_time',
                    'start_date' => $validated['start_date'] ?? now()->toDateString(),
                    'end_date' => null,
                    'days_of_week' => null,
                    'selected_dates' => null,
                    'is_all_day' => $validated['is_all_day'] ?? false,
                    'start_time' => $validated['start_time'] ?? null,
                    'end_time' => $validated['end_time'] ?? null,
                    'capacity' => $validated['default_capacity'] ?? null,
                    'is_unlimited_capacity' => $validated['is_unlimited_capacity'] ?? false,
                ];
            }

            $submittedFreqIds = [];

            foreach ($frequencies as $freqData) {

                // Ensure start_time/end_time exist for recurring events
                $freqData['start_time'] = $freqData['start_time'] ?? $validated['start_time'] ?? null;
                $freqData['end_time'] = $freqData['end_time'] ?? $validated['end_time'] ?? null;
                $freqData['is_all_day'] = $freqData['is_all_day'] ?? false;
                $freqData['capacity'] = $freqData['capacity'] ?? $validated['default_capacity'] ?? null;
                $freqData['is_unlimited_capacity'] = $freqData['is_unlimited_capacity'] ?? false;

                // 1️⃣ Create or update frequency
                if (!empty($freqData['id'])) {
                    $frequency = $event->frequencies()->find($freqData['id']);
                    if ($frequency) {
                        $frequency->update($freqData);
                    }
                } else {
                    $frequency = $event->frequencies()->create($freqData);
                }

                $submittedFreqIds[] = $frequency->id;

                // 2️⃣ Generate slots
                $slotService->generateSlots($event, $frequency, [
                    'is_all_day' => $freqData['is_all_day'],
                    'start_time' => $freqData['start_time'],
                    'end_time' => $freqData['end_time'],
                    'capacity' => $freqData['capacity'],
                    'is_unlimited' => $freqData['is_unlimited_capacity'],
                ]);
            }

            // 3️⃣ Remove frequencies that were deleted in the request
            $event->frequencies()->whereNotIn('id', $submittedFreqIds)->delete();

            // 6️⃣ Media
            if ($request->hasFile('media')) {
                foreach ($request->file('media') as $file) {
                    $filename = Str::uuid() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('event_media', $filename, 'public');
                    $event->media()->create([
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            Log::info('Creating Event:', ['event' => $event]);
            Log::info('Final created relationships:', [
                'frequencies' => $event->frequencies()->count(),
                'prices' => $event->prices()->count(),
                'slots' => $event->slots()->count(),
            ]);

            DB::commit();
            return redirect()->route('merchant.events.index')->with('success', 'Event created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event creation failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Event creation failed: ' . $e->getMessage()])->withInput();
        }
    } 

    public function update(Request $request, EventSlotService $slotService, $id)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        $event = Event::with(['location', 'ageGroups', 'prices', 'frequencies'])
            ->where('merchant_id', $merchant->id)
            ->findOrFail($id);

        Log::info('🧾 Raw Request Data:', $request->all());

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|max:100',
            'category' => 'nullable|string|max:100',
            'default_capacity' => 'nullable|integer|min:1',
            'is_unlimited_capacity' => 'boolean',
            'is_suitable_for_all_ages' => 'boolean',
            'is_recurring' => 'boolean',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'location' => 'required|array',
            'location.location_name' => 'required|string|max:255',

            'age_groups' => 'nullable|array',
            'age_groups.*.id' => 'nullable|uuid',
            'age_groups.*.label' => 'nullable|string|max:50',
            'age_groups.*.min_age' => 'nullable|integer|min:0',
            'age_groups.*.max_age' => 'nullable|integer|min:0',
            'age_groups.*.fixed_price_in_cents' => 'nullable|integer|min:0', 
            'age_groups.*.weekday_price_in_cents' => 'nullable|integer|min:0', 
            'age_groups.*.weekend_price_in_cents' => 'nullable|integer|min:0',

            'prices' => 'nullable|array',
            'prices.*.id' => 'nullable|uuid',
            'prices.*.age_group_label' => 'nullable|string|max:50',
            'prices.*.pricing_type' => 'required|string',
            'prices.*.fixed_price_in_cents' => 'nullable|integer|min:0',
            'prices.*.weekday_price_in_cents' => 'nullable|integer|min:0',
            'prices.*.weekend_price_in_cents' => 'nullable|integer|min:0',

            'frequencies' => 'nullable|array',
            'frequencies.*.id' => 'nullable|uuid',
            'frequencies.*.type' => 'required|string|in:one_time,daily,weekly,biweekly,monthly,annually,custom',
            'frequencies.*.start_date' => 'required|date',
            'frequencies.*.end_date' => 'nullable|date',
            'frequencies.*.start_time' => 'nullable|string',
            'frequencies.*.end_time' => 'nullable|string',
            'frequencies.*.capacity' => 'nullable|integer|min:1',
            'frequencies.*.days_of_week' => 'nullable|array',
            'frequencies.*.selected_dates' => 'nullable|array',
        ]);

        Log::info('Validated Event Payload:', $validated);

        DB::beginTransaction();

        try {
            // 1️⃣ Update main event
            $event->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'category' => $validated['category'] ?? null,
                'default_capacity' => $validated['is_unlimited_capacity'] ? null : ($validated['default_capacity'] ?? null),
                'is_unlimited_capacity' => $validated['is_unlimited_capacity'] ?? false,
                'is_suitable_for_all_ages' => $validated['is_suitable_for_all_ages'] ?? false,
            ]);

            // 2️⃣ Update location
            $event->location()->updateOrCreate(
                ['id' => $event->location?->id],
                $validated['location']
            );

            // 3️⃣ Sync Age Groups
            $submittedAgeGroupIds = [];
            $ageGroupsMap = [];

            foreach ($validated['age_groups'] ?? [] as $group) {
                if (!empty($group['id'])) {
                    $ag = $event->ageGroups()->find($group['id']);
                    if ($ag) {
                        $ag->update([
                            'label' => $group['label'],
                            'min_age' => $group['min_age'] ?? null,
                            'max_age' => $group['max_age'] ?? null,
                        ]);
                    }
                } else {
                    $ag = $event->ageGroups()->create([
                        'label' => $group['label'],
                        'min_age' => $group['min_age'] ?? null,
                        'max_age' => $group['max_age'] ?? null,
                    ]);
                }
                $submittedAgeGroupIds[] = $ag->id;
                $ageGroupsMap[$group['label']] = $ag->id;
            }

            $event->ageGroups()->whereNotIn('id', $submittedAgeGroupIds)->delete();

            // 4️⃣ Sync Prices
            $submittedPriceIds = [];

            foreach ($validated['prices'] ?? [] as $price) {
                $ageGroupId = isset($price['age_group_label'])
                    ? ($ageGroupsMap[$price['age_group_label']] ?? null)
                    : null;

                if ($price['pricing_type'] === 'mixed' && $ageGroupId) {
                    $ageGroupData = collect($validated['age_groups'])
                        ->first(fn($ag) => ($ag['label'] ?? null) === $price['age_group_label']);

                    $weekday = $ageGroupData['weekday_price_in_cents'] ?? 0;
                    $weekend = $ageGroupData['weekend_price_in_cents'] ?? 0;
                } else {
                    $weekday = $price['weekday_price_in_cents'] ?? 0;
                    $weekend = $price['weekend_price_in_cents'] ?? 0;
                }

                if (!empty($price['id'])) {
                    $p = $event->prices()->find($price['id']);
                    if ($p) {
                        $p->update([
                            'event_age_group_id' => $ageGroupId,
                            'pricing_type' => $price['pricing_type'],
                            'fixed_price_in_cents' => $price['fixed_price_in_cents'] ?? 0,
                            'weekday_price_in_cents' => $weekday,
                            'weekend_price_in_cents' => $weekend,
                        ]);
                    }
                } else {
                    $p = $event->prices()->create([
                        'event_age_group_id' => $ageGroupId,
                        'pricing_type' => $price['pricing_type'],
                        'fixed_price_in_cents' => $price['fixed_price_in_cents'] ?? 0,
                        'weekday_price_in_cents' => $weekday,
                        'weekend_price_in_cents' => $weekend,
                    ]);
                }
                $submittedPriceIds[] = $p->id;
            }

            $event->prices()->whereNotIn('id', $submittedPriceIds)->delete();

            // 5️⃣ Frequencies & Slots
            $frequencies = [];

            if (!empty($validated['is_recurring']) && $validated['is_recurring'] === true) {
                $frequencies = $validated['frequencies'] ?? [];
            } else {
                $frequencies[] = [
                    'type' => 'one_time',
                    'start_date' => $validated['start_date'] ?? now()->toDateString(),
                    'days_of_week' => null,
                    'selected_dates' => null,
                    'is_all_day' => $validated['is_all_day'] ?? false,
                    'start_time' => $validated['start_time'] ?? null,
                    'end_time' => $validated['end_time'] ?? null,
                    'capacity' => $validated['default_capacity'] ?? null,
                    'is_unlimited_capacity' => $validated['is_unlimited_capacity'] ?? false,
                ];
            }

            $submittedFreqIds = [];

            foreach ($frequencies as $freqData) {

                // Ensure start_time/end_time exist for recurring events
                $freqData['start_time'] = $freqData['start_time'] ?? $validated['start_time'] ?? null;
                $freqData['end_time'] = $freqData['end_time'] ?? $validated['end_time'] ?? null;
                $freqData['is_all_day'] = $freqData['is_all_day'] ?? false;
                $freqData['capacity'] = $freqData['capacity'] ?? $validated['default_capacity'] ?? null;
                $freqData['is_unlimited_capacity'] = $freqData['is_unlimited_capacity'] ?? false;

                // 1️⃣ Create or update frequency
                if (!empty($freqData['id'])) {
                    $frequency = $event->frequencies()->find($freqData['id']);
                    if ($frequency) {
                        $frequency->update($freqData);
                    }
                } else {
                    $frequency = $event->frequencies()->create($freqData);
                }

                $submittedFreqIds[] = $frequency->id;

                // 2️⃣ Generate slots
                $slotService->generateSlots($event, $frequency, [
                    'is_all_day' => $freqData['is_all_day'],
                    'start_time' => $freqData['start_time'],
                    'end_time' => $freqData['end_time'],
                    'capacity' => $freqData['capacity'],
                    'is_unlimited' => $freqData['is_unlimited_capacity'],
                ]);
            }

            // 3️⃣ Remove frequencies that were deleted in the request
            $event->frequencies()->whereNotIn('id', $submittedFreqIds)->delete();

            DB::commit();

            return redirect()->route('merchant.events.index')->with('success', "Event status updated successfully");
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Event status update failed', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return redirect()->back()->withErrors([
                    'error' => 'Event status update failed: ' . $e->getMessage()
                ]);
            }
    }

    public function edit(Event $event)
    {
        $user = Auth::user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        $event->load([
            'location',
            'ageGroups.prices',
            'frequencies.slots',
            'media',
        ]);

        $eventData = [
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'type' => $event->type,
            'category' => $event->category,
            'default_capacity' => $event->default_capacity,
            'is_unlimited_capacity' => $event->is_unlimited_capacity,
            'is_suitable_for_all_ages' => $event->is_suitable_for_all_ages,
            'status' => $event->status,
            'location' => $event->location ? $event->location->toArray() : [
                'place_id' => null,
                'location_name' => '',
                'latitude' => null,
                'longitude' => null,
                'viewport' => null,
                'raw_place' => null,
                'how_to_get_there' => '',
            ],
            'age_groups' => $event->ageGroups->map(fn($group) => [
            ...$group->toArray(),
            'prices' => $group->prices->map(fn($price) => $price->toArray())->toArray(),
            ])->toArray(),
            'frequencies' => $event->frequencies->map(fn($freq) => [
                ...$freq->toArray(),
                'slots' => $freq->slots->map(fn($slot) => $slot->toArray())->toArray(),
            ])->toArray(),
            'media' => $event->media->map(fn($m) => $m->toArray())->toArray(),
        ];

        Log::info('Editing Event:', ['event' => $event]);
        

        return Inertia::render('Events/Edit', [
            'event' => $eventData,
            'merchant_id' => $merchant->id,
            'userRole' => $user->role ?? 'merchant',
        ]);
    }

    public function updateStatus(Request $request, Event $event)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'status' => 'required|in:draft,pending,active,inactive,rejected',
            'rejected_reason' => 'nullable|string',
        ]);

        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();
            if ($event->merchant_id !== $merchant->id) {
                abort(403, 'Unauthorized action.');
            }

            if ($validated['status'] !== 'pending' && !($event->status === 'active' && $validated['status'] === 'inactive')) {
                abort(403, 'Merchants cannot change this status.');
            }
        } elseif ($user->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        DB::beginTransaction();
        try {
            $event->update([
                'status' => $validated['status'],
                'rejected_reason' => $validated['rejected_reason'] ?? null,
            ]);

            if ($validated['status'] === 'active') {
                $this->conversionService->convertEventSlots($event);
            }

            if ($event->merchant) {
                $event->merchant?->notify(new EventStatusNotification($event, $validated['status']));
            }

            DB::commit();

            return redirect()->back()->with('success', "Event status updated to '{$validated['status']}'");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event status update failed', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors([
                'error' => 'Event status update failed: ' . $e->getMessage()
            ]);
        }
    }

    /** Soft deactivate */
    public function deactivate(Event $event)
    {
        if ($user->role === 'merchant') {
            $merchant = Merchant::where('user_id', $user->id)->firstOrFail();
            $query->where('merchant_id', $merchant->id);
        }

        $event->update(['status' => 'inactive']);

        return redirect()->route('events.index')->with('success', 'Event deactivated successfully!');
    }
}