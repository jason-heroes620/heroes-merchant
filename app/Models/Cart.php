<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cart extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'customer_id',
        'status',
        'total_rm',
        'total_free_credits',
        'total_paid_credits'
    ];

    protected $casts = [
        'status' => 'string',
        'total_rm' => 'float',
        'total_free_credits' => 'integer',
        'total_paid_credits' => 'integer',
    ];

    /**
     * The customer who owns this cart.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Items in this cart.
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
