<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MerchantController;
use App\Http\Controllers\CustomerController;

// 🏠 Redirect to dashboard if logged in
Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login.show');
});

// 📊 Dashboard
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'user' => Auth::user()
    ]);
})->middleware('auth')->name('dashboard');

// 🔐 Authentication (Web)
Route::get('/login', [AuthController::class, 'showLogin'])->name('login.show');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// 🔁 Password Reset (Web)
Route::post('/password/forgot', [AuthController::class, 'sendResetLinkEmail'])->name('password.forgot');
Route::post('/password/reset', [AuthController::class, 'resetPassword'])->name('password.reset');

// ⚙️ Protected routes (only logged-in users)
Route::middleware(['auth'])->group(function () {
    Route::resource('users', UserController::class);
    Route::resource('merchants', MerchantController::class);
    Route::resource('customers', CustomerController::class);

    // Deactivate user
    Route::post('/users/{id}/deactivate', [AuthController::class, 'deactivate'])->name('user.deactivate');
});
