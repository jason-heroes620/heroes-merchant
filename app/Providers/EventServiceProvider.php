<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\ChannelManager;
use App\Notifications\Channels\PushChannel;

class EventServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->app->make(ChannelManager::class)->extend('push', function($app) {
            return new PushChannel();
        });
    }
}
