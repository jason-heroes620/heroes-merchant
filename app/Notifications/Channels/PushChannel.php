<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class PushChannel
{
    public function send($notifiable, Notification $notification)
    {
        Log::info('PushChannel::send called', [
            'notifiable_id' => $notifiable->id,
            'notification_class' => get_class($notification)
        ]);

        if (!method_exists($notification, 'toPush')) {
            return;
        }

        return $notification->toPush($notifiable);
    }
}
