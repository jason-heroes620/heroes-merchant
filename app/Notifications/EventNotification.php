<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class EventNotification extends Notification
{
    use Queueable;

    protected $event;
    protected $action; 
    protected $status; 

    /**
     * @param \App\Models\Event $event
     * @param string $action 'created' | 'updated' | 'status_change'
     * @param string|null $status e.g. 'pending', 'active'
     */
    public function __construct($event, string $action = 'created', ?string $status = null)
    {
        $this->event = $event;
        $this->action = $action;
        $this->status = $status;
    }

    public function via($notifiable)
    {
        $channels = ['database'];

        $token = $notifiable->expo_push_token ?? null;
        if (!empty($token)) {
            $channels[] = 'push';
        }

        Log::info('EventNotification::via', [
            'notifiable_id' => $notifiable->id,
            'channels' => $channels,
            'action' => $this->action,
            'status' => $this->status,
        ]);

        return $channels;
    }

    public function toArray($notifiable)
    {
        // Determine message
        $message = match ($this->action) {
            'created' => "New event '{$this->event->title}' created by {$this->event->merchant->user->full_name}",
            'updated' => "Your event '{$this->event->title}' has been updated",
            'status_change' => "Your event '{$this->event->title}' is now {$this->status}",
            default => "Your event '{$this->event->title}' has a new update",
        };

        return [
            'event_id' => $this->event->id,
            'title' => $this->event->title,
            'message' => $message,
            'action' => $this->action,
            'status' => $this->status,
        ];
    }
}