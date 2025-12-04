<?php

namespace App\Services;

use App\Models\EventSlot;

class SlotAvailabilityService
{
    public function isAvailable(EventSlot $slot, int $quantity = 1): bool
    {
        if ($slot->is_unlimited) {
            return true;
        }

        // Sum up quantities of all non-cancelled bookings
        $bookedQuantity = $slot->bookings()
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->sum('quantity');

        $availableCapacity = $slot->capacity - $bookedQuantity;

        return $availableCapacity >= $quantity;
    }

    public function availableCapacity(EventSlot $slot): int
    {
        if ($slot->is_unlimited) {
            return PHP_INT_MAX;
        }

        $bookedQuantity = $slot->bookings()
            ->where('status', '!=', 'cancelled')
            ->sum('quantity');

        return $slot->capacity - $bookedQuantity;
    }  
}
