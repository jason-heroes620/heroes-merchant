<?php

namespace App\Services;

use App\Models\Event;
use App\Models\EventFrequency;
use App\Models\EventDate;
use App\Models\EventSlot;
use App\Models\EventSlotPrice;
use App\Models\EventAgeGroup;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EventSlotService
{
    /**
     * Generate all slots for an event.
     */
    public function generateSlotsForEvent(Event $event): void
    {
        // 1️⃣ Recurring events: generate slots per frequency
        foreach ($event->frequencies as $frequency) {
            $this->generateSlotsForFrequency($event, $frequency);
        }

        // 2️⃣ One-time events: generate slots from event_dates not linked to any frequency
        foreach ($event->dates()->whereNull('event_frequency_id')->get() as $eventDate) {
            $this->generateSlotsForDate($event, $eventDate);
        }
    }

    /**
     * Generate slots for a single frequency.
     */
    public function generateSlotsForFrequency(Event $event, EventFrequency $frequency): void
    {
        DB::transaction(function () use ($event, $frequency) {

            Log::info('🔍 Generating slots for frequency', [
                'frequency_id' => $frequency->id,
                'type' => $frequency->type,
            ]);

            $eventDates = $frequency->dates()->with('slots')->get();

            foreach ($eventDates as $eventDate) {

                Log::info('📅 Processing EventDate', [
                    'event_date_id' => $eventDate->id,
                    'start_date' => $eventDate->start_date,
                    'end_date' => $eventDate->end_date
                ]);

                $templateSlots = $eventDate->slots->toArray();

                $dates = $frequency->generateDates($eventDate);

                Log::info('🗓 Generated Dates', [
                    'event_date_id' => $eventDate->id,
                    'dates' => $dates
                ]);

                foreach ($dates as $dateStr) {

                    if (EventSlot::where('event_date_id', $eventDate->id)->where('date', $dateStr)->exists()) {
                        Log::info('⏭️ Skipping slot creation because it already exists', [
                            'event_date_id' => $eventDate->id,
                            'date' => $dateStr,
                        ]);
                        continue;
                    }

                    Log::info('➡️ Creating slots for date', [
                        'date' => $dateStr,
                        'using_event_date_id' => $eventDate->id,
                    ]);

                    if (count($templateSlots)) {
                        foreach ($templateSlots as $slotTemplate) {
                            $this->createSlotForDate($event, $eventDate, $dateStr, $slotTemplate);
                        }
                    } else {
                        $this->createSlotForDate($event, $eventDate, $dateStr);
                    }
                }
            }
        });
    }

    public function generateSlotsForEventDate(Event $event, EventDate $eventDate, string $date, array $slots = [])
    {
        if (empty($slots)) {
            Log::warning("No slots provided for custom date $date of event {$event->id}");
            return;
        }

        foreach ($slots as $slotPayload) {
            $this->createSlotForDate($event, $eventDate, $date, $slotPayload);
        }
    }

    /**
     * Generate slots for a one-time event_date.
     */
    public function generateSlotsForDate(Event $event, EventDate $eventDate): void
    {
        DB::transaction(function () use ($event, $eventDate) {
            $start = Carbon::parse($eventDate->start_date);
            $end = Carbon::parse($eventDate->end_date);

            foreach (CarbonPeriod::create($start, $end) as $date) {
                $this->createSlotForDate($event, $eventDate, $date->toDateString());
            }
        });
    }

    /**
     * Create a slot row and price rows for a single date.
     */
    public function createSlotForDate(Event $event, EventDate $eventDate, string $dateStr, array $slotTemplate = []): void
    {
        $isWeekend = in_array(Carbon::parse($dateStr)->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);

        $startTime   = isset($slotTemplate['start_time']) ? date('H:i:s', strtotime($slotTemplate['start_time'])) : null;
        $endTime     = isset($slotTemplate['end_time']) ? date('H:i:s', strtotime($slotTemplate['end_time'])) : null;
        $capacity    = isset($slotTemplate['capacity']) ? (int)$slotTemplate['capacity'] : null;
        $isUnlimited = isset($slotTemplate['is_unlimited']) ? (bool)$slotTemplate['is_unlimited'] : false;

        $duration = null;
        if ($startTime && $endTime) {
            $startDT = Carbon::createFromFormat('H:i:s', $startTime);
            $endDT   = Carbon::createFromFormat('H:i:s', $endTime);

            $duration = $startDT->diffInMinutes($endDT);

            // Overnight (e.g. 23:00 → 01:00)
            if ($duration < 0) {
                $duration = (24 * 60) + $duration;
            }
        }

        $slot = EventSlot::create([
            'event_id'      => $event->id,
            'event_date_id' => $eventDate->id,
            'date'          => $event->is_recurring ? $dateStr : null,
            'start_time'    => $startTime,
            'end_time'      => $endTime,
            'duration'      => $duration,
            'capacity'      => $capacity,
            'is_unlimited'  => $isUnlimited,
        ]);

        $this->createSlotPrices($event, $slot, $isWeekend);
    }

    /**
     * Create EventSlotPrice rows for a slot based on pricing type.
     */
    protected function createSlotPrices(Event $event, EventSlot $slot, bool $isWeekend): void
    {
        $pricingType = $event->prices()->first()?->pricing_type ?? 'fixed';
        $ageGroups = $event->ageGroups;

        if (in_array($pricingType, ['age_based', 'mixed']) && $ageGroups->count()) {
            // Only create the relevant price per slot based on day type
            foreach ($ageGroups as $ageGroup) {
                $priceRow = $event->prices()
                    ->where('event_age_group_id', $ageGroup->id)
                    ->first();

                if (!$priceRow) continue;

                $price = match($pricingType) {
                    'age_based' => $priceRow->fixed_price_in_rm ?? 0,
                    'mixed' => $isWeekend
                        ? ($priceRow->weekend_price_in_rm ?? $priceRow->fixed_price_in_rm ?? 0)
                        : ($priceRow->weekday_price_in_rm ?? $priceRow->fixed_price_in_rm ?? 0),
                    default => 0,
                };

                EventSlotPrice::create([
                    'event_slot_id' => $slot->id,
                    'event_age_group_id' => $ageGroup->id,
                    'price_in_rm' => $price,
                ]);
            }
        } else {
            // Fixed or day_type pricing without age groups
            $price = $this->resolvePrice($event, $isWeekend, null);
            EventSlotPrice::create([
                'event_slot_id' => $slot->id,
                'event_age_group_id' => null,
                'price_in_rm' => $price,
            ]);
        }
    }

    /**
     * Resolve price for a slot (based on pricing type, weekend, and optional ageGroup)
     */
    protected function resolvePrice(Event $event, bool $isWeekend, ?EventAgeGroup $ageGroup = null): ?float
    {
        $priceQuery = $event->prices();
        $priceQuery = $ageGroup ? $priceQuery->where('event_age_group_id', $ageGroup->id) : $priceQuery->whereNull('event_age_group_id');

        $price = $priceQuery->first();
        if (!$price) return null;

        return match($price->pricing_type) {
            'fixed', 'age_based' => $price->fixed_price_in_rm !== null ? (float)$price->fixed_price_in_rm : null,
            'day_type', 'mixed' => $isWeekend ? ($price->weekend_price_in_rm !== null ? (float)$price->weekend_price_in_rm : null) : ($price->weekday_price_in_rm !== null ? (float)$price->weekday_price_in_rm : null),
            default => null,
        };
    }
}