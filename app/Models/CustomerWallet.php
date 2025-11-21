<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CustomerWallet extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'customer_id',
        'cached_free_credits',
        'cached_paid_credits',
    ];

    protected $casts = [
        'cached_free_credits' => 'integer',
        'cached_paid_credits' => 'integer',
    ];

    /** Relationships */

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function grants()
    {
        return $this->hasMany(WalletCreditGrant::class, 'wallet_id');
    }

    public function transactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class, 'wallet_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'wallet_id');
    }
}

