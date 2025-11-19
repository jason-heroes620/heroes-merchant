<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerCreditTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_id',
        'type',
        'amount_in_credits',
        'description',
        'transaction_id',
    ];

    public function wallet()
    {
        return $this->belongsTo(CustomerWallet::class, 'wallet_id');
    }
}
