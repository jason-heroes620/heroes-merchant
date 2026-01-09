<?php

namespace App\Mail;

use App\Models\OrderProducts;
use App\Models\Orders;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class OrderSummaryMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $order;
    public $orderProducts;
    public $qrCodeSvg;
    /**
     * Create a new message instance.
     */
    public function __construct($user, $order, $orderProducts, $qrCodeSvg)
    {
        $this->user = $user;
        $this->order = $order;
        $this->orderProducts = $orderProducts;
        $this->qrCodeSvg = $qrCodeSvg;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Heroes - Order Summary For Order No.:' . $this->order->order_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        Log::info($this->orderProducts);
        return new Content(
            view: 'emails.order-summary',
            with: [
                'name' => $this->user->full_name,
                'order' => $this->order,
                'orderProducts' => $this->orderProducts,
                'qrCodeSvg' => $this->qrCodeSvg
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
