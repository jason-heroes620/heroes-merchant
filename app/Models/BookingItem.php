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
        'quantity_claimed',
        'price_in_rm',
        'free_credits',
        'paid_credits',
        'activation_mode'
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

    public function eventSlotPrice()
    {
        return $this->belongsTo(EventSlotPrice::class, 'event_slot_price_id');
    }
}
