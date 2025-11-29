<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CustomerCreditTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'wallet_id',
        'type',
        'before_free_credits',
        'before_paid_credits',
        'delta_free',
        'delta_paid',
        'amount_in_rm',
        'description',
        'booking_id',
        'purchase_package_id',
        'transaction_id',
    ];

    protected $casts = [
        'before_free_credits' => 'integer',
        'before_paid_credits' => 'integer',
        'amount_in_rm' => 'float',
        'delta_free' => 'integer',
        'delta_paid' => 'integer',
    ];

    /** Relationships */

    public function wallet()
    {
        return $this->belongsTo(CustomerWallet::class, 'wallet_id');
    }

    public function grant()
    {
        return $this->belongsTo(WalletCreditGrant::class, 'wallet_credit_grant_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function package()
    {
        return $this->belongsTo(PurchasePackage::class, 'purchase_package_id');
    }
}
