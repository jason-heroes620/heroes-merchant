<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Booking extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'customer_id',
        'event_id',
        'slot_id',
        'age_group_id',
        'wallet_id',
        'quantity',
        'status',
        'qr_code_path',
        'booked_at',
        'cancelled_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'booked_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /** Relationships */

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function slot()
    {
        return $this->belongsTo(EventSlot::class, 'slot_id');
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class, 'age_group_id');
    }

    public function wallet()
    {
        return $this->belongsTo(CustomerWallet::class, 'wallet_id');
    }

    public function transactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class, 'booking_id');
    }
    
    public function items()
    {
        return $this->hasMany(BookingItem::class, 'booking_id');
    }

    public function merchantPayout()
    {
        return $this->hasOne(MerchantPayout::class, 'booking_id');
    }
}
