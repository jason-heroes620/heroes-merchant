<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Attendance;
use Carbon\Carbon;

class UpdateAttendanceStatus extends Command
{
    protected $signature = 'attendance:update-status';
    protected $description = 'Mark pending attendances as absent if event slot has ended';

    public function handle()
    {
        $now = Carbon::now('Asia/Kuala_Lumpur');

        $attendances = Attendance::where('status', 'pending')
            ->whereHas('slot', function ($q) use ($now) {
                $q->whereRaw("STR_TO_DATE(CONCAT(date, ' ', end_time), '%Y-%m-%d %H:%i:%s') < ?", [$now->format('Y-m-d H:i:s')]);
            })
            ->get();

        $count = $attendances->count();

        $attendances->each(fn($a) => $a->update(['status' => 'absent']));

        $this->info("Updated $count attendances to absent.");
    }
}