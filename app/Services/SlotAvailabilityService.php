<?php

namespace App\Services;

use App\Models\EventSlot;

class SlotAvailabilityService
{
    public function isAvailable(EventSlot $slot, int $quantity = 1): bool
    {
        if ($slot->is_unlimited) return true;
        return ($slot->capacity - $slot->bookings()->count()) >= $quantity;
    }
}
