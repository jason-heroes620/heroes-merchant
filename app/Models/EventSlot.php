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
        'date',
        'start_time',
        'end_time',
        'duration',
        'capacity',
        'is_unlimited',
    ];

    protected $casts = [
        'duration' => 'integer',
        'capacity' => 'integer',
        'is_unlimited' => 'boolean',
        'date' => 'date',
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