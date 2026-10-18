<?php

namespace Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('modules/sales/index', ['companies' => DB::table('tbl_company')->where('status', 1)->where('record_type', 1)->orderBy('company_name')->get(['id', 'company_code', 'company_name']), 'dashboard' => ['updated_at' => now()->format('d M Y, h:i A'), 'kpis' => [['label' => 'Sales this month', 'value' => 18450000, 'change' => 12.4], ['label' => 'Sales this year', 'value' => 174820000, 'change' => 8.7], ['label' => 'Target achieved', 'value' => 86.4, 'suffix' => '%', 'change' => 4.2], ['label' => 'Outstanding', 'value' => 32750000, 'change' => -6.1]], 'companies' => ['APL' => ['sales' => 108600000, 'target' => 120000000, 'achievement' => 90.5], 'KPL' => ['sales' => 66220000, 'target' => 82500000, 'achievement' => 80.3]], 'pipeline' => [['label' => 'Pending approval', 'count' => 12, 'amount' => 8650000], ['label' => 'Ready to dispatch', 'count' => 17, 'amount' => 12300000], ['label' => 'Partially dispatched', 'count' => 6, 'amount' => 4780000], ['label' => 'Delayed dispatch', 'count' => 4, 'amount' => 2150000]], 'outstanding' => [['label' => 'Not due', 'value' => 12800000, 'percent' => 39], ['label' => '1–30 days', 'value' => 9450000, 'percent' => 29], ['label' => '31–60 days', 'value' => 6230000, 'percent' => 19], ['label' => 'Over 60 days', 'value' => 4270000, 'percent' => 13]]]]);
    }
}
