<?php

namespace App\Http\Controllers;

use App\Services\AdminDashboardService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request, AdminDashboardService $service)
    {
        $data = $service->getDashboardData();

        return Inertia::render('Admin/Dashboard', array_merge($data, [
            'userRole' => $request->user()->role,
        ]));
    }
}
