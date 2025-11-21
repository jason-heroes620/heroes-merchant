<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Event extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'merchant_id',
        'type',
        'title',
        'description',
        'category',
        'is_suitable_for_all_ages',
        'is_recurring',
        'featured',
        'like_count',
        'click_count',
        'status',
        'rejected_reason',
    ];

    protected $casts = [
        'is_suitable_for_all_ages' => 'boolean',
        'is_recurring' => 'boolean',
        'featured' => 'boolean',
        'like_count' => 'integer',
        'click_count' => 'integer',
    ];

    /** Relationships */
    public function merchant() { return $this->belongsTo(Merchant::class); }

    public function location() { return $this->hasOne(EventLocation::class); }

    public function media() { return $this->hasMany(EventMedia::class); }

    public function ageGroups() { return $this->hasMany(EventAgeGroup::class); }

    public function prices() { return $this->hasMany(EventPrice::class); }

    public function frequencies() { return $this->hasMany(EventFrequency::class); }

    public function dates() { return $this->hasMany(EventDate::class); }

    public function slots()
    {
        return $this->hasManyThrough(
            EventSlot::class,
            EventDate::class,
            'event_id',
            'event_date_id',
            'id',
            'id'
        );
    }

    public function likedBy()
    {
        return $this->belongsToMany(Customer::class, 'event_likes');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
