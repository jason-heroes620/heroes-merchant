<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Claim extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id',
        'booking_item_id',
        'slot_id',
        'event_id',
        'customer_id',
        'status',
        'scanned_at',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    /** Relationships */

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function bookingItem()
    {
        return $this->belongsTo(BookingItem::class);
    }

    public function slot()
    {
        return $this->belongsTo(EventSlot::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
