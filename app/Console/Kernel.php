<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\CalculateMerchantPayouts;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        CalculateMerchantPayouts::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        // Run hourly to pick up slots that have ended recently.
        // The service enforces available_at (72h) and will only create payouts when appropriate.
        $schedule->command('payouts:calculate')->hourly();
        $schedule->command('attendance:update-status')->everyFiveMinutes();
    }

    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
