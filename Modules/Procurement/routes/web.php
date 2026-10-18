<?php

use Illuminate\Support\Facades\Route;
use Modules\Procurement\Http\Controllers\Planning\AllBalanceSheetController;
use Modules\Procurement\Http\Controllers\Planning\BalanceSheetController;
use Modules\Procurement\Http\Controllers\Planning\ConsumptionController;
use Modules\Procurement\Http\Controllers\Planning\MaterialInventoryController;
use Modules\Procurement\Http\Controllers\ProcurementController;

Route::middleware(['auth', 'module.active:procurement'])
    ->prefix('admin/procurement')
    ->name('admin.procurement.')
    ->group(function (): void {
        Route::get('dashboard', [ProcurementController::class, 'dashboard'])->middleware('permission:procurement.overview.view')->name('dashboard');
        Route::get('', [ConsumptionController::class, 'index'])->middleware('permission:procurement.overview.view')->name('index');
        Route::get('purchases', [ConsumptionController::class, 'index'])->middleware('permission:procurement.purchases.view')->name('purchases.index');
        Route::get('daily-consumption', [ConsumptionController::class, 'index'])->middleware('permission:procurement.daily_consumption.view')->name('daily-consumption.index');
        Route::get('reference-data', [ConsumptionController::class, 'referenceData'])->middleware('permission:procurement.overview.view')->name('reference-data');
        Route::get('vendors', [ConsumptionController::class, 'vendors'])->middleware('permission:procurement.overview.view')->name('vendors');
        Route::get('balance-sheet', [BalanceSheetController::class, 'balanceSheet'])->middleware('permission:procurement.overview.view')->name('balance-sheet');
        Route::get('all-balance-sheet', [AllBalanceSheetController::class, 'index'])->middleware('permission:procurement.overview.view')->name('all-balance-sheet');
        Route::put('balance-sheet/remarks', [BalanceSheetController::class, 'updateBalanceRemark'])->middleware('permission:procurement.daily_consumption.create')->name('balance-sheet.remarks');
        Route::get('material-inventory', [MaterialInventoryController::class, 'inventory'])->middleware('permission:procurement.overview.view')->name('material-inventory');
        Route::get('consumptions/{consumption}/supply-plan', [ConsumptionController::class, 'supplyPlan'])->middleware('permission:procurement.daily_consumption.view')->name('supply-plan');
        Route::post('consumptions/{consumption}/purchase-orders', [ConsumptionController::class, 'storeSupplyPlanPurchase'])->middleware('permission:procurement.purchases.create')->name('supply-plan.purchases.store');
        Route::post('consumptions/{consumption}/mou-plans', [ConsumptionController::class, 'storeMouPlan'])->middleware('permission:procurement.daily_consumption.create')->name('supply-plan.mou.store');
        Route::post('purchases', [ConsumptionController::class, 'storePurchase'])->middleware('permission:procurement.purchases.create')->name('purchases.store');
        Route::patch('purchases/{purchase}/delivery-status', [ConsumptionController::class, 'updateDelivery'])->middleware('permission:procurement.purchases.create')->name('purchases.delivery');
        Route::delete('purchases/{purchase}', [ConsumptionController::class, 'destroyPurchase'])->middleware('permission:procurement.purchases.create')->name('purchases.destroy');
        Route::post('consumptions', [ConsumptionController::class, 'storeConsumption'])->middleware('permission:procurement.daily_consumption.create')->name('consumptions.store');
        Route::put('consumptions/{consumption}', [ConsumptionController::class, 'updateConsumption'])->middleware('permission:procurement.daily_consumption.create')->name('consumptions.update');
        Route::patch('consumptions/bulk', [ConsumptionController::class, 'bulkConsumptions'])->middleware('permission:procurement.daily_consumption.create')->name('consumptions.bulk');
        Route::patch('consumptions/empty', [ConsumptionController::class, 'emptyConsumptions'])->middleware('permission:procurement.daily_consumption.create')->name('consumptions.empty');
        Route::delete('consumptions/{consumption}', [ConsumptionController::class, 'destroyConsumption'])->middleware('permission:procurement.daily_consumption.create')->name('consumptions.destroy');
    });
