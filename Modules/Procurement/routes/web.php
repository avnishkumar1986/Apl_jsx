<?php

use Illuminate\Support\Facades\Route;
use Modules\Procurement\Http\Controllers\Planning\AllBalanceSheetController;
use Modules\Procurement\Http\Controllers\Planning\BalanceSheetController;
use Modules\Procurement\Http\Controllers\Planning\ConsumptionController;
use Modules\Procurement\Http\Controllers\Planning\MaterialInventoryController;
use Modules\Procurement\Http\Controllers\Planning\PlanningDecisionController;
use Modules\Procurement\Http\Controllers\Planning\VendorListController;
use Modules\Procurement\Http\Controllers\ProcurementController;

Route::middleware(['auth', 'module.active:procurement'])
    ->prefix('admin/procurement')
    ->name('admin.procurement.')
    ->group(function (): void {
        Route::get('dashboard', [ProcurementController::class, 'dashboard'])->middleware('permission:procurement.dashboard.view')->name('dashboard');
        Route::get('', [ConsumptionController::class, 'index'])->middleware('permission:procurement.consumption.view')->name('index');
        Route::get('purchases', [ConsumptionController::class, 'index'])->middleware('permission:procurement.purchases.view')->name('purchases.index');
        Route::get('daily-consumption', [ConsumptionController::class, 'index'])->middleware('permission:procurement.consumption.view')->name('daily-consumption.index');
        Route::get('reference-data', [ConsumptionController::class, 'referenceData'])
            ->middleware('permission:procurement.planning_decisions.view|procurement.materials_balance.view|procurement.consumption.view|procurement.rm_inventories.view|procurement.purchases.view')
            ->name('reference-data');
        Route::get('vendors', [ConsumptionController::class, 'vendors'])
            ->middleware('permission:procurement.planning_decisions.view|procurement.consumption.view|procurement.purchases.view')
            ->name('vendors');
        Route::get('balance-sheet', [BalanceSheetController::class, 'balanceSheet'])->middleware('permission:procurement.rm_inventories.view')->name('balance-sheet');
        Route::get('balance-overview', fn () => redirect()->route('admin.procurement.balance-sheet'))
            ->middleware('permission:procurement.rm_inventories.view');
        Route::get('all-balance-sheet', [AllBalanceSheetController::class, 'index'])->middleware('permission:procurement.materials_balance.view')->name('all-balance-sheet');
        Route::put('balance-sheet/remarks', [BalanceSheetController::class, 'updateBalanceRemark'])->middleware('permission:procurement.materials_balance.edit')->name('balance-sheet.remarks');
        Route::get('material-inventory', [MaterialInventoryController::class, 'inventory'])->middleware('permission:procurement.rm_inventories.view')->name('material-inventory');
        Route::get('vendor-list', [VendorListController::class, 'index'])->middleware('permission:procurement.rm_inventories.view')->name('vendor-list');
        Route::get('planning-decisions', [PlanningDecisionController::class, 'index'])->middleware('permission:procurement.planning_decisions.view')->name('planning-decisions.index');
        Route::post('planning-decisions', [PlanningDecisionController::class, 'store'])->middleware('permission:procurement.planning_decisions.create')->name('planning-decisions.store');
        Route::patch('planning-decisions/lock-all', [PlanningDecisionController::class, 'lockAll'])->middleware('permission:procurement.planning_decisions.edit')->name('planning-decisions.lock-all');
        Route::patch('planning-decisions/unlock-all', [PlanningDecisionController::class, 'unlockAll'])->middleware('permission:procurement.planning_decisions.unlock')->name('planning-decisions.unlock-all');
        Route::patch('planning-decisions/{decision}/lock', [PlanningDecisionController::class, 'lock'])->middleware('permission:procurement.planning_decisions.edit')->name('planning-decisions.lock');
        Route::patch('planning-decisions/{decision}/unlock', [PlanningDecisionController::class, 'unlock'])->middleware('permission:procurement.planning_decisions.unlock')->name('planning-decisions.unlock');
        Route::delete('planning-decisions/{decision}', [PlanningDecisionController::class, 'destroy'])->middleware('permission:procurement.planning_decisions.delete')->name('planning-decisions.destroy');
        Route::get('consumptions/auto/supply-plan', [ConsumptionController::class, 'autoSupplyPlan'])->middleware('permission:procurement.consumption.view')->name('auto-supply-plan');
        Route::post('consumptions/auto/mou-plans', [ConsumptionController::class, 'storeAutoMouPlan'])->middleware('permission:procurement.consumption.create')->name('auto-supply-plan.mou.store');
        Route::get('consumptions/{consumption}/supply-plan', [ConsumptionController::class, 'supplyPlan'])->middleware('permission:procurement.consumption.view')->name('supply-plan');
        Route::post('consumptions/{consumption}/purchase-orders', [ConsumptionController::class, 'storeSupplyPlanPurchase'])->middleware('permission:procurement.purchases.create')->name('supply-plan.purchases.store');
        Route::post('consumptions/{consumption}/mou-plans', [ConsumptionController::class, 'storeMouPlan'])->middleware('permission:procurement.consumption.create')->name('supply-plan.mou.store');
        Route::post('purchases', [ConsumptionController::class, 'storePurchase'])->middleware('permission:procurement.purchases.create')->name('purchases.store');
        Route::patch('purchases/{purchase}/delivery-status', [ConsumptionController::class, 'updateDelivery'])->middleware('permission:procurement.purchases.create')->name('purchases.delivery');
        Route::delete('purchases/{purchase}', [ConsumptionController::class, 'destroyPurchase'])->middleware('permission:procurement.purchases.create')->name('purchases.destroy');
        Route::post('consumptions', [ConsumptionController::class, 'storeConsumption'])->middleware('permission:procurement.consumption.create')->name('consumptions.store');
        Route::put('consumptions/{consumption}', [ConsumptionController::class, 'updateConsumption'])->middleware('permission:procurement.consumption.edit')->name('consumptions.update');
        Route::patch('consumptions/bulk', [ConsumptionController::class, 'bulkConsumptions'])->middleware('permission:procurement.consumption.edit')->name('consumptions.bulk');
        Route::patch('consumptions/empty', [ConsumptionController::class, 'emptyConsumptions'])->middleware('permission:procurement.consumption.delete')->name('consumptions.empty');
        Route::delete('consumptions/{consumption}', [ConsumptionController::class, 'destroyConsumption'])->middleware('permission:procurement.consumption.delete')->name('consumptions.destroy');
    });
