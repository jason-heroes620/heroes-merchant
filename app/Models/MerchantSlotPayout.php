<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MerchantSlotPayout extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'merchant_slot_payouts';

    protected $fillable = [
        'id',
        'merchant_id',
        'event_id',
        'slot_id',
        'total_paid_credits',
        'total_free_credits', 
        'gross_amount_in_rm',
        'platform_fee_in_rm',
        'net_amount_in_rm',
        'total_bookings',
        'booking_ids',             
        'meta', 
        'calculated_at',
        'available_at',
        'status',
    ];

    protected $casts = [
        'calculated_at' => 'datetime',
        'available_at' => 'datetime',
        'booking_ids' => 'array',  
        'meta' => 'array', 
    ];

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function slot()
    {
        return $this->belongsTo(EventSlot::class, 'slot_id');
    }
}
