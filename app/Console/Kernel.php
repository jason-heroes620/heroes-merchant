<?php

namespace App\Console;

use App\Console\Commands\ExpireWalletCredits;
use App\Console\Commands\UpdateClaimStatus;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\CalculateMerchantPayouts;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        CalculateMerchantPayouts::class,
        UpdateClaimStatus::class,
        ExpireWalletCredits::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        // Run hourly to pick up slots that have ended recently.
        // The service enforces available_at (72h) and will only create payouts when appropriate.
        $schedule->command('payouts:calculate')->hourly();
        $schedule->command('claim:update-status')->hourly();
        $schedule->command('wallet:expire-credits')->dailyAt('00:10');
        $schedule->command('conversions:apply-scheduled')->dailyAt('00:00');
    }

    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
