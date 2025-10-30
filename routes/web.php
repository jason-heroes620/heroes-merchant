<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MerchantController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ProfileController;

// Root redirect
Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login.show');
});

// Dashboard (shared for all authenticated users)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'user' => Auth::user(),
    ]);
})->middleware('auth')->name('dashboard');

// Authentication
Route::get('/login', [AuthController::class, 'showLogin'])->name('login.show');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Password Reset 
Route::post('/password/forgot', [AuthController::class, 'sendResetLinkEmail'])->name('password.forgot');
Route::post('/password/reset', [AuthController::class, 'resetPassword'])->name('password.reset');

// Authenticated User Routes
Route::middleware(['auth'])->group(function () {

    // 👤 Profile
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/update', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword'])->name('profile.changePassword');

    // 📴 Deactivate user
    Route::post('/users/{id}/deactivate', [AuthController::class, 'deactivate'])->name('user.deactivate');

 
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/merchants/create', [MerchantController::class, 'create'])->name('merchants.create');
        Route::post('/merchants', [MerchantController::class, 'store'])->name('merchants.store');
        Route::get('/merchants', [MerchantController::class, 'index'])->name('merchants.index');
        Route::get('/merchants/{id}', [MerchantController::class, 'showProfile'])->name('merchants.showProfile');
        Route::post('/merchants/{id}/update', [MerchantController::class, 'update'])->name('merchants.update');
        Route::get('/customers/create', [CustomerController::class, 'create'])->name('customers.create');
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{id}', [CustomerController::class, 'showProfile'])->name('customers.showProfile');
        Route::post('/customers/{id}/update', [CustomerController::class, 'update'])->name('customers.update');
    });
});

