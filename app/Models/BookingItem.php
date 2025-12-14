<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\EventSlotPrice;

class BookingItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'age_group_id',
        'quantity',
        'quantity_attended',
        'free_credits',
        'paid_credits',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class, 'age_group_id');
    }

    public function creditTotals(): array
    {
        return [
            'paid' => (int) ($this->paid_credits ?? 0),
            'free' => (int) ($this->free_credits ?? 0),
        ];
    }

    public function toMerchantMeta(): array
    {
        return [
            'age_group' => $this->ageGroup?->label ?? 'Unknown',
            'quantity' => $this->quantity,
            'attended' => $this->quantity_attended ?? 0,
        ];
    }

    public function toInternalMeta(): array
    {
        return [
            'age_group_id' => $this->age_group_id,
            'age_group_label' => $this->ageGroup?->label ?? 'Unknown',
            'quantity' => $this->quantity,
            'attended' => $this->quantity_attended ?? 0,
            'free_credits' => $this->free_credits ?? 0,
            'paid_credits' => $this->paid_credits ?? 0,
        ];
    }

    public function resolveSlotPrice(): ?EventSlotPrice
    {
        return EventSlotPrice::where('event_slot_id', $this->booking->slot_id)
            ->where('event_age_group_id', $this->age_group_id)
            ->first();
    }

    public function grossRm(): float
    {
        $slotPrice = $this->resolveSlotPrice();

        if (! $slotPrice || ! $slotPrice->price_in_rm) {
            return 0.00;
        }

        return round(
            (float) $slotPrice->price_in_rm * (int) $this->quantity,
            2
        );
    }
}
