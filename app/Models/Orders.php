<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Orders extends Model
{
    use HasUuids;

    protected $table = 'orders';
    protected $primaryKey = 'order_id';
    protected $fillable = [
        'order_number',
        'payment_id',
        'user_id',
        'package_id',
        'product',
        'quantity',
        'price',
        'order_status',
    ];
}
