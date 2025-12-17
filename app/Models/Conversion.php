<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Conversion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'credits_per_rm',
        'paid_to_free_ratio',
        'paid_credit_percentage',
        'free_credit_percentage',
        'effective_from',
        'valid_until',
        'status',
    ];

    protected $casts = [
        'credits_per_rm' => 'float',
        'paid_to_free_ratio' => 'float',
        'paid_credit_percentage' => 'float',
        'free_credit_percentage' => 'float',
        'effective_from' => 'datetime',
        'valid_until' => 'datetime',
    ];
}
