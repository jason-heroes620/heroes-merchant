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
        $reminder = Reminder::with('booking.customer')->find($this->reminderId);
        if (!$reminder || $reminder->status !== 'scheduled') return;

        $booking = $reminder->booking;

        if (!$booking || $booking->status !== 'confirmed') {
            $reminder->status = 'cancelled';
            $reminder->save();
            return;
        }

        SendPushNotification::dispatch(
            $booking->customer->id,
            "Reminder: your booking",
            "Your booking for {$booking->event->title} is coming up.",
            ['booking_id' => (string)$booking->id]
        );

        $reminder->status = 'sent';
        $reminder->save();
    }
}
