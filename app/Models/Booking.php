<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\Carbon;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_code',
        'customer_id',
        'event_id',
        'slot_id',
        'age_group_id',
        'wallet_id',
        'quantity',
        'status',
        'qr_code_path',
        'booked_at',
        'cancelled_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'booked_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($booking) {
            if (empty($booking->id)) {
                $booking->id = (string) Str::uuid();
            }

            // Auto-generate booking code if not provided
            if (empty($booking->booking_code)) {
                $booking->booking_code = strtoupper(Str::random(8));
            }
        });
    }

    /** Relationships */

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function slot()
    {
        return $this->belongsTo(EventSlot::class, 'slot_id');
    }

    public function ageGroup()
    {
        return $this->belongsTo(EventAgeGroup::class, 'age_group_id');
    }

    public function wallet()
    {
        return $this->belongsTo(CustomerWallet::class, 'wallet_id');
    }

    public function transactions()
    {
        return $this->hasMany(CustomerCreditTransaction::class, 'booking_id');
    }

    public function items()
    {
        return $this->hasMany(BookingItem::class, 'booking_id');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function scopeForCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'confirmed')
                     ->whereHas('slot', function ($q) {
                         $q->where('start_time', '>=', Carbon::now());
                     });
    }

    public function scopeCompleted($query)
    {
        return $query->where(function ($q) {
            $q->where('status', 'completed')
              ->orWhereHas('slot', function ($q2) {
                  $q2->where('end_time', '<', Carbon::now());
              });
        });
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function getQrUrlAttribute()
    {
        if (! $this->qr_code_path) return null;
        return asset($this->qr_code_path);
    }

    public function getSlotStartAttribute()
    {
        return $this->slot?->start_time;
    }

    public function getSlotEndAttribute()
    {
        return $this->slot?->end_at;
    }

     /**
     * Merchant-safe booking items
     */
    public function itemsForMerchantMeta(): array
    {
        return $this->items
            ->map(fn ($item) => $item->toMerchantMeta())
            ->values()
            ->toArray();
    }

    /**
     * Internal booking items
     */
    public function itemsForInternalMeta(): array
    {
        return $this->items
            ->map(fn ($item) => $item->toInternalMeta())
            ->values()
            ->toArray();
    }

    public function creditBreakdown(): array
    {
        $paid = 0;
        $free = 0;
        $items = [];

        foreach ($this->items as $item) {
            $totals = $item->creditTotals();

            $paid += $totals['paid'];
            $free += $totals['free'];

            $items[] = [
                'age_group_id' => $item->age_group_id,
                'age_group_label' => $item->ageGroup?->label,
                'quantity' => $item->quantity,
                'paid_total' => $totals['paid'],
                'free_total' => $totals['free'],
            ];
        }

        return [
            'paid' => $paid,
            'free' => $free,
            'items' => $items,
        ];
    }
}
