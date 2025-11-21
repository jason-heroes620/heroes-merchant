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
        'days_of_week',      
        'selected_dates', 
    ];

    protected $casts = [
        'days_of_week' => 'array',     
        'selected_dates' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function dates()
    {
        return $this->hasMany(EventDate::class);
    }

    public function generateDates(EventDate $eventDate): array
    {
        $start = Carbon::parse($eventDate->start_date);
        $end = Carbon::parse($eventDate->end_date);

        switch ($this->type) {
            case 'daily':
                return collect(CarbonPeriod::create($start, $end))
                    ->map(fn($d) => $d->toDateString())
                    ->toArray();

            case 'weekly':
            case 'biweekly':
                $interval = $this->type === 'weekly' ? 1 : 2;
                $daysOfWeek = $this->days_of_week ?? [0]; // 0 = Sunday

                $dates = [];
                $current = $start->copy();

                while ($current->lte($end)) {
                    if (in_array($current->dayOfWeek, $daysOfWeek)) {
                        $dates[] = $current->toDateString();
                    }
                    $current->addDay();
                }

                if ($interval === 2 && $dates) {
                    $firstDate = Carbon::parse($dates[0]);
                    $dates = array_filter($dates, fn($d) => Carbon::parse($d)->diffInWeeks($firstDate) % 2 === 0);
                }

                return array_values($dates);

            case 'monthly':
                $dates = [];
                $current = $start->copy();

                while ($current->lte($end)) {
                    $dates[] = $current->toDateString();
                    $current->addMonth();
                }

                return $dates;

            case 'custom':
                return $this->selected_dates ?? [];

            default:
                return [$start->toDateString()];
        }
    }
}
