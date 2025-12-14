<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class MerchantPayoutRequest extends Model
{
    use HasUuids;

    protected $table = 'merchant_payout_requests';

    protected $fillable = [
        'id',
        'merchant_id',
        'amount_requested',
        'status',
        'paid_at',
        'payment_reference',
        'payout_ids',
        'meta'
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'payout_ids' => 'array',
        'meta' => 'array'
    ];

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}
