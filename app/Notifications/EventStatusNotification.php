<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Services\PushNotificationService;
use Illuminate\Support\Facades\Log;

class EventStatusNotification extends Notification
{
    use Queueable;

    protected $event;
    protected $status;

    public function __construct($event, $status)
    {
        $this->event = $event;
        $this->status = $status;
    }

    public function via($notifiable)
    {
        $channels = ['database']; // always store in database for web

        // If device token exists, add push channel
        $token = $notifiable->expo_push_token ?? null;
        if (!empty($token)) {
            $channels[] = 'push';
        }

        Log::info('EventStatusNotification::via', [
            'notifiable_id' => $notifiable->id,
            'channels' => $channels,
            'expo_push_token' => $token,
        ]);

        return $channels;
    }

    public function toPush($notifiable)
    {
        $token = $notifiable->expo_push_token ?? null;

        if (!$token) {
            Log::warning("Push notification skipped: no token for user {$notifiable->id}");
            return;
        }

        Log::info('EventStatusNotification::toPush called', [
            'notifiable_id' => $notifiable->id,
            'expo_push_token' => $notifiable->expo_push_token ?? null,
            'event_id' => $this->event->id
        ]);

        // Call PushService
        return PushNotificationService::send(
             $token,
            $this->event->title,
            match ($this->status) {
                'active' => "Your event '{$this->event->title}' is now active!",
                'rejected' => "Your event '{$this->event->title}' was rejected: {$this->event->rejected_reason}",
                'inactive' => "Your event '{$this->event->title}' is inactive.",
                default => "Your event '{$this->event->title}' status updated.",
            },
            [
                'event_id' => $this->event->id,
                'status' => $this->status,
                'user_id' => $notifiable->id,
            ]
        );
    }
    
    public function toArray($notifiable)
    {
        return [
            'event_id' => $this->event->id,
            'title' => $this->event->title,
            'status' => $this->status,
            'message' => match ($this->status) {
                'active' => "Your event '{$this->event->title}' has been approved and is now active!",
                'rejected' => "Your event '{$this->event->title}' was rejected. Reason: {$this->event->rejected_reason}",
                'inactive' => "Your event '{$this->event->title}' has been set to inactive.",
                default => "Your event '{$this->event->title}' status has been updated.",
            },
        ];
    }
}
