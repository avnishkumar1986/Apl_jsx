<?php

use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\SalesController;

Route::middleware(['auth', 'module.active:sales', 'permission:sales.overview.view'])
    ->get('admin/sales', [SalesController::class, 'index'])
    ->name('admin.sales.index');
