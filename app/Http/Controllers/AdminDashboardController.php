<?php

namespace App\Http\Controllers;

use App\Services\AdminDashboardService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index(Request $request, AdminDashboardService $service)
    {
        // Get month from query parameter
        $month = $request->query('month');
        
        // Prevent future months
        if ($month) {
            $selectedDate = Carbon::createFromFormat('Y-m', $month);
            $now = Carbon::now();
            
            // If selected month is in the future, use current month instead
            if ($selectedDate->isFuture() && !$selectedDate->isSameMonth($now)) {
                $month = $now->format('Y-m');
            }
        }
        
        $data = $service->getDashboardData($month);

        return Inertia::render('Admin/Dashboard', array_merge($data, [
            'userRole' => $request->user()->role,
            'selectedMonth' => $month ?? now()->format('Y-m'),
        ]));
    }
}