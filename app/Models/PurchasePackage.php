<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchasePackage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'price_in_rm',
        'paid_credits',
        'free_credits',
        'effective_from',
        'valid_until',
        'active',
        'system_locked'
    ];

    protected $casts = [
        'price_in_rm' => 'float',
        'paid_credits' => 'integer',
        'free_credits' => 'integer',
        'effective_from' => 'datetime',
        'valid_until' => 'datetime',
        'active' => 'boolean',
        'system_locked' => 'boolean'
    ];

    /** Relationships */

    public function grants()
    {
        return $this->hasMany(WalletCreditGrant::class, 'purchase_package_id');
    }

    public function transactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class, 'purchase_package_id');
    }
}
