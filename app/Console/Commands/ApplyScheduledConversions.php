<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ConversionService;

class ApplyScheduledConversions extends Command
{
    protected $signature = 'conversions:apply-scheduled';
    protected $description = 'Apply scheduled conversions whose effective_from has arrived';
    protected $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        parent::__construct();
        $this->conversionService = $conversionService;
    }

    public function handle()
    {
        $this->conversionService->applyScheduledConversions();
        $this->info('Scheduled conversions applied successfully.');
    }
}
