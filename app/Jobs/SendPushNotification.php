<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable; // <- add this
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Customer;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $customerId;
    public $title;
    public $body;
    public $data;

    public function __construct(string $customerId, string $title, string $body, array $data = [])
    {
        $this->customerId = $customerId;
        $this->title = $title;
        $this->body = $body;
        $this->data = $data;
    }

    public function handle()
    {
        $customer = Customer::find($this->customerId);
        if (! $customer || ! $customer->push_token) {
            return;
        }

        \App\Services\PushService::send($customer->push_token, $this->title, $this->body, $this->data);
    }
}

