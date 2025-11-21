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
        'validity_days',
        'active',
    ];

    protected $casts = [
        'price_in_rm' => 'decimal:2',
        'paid_credits' => 'integer',
        'free_credits' => 'integer',
        'validity_days' => 'integer',
        'active' => 'boolean',
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
