<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MerchantController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ConversionController;
use App\Http\Controllers\PurchasePackageController;

/* Root Redirect */
Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login.show');
});

/* Dashboard (Shared for all authenticated users) */
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'user' => Auth::user(),
    ]);
})->middleware('auth')->name('dashboard');

/* Authentication */
Route::get('/login', [AuthController::class, 'showLogin'])->name('login.show');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Password Reset
Route::post('/password/forgot', [AuthController::class, 'sendResetLinkEmail'])->name('password.forgot');
Route::post('/password/reset', [AuthController::class, 'resetPassword'])->name('password.reset');

/* Authenticated User Routes */
Route::middleware(['auth'])->group(function () {
    /* Profile */
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/update', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword'])->name('profile.changePassword');
    Route::post('/users/{id}/deactivate', [AuthController::class, 'deactivate'])->name('user.deactivate');

    /* Admin Routes */
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        // Merchant management
        Route::get('/merchants/create', [MerchantController::class, 'create'])->name('merchants.create');
        Route::post('/merchants', [MerchantController::class, 'store'])->name('merchants.store');
        Route::get('/merchants', [MerchantController::class, 'index'])->name('merchants.index');
        Route::get('/merchants/{id}', [MerchantController::class, 'showProfile'])->name('merchants.showProfile');
        Route::post('/merchants/{id}/update', [MerchantController::class, 'update'])->name('merchants.update');

        // Customer management
        Route::get('/customers/create', [CustomerController::class, 'create'])->name('customers.create');
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{id}', [CustomerController::class, 'showProfile'])->name('customers.showProfile');
        Route::post('/customers/{id}/update', [CustomerController::class, 'update'])->name('customers.update');
        
        // Wallet and transaction management
        Route::get('/customers/{id}/wallet', [CustomerController::class, 'wallet'])->name('customers.wallet');
        Route::get('/customers/{customer}/transactions/export-pdf', [CustomerController::class, 'exportPdf'])->name('customers.transactions.exportPdf');

        Route::get('/admin/customers/{id}/referees', [CustomerController::class, 'viewReferral'])->name('customers.referrals');


        // Admin Event Management
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
        Route::post('/events/{event}/update-status', [EventController::class, 'updateStatus'])->name('events.updateStatus');

        // Conversion Management
        Route::get('/conversions', [ConversionController::class, 'index'])->name('conversions.index');
        Route::get('/conversions/create', [ConversionController::class, 'create'])->name('conversions.create');
        Route::post('/conversions', [ConversionController::class, 'store'])->name('conversions.store');
        Route::post('/conversions/{conversion}/activate', [ConversionController::class, 'activate'])->name('admin.conversions.activate');
        Route::post('/conversions/{conversion}/deactivate', [ConversionController::class, 'deactivate'])->name('admin.conversions.deactivate');
        Route::post('/admin/conversions/check-overlap', [ConversionController::class, 'checkOverlap']);
        Route::resource('packages', PurchasePackageController::class);
    });

    /* Merchant Routes */
    Route::middleware('role:merchant')->prefix('merchant')->name('merchant.')->group(function () {
        // Merchant Event Management
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::get('/events/create', [EventController::class, 'create'])->name('events.create');
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
        Route::get('/events/{event}/edit', [EventController::class, 'edit'])->name('events.edit');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
        Route::post('/events/{event}/deactivate', [EventController::class, 'deactivate'])->name('events.deactivate');
        Route::post('/events/{event}/update-status', [EventController::class, 'updateStatus'])->name('events.updateStatus');
    });

    /* Notifications (shared for all authenticated users) */
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
});
