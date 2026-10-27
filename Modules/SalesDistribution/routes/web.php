<?php

use Illuminate\Support\Facades\Route;
use Modules\SalesDistribution\Http\Controllers\SalesDistributionController;

Route::middleware(['auth', 'module.active:sales-distribution', 'permission:sales_distribution.dashboard.view'])
    ->get('admin/sales-distribution', [SalesDistributionController::class, 'index'])
    ->name('admin.sales-distribution.index');
