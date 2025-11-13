<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Notifications\Notifiable;

class Merchant extends Model
{
    use HasFactory, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'company_name',
        'business_registration_number',
        'company_details',
        'business_status',
        'rejection_reason',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($merchant) {
            if (empty($merchant->id)) {
                $merchant->id = (string) Str::uuid();
            }
        });
    }

    /** Relationships */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function routeNotificationForMail($notification)
    {
        return $this->user?->email; // send via the linked user’s email
    }
}
