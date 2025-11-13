<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

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
        return ['database'];
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
