<?php

use Illuminate\Support\Facades\Route;
use Modules\Support\Http\Controllers\SupportTicketController;

Route::middleware(['auth', 'module.active:support'])->prefix('support')->name('support.')->group(function (): void {
    Route::get('/', [SupportTicketController::class, 'index'])->name('index');
    Route::post('/', [SupportTicketController::class, 'store'])->name('store');
    Route::get('/attachments/{attachment}', [SupportTicketController::class, 'download'])->name('attachments.download');
    Route::get('/{ticket}', [SupportTicketController::class, 'show'])->name('show');
    Route::post('/{ticket}/replies', [SupportTicketController::class, 'reply'])->name('reply');
    Route::patch('/{ticket}', [SupportTicketController::class, 'update'])->name('update');
});
