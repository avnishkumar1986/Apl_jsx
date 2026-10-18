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
    public function index(Request $request): Response
    {
        $requestedMonth = trim((string) $request->string('month'));
        $month = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $requestedMonth)
            ? CarbonImmutable::parse($requestedMonth.'-01')->startOfMonth()
            : CarbonImmutable::now('Asia/Kolkata')->startOfMonth();
        $monthStart = $month->startOfMonth();
        $monthEnd = $month->endOfMonth();
        $plantCode = trim((string) $request->string('plant_code'));
        $materialCode = trim((string) $request->string('material'));
        $search = trim((string) $request->string('search'));
        $perPage = max(10, min(200, $request->integer('per_page', 50)));
        $sortable = ['material_name', 'material', 'plant_name', 'plant_code', 'opening_stock', 'daily_consumption', 'days', 'consumption', 'planned_buying', 'imports', 'supplier_receipts', 'total_buying', 'total_availability', 'closing_stock', 'shortage'];
        $sort = (string) $request->string('sort', 'material_name');
        $sort = in_array($sort, $sortable, true) ? $sort : 'material_name';
        $direction = strtolower((string) $request->string('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $plants = Cache::remember('procurement:active-plants', now()->addMinute(), fn () => DB::table('tbl_company')
            ->where('status', 1)->whereIn('record_type', [2, 3])
            ->whereRaw("LOWER(TRIM(company_name)) NOT IN ('head office', 'other plant')")
            ->orderBy('company_name')->get(['id', 'company_code', 'company_name']));
        $materials = Cache::remember('procurement:active-materials', now()->addMinute(), fn () => DB::table('tbl_materials')
            ->where('status', 1)->orderBy('maktx')->get(['matnr', 'maktx', 'meins']));
        $selectedPlants = $plantCode !== '' ? $plants->where('company_code', $plantCode) : $plants;
        $selectedMaterials = $materialCode !== '' ? $materials->where('matnr', $materialCode) : $materials;
        $plantIds = $selectedPlants->pluck('id');
        $plantCodes = $selectedPlants->pluck('company_code');
        $materialCodes = $selectedMaterials->pluck('matnr');

        $stocks = DB::table('tbl_material_stocks')->where('status', 1)
            ->whereIn('plant_code', $plantCodes)->whereIn('matnr', $materialCodes)
            ->select('matnr', 'plant_code', DB::raw('SUM(current_stock) as current_stock'))
            ->groupBy('matnr', 'plant_code')->get()->keyBy(fn ($row) => $row->matnr.'|'.$row->plant_code);
        $consumptions = DB::table('procurement_daily_consumptions')->where('status', 1)
            ->whereIn('plant_id', $plantIds)->whereIn('material', $materialCodes)
            ->whereDate('consumption_date', '<=', $monthEnd->toDateString())
            ->where(fn ($query) => $query->whereNull('effective_to')->orWhereDate('effective_to', '>=', $monthStart->toDateString()))
            ->orderByDesc('consumption_date')->get()->groupBy(fn ($row) => $row->material.'|'.$row->plant_id);
        $purchases = DB::table('vw_procurement_purchase_receipts')->where('status', 1)
            ->where('delivery_status', '!=', 'cancelled')->whereIn('plant_id', $plantIds)->whereIn('material', $materialCodes)
            ->whereBetween('expected_delivery_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->select('material', 'plant_id', DB::raw('SUM(quantity_mt) as quantity_mt'))
            ->groupBy('material', 'plant_id')->get()->keyBy(fn ($row) => $row->material.'|'.$row->plant_id);

        $rows = $selectedMaterials->flatMap(function ($material) use ($selectedPlants, $stocks, $consumptions, $purchases, $monthStart, $monthEnd) {
            return $selectedPlants->map(function ($plant) use ($material, $stocks, $consumptions, $purchases, $monthStart, $monthEnd) {
                $key = $material->matnr.'|'.$plant->id;
                $activePlan = $consumptions->get($key, collect())->first();
                $openingStock = (float) ($stocks->get($material->matnr.'|'.$plant->company_code)?->current_stock ?? 0) / 1000;
                $dailyConsumption = (float) ($activePlan?->quantity_mt ?? 0);
                $isStartMonth = $activePlan && CarbonImmutable::parse($activePlan->consumption_date)->format('Y-m') === $monthStart->format('Y-m');
                $days = $activePlan ? ($activePlan->period_type === 'datewise' ? 1 : ($isStartMonth ? max(1, (int) $activePlan->day_count) : $monthEnd->day)) : $monthEnd->day;
                $consumption = $dailyConsumption * $days;
                $plannedBuying = (float) ($activePlan?->planned_buying_mt ?? 0);
                $imports = (float) ($activePlan?->imports_mt ?? 0);
                $supplierReceipts = (float) ($purchases->get($key)?->quantity_mt ?? 0);
                $totalBuying = $plannedBuying + $imports + $supplierReceipts;
                $availability = $openingStock + $totalBuying;
                $closingStock = $availability - $consumption;

                return [
                    'material' => $material->matnr, 'material_name' => $material->maktx, 'unit' => $material->meins,
                    'plant_code' => $plant->company_code, 'plant_name' => $plant->company_name,
                    'opening_stock' => $openingStock, 'daily_consumption' => $dailyConsumption, 'days' => $days,
                    'consumption' => $consumption, 'planned_buying' => $plannedBuying, 'imports' => $imports,
                    'supplier_receipts' => $supplierReceipts, 'total_buying' => $totalBuying,
                    'total_availability' => $availability, 'closing_stock' => $closingStock,
                    'shortage' => max(0, -$closingStock),
                ];
            });
        })->filter(fn (array $row) => $search === '' || str_contains(strtolower(implode(' ', [$row['material'], $row['material_name'], $row['plant_code'], $row['plant_name']])), strtolower($search)));

        $rows = ($direction === 'desc' ? $rows->sortByDesc($sort) : $rows->sortBy($sort))->values();

        $page = max(1, $request->integer('page', 1));
        $paginated = new LengthAwarePaginator($rows->forPage($page, $perPage)->values(), $rows->count(), $perPage, $page, ['path' => $request->url(), 'query' => $request->query()]);

        return Inertia::render('modules/procurement/planning/all-balance-sheet', [
            'rows' => $paginated,
            'plants' => $plants,
            'materials' => $materials,
            'filters' => ['month' => $month->format('Y-m'), 'plant_code' => $plantCode, 'material' => $materialCode, 'search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'summary' => [
                'plants' => $selectedPlants->count(), 'materials' => $selectedMaterials->count(),
                'opening_stock' => $rows->sum('opening_stock'), 'consumption' => $rows->sum('consumption'),
                'closing_stock' => $rows->sum('closing_stock'), 'shortage' => $rows->sum('shortage'),
            ],
        ]);
    }
}
