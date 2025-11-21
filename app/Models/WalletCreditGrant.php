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
        'credits',
        'credits_remaining',
        'expires_at',
        'purchase_package_id',
        'reference_id',
        'credits_per_rm',
    ];

    protected $casts = [
        'credits' => 'integer',
        'credits_remaining' => 'integer',
        'expires_at' => 'datetime',
        'credits_per_rm' => 'decimal:6',
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
}
