<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\CustomerCreditTransaction;

class WalletTransactionNotification extends Notification
{
    use Queueable;

    public $transaction;
    public $customerName;
    public $customerId;
    public $eventTitle;
    public $slotDate;
    public $slotTime;
    public $bookingCode;
    public $refunded;

    public function __construct(
        CustomerCreditTransaction $transaction, 
        string $customerName, 
        $customerId, 
        ?string $eventTitle = null, 
        ?string $slotDate = null, 
        ?string $slotTime = null,
        ?string $bookingCode = null,
        ?bool $refunded = null
    ) {
        $this->transaction = $transaction;
        $this->customerName = $customerName;
        $this->customerId = $customerId;
        $this->eventTitle = $eventTitle;
        $this->slotDate = $slotDate;
        $this->slotTime = $slotTime;
        $this->bookingCode = $bookingCode;
        $this->refunded = $refunded;
    }

    public function via($notifiable)
    {
        return ['database', 'mail']; 
    }

    public function toDatabase($notifiable)
    {
        $typeLabel = match($this->transaction->type) {
            'bonus' => $this->transaction->description ?? 'Bonus',
            'purchase' => $this->transaction->purchasePackage?->name ?? 'Package Purchase',
            'booking' => $this->refunded === null
                ? 'Booking Deduction'
                : ($this->refunded ? 'Booking Refund' : 'Booking Cancellation (Credits Forfeited)'),
            'refund' => 'Booking Refund',
            default => 'Wallet Update',
        };

        $credits = [];
        if ($this->transaction->delta_free > 0) {
            $credits[] = "{$this->transaction->delta_free} free credits";
        }
        if ($this->transaction->delta_paid > 0) {
            $credits[] = "{$this->transaction->delta_paid} paid credits";
        }
        $creditsText = implode(' and ', $credits);

        $context = $this->eventTitle 
            ? " for '{$this->eventTitle}' on {$this->slotDate} at {$this->slotTime}" 
            : "";

        $bookingInfo = $this->bookingCode ? " (Booking Code: {$this->bookingCode})" : "";

        return [
            'message' => "{$this->customerName} (Customer ID: {$this->customerId}) {$typeLabel}{$bookingInfo}: {$creditsText}{$context}.",
            'transaction_id' => $this->transaction->id,
            'type' => $this->transaction->type,
            'link' => url("/admin/customers/{$this->customerId}/wallet"),
        ];
    }

    public function toMail($notifiable)
    {
        $typeLabel = match($this->transaction->type) {
            'bonus' => $this->transaction->description ?? 'Bonus',
            'purchase' => $this->transaction->purchasePackage?->name ?? 'Package Purchase',
            'booking' => $this->refunded === null
                ? 'Booking Deduction'
                : ($this->refunded ? 'Booking Refund' : 'Booking Cancellation (Credits Forfeited)'),
            'refund' => 'Booking Refund',
            default => 'Wallet Update',
        };

        $credits = [];
        if ($this->transaction->delta_free > 0) {
            $credits[] = "{$this->transaction->delta_free} free credits";
        }
        if ($this->transaction->delta_paid > 0) {
            $credits[] = "{$this->transaction->delta_paid} paid credits";
        }
        $creditsText = implode(' and ', $credits);

        $context = $this->eventTitle 
            ? " for '{$this->eventTitle}' on {$this->slotDate} at {$this->slotTime}" 
            : "";

        $bookingInfo = $this->bookingCode ? " (Booking Code: {$this->bookingCode})" : "";

        return (new MailMessage)
            ->subject("Wallet Transaction: {$typeLabel}")
            ->line("Customer: {$this->customerName} (ID: {$this->customerId})")
            ->line("Transaction: {$typeLabel}{$bookingInfo}")
            ->line("Credits: {$creditsText}{$context}")
            ->action('View Wallet', url("/admin/customers/{$this->customerId}/wallet"));
    }
}
