<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventDate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'event_frequency_id',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function event() { return $this->belongsTo(Event::class); }

    public function frequency()
    {
        return $this->belongsTo(EventFrequency::class, 'event_frequency_id');
    }

    public function slots()
    {
        return $this->hasMany(EventSlot::class, 'event_date_id');
    }
}
