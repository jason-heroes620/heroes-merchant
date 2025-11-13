<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventPrice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'event_age_group_id',
        'pricing_type',
        'fixed_price_in_cents',
        'weekday_price_in_cents',
        'weekend_price_in_cents',
    ];

    protected $casts = [
        'fixed_price_in_cents' => 'integer',
        'weekday_price_in_cents' => 'integer',
        'weekend_price_in_cents' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class, 'event_age_group_id');
    }
}
