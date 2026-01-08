<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Orders extends Model
{
    use HasUuids;

    protected $table = 'orders';
    protected $primaryKey = 'order_id';
    protected $fillable = [
        'order_number',
        'invoice_number',
        'payment_id',
        'user_id',
        'total',
        'order_status',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(OrderProducts::class, 'order_id', 'order_id');
    }
}
