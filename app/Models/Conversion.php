<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Conversion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'conversion_rate',
        'effective_from',
        'valid_until',
        'status',
    ];

    protected $casts = [
        'effective_from' => 'datetime',
        'valid_until' => 'datetime',
        'conversion_rate' => 'float',

    ];

    /** Check if conversion is currently active */
    public function isActive(): bool
    {
        $now = now();
        return $this->effective_from <= $now &&
               ($this->valid_until === null || $this->valid_until >= $now);
    }
}
