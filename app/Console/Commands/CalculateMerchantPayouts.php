<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MerchantPayoutService;

class CalculateMerchantPayouts extends Command
{
    protected $signature = 'payouts:calculate';
    protected $description = 'Calculate merchant payouts for completed slots';

    public function handle(MerchantPayoutService $service)
    {
        $this->info('Starting payout calculation...');

        $processed = $service->calculateAllEligibleSlots();

        $this->info('Processed ' . count($processed) . ' slot payouts.');

        return 0;
    }
}
