<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\MobileEventController;
use App\Http\Controllers\EventLikeController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\MerchantBookingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PurchasePackageController;

// Public API routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/forgot', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

Route::get('/packages', [PurchasePackageController::class, 'index']);

// Authenticated routes (mobile)
Route::middleware('auth:sanctum')->group(function () {
    // Auth controller
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/deactivate/{id}', [AuthController::class, 'deactivate']);

    // Profile
    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user', [ProfileController::class, 'update']);
    Route::delete('/user', [ProfileController::class, 'destroy']);
    Route::post('/user/password', [ProfileController::class, 'changePassword']);

    // Wallet
    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/transactions', [WalletController::class, 'addWalletTransaction']);  

    //Referrals
    Route::get('/referrals', [CustomerController::class, 'viewReferral']);

    //Events
    Route::get('/events/liked', [MobileEventController::class, 'likedEvents']);
    Route::post('/events/{id}/toggle-like', [EventLikeController::class, 'toggleLike']);
    
    // Booking
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'book']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::get('bookings/{booking}/qr', [BookingController::class, 'qr']);
    Route::patch('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/scan-qr', [AttendanceController::class, 'scanQr']);

    Route::post('/notifications/token', [NotificationController::class, 'saveToken']);
});

//Public Events
Route::prefix('events')->group(function () {
    Route::get('/', [MobileEventController::class, 'index']);
    Route::post('/{id}/click', [MobileEventController::class, 'incrementClickCount']);   
    Route::get('/{event}', [MobileEventController::class, 'show']);  
});