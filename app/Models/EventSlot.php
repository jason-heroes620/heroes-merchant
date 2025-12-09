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
        // Get date part
        $slotDate = $this->date instanceof Carbon 
            ? $this->date->format('Y-m-d') 
            : (is_string($this->date) ? substr($this->date, 0, 10) : null);

        if (!$slotDate) {
            $eventStartDate = optional($this->event->dates->first())->start_date;
            $slotDate = $eventStartDate instanceof Carbon 
                ? $eventStartDate->format('Y-m-d') 
                : (is_string($eventStartDate) ? substr($eventStartDate, 0, 10) : null);
        }

        $slotTime = $this->start_time instanceof Carbon
            ? $this->start_time->format('H:i:s')
            : (is_string($this->start_time) ? substr($this->start_time, 0, 8) : null);

        if (!$slotDate || !$slotTime) {
            \Log::warning('Slot display_start is missing date or time', [
                'slot_id' => $this->id,
                'slot_date' => $slotDate,
                'slot_time' => $slotTime,
            ]);
            return null;
        }

        try {
            return Carbon::createFromFormat('Y-m-d H:i:s', "{$slotDate} {$slotTime}", 'Asia/Kuala_Lumpur');
        } catch (\Exception $e) {
            \Log::error('Failed to parse display_end', [
                'slot_id' => $this->id,
                'slot_date' => $slotDate,
                'slot_time' => $slotTime,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

   public function getDisplayEndAttribute(): ?Carbon
    {
        // Get date part
        $slotDate = $this->date instanceof Carbon 
            ? $this->date->format('Y-m-d') 
            : (is_string($this->date) ? substr($this->date, 0, 10) : null);

        if (!$slotDate) {
            $eventEndDate = optional($this->event->dates->first())->end_date;
            $slotDate = $eventEndDate instanceof Carbon 
                ? $eventEndDate->format('Y-m-d') 
                : (is_string($eventEndDate) ? substr($eventEndDate, 0, 10) : null);
        }

        $slotTime = $this->end_time instanceof Carbon
            ? $this->end_time->format('H:i:s')
            : (is_string($this->end_time) ? substr($this->end_time, 0, 8) : null);

        if (!$slotDate || !$slotTime) {
            \Log::warning('Slot display_end is missing date or time', [
                'slot_id' => $this->id,
                'slot_date' => $slotDate,
                'slot_time' => $slotTime,
            ]);
            return null;
        }

        try {
            return Carbon::createFromFormat('Y-m-d H:i:s', "{$slotDate} {$slotTime}", 'Asia/Kuala_Lumpur');
        } catch (\Exception $e) {
            \Log::error('Failed to parse display_end', [
                'slot_id' => $this->id,
                'slot_date' => $slotDate,
                'slot_time' => $slotTime,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function payout()
    {
        return $this->hasOne(MerchantSlotPayout::class,'slot_id');
    }
}