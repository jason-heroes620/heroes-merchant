<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClaimConfiguration extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'total_redemption_type',
        'total_redemption_limit',
        'daily_redemption_type',
        'daily_redemption_limit',
    ];

    /** Relationships */

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function claims()
    {
        return $this->hasMany(Claim::class, 'configuration_id');
    }
}
