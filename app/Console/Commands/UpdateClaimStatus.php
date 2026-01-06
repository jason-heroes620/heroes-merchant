<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Claim;
use Carbon\Carbon;

class UpdateClaimStatus extends Command
{
    protected $signature = 'claim:update-status';
    protected $description = 'Mark pending claims as not claimed if event slot has ended';

    public function handle()
    {
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $claims = Claim::where('status', 'pending')
            ->whereHas('slot', function ($q) use ($now) {
                $q->whereRaw("STR_TO_DATE(CONCAT(date, ' ', end_time), '%Y-%m-%d %H:%i:%s') < ?", [$now->format('Y-m-d H:i:s')]);
            })
            ->get();

        $count = $claims->count();

        $claims->each(fn($a) => $a->update(['status' => 'expired']));

        $this->info("$count claims expired.");
    }
}