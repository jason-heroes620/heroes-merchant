<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CartItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'cart_id',
        'purchase_package_id',
        'event_slot_price_id',
        'age_group_id',
        'product_id',
        'product_id',
        'event_title',
        'age_group_label',
        'slot_date',
        'slot_start_time',
        'slot_end_time',
        'price_in_rm',
        'free_credits',
        'paid_credits',
    ];

    protected $casts = [
        'slot_start_time' => 'datetime:H:i',
        'slot_end_time' => 'datetime:H:i',
        'price_in_rm' => 'float',
        'free_credits' => 'integer',
        'paid_credits' => 'integer',
    ];

    /**
     * The cart this item belongs to.
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * The associated package (if applicable)
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(PurchasePackage::class, 'purchase_package_id');
    }

    /**
     * The associated event slot price (if applicable)
     */
    public function eventSlot(): BelongsTo
    {
        return $this->belongsTo(EventSlot::class, 'event_slot_id');
    }

    // public function product(): BelongsTo
    // {
    //     return $this->belongsTo(Product::class, 'product_id');
    // }
}
