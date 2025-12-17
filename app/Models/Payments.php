<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Payments extends Model
{
    use HasUlids;

    protected $table = 'payments';
    protected $primaryKey = 'id';
    protected $fillable = [
        'payment_id',
        'transaction_id',
        'order_number',
        'payment_method',
        'transaction_status',
        'amount',
        'transaction_message',
        'bank_ref_no',
        'issuing_bank',
        'card_type',
        'card_number',
    ];
}
