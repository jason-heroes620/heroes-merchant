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
        'wallet_id',
        'free_credits_spent',
        'paid_credits_spent',
        'quantity',
        'amount_paid_in_rm',
        'status',
        'qr_code_path',
        'booked_at',
        'cancelled_at',
    ];

    protected $casts = [
        'free_credits_spent' => 'integer',
        'paid_credits_spent' => 'integer',
        'quantity' => 'integer',
        'amount_paid_in_rm' => 'decimal:2',
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

    public function wallet()
    {
        return $this->belongsTo(CustomerWallet::class, 'wallet_id');
    }

    public function transactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class, 'booking_id');
    }

    public function merchantPayout()
    {
        return $this->hasOne(MerchantPayout::class, 'booking_id');
    }
}
