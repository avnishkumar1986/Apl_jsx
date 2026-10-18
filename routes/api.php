<?php

use App\Http\Controllers\Api\JwtAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login', [JwtAuthController::class, 'login'])->name('api.auth.login');
    Route::post('refresh', [JwtAuthController::class, 'refresh'])->name('api.auth.refresh');

    Route::middleware('auth:api')->group(function (): void {
        Route::get('me', [JwtAuthController::class, 'me'])->name('api.auth.me');
        Route::post('logout', [JwtAuthController::class, 'logout'])->name('api.auth.logout');
    });
});
