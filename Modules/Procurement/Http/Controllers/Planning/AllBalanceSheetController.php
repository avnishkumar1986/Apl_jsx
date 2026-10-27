<?php

namespace Modules\Procurement\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AllBalanceSheetController extends Controller
{
    private const COMPANY_MATERIAL_TYPES = [
        '1000' => 'ZRAW',
        '5000' => 'YRAW',
    ];

    public function index(Request $request): Response
    {
        $requestedMonth = trim((string) $request->string('month'));
        $month = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $requestedMonth)
            ? CarbonImmutable::parse($requestedMonth.'-01')->startOfMonth()
            : CarbonImmutable::now('Asia/Kolkata')->startOfMonth();
        $monthStart = $month->startOfMonth();
        $monthEnd = $month->endOfMonth();
        $companies = Cache::remember('procurement:all-balance-companies:v2', now()->addMinutes(5), fn () => DB::table('tbl_company')
            ->where('status', 1)
            ->where('record_type', 1)
            ->whereIn('company_code', array_keys(self::COMPANY_MATERIAL_TYPES))
            ->orderByRaw("FIELD(company_code, '1000', '5000')")
            ->get(['id', 'company_code', 'company_name']));
        $companyCode = trim((string) $request->string('company_code'));
        $selectedCompany = $companyCode !== '' ? $companies->firstWhere('company_code', $companyCode) : null;
        $selectedCompany ??= $companies->first();
        $companyCode = (string) ($selectedCompany->company_code ?? '');
        $materialType = self::COMPANY_MATERIAL_TYPES[$companyCode] ?? null;
        $plantCode = trim((string) $request->string('plant_code'));
        $materialCode = trim((string) $request->string('material'));
        $search = trim((string) $request->string('search'));
        $pageSizeOptions = config('datatable.page_size_options');
        $perPage = $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $pageSizeOptions, true)) {
            $perPage = (int) config('datatable.per_page');
        }
        $sortable = ['material_name', 'material', 'plant_name', 'plant_code', 'opening_stock', 'auto_monthly_consumption', 'auto_perday_consumption', 'daily_consumption', 'consumption', 'planned_po', 'planned_buying', 'imports', 'supplier_receipts', 'total_buying', 'total_availability', 'closing_stock', 'shortage'];
        $sort = (string) $request->string('sort', 'material_name');
        $sort = in_array($sort, $sortable, true) ? $sort : 'material_name';
        $direction = strtolower((string) $request->string('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $plants = Cache::remember('procurement:active-plants:'.$companyCode, now()->addMinute(), fn () => DB::table('tbl_company')
            ->where('status', 1)->where('record_type', 2)
            ->where('parent_company_id', $companyCode)
            ->whereRaw("LOWER(TRIM(company_name)) NOT IN ('head office', 'other plant')")
            ->orderBy('company_name')->get(['id', 'company_code', 'company_name', 'parent_company_id']));
        $materials = Cache::remember('procurement:active-materials:'.($materialType ?? 'none'), now()->addMinute(), fn () => DB::table('tbl_materials')
            ->where('status', 1)
            ->when($materialType, fn ($query) => $query->whereRaw('UPPER(TRIM(mtart)) = ?', [$materialType]))
            ->when(! $materialType, fn ($query) => $query->whereRaw('1 = 0'))
            ->orderBy('maktx')->get(['matnr', 'maktx', 'meins', 'mtart']));
        if ($plantCode !== '' && ! $plants->contains('company_code', $plantCode)) {
            $plantCode = '';
        }
        if ($materialCode !== '' && ! $materials->contains('matnr', $materialCode)) {
            $materialCode = '';
        }
        $selectedPlants = $plantCode !== '' ? $plants->where('company_code', $plantCode) : $plants;
        $selectedMaterials = $materialCode !== '' ? $materials->where('matnr', $materialCode) : $materials;
        $plantCodes = $selectedPlants->pluck('company_code');
        $materialCodes = $selectedMaterials->pluck('matnr');

        $stockQuery = DB::table('tbl_material_stocks')->where('status', 1)
            ->whereIn('plant_code', $plantCodes)->whereIn('matnr', $materialCodes)
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('matnr', 'like', "%{$search}%")
                ->orWhere('material_desc', 'like', "%{$search}%")
                ->orWhere('plant_code', 'like', "%{$search}%")))
            ->select(
                'matnr',
                'plant_code',
                DB::raw('SUM(current_stock) as current_stock'),
                DB::raw('SUM(stock_value) as stock_value'),
                DB::raw('SUM(auto_perday_consumption) * '.((int) $monthEnd->day).' as auto_monthly_consumption'),
                DB::raw('SUM(auto_perday_consumption) as auto_perday_consumption'),
            )
            ->groupBy('matnr', 'plant_code');
        $stocks = $stockQuery->get()->keyBy(fn ($row) => $row->matnr.'|'.$row->plant_code);
        $pageMaterialCodes = $stocks->pluck('matnr')->unique()->values();
        $plantsByCode = $selectedPlants->keyBy('company_code');
        $pagePlantIds = $stocks->pluck('plant_code')->unique()->map(fn ($code) => $plantsByCode->get($code)?->id)->filter()->values();
        $planningDecisions = DB::table('procurement_planning_decisions')
            ->where('company_id', $selectedCompany->id)
            ->whereDate('planning_month', $monthStart->toDateString())
            ->where('status', 1)
            ->whereIn('plant_id', $pagePlantIds)
            ->whereIn('material', $pageMaterialCodes)
            ->get(['plant_id', 'material', 'planning_mode'])
            ->keyBy(fn ($decision) => $decision->material.'|'.$decision->plant_id);
        $consumptions = DB::table('procurement_daily_consumptions')->where('status', 1)
            ->whereIn('plant_id', $pagePlantIds)->whereIn('material', $pageMaterialCodes)
            ->whereDate('consumption_date', '<=', $monthEnd->toDateString())
            ->where(fn ($query) => $query->whereNull('effective_to')->orWhereDate('effective_to', '>=', $monthStart->toDateString()))
            ->orderByDesc('consumption_date')->get()->groupBy(fn ($row) => $row->material.'|'.$row->plant_id);
        $purchases = DB::table('vw_procurement_purchase_receipts')->where('status', 1)
            ->where('delivery_status', '!=', 'cancelled')->whereIn('plant_id', $pagePlantIds)->whereIn('material', $pageMaterialCodes)
            ->whereBetween('expected_delivery_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->select(
                'material',
                'plant_id',
                DB::raw("SUM(CASE WHEN delivery_status = 'planned' THEN quantity_mt ELSE 0 END) as planned_po_mt"),
                DB::raw("SUM(CASE WHEN source = 'local' THEN quantity_mt ELSE 0 END) as local_quantity_mt"),
                DB::raw("SUM(CASE WHEN source <> 'local' THEN quantity_mt ELSE 0 END) as sap_quantity_mt"),
            )
            ->groupBy('material', 'plant_id')->get()->keyBy(fn ($row) => $row->material.'|'.$row->plant_id);

        $materialsByCode = $selectedMaterials->keyBy('matnr');
        $rows = $stocks->values()->map(function ($stock) use ($materialsByCode, $plantsByCode, $consumptions, $purchases, $monthStart, $monthEnd, $planningDecisions) {
            $material = $materialsByCode->get($stock->matnr);
            $plant = $plantsByCode->get($stock->plant_code);
            $key = $stock->matnr.'|'.$plant->id;
            $activePlan = $consumptions->get($key, collect())->first();
            $openingStock = (float) $stock->current_stock / 1000;
            $openingStockValue = (float) $stock->stock_value;
            $autoMonthlyConsumption = (float) $stock->auto_monthly_consumption / 1000;
            $autoPerdayConsumption = (float) $stock->auto_perday_consumption / 1000;
            $manualPerdayConsumption = (float) ($activePlan?->quantity_mt ?? 0);
            $rowPlanningMode = $planningDecisions->get($key)?->planning_mode ?? 'auto';
            if ($rowPlanningMode === 'manual' && ! $activePlan) {
                return null;
            }
            $dailyConsumption = $rowPlanningMode === 'auto' ? $autoPerdayConsumption : $manualPerdayConsumption;
            $isStartMonth = $activePlan && CarbonImmutable::parse($activePlan->consumption_date)->format('Y-m') === $monthStart->format('Y-m');
            $days = $rowPlanningMode === 'auto'
                ? $monthEnd->day
                : ($activePlan ? ($activePlan->period_type === 'datewise' ? 1 : ($isStartMonth ? max(1, (int) $activePlan->day_count) : $monthEnd->day)) : $monthEnd->day);
            $consumption = $dailyConsumption * $days;
            $plannedBuying = (float) ($activePlan?->planned_buying_mt ?? 0);
            $plannedPo = (float) ($purchases->get($key)?->planned_po_mt ?? 0);
            $localPurchases = (float) ($purchases->get($key)?->local_quantity_mt ?? 0);
            $sapPurchases = (float) ($purchases->get($key)?->sap_quantity_mt ?? 0);
            $imports = $localPurchases + $sapPurchases;
            $supplierReceipts = $imports;
            $totalBuying = $plannedBuying + $imports;
            $availability = $openingStock + $totalBuying;
            $closingStock = $availability - $consumption;

            return [
                'material' => $stock->matnr, 'material_name' => $material?->maktx ?? $stock->matnr, 'unit' => $material?->meins,
                'plant_code' => $stock->plant_code, 'plant_name' => $plant->company_name,
                'opening_stock' => $openingStock,
                'opening_stock_value' => $openingStockValue,
                'auto_monthly_consumption' => $autoMonthlyConsumption,
                'auto_perday_consumption' => $autoPerdayConsumption,
                'planning_mode' => $rowPlanningMode,
                'daily_consumption' => $dailyConsumption, 'days' => $days,
                'consumption' => $consumption, 'planned_po' => $plannedPo, 'planned_buying' => $plannedBuying, 'imports' => $imports,
                'supplier_receipts' => $supplierReceipts, 'total_buying' => $totalBuying,
                'total_availability' => $availability, 'closing_stock' => $closingStock,
                'shortage' => max(0, $consumption - $availability),
            ];
        })->filter()->filter(fn (array $row) => $search === '' || str_contains(strtolower(implode(' ', [$row['material'], $row['material_name'], $row['plant_code'], $row['plant_name']])), strtolower($search)));

        $rows = $rows->unique(fn (array $row) => $row['material'].'|'.$row['plant_code'])->values();
        $rows = ($direction === 'desc' ? $rows->sortByDesc($sort) : $rows->sortBy($sort))->values();
        $rowModes = $rows->pluck('planning_mode')->unique()->values();
        $planningMode = $rowModes->count() > 1 ? 'mixed' : ($rowModes->first() ?? 'auto');
        $page = max(1, $request->integer('page', 1));
        $paginated = new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('modules/procurement/planning/all-balance-sheet', [
            'rows' => $paginated,
            'companies' => $companies,
            'plants' => $plants,
            'materials' => $materials,
            'filters' => ['month' => $month->format('Y-m'), 'company_code' => $companyCode, 'plant_code' => $plantCode, 'material' => $materialCode, 'search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'planningMode' => $planningMode,
            'summary' => [
                'material_type' => $materialType,
                'plants' => $selectedPlants->count(), 'materials' => $selectedMaterials->count(),
                'opening_stock' => $rows->sum('opening_stock'), 'opening_stock_value' => $rows->sum('opening_stock_value'),
                'consumption' => $rows->sum('consumption'),
                'closing_stock' => $rows->sum('closing_stock'), 'shortage' => $rows->sum('shortage'),
            ],
        ]);
    }
}
