<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Services\MerchantPayoutService;

class CalculateMerchantPayouts extends Command
{
    protected $signature = 'payouts:calculate';
    protected $description = 'Calculate merchant payouts for completed slots';

    protected MerchantPayoutService $payoutService;

    public function __construct(MerchantPayoutService $payoutService)
    {
        parent::__construct();
        $this->payoutService = $payoutService;
    }

    public function handle(): int
    {
        $this->info('Starting payout calculation...');

        try {
            $processed = $this->payoutService->calculateAllEligibleSlots();
            $count = count($processed);

            $this->info("Processed {$count} slot payout" . ($count === 1 ? '' : 's') . ".");
            Log::info('Payout command finished', ['processed_count' => $count]);
        } catch (\Throwable $e) {
            $this->error('Error calculating payouts: ' . $e->getMessage());
            Log::error('Payout calculation failed', ['error' => $e]);
            return 1;
        }

        return 0;
    }
}
