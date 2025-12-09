<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        RateLimiter::for('api', function (Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by(optional($request->user())->id ?: $request->ip());
        });

        Inertia::share([
            'auth' => function () {
                return [
                    'userRole' => Auth::check() ? Auth::user()->role : null,
                    'userName' => Auth::check() ? Auth::user()->full_name : null,
                ];
            },
            'errors' => fn() => session()->get('errors')
                ? session()->get('errors')->getBag('default')->toArray()
                : new \stdClass(),
        ]);
    }
}
