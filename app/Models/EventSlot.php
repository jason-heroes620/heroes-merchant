<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventSlot extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_date_id',
        'event_id',
        'start_time',
        'end_time',
        'duration',
        'capacity',
        'is_unlimited',
        'price_in_rm',
        'total_credits',
        'free_credits',
        'paid_credits',
    ];

    protected $casts = [
        'duration' => 'integer',
        'capacity' => 'integer',
        'is_unlimited' => 'boolean',
        'price_in_rm' => 'decimal:2',
        'total_credits' => 'integer',
        'free_credits' => 'integer',
        'paid_credits' => 'integer',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function date()
    {
        return $this->belongsTo(EventDate::class, 'event_date_id');
    }
}