<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MerchantSlotPayout extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'merchant_slot_payouts';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'merchant_id',
        'slot_id',
        'booking_id',
        'total_amount_in_rm',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'total_amount_in_rm' => 'decimal:2',
    ];

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function slot()
    {
        return $this->belongsTo(EventSlot::class, 'slot_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function items()
    {
        return $this->hasMany(MerchantSlotPayoutItem::class, 'payout_id');
    }
}
