<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventPrice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'event_age_group_id',
        'pricing_type',
        'fixed_price_in_rm',
        'weekday_price_in_rm',
        'weekend_price_in_rm',
    ];

    protected $casts = [
        'fixed_price_in_rm' => 'decimal:2',
        'weekday_price_in_rm' => 'decimal:2',
        'weekend_price_in_rm' => 'decimal:2',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class);
    }
}

