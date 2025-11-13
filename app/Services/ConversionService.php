<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Conversion;
use Carbon\Carbon;

class ConversionService
{
    /**Get the latest valid conversion rate.*/
    public function getActiveRate(): ?float
    {
        $now = Carbon::now();

        $conversion = Conversion::where('status', 'active')
            ->where('effective_from', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('valid_until')
                      ->orWhere('valid_until', '>=', $now);
            })
            ->orderByDesc('effective_from')
            ->first();

        return $conversion?->conversion_rate;
    }

    public function convertToCredits(int $priceInCents): int
    {
        $rate = $this->getActiveRate();

        if (!$rate) {
            throw new \Exception('No active conversion rate found.');
        }

        return (int) floor(($priceInCents / 100) * $rate);
    }

    public function convertEventSlots(Event $event): void
    {
        foreach ($event->slots as $slot) {
            if ($slot->price_in_cents !== null) {
                $slot->price_in_credits = $this->convertToCredits($slot->price_in_cents);
                $slot->save();
            }
        }
    }
}
