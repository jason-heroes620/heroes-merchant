<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BookingItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'age_group_id',
        'quantity',
        'free_credits',
        'paid_credits',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class, 'age_group_id');
    }
}
