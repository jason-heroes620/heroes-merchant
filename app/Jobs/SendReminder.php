<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Bus\Dispatchable;
use App\Models\Reminder;
use App\Jobs\SendPushNotification;

class SendReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $reminderId;

    public function __construct(string $reminderId)
    {
        $this->reminderId = $reminderId;
    }

    public function handle()
    {
        $reminder = Reminder::with('booking.customer.slot.event')->find($this->reminderId);
        if (!$reminder || $reminder->status !== 'scheduled') return;

        $booking = $reminder->booking;

        if (!$booking || $booking->status !== 'confirmed') {
            $reminder->status = 'cancelled';
            $reminder->save();
            return;
        }

        $eventTitle = $booking->slot->event->title ?? 'Event';
        $bookingCode = $booking->booking_code ?? 'N/A';

        SendPushNotification::dispatch(
            (string) $booking->customer->id,
            "", // no merchant
            "Reminder: Booking {$bookingCode}",
            "Your booking for '{$eventTitle}' is coming up soon.",
            [
                'booking_id' => (string) $booking->id,
                'booking_code' => $bookingCode,
            ]
        );

        $reminder->status = 'sent';
        $reminder->save();
    }
}
