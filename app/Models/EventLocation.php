<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventLocation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'place_id',
        'location_name',
        'latitude',
        'longitude',
        'viewport',
        'raw_place',
        'how_to_get_there',
    ];

    protected $casts = [
        'viewport' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
