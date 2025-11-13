<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\CarbonPeriod;
use Carbon\Carbon;

class EventFrequency extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'type',
        'start_date',
        'end_date',
        'days_of_week',      
        'selected_dates', 
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'days_of_week' => 'array',     
        'selected_dates' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function slots()
    {
        return $this->hasMany(EventSlot::class, 'frequency_id');
    }

    public function generateDates(): array
    {
        if (!$this->start_date) {
            return [];
        }

        $start = Carbon::parse($this->start_date);
        $end = $this->end_date ? Carbon::parse($this->end_date) : $start;

        switch ($this->type) {
            case 'one_time':
                return [$start->toDateString()];

            case 'daily':
                return collect(CarbonPeriod::create($start, $end))->map(fn($d) => $d->toDateString())->toArray();

            case 'weekly':
                return collect(CarbonPeriod::create($start, '1 week', $end))->map(fn($d) => $d->toDateString())->toArray();

            case 'biweekly':
                return collect(CarbonPeriod::create($start, '2 weeks', $end))->map(fn($d) => $d->toDateString())->toArray();

            case 'monthly':
                return collect(CarbonPeriod::create($start, '1 month', $end))->map(fn($d) => $d->toDateString())->toArray();

            default:
                return [$start->toDateString()];
        }
    }
}
