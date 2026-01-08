<?php

use App\Http\Controllers\ArtFairController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\MobileEventController;
use App\Http\Controllers\MerchantEventController;
use App\Http\Controllers\MerchantBookingController;
use App\Http\Controllers\EventLikeController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\EghlCallbackController;
use App\Http\Controllers\EghlPaymentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\PurchasePackageController;
use App\Http\Controllers\SettingsController;

// Public API routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/forgot', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);
Route::post('/merchant/login', [AuthController::class, 'merchantLogin']);

Route::get('/packages', [PurchasePackageController::class, 'index']);

// EGHL Payment
Route::post('/eghl/secure-callback', [EghlCallbackController::class, 'handleCallback'])->name('eghl.callback');
Route::get('/payment/return', [EghlCallbackController::class, 'handleReturn'])->name('payment.return');

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

    // payment 
    Route::post('/eghl/initiate', [EghlPaymentController::class, 'initiate']);
    Route::get('/payment/status/{order_number}', [EghlPaymentController::class, 'paymentStatus']);

    //Referrals
    Route::get('/referrals', [CustomerController::class, 'viewReferral']);

    //Events
    Route::get('/events/liked', [MobileEventController::class, 'likedEvents']);
    Route::post('/events/{id}/toggle-like', [EventLikeController::class, 'toggleLike']);

    // Booking
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'book']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::patch('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);

    Route::post('/notifications/token', [NotificationController::class, 'saveToken']);
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');

    Route::get('/settings', [SettingsController::class, 'apiGetSettings']);
});

Route::middleware('auth:sanctum')->prefix('merchant')->group(function () {
    Route::get('/events', [MerchantEventController::class, 'merchantSlots']);
    Route::post('/scan-qr', [AttendanceController::class, 'scanPreview']);
    Route::post('/attendance/claim', [AttendanceController::class, 'claimAttendance']);
    Route::get('/attendances/slot/{slotId}', [AttendanceController::class, 'getSlotAttendances']);
    Route::get('/bookings/event/{eventId}', [MerchantBookingController::class, 'apiBookingsByEvent']);
    Route::post('/attendances/{bookingId}/manual-claim', [AttendanceController::class, 'manualClaim']);
});

//Public Events
Route::prefix('events')->group(function () {
    Route::get('/', [MobileEventController::class, 'index']);
    Route::post('/{id}/click', [MobileEventController::class, 'incrementClickCount']);
    Route::get('/{event}', [MobileEventController::class, 'show']);
});

Route::get('/orders/{order}', [OrdersController::class, 'getOrderByOrderNumber']);
Route::post('/artfair/register', [ArtFairController::class, 'createOrderAndRegistration']);
Route::post('/artfair/callback', [ArtFairController::class, 'eghlCallback']);
Route::post('/artfair/return', [ArtFairController::class, 'eghlReturn']);
