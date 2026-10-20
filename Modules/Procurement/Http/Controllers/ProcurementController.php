<?php

namespace Modules\Procurement\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ImportMaterialsFromApi;
use App\Models\ApiIntegration;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProcurementController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $companyCode = trim((string) $request->query('company_code', ''));
        $plantCode = trim((string) $request->query('plant_code', ''));
        $materialCode = trim((string) $request->query('material', ''));
        $company = $companyCode !== '' ? DB::table('tbl_company')->where('company_code', $companyCode)->where('record_type', 1)->first() : null;
        $plant = $company && $plantCode !== ''
            ? DB::table('tbl_company')
                ->where('company_code', $plantCode)
                ->where('record_type', 2)
                ->when($company, fn ($query) => $query->where('parent_company_id', $company->company_code))
                ->first()
            : null;

        $filterConsumptions = function ($query) use ($company, $plant, $materialCode) {
            return $query
                ->when($company, fn ($query) => $query->where('company_id', $company->id))
                ->when($plant, fn ($query) => $query->where('plant_id', $plant->id))
                ->when($materialCode !== '', fn ($query) => $query->where('material', $materialCode));
        };
        $filterPurchases = function ($query) use ($company, $plant, $materialCode) {
            return $query
                ->when($company, fn ($query) => $query->where('company_id', $company->id))
                ->when($plant, fn ($query) => $query->where('plant_id', $plant->id))
                ->when($materialCode !== '', fn ($query) => $query->where('material', $materialCode));
        };

        $activeConsumptions = $filterConsumptions(DB::table('procurement_daily_consumptions')->where('status', 1));
        $activePurchases = $filterPurchases(DB::table('procurement_purchases')->where('status', 1));
        $openPurchases = $filterPurchases(DB::table('procurement_purchases')->where('status', 1)->whereIn('delivery_status', ['planned', 'in_transit', 'partially_received']));

        $plantDemand = DB::table('tbl_company as plant')
            ->leftJoin('procurement_daily_consumptions as consumption', function (JoinClause $join) use ($company, $materialCode): void {
                $join->on('consumption.plant_id', '=', 'plant.id')
                    ->where('consumption.status', 1)
                    ->when($company, fn (JoinClause $join) => $join->where('consumption.company_id', $company->id))
                    ->when($materialCode !== '', fn (JoinClause $join) => $join->where('consumption.material', $materialCode));
            })
            ->where('plant.record_type', 2)
            ->where('plant.status', 1)
            ->when($company, fn ($query) => $query->where('plant.parent_company_id', $company->company_code))
            ->when($plant, fn ($query) => $query->where('plant.id', $plant->id))
            ->select('plant.company_name as label', DB::raw('COALESCE(SUM(consumption.quantity_mt * COALESCE(consumption.day_count, 1)), 0) as value'))
            ->groupBy('plant.id', 'plant.company_name')
            ->orderByDesc('value')
            ->get();

        $materialDemand = DB::table('tbl_materials as material')
            ->leftJoin('procurement_daily_consumptions as consumption', function (JoinClause $join) use ($company, $plant): void {
                $join->on('consumption.material', '=', 'material.matnr')
                    ->where('consumption.status', 1)
                    ->when($company, fn (JoinClause $join) => $join->where('consumption.company_id', $company->id))
                    ->when($plant, fn (JoinClause $join) => $join->where('consumption.plant_id', $plant->id));
            })
            ->where('material.status', 1)
            ->when($materialCode !== '', fn ($query) => $query->where('material.matnr', $materialCode))
            ->select('material.matnr as code', 'material.maktx as name', DB::raw('COALESCE(SUM(consumption.quantity_mt * COALESCE(consumption.day_count, 1)), 0) as value'))
            ->groupBy('material.matnr', 'material.maktx')
            ->orderByDesc('value')
            ->get();

        $localDeliveryStatus = DB::table('procurement_purchases')
            ->where('status', 1)
            ->when($company, fn ($query) => $query->where('company_id', $company->id))
            ->when($plant, fn ($query) => $query->where('plant_id', $plant->id))
            ->when($materialCode !== '', fn ($query) => $query->where('material', $materialCode))
            ->select(
                DB::raw("'local' as source"),
                'id',
                'reference as po_number',
                'vendor_name',
                'delivery_status as label',
                'quantity_mt',
                'expected_delivery_date',
            )
            ->orderBy('expected_delivery_date')
            ->get();

        $apiDeliveryStatus = DB::table('tbl_vendor_purchase_orders')
            ->where('status', 1)
            ->when($plant, fn ($query) => $query->where('plant_code', $plant->company_code))
            ->when($company && ! $plant, function ($query) use ($company) {
                $plantCodes = DB::table('tbl_company')->where('record_type', 2)->where('parent_company_id', $company->company_code)->pluck('company_code');
                $query->whereIn('plant_code', $plantCodes);
            })
            ->when($materialCode !== '', fn ($query) => $query->where('material', $materialCode))
            ->select(
                DB::raw("'sap' as source"),
                'id',
                'po_number',
                'item_number',
                'vendor_name',
                'delivery_status as label',
                DB::raw("CASE WHEN delivery_status = 'received' THEN received_quantity_mt ELSE quantity_mt END as quantity_mt"),
                'expected_delivery_date',
            )
            ->orderBy('expected_delivery_date')
            ->get();

        $deliveryStatus = $localDeliveryStatus
            ->concat($apiDeliveryStatus)
            ->sortBy('expected_delivery_date')
            ->values()
            ->map(function ($purchase) {
                $purchase->po_number = filled($purchase->po_number)
                    ? $purchase->po_number.($purchase->source === 'sap' && filled($purchase->item_number ?? null) ? '/'.$purchase->item_number : '')
                    : 'LOCAL-'.$purchase->id;

                return $purchase;
            });
        $apiOpenPurchases = $apiDeliveryStatus->whereIn('label', ['planned', 'in_transit', 'partially_received']);
        $apiPurchaseQuantity = (float) $apiDeliveryStatus->sum('quantity_mt');
        $apiOpenQuantity = (float) $apiOpenPurchases->sum('quantity_mt');

        $stockByPlant = DB::table('tbl_company as plant')
            ->leftJoin('tbl_material_stocks as stock', function (JoinClause $join) use ($materialCode): void {
                $join->on('stock.plant_code', '=', 'plant.company_code')
                    ->where('stock.status', 1)
                    ->when($materialCode !== '', fn (JoinClause $join) => $join->where('stock.matnr', $materialCode));
            })
            ->where('plant.record_type', 2)
            ->where('plant.status', 1)
            ->when($company, fn ($query) => $query->where('plant.parent_company_id', $company->company_code))
            ->when($plant, fn ($query) => $query->where('plant.id', $plant->id))
            ->select('plant.company_name as label', DB::raw('COALESCE(SUM(stock.current_stock), 0) / 1000 as value'))
            ->groupBy('plant.id', 'plant.company_name')
            ->orderByDesc('value')
            ->get();

        return Inertia::render('modules/procurement/dashboard', [
            'filters' => ['company_code' => $company?->company_code ?? '', 'plant_code' => $plant?->company_code ?? '', 'material' => $materialCode],
            'companies' => DB::table('tbl_company')->where('record_type', 1)->where('status', 1)->orderBy('company_name')->get(['company_code', 'company_name']),
            'plants' => DB::table('tbl_company')->where('record_type', 2)->where('status', 1)->orderBy('company_name')->get(['company_code', 'company_name', 'parent_company_id']),
            'materials' => DB::table('tbl_materials')->where('status', 1)->orderBy('matnr')->get(['matnr', 'maktx']),
            'updatedAt' => now()->format('d M Y, h:i A'),
            'kpis' => [
                'active_consumptions' => (clone $activeConsumptions)->count(),
                'monthly_demand_mt' => (float) (clone $activeConsumptions)->sum(DB::raw('quantity_mt * COALESCE(day_count, 1)')),
                'purchase_quantity_mt' => (float) (clone $activePurchases)->sum('quantity_mt') + $apiPurchaseQuantity,
                'open_orders' => (clone $openPurchases)->count() + $apiOpenPurchases->count(),
                'open_order_quantity_mt' => (float) (clone $openPurchases)->sum('quantity_mt') + $apiOpenQuantity,
                'inventory_mt' => (float) DB::table('tbl_material_stocks')
                    ->where('status', 1)
                    ->when($plant, fn ($query) => $query->where('plant_code', $plant->company_code))
                    ->when($company && ! $plant, function ($query) use ($company) {
                        $plantCodes = DB::table('tbl_company')->where('record_type', 2)->where('parent_company_id', $company->company_code)->pluck('company_code');
                        $query->whereIn('plant_code', $plantCodes);
                    })
                    ->when($materialCode !== '', fn ($query) => $query->where('matnr', $materialCode))
                    ->sum('current_stock') / 1000,
            ],
            'plantDemand' => $plantDemand,
            'materialDemand' => $materialDemand,
            'deliveryStatus' => $deliveryStatus,
            'stockByPlant' => $stockByPlant,
        ]);
    }

    public function supplyPlan(int $consumption): Response
    {
        $plan = DB::table('vw_procurement_consumption_sheet')->where('id', $consumption)->first();
        abort_unless($plan, 404);
        $monthStart = CarbonImmutable::parse($plan->consumption_date)->startOfMonth();
        $plant = DB::table('tbl_company')->where('id', $plan->plant_id)->first(['company_code', 'company_name']);
        $company = DB::table('tbl_company')->where('id', $plan->company_id)->first(['company_code', 'company_name']);
        $material = DB::table('tbl_materials')->where('matnr', $plan->material)->first(['matnr', 'maktx', 'meins']);
        $this->syncVendorPurchaseOrdersForMaterial($plan->material);
        $purchases = DB::table('vw_procurement_purchase_receipts')
            ->where('material', $plan->material)
            ->where('plant_code', $plant?->company_code)
            ->where('status', 1)
            ->whereBetween('expected_delivery_date', [$monthStart->toDateString(), $monthStart->endOfMonth()->toDateString()])
            ->orderBy('expected_delivery_date')
            ->get()
            ->each(fn ($purchase) => $purchase->vendor_source = $purchase->source);
        $this->persistConsumptionCalculation($consumption);
        $storedResult = DB::table('procurement_balance_results')->where('material', $plan->material)->where('plant_id', $plan->plant_id)->whereDate('month', $monthStart->toDateString())->first();
        $calculation = json_decode((string) $storedResult?->calculations, true) ?: [];

        return Inertia::render('modules/procurement/planning/supply-plan', [
            'plan' => $plan,
            'plant' => $plant,
            'company' => $company,
            'material' => $material,
            'purchases' => $purchases,
            'mouPlans' => DB::table('procurement_mou_plans')->where('consumption_id', $plan->id)->orderBy('vendor_name')->get(),
            'vendors' => DB::table('tbl_vendor_purchase_orders')
                ->where('status', 1)
                ->where('plant_code', $plant?->company_code)
                ->where('material', $plan->material)
                ->whereNotNull('vendor_name')
                ->where('vendor_name', '!=', '')
                ->distinct()
                ->orderBy('vendor_name')
                ->pluck('vendor_name'),
            'summary' => [
                'opening_stock' => (float) ($calculation['opening_stock_mt'] ?? 0),
                'working_days' => (int) ($calculation['day_count'] ?? 1),
                'total_required' => (float) ($calculation['total_required_mt'] ?? 0),
                'projected_closing' => (float) ($calculation['projected_closing_mt'] ?? 0),
                'gross_shortage' => (float) ($calculation['gross_shortage_mt'] ?? 0),
                'remaining_shortage' => (float) ($calculation['remaining_shortage_mt'] ?? 0),
                'stock_cover' => (float) ($calculation['cover_days'] ?? 0),
            ],
        ]);
    }

    private function persistConsumptionCalculation(int $consumption): void
    {
        DB::statement('CALL sp_refresh_procurement_consumption_calculation(?)', [$consumption]);
    }

    private function syncVendorPurchaseOrdersForMaterial(?string $material = null): void
    {
        $fresh = DB::table('tbl_vendor_purchase_orders')
            ->when(filled($material), fn ($query) => $query->where('material', $material))
            ->where('synced_at', '>=', now()->subMinutes(15))
            ->exists();
        if ($fresh) {
            return;
        }

        $api = ApiIntegration::query()->where('code', 'vendor')->where('status', true)->first();
        if (! $api || blank($api->endpoint)) {
            return;
        }

        try {
            ImportMaterialsFromApi::dispatchSync($api->id, auth()->id(), $material);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    public function storeSupplyPlanPurchase(Request $request, int $consumption): RedirectResponse
    {
        $plan = DB::table('procurement_daily_consumptions')->where('id', $consumption)->first();
        abort_unless($plan, 404);
        $data = $request->validate(['vendor_name' => ['required', 'string', 'max:255'], 'quantity_mt' => ['required', 'numeric', 'gt:0'], 'expected_delivery_date' => ['required', 'date'], 'delivery_status' => ['required', Rule::in(['planned', 'in_transit', 'partially_received', 'received', 'cancelled'])], 'remarks' => ['nullable', 'string', 'max:1000']]);
        DB::table('procurement_purchases')->insert([...$data, 'company_id' => $plan->company_id, 'plant_id' => $plan->plant_id, 'consumption_id' => $plan->id, 'vendor_source' => 'local', 'material' => $plan->material, 'purchase_date' => CarbonImmutable::parse($plan->consumption_date)->startOfMonth()->toDateString(), 'reference' => null, 'status' => 1, 'submission_token' => (string) Str::uuid(), 'created_by' => $request->user()?->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->persistConsumptionCalculation($consumption);

        return back()->with('success', 'Manual purchase order created.');
    }

    public function storeMouPlan(Request $request, int $consumption): RedirectResponse
    {
        abort_unless(DB::table('procurement_daily_consumptions')->where('id', $consumption)->exists(), 404);
        $data = $request->validate(['vendor_name' => ['required', 'string', 'max:255'], 'vendor_code' => ['nullable', 'string', 'max:100'], 'quantity_mt' => ['required', 'numeric', 'gt:0'], 'remarks' => ['nullable', 'string', 'max:1000']]);
        DB::table('procurement_mou_plans')->updateOrInsert(['consumption_id' => $consumption, 'vendor_name' => $data['vendor_name']], [...$data, 'created_by' => $request->user()?->id, 'created_at' => now(), 'updated_at' => now()]);

        return back()->with('success', 'MOU lifting plan saved.');
    }

    public function balanceSheet(Request $request): Response
    {
        $companies = Cache::remember('procurement:balance-companies', now()->addMinutes(5), fn () => DB::table('tbl_company')
            ->where('status', 1)
            ->where('record_type', 1)
            ->orderBy('company_name')
            ->get(['id', 'company_code', 'company_name']));
        $companyCode = trim((string) $request->string('company_code'));
        $selectedCompany = $companyCode !== '' ? $companies->firstWhere('company_code', $companyCode) : null;
        if (! $selectedCompany && $request->integer('company_id') > 0) {
            $selectedCompany = $companies->firstWhere('id', $request->integer('company_id'));
        }
        $selectedCompany ??= $companies->first();
        $companyId = (int) ($selectedCompany->id ?? 0);
        $companyCode = (string) ($selectedCompany->company_code ?? '');
        $materials = Cache::remember('procurement:balance-materials', now()->addMinutes(2), fn () => DB::table('tbl_materials')
            ->where('status', 1)
            ->orderBy('maktx')
            ->limit(5000)
            ->get(['matnr', 'maktx', 'mtart', 'matkl', 'meins']));
        $materialCode = trim((string) $request->string('material')) ?: (string) ($materials->first()->matnr ?? '');
        $selectedMaterial = $materials->firstWhere('matnr', $materialCode);
        $requestedMonth = trim((string) $request->string('month'));
        $monthStart = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $requestedMonth)
            ? CarbonImmutable::parse($requestedMonth.'-01')->startOfMonth()
            : CarbonImmutable::now('Asia/Kolkata')->startOfMonth();
        $month = $monthStart->format('Y-m');
        $monthCount = max(1, min(60, $request->integer('months', 3)));

        $plantsQuery = DB::table('tbl_company')
            ->where('status', 1)
            ->whereIn('record_type', [2, 3])
            ->whereRaw("LOWER(TRIM(company_name)) NOT IN ('head office', 'other plant')");
        if ($selectedCompany) {
            $plantsQuery->where('parent_company_id', $selectedCompany->company_code);
        }
        $plantCode = trim((string) $request->string('plant_code'));
        if ($plantCode === '' && $request->integer('plant_id') > 0) {
            $plantCode = (string) DB::table('tbl_company')->where('id', $request->integer('plant_id'))->value('company_code');
        }
        if ($plantCode !== '') {
            $plantsQuery->where('company_code', $plantCode);
        }
        $plants = $plantsQuery->orderBy('record_type')->orderBy('company_name')->get(['id', 'company_code', 'company_name', 'record_type']);
        $selectedPlant = $plantCode !== '' ? $plants->firstWhere('company_code', $plantCode) : null;
        $plantId = (int) ($selectedPlant->id ?? 0);
        $plantCode = (string) ($selectedPlant->company_code ?? '');

        $periods = collect(range(0, $monthCount - 1))
            ->map(fn (int $offset) => $monthStart->addMonths($offset));
        $horizonEnd = $periods->last()->endOfMonth();

        // The visual balance workspace must remain instant when switching tabs.
        // API imports are managed by the integration runner; do not block this GET.
        if ($materialCode !== '' && ! $request->routeIs('admin.procurement.balance-overview')) {
            $this->syncVendorPurchaseOrdersForMaterial($materialCode);
        }
        $stocks = DB::table('tbl_material_stocks')
            ->where('matnr', $materialCode)
            ->where('status', 1)
            ->whereIn('plant_code', $plants->pluck('company_code'))
            ->select('plant_code', DB::raw('SUM(current_stock) as current_stock'))
            ->groupBy('plant_code')
            ->get()
            ->keyBy('plant_code');
        $consumptions = DB::table('procurement_daily_consumptions')
            ->where('material', $materialCode)
            ->where('status', 1)
            ->where('consumption_date', '<=', $horizonEnd->toDateString())
            ->whereIn('plant_id', $plants->pluck('id'))
            ->orderBy('consumption_date')
            ->get()
            ->groupBy('plant_id');
        $purchases = DB::table('vw_procurement_purchase_receipts')
            ->where('material', $materialCode)
            ->whereBetween('expected_delivery_date', [$monthStart->toDateString(), $horizonEnd->toDateString()])
            ->whereIn('plant_code', $plants->pluck('company_code'))
            ->get()
            ->groupBy(fn ($row) => $row->plant_id.'|'.CarbonImmutable::parse($row->expected_delivery_date)->format('Y-m'));
        $savedResults = DB::table('procurement_balance_results')->where('material', $materialCode)->whereBetween('month', [$monthStart->toDateString(), $horizonEnd->toDateString()])->whereIn('plant_id', $plants->pluck('id'))->get()->keyBy(fn ($row) => $row->plant_id.'|'.CarbonImmutable::parse($row->month)->format('Y-m'));
        $mouPlans = DB::table('procurement_mou_plans as mou')
            ->join('procurement_daily_consumptions as consumption', 'consumption.id', '=', 'mou.consumption_id')
            ->where('consumption.material', $materialCode)
            ->where('consumption.status', 1)
            ->whereBetween('consumption.consumption_date', [$monthStart->toDateString(), $horizonEnd->toDateString()])
            ->when($companyId > 0, fn ($query) => $query->where('consumption.company_id', $companyId))
            ->select('mou.vendor_name', 'mou.vendor_code', DB::raw('SUM(mou.quantity_mt) as quantity_mt'))
            ->groupBy('mou.vendor_name', 'mou.vendor_code')
            ->orderBy('mou.vendor_name')
            ->get();

        $rollingOpeningStock = $plants->mapWithKeys(fn ($plant) => [
            // SAP stock is stored in KG; all procurement planning calculations use MT.
            $plant->id => (float) ($stocks->get($plant->company_code)?->current_stock ?? 0) / 1000,
        ])->all();

        $plantColumns = $periods->flatMap(function (CarbonImmutable $period) use ($plants, $consumptions, $purchases, $savedResults, &$rollingOpeningStock, $plantId) {
            $periodKey = $period->format('Y-m');
            $periodStart = $period->startOfMonth();
            $periodEnd = $period->endOfMonth();

            return $plants->map(function ($plant) use ($consumptions, $purchases, $savedResults, &$rollingOpeningStock, $plantId, $periodKey, $periodStart, $periodEnd) {
                $groupKey = $plant->id.'|'.$periodKey;
                $activePlan = $consumptions->get($plant->id, collect())
                    ->filter(fn ($plan) => CarbonImmutable::parse($plan->consumption_date)->lte($periodEnd)
                        && (blank($plan->effective_to) || CarbonImmutable::parse($plan->effective_to)->gte($periodStart)))
                    ->sortByDesc('consumption_date')
                    ->first();
                $plantPurchases = $purchases->get($groupKey, collect());
                $calculationPurchases = $plantPurchases->filter(fn ($purchase) => (bool) $purchase->status && $purchase->delivery_status !== 'cancelled');
                $openingStock = $rollingOpeningStock[$plant->id] ?? 0;
                $dailyConsumption = (float) ($activePlan?->quantity_mt ?? 0);
                $isPlanStartMonth = $activePlan && CarbonImmutable::parse($activePlan->consumption_date)->format('Y-m') === $periodKey;
                $days = $activePlan ? ($activePlan->period_type === 'datewise' ? 1 : ($isPlanStartMonth ? max(1, (int) $activePlan->day_count) : $periodEnd->day)) : $periodEnd->day;
                $plannedBuying = (float) ($activePlan?->planned_buying_mt ?? 0);
                // Buying / Imports represents SAP-generated POs only. Portal POs
                // are displayed separately under To Buy, but both sources still
                // contribute to Total Buying and stock availability.
                $localPurchases = $calculationPurchases->where('source', 'local');
                $supplierPurchases = $calculationPurchases->where('source', '!=', 'local');
                $localPurchaseQuantity = (float) $localPurchases->sum('quantity_mt');
                $sapPurchaseQuantity = (float) $supplierPurchases->sum('quantity_mt');
                $toBuy = $plannedBuying + $localPurchaseQuantity;
                $imports = $sapPurchaseQuantity;
                $supplierReceipts = $imports;
                $consumption = $dailyConsumption * $days;
                // Total Buying and shortage calculations include both categorized
                // PO sources even though Buying / Imports displays SAP only.
                $totalBuying = $toBuy + $sapPurchaseQuantity;
                $totalAvailability = $openingStock + $totalBuying;
                $closingStock = $totalAvailability - $consumption;
                $grossShortage = max(0, $consumption - ($openingStock + $plannedBuying));
                $remainingShortage = max(0, $grossShortage - $localPurchaseQuantity - $sapPurchaseQuantity);
                $purchaseOrders = $plantPurchases->map(fn ($purchase) => [
                    'po_number' => $purchase->reference ?: 'Manual PO',
                    'vendor_name' => $purchase->vendor_name ?: 'Vendor not provided',
                    'quantity_mt' => (float) $purchase->quantity_mt,
                    'eta' => $purchase->expected_delivery_date,
                    'source' => $purchase->source ?? 'local',
                    'status' => $purchase->delivery_status,
                ])->values();
                $saved = $savedResults->get($groupKey);
                $remarks = $saved?->remarks ? (json_decode($saved->remarks, true) ?: []) : [];
                $rollingOpeningStock[$plant->id] = $closingStock;

                return [
                    'id' => (int) $plant->id,
                    'column_key' => $groupKey,
                    'month' => $periodKey,
                    'code' => $plant->company_code,
                    'name' => $plantId > 0 ? $plant->company_name.' · '.$periodEnd->format('F Y') : $plant->company_name,
                    'consumption_id' => $activePlan?->id,
                    'opening_stock' => $openingStock,
                    'cover_days' => $dailyConsumption > 0 ? $openingStock / $dailyConsumption : null,
                    'to_buy' => $toBuy,
                    'supplier_receipts' => $supplierReceipts,
                    'purchase_orders' => $purchaseOrders,
                    'buying_imports' => $imports,
                    'total_buying' => $totalBuying,
                    'total_availability' => $totalAvailability,
                    'average_consumption' => $dailyConsumption,
                    'days' => $days,
                    'consumption' => $consumption,
                    'gross_shortage' => $grossShortage,
                    'closing_stock' => $closingStock,
                    'remaining_shortage' => $remainingShortage,
                    'remarks' => $remarks,
                ];
            });
        })->values();

        $page = $request->routeIs('admin.procurement.balance-overview')
            ? 'modules/procurement/planning/balance-overview'
            : 'modules/procurement/planning/balance-sheet';

        return Inertia::render($page, [
            'companies' => $companies,
            'plants' => $plants,
            'materials' => $materials,
            'columns' => $plantColumns,
            'mouPlans' => $mouPlans,
            'selectedMaterial' => $selectedMaterial,
            'filters' => ['company_code' => $companyCode, 'plant_code' => $plantCode ?: null, 'material' => $materialCode, 'month' => $month, 'months' => $monthCount],
            'canManage' => $request->user()?->can('users.manage') ?? false,
        ]);
    }

    public function updateBalanceRemark(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'material' => ['required', 'string', 'max:50'],
            'plant_id' => ['required', 'integer', 'exists:tbl_company,id'],
            'month' => ['required', 'date_format:Y-m'],
            'metric' => ['required', Rule::in(['opening_stock', 'cover_days', 'to_buy', 'supplier_receipts', 'buying_imports', 'total_buying', 'total_availability', 'average_consumption', 'days', 'consumption', 'gross_shortage', 'closing_stock', 'remaining_shortage'])],
            'remark' => ['nullable', 'string', 'max:1000'],
        ]);
        $month = CarbonImmutable::parse($data['month'].'-01')->toDateString();
        $existing = DB::table('procurement_balance_results')->where('material', $data['material'])->where('plant_id', $data['plant_id'])->whereDate('month', $month)->first();
        $remarks = $existing?->remarks ? (json_decode($existing->remarks, true) ?: []) : [];
        if (filled($data['remark'] ?? null)) {
            $remarks[$data['metric']] = $data['remark'];
        } else {
            unset($remarks[$data['metric']]);
        }
        DB::table('procurement_balance_results')->updateOrInsert(
            ['material' => $data['material'], 'plant_id' => $data['plant_id'], 'month' => $month],
            ['calculations' => $existing?->calculations ?? '{}', 'remarks' => json_encode($remarks), 'created_at' => $existing?->created_at ?? now(), 'updated_at' => now()],
        );

        return back()->with('success', 'Balance sheet remark saved.');
    }

    private function normaliseMonth(string $month): string
    {
        if (preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            return $month;
        }

        return now()->format('Y-m');
    }

    public function index(Request $r): Response
    {
        $search = trim((string) $r->string('search'));
        $tab = $r->routeIs('admin.procurement.daily-consumption.index') ? 'consumptions' : 'purchases';
        $companies = DB::table('tbl_company')->where('status', 1)->orderBy('company_name')->get(['id', 'company_code', 'company_name', 'record_type', 'parent_company_id']);
        $purchases = $tab === 'purchases'
            ? DB::table('procurement_purchases as p')->leftJoin('tbl_company as c', 'c.id', '=', 'p.company_id')->leftJoin('tbl_company as plant', 'plant.id', '=', 'p.plant_id')->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('p.material', 'like', "%{$search}%")->orWhere('p.vendor_name', 'like', "%{$search}%")->orWhere('p.reference', 'like', "%{$search}%")))->select('p.*', 'c.company_name', 'plant.company_name as plant_name')->latest('p.purchase_date')->limit(200)->get()
            : collect();
        $consumptions = collect();
        if ($tab === 'consumptions') {
            $consumptions = DB::table('vw_procurement_consumption_sheet')
                ->where('status', 1)
                ->whereRaw("LOWER(TRIM(plant_name)) NOT IN ('head office', 'other plant')")
                ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('material', 'like', "%{$search}%")->orWhere('company_name', 'like', "%{$search}%")->orWhere('plant_name', 'like', "%{$search}%")))
                ->latest('consumption_date')
                ->limit(200)
                ->get();
        }

        return Inertia::render('modules/procurement/planning/consumption', [
            'purchases' => $purchases,
            'consumptions' => $consumptions,
            'companies' => $companies,
            'stats' => [
                'purchases' => DB::table('procurement_purchases')->where('status', 1)->count(),
                'purchase_mt' => (float) DB::table('procurement_purchases')->where('status', 1)->sum('quantity_mt'),
                'planned_mt' => (float) DB::table('procurement_daily_consumptions')->where('status', 1)->sum('quantity_mt'),
                'open_orders' => DB::table('procurement_purchases')->where('status', 1)->whereNotIn('delivery_status', ['received', 'cancelled'])->count(),
            ],
            'filters' => ['search' => $search, 'tab' => $tab],
            'canManagePurchases' => $r->user()?->can('procurement.purchases.create') ?? false,
            'canManageConsumptions' => $r->user()?->can('procurement.daily_consumption.create') ?? false,
        ]);
    }

    public function referenceData(): JsonResponse
    {
        return response()->json([
            'materials' => DB::table('tbl_materials')->where('status', 1)->orderBy('maktx')->limit(5000)->get(['matnr', 'maktx']),
            'materialStocks' => DB::table('tbl_material_stocks')->where('status', 1)->get(['matnr', 'plant_code', 'current_stock']),
        ]);
    }

    public function vendors(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'plant_code' => ['required', 'string', 'max:30'],
            'material' => ['required', 'string', 'max:50'],
        ]);

        return response()->json([
            'vendors' => DB::table('tbl_vendor_purchase_orders')
                ->where('status', 1)
                ->where('plant_code', $filters['plant_code'])
                ->where('material', $filters['material'])
                ->whereNotNull('vendor_name')
                ->where('vendor_name', '!=', '')
                ->distinct()
                ->orderBy('vendor_name')
                ->pluck('vendor_name'),
        ]);
    }

    public function storePurchase(Request $r): RedirectResponse
    {
        $d = $r->validate(['company_id' => ['required', 'integer', 'exists:tbl_company,id'], 'plant_id' => ['required', 'integer', 'exists:tbl_company,id'], 'consumption_id' => ['nullable', 'integer', 'exists:procurement_daily_consumptions,id'], 'vendor_name' => ['required', 'string', 'max:255'], 'vendor_source' => ['required', Rule::in(['sap', 'local'])], 'material' => ['required', 'string', 'max:50'], 'purchase_date' => ['required', 'date'], 'quantity_mt' => ['required', 'numeric', 'gt:0'], 'expected_delivery_date' => ['required', 'date'], 'delivery_status' => ['required', Rule::in(['planned', 'in_transit', 'partially_received', 'received', 'cancelled'])], 'reference' => ['nullable', 'string', 'max:100'], 'remarks' => ['nullable', 'string', 'max:1000']]);
        DB::table('procurement_purchases')->insert([...$d, 'status' => 1, 'submission_token' => (string) Str::uuid(), 'created_by' => $r->user()?->id, 'created_at' => now(), 'updated_at' => now()]);

        return back()->with('success', 'Purchase plan created.');
    }

    public function updateDelivery(Request $r, int $purchase): RedirectResponse
    {
        $d = $r->validate(['delivery_status' => ['required', Rule::in(['planned', 'in_transit', 'partially_received', 'received', 'cancelled'])]]);
        DB::table('procurement_purchases')->where('id', $purchase)->update([...$d, 'updated_at' => now()]);

        return back()->with('success', 'Delivery status updated.');
    }

    public function destroyPurchase(int $purchase): RedirectResponse
    {
        DB::table('procurement_purchases')->where('id', $purchase)->delete();

        return back()->with('success', 'Purchase plan deleted.');
    }

    public function storeConsumption(Request $r): RedirectResponse
    {
        $data = $r->validate(['company_id' => ['required', 'integer', 'exists:tbl_company,id'], 'consumption_date' => ['required', 'date'], 'period_type' => ['required', Rule::in(['monthly', 'datewise'])], 'day_count' => ['required', 'integer', 'between:1,31'], 'material' => ['required', 'string', 'max:50', 'exists:tbl_materials,matnr'], 'common_remarks' => ['nullable', 'string', 'max:1000'], 'entries' => ['required', 'array', 'min:1'], 'entries.*.plant_id' => ['required', 'integer', 'exists:tbl_company,id'], 'entries.*.quantity_mt' => ['required', 'numeric', 'gt:0'], 'entries.*.remarks' => ['nullable', 'string', 'max:1000']]);
        $rows = collect($data['entries'])->map(fn ($entry) => ['company_id' => $data['company_id'], 'plant_id' => $entry['plant_id'], 'consumption_date' => $data['consumption_date'], 'effective_to' => null, 'period_type' => $data['period_type'], 'day_count' => $data['day_count'], 'material' => $data['material'], 'quantity_mt' => $entry['quantity_mt'], 'planned_buying_mt' => 0, 'imports_mt' => 0, 'total_buying_mt' => 0, 'remarks' => $entry['remarks'] ?: ($data['common_remarks'] ?? null), 'status' => 1, 'submission_token' => (string) Str::uuid(), 'created_by' => $r->user()?->id, 'created_at' => now(), 'updated_at' => now()])->all();
        DB::table('procurement_daily_consumptions')->insert($rows);

        return back()->with('success', count($rows).' plant consumption entries created.');
    }

    public function destroyConsumption(int $consumption): RedirectResponse
    {
        DB::table('procurement_daily_consumptions')->where('id', $consumption)->update(['status' => 0, 'updated_at' => now()]);

        return back()->with('success', 'Consumption plan moved to inactive status.');
    }

    public function updateConsumption(Request $request, int $consumption): RedirectResponse
    {
        abort_unless(DB::table('procurement_daily_consumptions')->where('id', $consumption)->where('status', 1)->exists(), 404);
        $data = $request->validate(['company_id' => ['required', 'integer', 'exists:tbl_company,id'], 'consumption_date' => ['required', 'date'], 'period_type' => ['required', Rule::in(['monthly', 'datewise'])], 'day_count' => ['required', 'integer', 'between:1,31'], 'material' => ['required', 'string', 'max:50', 'exists:tbl_materials,matnr'], 'common_remarks' => ['nullable', 'string', 'max:1000'], 'entries' => ['required', 'array', 'size:1'], 'entries.0.plant_id' => ['required', 'integer', 'exists:tbl_company,id'], 'entries.0.quantity_mt' => ['required', 'numeric', 'gt:0'], 'entries.0.remarks' => ['nullable', 'string', 'max:1000']]);
        $entry = $data['entries'][0];
        DB::table('procurement_daily_consumptions')->where('id', $consumption)->update(['company_id' => $data['company_id'], 'plant_id' => $entry['plant_id'], 'consumption_date' => $data['consumption_date'], 'period_type' => $data['period_type'], 'day_count' => $data['day_count'], 'material' => $data['material'], 'quantity_mt' => $entry['quantity_mt'], 'remarks' => $entry['remarks'] ?: ($data['common_remarks'] ?? null), 'updated_at' => now()]);

        return back()->with('success', 'Consumption plan updated.');
    }

    public function bulkConsumptions(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer', 'exists:procurement_daily_consumptions,id'], 'action' => ['required', Rule::in(['delete'])]]);
        DB::table('procurement_daily_consumptions')->whereIn('id', $data['ids'])->update(['status' => 0, 'updated_at' => now()]);

        return back()->with('success', count($data['ids']).' consumption plans moved to inactive status.');
    }

    public function emptyConsumptions(): RedirectResponse
    {
        $count = DB::table('procurement_daily_consumptions')->where('status', 1)->update(['status' => 0, 'updated_at' => now()]);

        return back()->with('success', $count.' consumption plans moved to inactive status.');
    }
}
