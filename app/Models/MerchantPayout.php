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
        'booking_id',
        'gross_in_rm',
        'admin_fee_in_rm',
        'merchant_net_in_rm',
        'status',
        'notes',
    ];

    protected $casts = [
        'gross_in_rm' => 'decimal:2',
        'admin_fee_in_rm' => 'decimal:2',
        'merchant_net_in_rm' => 'decimal:2',
    ];

    /** Relationships */

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
