<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MerchantSlotPayoutItem extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'merchant_slot_payout_items';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'payout_id',
        'booking_item_id',
        'event_slot_price_id',
        'amount_in_rm',
    ];

    protected $casts = [
        'amount_in_rm' => 'decimal:2',
    ];

    public function payout()
    {
        return $this->belongsTo(MerchantSlotPayout::class, 'payout_id');
    }

    public function bookingItem()
    {
        return $this->belongsTo(BookingItem::class, 'booking_item_id');
    }

    public function eventSlotPrice()
    {
        return $this->belongsTo(EventSlotPrice::class, 'event_slot_price_id');
    }
}
