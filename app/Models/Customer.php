<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Customer extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'date_of_birth',
        'age',
        'device_id',
        'referral_code',
        'referred_by',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($customer) {
            if (empty($customer->id)) {
                $customer->id = (string) Str::uuid();
            }

            // Auto-generate referral code if not provided
            if (empty($customer->referral_code)) {
                $customer->referral_code = strtoupper(Str::random(8));
            }
        });

        // Auto-calculate age on save
        static::saving(function ($customer) {
            if ($customer->date_of_birth) {
                $customer->age = Carbon::parse($customer->date_of_birth)->age;
            }
        });
    }

    /** Relationships */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function referrer()
    {
        return $this->belongsTo(Customer::class, 'referred_by');
    }

    public function referees()
    {
        return $this->hasMany(Customer::class, 'referred_by');
    }
}
