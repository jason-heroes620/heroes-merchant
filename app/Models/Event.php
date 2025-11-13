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
        'default_capacity',
        'is_unlimited_capacity',
        'is_suitable_for_all_ages',
        'is_recurring' => 'boolean',
        'featured',
        'status',
        'rejected_reason',
    ];

    protected $casts = [
        'is_unlimited_capacity' => 'boolean',
        'is_suitable_for_all_ages' => 'boolean',
        'is_recurring' => 'boolean',
        'featured' => 'boolean',
    ];

    /** ─── Relationships ─── */

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function location()
    {
        return $this->hasOne(EventLocation::class);
    }

    public function media()
    {
        return $this->hasMany(EventMedia::class);
    }

    public function ageGroups()
    {
        return $this->hasMany(EventAgeGroup::class);
    }

    public function prices()
    {
        return $this->hasMany(EventPrice::class);
    }

    public function frequencies()
    {
        return $this->hasMany(EventFrequency::class);
    }

    public function slots()
    {
        return $this->hasMany(EventSlot::class);
    }
}

