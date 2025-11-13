<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventSlot extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'frequency_id',
        'date',
        'is_all_day',
        'start_time',
        'end_time',
        'duration',
        'capacity',
        'is_unlimited',
        'booked',
        'slot_type',
        'price_in_cents',
        'price_in_credits',
    ];

    protected $casts = [
        'date' => 'date',
        'is_all_day' => 'boolean',
        'is_unlimited' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function frequency()
    {
        return $this->belongsTo(EventFrequency::class, 'frequency_id');
    }
}
