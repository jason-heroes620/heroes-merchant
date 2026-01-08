<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class EventSlotPrice extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'event_slot_prices';

    protected $fillable = [
        'event_slot_id',
        'event_age_group_id',
        'price_in_rm',
        'free_credits',
        'paid_credits',
        'activation_mode'
    ];

    protected $casts = [
        'price_in_rm' => 'decimal:2',
        'free_credits' => 'integer',
        'paid_credits' => 'integer',
    ];

    public function slot()
    {
        return $this->belongsTo(EventSlot::class, 'event_slot_id');
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class, 'event_age_group_id');
    }
    
    public function conversion()
    {
        return $this->belongsTo(Conversion::class);
    }
}
