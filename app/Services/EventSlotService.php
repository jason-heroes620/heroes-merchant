<?php

namespace App\Services;

use App\Models\Event;
use App\Models\EventSlot;
use App\Models\EventPrice;
use App\Models\EventFrequency;
use App\Models\EventAgeGroup;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class EventSlotService
{
    protected ConversionService $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    /**
     * Generate slots for a given event and frequency.
     */
    public function generateSlots(Event $event, EventFrequency $frequency, array $data = []): void
    {
        DB::transaction(function () use ($event, $frequency, $data) {
            // Cleanup old slots for that frequency
            $frequency->slots()->delete();

            // Generate dates based on frequency type
            $dates = $this->generateDatesFromFrequency($frequency);

            if (empty($dates)) {
                return; 
            }

            $isWeekendMap = [];

            foreach ($dates as $date) {
                $carbonDate = Carbon::parse($date);
                $isWeekend = in_array($carbonDate->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);
                $slotType = $isWeekend ? 'weekend' : 'weekday';

                $isWeekendMap[$date] = $isWeekend;

                $startTime = isset($data['start_time']) ? date('H:i:s', strtotime($data['start_time'])) : null;
                $endTime = isset($data['end_time']) ? date('H:i:s', strtotime($data['end_time'])) : null;
                $duration = abs(Carbon::parse($endTime)->diffInMinutes(Carbon::parse($startTime)));

                // 4️⃣ Handle pricing type
                $pricingType = $event->prices()->first()?->pricing_type ?? 'fixed';

                $ageGroups = $event->ageGroups()->get();
                
                if (in_array($pricingType, ['age_based', 'mixed']) && $ageGroups->count() > 0) {
                    foreach ($ageGroups as $ageGroup) {
                        $priceInCents = $this->resolvePrice($event, $date, $ageGroup);

                        EventSlot::create([
                            'event_id' => $event->id,
                            'frequency_id' => $frequency->id,
                            'date' => $date,
                            'is_all_day' => $this->extractBool($data, 'is_all_day', false),
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'duration' => $duration,
                            'capacity' => $data['capacity'] ?? null,
                            'is_unlimited' => $this->extractBool($data, 'is_unlimited', false),
                            'booked' => 0,
                            'slot_type' => $slotType,
                            'price_in_cents' => $priceInCents,
                            'price_in_credits' => $data['price_in_credits'] ?? null,
                        ]);
                    }
                } else {
                    // Single slot for fixed/day_type
                    $priceInCents = $this->resolvePrice($event, $date);

                    EventSlot::create([
                        'event_id' => $event->id,
                        'frequency_id' => $frequency->id,
                        'date' => $date,
                        'is_all_day' => $this->extractBool($data, 'is_all_day', false),
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'duration' => $duration,
                        'capacity' => $data['capacity'] ?? null,
                        'is_unlimited' => $this->extractBool($data, 'is_unlimited', false),
                        'booked' => 0,
                        'slot_type' => $slotType,
                        'price_in_cents' => $priceInCents,
                        'price_in_credits' => $data['price_in_credits'] ?? null,
                    ]);
                }
            }
        });
    }

    /**
     * Generate slots for a given event and frequency.
     */
    protected function generateDatesFromFrequency(EventFrequency $frequency): array
    {
        $type = $frequency->type;
        $start = $frequency->start_date ? Carbon::parse($frequency->start_date) : null;
        $end = $frequency->end_date ? Carbon::parse($frequency->end_date) : $start;

        if (!$start) {
            return [];
        }

        switch ($type) {
            case 'one_time':
                return [$start->toDateString()];

            case 'daily':
                return collect(CarbonPeriod::create($start, '1 day', $end))
                    ->map(fn($d) => $d->toDateString())
                    ->toArray();

            case 'weekly':
                return collect(CarbonPeriod::create($start, '1 week', $end))
                    ->map(fn($d) => $d->toDateString())
                    ->toArray();

            case 'biweekly':
                return collect(CarbonPeriod::create($start, '2 weeks', $end))
                    ->map(fn($d) => $d->toDateString())
                    ->toArray();

            case 'monthly':
                return collect(CarbonPeriod::create($start, '1 month', $end))
                    ->map(fn($d) => $d->toDateString())
                    ->toArray();

            case 'annually':
                return collect(CarbonPeriod::create($start, '1 year', $end))
                    ->map(fn($d) => $d->toDateString())
                    ->toArray();

            case 'custom':
                return is_array($frequency->selected_dates)
                    ? array_map(fn($d) => Carbon::parse($d)->toDateString(), $frequency->selected_dates)
                    : [];

            default:
                return [$start->toDateString()];
        }
    }

    /**
     * Resolve the correct price for the event based on pricing_type.
     */
    protected function resolvePrice(Event $event, bool $isWeekend): int
    {
        $price = $event->prices()->first();

        if (!$price) {
            return 0;
        }

        switch ($price->pricing_type) {
            case 'fixed':
                return $price->fixed_price_in_cents ?? 0;

            case 'day_type':
                return $isWeekend
                    ? ($price->weekend_price_in_cents ?? 0)
                    : ($price->weekday_price_in_cents ?? 0);

            case 'age_based':
                if ($ageGroup) {
                    $groupPrice = $event->prices()->where('event_age_group_id', $ageGroup->id)->first();
                    return $groupPrice->fixed_price_in_cents ?? 0;
                }
                return 0;

            case 'mixed':
                if ($ageGroup) {
                    $groupPrice = $event->prices()->where('event_age_group_id', $ageGroup->id)->first();
                    return $isWeekend
                        ? ($groupPrice->weekend_price_in_cents ?? 0)
                        : ($groupPrice->weekday_price_in_cents ?? 0);
                }
                return $isWeekend
                    ? ($price->weekend_price_in_cents ?? 0)
                    : ($price->weekday_price_in_cents ?? 0);

            default:
                return 0;
        }
    }

     /**
     * Safely extract a boolean value, respecting explicit false/null values.
     */
    protected function extractBool(array $data, string $key, bool $default = false): bool
    {
        if (array_key_exists($key, $data)) {
            return (bool) $data[$key];
        }
        return $default;
    }
}