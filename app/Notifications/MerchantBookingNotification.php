<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MerchantBookingNotification extends Notification
{
    use Queueable;

    public $customerName;
    public $bookingCode;
    public $eventTitle;
    public $slotDate;
    public $slotTime;
    public $status; 

    public function __construct(string $customerName, string $bookingCode, string $eventTitle, ?string $slotDate, ?string $slotTime, string $status)
    {
        $this->customerName = $customerName;
        $this->bookingCode = $bookingCode;
        $this->eventTitle = $eventTitle;
        $this->slotDate = $slotDate;
        $this->slotTime = $slotTime;
        $this->status = $status;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "{$this->customerName}'s booking {$this->bookingCode} for '{$this->eventTitle}' on {$this->slotDate} at {$this->slotTime} has been {$this->status}.",
            'booking_code' => $this->bookingCode,
            'status' => $this->status,
            'link' => url("/merchant/bookings/{$this->bookingCode}")
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject("Booking {$this->status}: {$this->bookingCode}")
            ->line("Customer: {$this->customerName}")
            ->line("Booking Code: {$this->bookingCode}")
            ->line("Event: {$this->eventTitle}")
            ->line("Date & Time: {$this->slotDate} {$this->slotTime}")
            ->line("Status: {$this->status}")
            ->action('View Booking', url("/merchant/bookings/{$this->bookingCode}"));
    }
}
