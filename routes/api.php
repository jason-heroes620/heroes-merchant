<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;

// Public API routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/password/forgot', [AuthController::class, 'sendResetLinkEmail']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// Authenticated routes (mobile)
Route::middleware('auth:sanctum')->group(function () {
    // Auth controller
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/deactivate/{id}', [AuthController::class, 'deactivate']);

    // ProfileController routes
    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user', [ProfileController::class, 'update']);
    Route::delete('/user', [ProfileController::class, 'destroy']);
    Route::post('/user/password/change', [ProfileController::class, 'changePassword']);
});
