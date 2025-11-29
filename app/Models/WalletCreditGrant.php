<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WalletCreditGrant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'wallet_id',
        'grant_type',
        'free_credits',
        'paid_credits',
        'free_credits_remaining',
        'paid_credits_remaining',
        'expires_at',
        'purchase_package_id',
        'reference_id',
        'free_credits_per_rm',
        'paid_credits_per_rm',
    ];

    protected $casts = [
        'free_credits' => 'integer',
        'paid_credits' => 'integer',
        'free_credits_remaining' => 'integer',
        'paid_credits_remaining' => 'integer',
        'expires_at' => 'datetime',
        'free_credits_per_rm' => 'float',
        'paid_credits_per_rm' => 'float',
    ];

    /** Relationships */

    public function wallet()
    {
        return $this->belongsTo(CustomerWallet::class, 'wallet_id');
    }

    public function purchasePackage()
    {
        return $this->belongsTo(PurchasePackage::class, 'purchase_package_id');
    }

    public function transactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class, 'wallet_credit_grant_id');
    }
}
