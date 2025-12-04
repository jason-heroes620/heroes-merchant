<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MerchantPayout extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'merchant_id',
        'month',
        'tickets_sold',
        'gross_in_rm',
        'platform_fee_in_rm',
        'merchant_net_in_rm',
        'status',
        'notes',
    ];

    protected $casts = [
        'gross_in_rm' => 'decimal:2',
        'platform_fee_in_rm' => 'decimal:2',
        'merchant_net_in_rm' => 'decimal:2',
    ];

    /** Relationships */

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}
