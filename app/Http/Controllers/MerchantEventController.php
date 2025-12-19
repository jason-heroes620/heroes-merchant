<?php

namespace App\Http\Controllers;

use App\Models\{
    Merchant,
    Event,
};
use Illuminate\Http\Request;
use Carbon\Carbon;

class MerchantEventController extends Controller
{
    public function merchantSlots(Request $request)
    {
        $tz = 'Asia/Kuala_Lumpur';
        $todayStart = Carbon::now($tz)->startOfDay();
        $todayEnd   = Carbon::now($tz)->endOfDay();

        $user = $request->user();
        $merchant = Merchant::where('user_id', $user->id)->firstOrFail();

        $events = Event::with([
                'media',
                'slots.bookings.items',
                'slots.date',
                'slots.prices',
            ])
            ->where('status', 'active')
            ->where('merchant_id', $merchant->id)
            ->get();

        $slotsList = collect();

        foreach ($events as $event) {
            // Filter today's slots
            $todaySlots = $event->slots->filter(function ($s) use ($todayStart, $todayEnd, $tz) {
                $displayStart = $s->display_start ? Carbon::parse($s->display_start)->setTimezone($tz) : null;
                $displayEnd   = $s->display_end   ? Carbon::parse($s->display_end)->setTimezone($tz) : null;

                if (!$displayStart || !$displayEnd) {
                    $eventDate = $s->date;
                    if (!$eventDate) return false;

                    $startDate = $eventDate->start_date?->format('Y-m-d');
                    $endDate   = $eventDate->end_date?->format('Y-m-d');

                    $startTime = $s->start_time?->format('H:i:s') ?? '00:00:00';
                    $endTime   = $s->end_time?->format('H:i:s') ?? '23:59:59';

                    $displayStart = $startDate
                        ? Carbon::createFromFormat('Y-m-d H:i:s', "$startDate $startTime", $tz)
                        : null;

                    $displayEnd = $endDate
                        ? Carbon::createFromFormat('Y-m-d H:i:s', "$endDate $endTime", $tz)
                        : null;
                }

                return $displayStart && $displayEnd
                    && $displayStart <= $todayEnd
                    && $displayEnd >= $todayStart;
            });

            foreach ($todaySlots as $slot) {
                // Aggregate booking data
                $totalBookings = 0;
                $expectedAttendees = 0;

                foreach ($slot->bookings as $booking) {
                    if ($booking->status !== 'confirmed') continue;

                    $totalBookings++;

                    foreach ($booking->items as $item) {
                        $expectedAttendees += (int) $item->quantity;
                    }
                }

                // Transform media
                $media = $event->media->map(fn($m) => [
                    'id' => $m->id,
                    'url' => $m->url,
                    'file_path' => $m->url,
                    'type' => $m->type,
                ])->values();

                $slotsList->push([
                    'slot_id' => $slot->id,
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'media' => $media,
                    'slot_start' => $slot->display_start ? Carbon::parse($slot->display_start)->setTimezone($tz)->format('Y-m-d H:i:s') : null,
                    'slot_end' => $slot->display_end ? Carbon::parse($slot->display_end)->setTimezone($tz)->format('Y-m-d H:i:s') : null,
                    'total_bookings' => $totalBookings,
                    'expected_attendees' => $expectedAttendees,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'count' => $slotsList->count(),
            'slots' => $slotsList->values(),
        ]);
    }
}
