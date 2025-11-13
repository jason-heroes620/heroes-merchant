<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventAgeGroup extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'label',
        'min_age',
        'max_age',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function prices()
    {
        return $this->hasMany(EventPrice::class, 'event_age_group_id');
    }
}
