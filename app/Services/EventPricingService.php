<?php

namespace App\Services;

use App\Models\Event;
use App\Models\EventAgeGroup;

class EventPricingService
{
    public function resolvePrice(Event $event, bool $isWeekend, ?EventAgeGroup $ageGroup = null): float
    {
        $price = $event->prices()
            ->when($ageGroup, fn($q) => $q->where('event_age_group_id', $ageGroup->id))
            ->first();

        if (!$price) return 0;

        return match($price->pricing_type) {
            'fixed' => $price->fixed_price_in_rm ?? 0,
            'day_type' => $isWeekend ? $price->weekend_price_in_rm : $price->weekday_price_in_rm,
            'age_based' => $price->fixed_price_in_rm ?? 0,
            'mixed' => $isWeekend ? $price->weekend_price_in_rm : $price->weekday_price_in_rm,
            default => 0,
        };
    }
}
