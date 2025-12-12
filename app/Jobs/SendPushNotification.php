<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable; 
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Customer;
use App\Models\Merchant;
use App\Services\PushNotificationService;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $customerId;
    public $merchantId;
    public $title;
    public $body;
    public $data;

    public function __construct(string $customerId, string $merchantId, string $title, string $body, array $data = [])
    {
        $this->customerId = $customerId;
         $this->merchantId = $merchantId;
        $this->title = $title;
        $this->body = $body;
        $this->data = $data;
    }

   public function handle()
    {
        $notifiable = Customer::find($this->customerId)?->user ?? Merchant::find($this->merchantId)?->user;
        if (! $notifiable?->expo_push_token) return;

        PushNotificationService::send(
            $notifiable->expo_push_token,
            $this->title,
            $this->body,
            $this->data
        );
    }
}

