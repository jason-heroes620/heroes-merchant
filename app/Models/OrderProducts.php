<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrderProducts extends Model
{
    use HasUuids;

    protected $table = 'order_products';
    protected $primaryKey = 'order_product_id';
    protected $fillable = [
        'order_id',
        'product_id',
        'is_package',
        'is_event',
        'is_product',
        'product_name',
        'qty',
        'uom',
        'price',
        'total',
        'reward'
    ];

    public function order()
    {
        return $this->belongsTo(Orders::class, 'order_id', 'order_id');
    }

    public $casts = [
        'is_package' => 'boolean',
        'is_event' => 'boolean',
        'is_product' => 'boolean',
    ];
}
