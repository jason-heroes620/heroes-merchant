<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\Carbon;

class EventSlot extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_date_id',
        'event_id',
        'date',
        'start_time',
        'end_time',
        'duration',
        'capacity',
        'is_unlimited',
    ];

    protected $casts = [
        'duration' => 'integer',
        'capacity' => 'integer',
        'is_unlimited' => 'boolean',
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    protected $appends = ['booked_quantity'];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function date()
    {
        return $this->belongsTo(EventDate::class, 'event_date_id');
    }

    public function prices()
    {
        return $this->hasMany(EventSlotPrice::class, 'event_slot_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'slot_id');
    }

    public function getBookedQuantityAttribute(): int
    {
        return $this->bookings()
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->sum('quantity');
    }

    public function getAvailableSeatsAttribute(): ?int
    {
        if ($this->is_unlimited) return null;
        return $this->capacity - $this->booked_quantity;
    }

    public function getDisplayStartAttribute(): ?Carbon
    {
        $date = $this->date ?? optional($this->date()->first())->start_date;
        $time = $this->start_time instanceof Carbon ? $this->start_time->format('H:i:s') : $this->start_time;

        return $date && $time
            ? Carbon::parse("{$date->format('Y-m-d')} {$time}", 'Asia/Kuala_Lumpur')
            : null;
    }

    public function getDisplayEndAttribute(): ?Carbon
    {
        $date = $this->date ?? optional($this->date()->first())->end_date;
        $time = $this->end_time instanceof Carbon ? $this->end_time->format('H:i:s') : $this->end_time;

        return $date && $time
            ? Carbon::parse("{$date->format('Y-m-d')} {$time}", 'Asia/Kuala_Lumpur')
            : null;
    }
}