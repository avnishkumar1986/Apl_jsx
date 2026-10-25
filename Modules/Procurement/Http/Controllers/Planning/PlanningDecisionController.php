<?php

namespace Modules\Procurement\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlanningDecisionController extends Controller
{
    private const COMPANY_MATERIAL_TYPES = ['1000' => 'ZRAW', '5000' => 'YRAW'];

    public function index(Request $request): Response
    {
        $this->releaseExpiredLocks();
        $month = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', (string) $request->string('month'))
            ? (string) $request->string('month')
            : now('Asia/Kolkata')->format('Y-m');
        $companyId = $request->integer('company_id');
        $plantId = $request->integer('plant_id');
        $material = trim((string) $request->string('material'));
        $search = trim((string) $request->string('search'));

        $companies = DB::table('tbl_company')->where('status', 1)->where('record_type', 1)
            ->whereIn('company_code', array_keys(self::COMPANY_MATERIAL_TYPES))
            ->orderBy('company_name')->get(['id', 'company_code', 'company_name']);
        $selectedCompany = $companies->firstWhere('id', $companyId) ?? $companies->first();
        $companyId = (int) ($selectedCompany->id ?? 0);
        $plants = DB::table('tbl_company as plant')->join('tbl_company as company', function ($join): void {
            $join->on('company.company_code', '=', 'plant.parent_company_id')->where('company.record_type', 1);
        })->where('plant.status', 1)->where('plant.record_type', 2)
            ->whereIn('company.company_code', array_keys(self::COMPANY_MATERIAL_TYPES))
            ->whereRaw("LOWER(TRIM(plant.company_name)) NOT IN ('head office', 'other plant')")
            ->orderBy('plant.company_name')->get(['plant.id', 'plant.company_code', 'plant.company_name', 'company.id as company_id']);
        $companyPlants = $plants->where('company_id', $companyId);
        $selectedPlant = $companyPlants->firstWhere('id', $plantId);
        $plantId = (int) ($selectedPlant->id ?? 0);
        $materialType = self::COMPANY_MATERIAL_TYPES[$selectedCompany->company_code ?? ''] ?? null;
        $decisions = DB::table('tbl_materials as material')
            ->crossJoin('tbl_company as selected_plant')
            ->leftJoin('procurement_planning_decisions as decision', function ($join) use ($companyId, $month): void {
                $join->on('decision.material', '=', 'material.matnr')
                    ->on('decision.plant_id', '=', 'selected_plant.id')
                    ->where('decision.company_id', $companyId)
                    ->whereDate('decision.planning_month', $month.'-01');
            })
            ->where('material.status', 1)
            ->where('selected_plant.status', 1)
            ->where('selected_plant.record_type', 2)
            ->where('selected_plant.parent_company_id', $selectedCompany->company_code ?? '')
            ->whereRaw("LOWER(TRIM(selected_plant.company_name)) NOT IN ('head office', 'other plant')")
            ->when($plantId > 0, fn ($query) => $query->where('selected_plant.id', $plantId))
            ->when($materialType, fn ($query) => $query->whereRaw('UPPER(TRIM(material.mtart)) = ?', [$materialType]))
            ->when($material !== '', fn ($query) => $query->where('material.matnr', $material))
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('material.matnr', 'like', "%{$search}%")
                ->orWhere('material.maktx', 'like', "%{$search}%")))
            ->select(
                'decision.id', 'decision.planning_mode', 'decision.planning_month', 'decision.locked_at', 'selected_plant.id as plant_id',
                'selected_plant.company_code as plant_code', 'selected_plant.company_name as plant_name',
                'material.matnr as material', 'material.maktx as material_name', 'material.mtart',
            )
            ->selectRaw('? as company_id, ? as company_code, ? as company_name', [
                $companyId, $selectedCompany->company_code ?? '', $selectedCompany->company_name ?? '',
            ])
            ->orderBy('selected_plant.company_name')->orderBy('material.maktx')
            ->paginate(50)->withQueryString();

        return Inertia::render('modules/procurement/planning/planning-decisions', [
            'companies' => $companies, 'plants' => $plants, 'decisions' => $decisions,
            'filters' => ['month' => $month, 'company_id' => $companyId ?: null, 'plant_id' => $plantId ?: null, 'material' => $material ?: null, 'search' => $search],
            'canManage' => $request->user()?->can('procurement.planning_decisions.create') ?? false,
            'canLock' => $request->user()?->can('procurement.planning_decisions.edit') ?? false,
            'canUnlock' => $this->isSuperAdmin($request),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->releaseExpiredLocks();
        $data = $request->validate([
            'company_id' => ['required', 'integer', 'exists:tbl_company,id'],
            'selections' => ['required', 'array', 'min:1'],
            'selections.*.plant_id' => ['required', 'integer', 'exists:tbl_company,id'],
            'selections.*.material' => ['required', 'string', 'max:50', 'exists:tbl_materials,matnr'],
            'planning_month' => ['required', 'date_format:Y-m'],
            'planning_mode' => ['required', Rule::in(['auto', 'manual'])],
        ]);
        $company = DB::table('tbl_company')->where('id', $data['company_id'])->where('record_type', 1)->first(['company_code']);
        abort_unless($company, 422, 'The selected company is invalid.');
        $selections = $this->validateSelections($company->company_code, $data['selections']);

        $now = now();
        $month = CarbonImmutable::parse($data['planning_month'].'-01')->toDateString();
        foreach ($selections as $selection) {
            $locked = DB::table('procurement_planning_decisions')
                ->where('company_id', $data['company_id'])->where('plant_id', $selection['plant_id'])
                ->whereDate('planning_month', $month)->where('material', $selection['material'])
                ->whereNotNull('locked_at')->exists();
            abort_if($locked, 422, 'Locked planning decisions cannot be changed.');
        }
        $rows = collect($selections)->map(fn (array $selection) => [
            'company_id' => $data['company_id'], 'plant_id' => $selection['plant_id'], 'material' => $selection['material'],
            'planning_month' => $month, 'planning_mode' => $data['planning_mode'], 'status' => 1,
            'created_by' => $request->user()?->id, 'created_at' => $now, 'updated_at' => $now,
        ])->all();
        DB::table('procurement_planning_decisions')->upsert(
            $rows,
            ['company_id', 'plant_id', 'material', 'planning_month'],
            ['planning_mode', 'status', 'updated_at'],
        );

        return back()->with('success', count($rows).' planning decision(s) saved.');
    }

    public function destroy(int $decision): RedirectResponse
    {
        $this->releaseExpiredLocks();
        $deleted = DB::table('procurement_planning_decisions')->where('id', $decision)->whereNull('locked_at')->delete();
        abort_unless($deleted === 1, 422, 'Locked planning decisions cannot be removed.');

        return back()->with('success', 'Planning decision removed.');
    }

    public function lock(Request $request, int $decision): RedirectResponse
    {
        $this->releaseExpiredLocks();
        $updated = DB::table('procurement_planning_decisions')->where('id', $decision)->whereNull('locked_at')->update([
            'locked_at' => now(), 'locked_by' => $request->user()?->id, 'updated_at' => now(),
        ]);
        abort_unless($updated === 1, 422, 'This planning decision is already locked.');

        return back()->with('success', 'Planning decision locked.');
    }

    public function unlock(Request $request, int $decision): RedirectResponse
    {
        abort_unless($this->isSuperAdmin($request), 403);

        DB::table('procurement_planning_decisions')->where('id', $decision)->update([
            'locked_at' => null, 'locked_by' => null,
            'unlocked_at' => now(), 'unlocked_by' => $request->user()?->id, 'updated_at' => now(),
        ]);

        return back()->with('success', 'Planning decision unlocked.');
    }

    public function lockAll(Request $request): RedirectResponse
    {
        $this->releaseExpiredLocks();
        $data = $this->validateBulkLock($request);
        $companyCode = DB::table('tbl_company')->where('id', $data['company_id'])->where('record_type', 1)->value('company_code');
        abort_unless($companyCode, 422, 'The selected company is invalid.');
        $selections = $this->validateSelections($companyCode, $data['selections']);
        $now = now();
        DB::table('procurement_planning_decisions')->insertOrIgnore(collect($selections)->map(fn (array $selection) => [
            'company_id' => $data['company_id'],
            'plant_id' => $selection['plant_id'],
            'material' => $selection['material'],
            'planning_month' => $data['planning_month'].'-01',
            'planning_mode' => 'auto',
            'status' => 1,
            'created_by' => $request->user()?->id,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all());
        $count = 0;
        foreach ($selections as $selection) {
            $count += DB::table('procurement_planning_decisions')
                ->where('company_id', $data['company_id'])->where('plant_id', $selection['plant_id'])
                ->whereDate('planning_month', $data['planning_month'].'-01')->where('material', $selection['material'])
                ->whereNull('locked_at')->update([
                    'locked_at' => now(), 'locked_by' => $request->user()?->id, 'updated_at' => now(),
                ]);
        }

        return back()->with('success', $count.' planning decision(s) locked.');
    }

    public function unlockAll(Request $request): RedirectResponse
    {
        abort_unless($this->isSuperAdmin($request), 403);

        $data = $this->validateBulkLock($request);
        $companyCode = DB::table('tbl_company')->where('id', $data['company_id'])->where('record_type', 1)->value('company_code');
        abort_unless($companyCode, 422, 'The selected company is invalid.');
        $selections = $this->validateSelections($companyCode, $data['selections']);
        $count = 0;
        foreach ($selections as $selection) {
            $count += DB::table('procurement_planning_decisions')
                ->where('company_id', $data['company_id'])->where('plant_id', $selection['plant_id'])
                ->whereDate('planning_month', $data['planning_month'].'-01')->where('material', $selection['material'])
                ->whereNotNull('locked_at')->update([
                    'locked_at' => null, 'locked_by' => null,
                    'unlocked_at' => now(), 'unlocked_by' => $request->user()?->id, 'updated_at' => now(),
                ]);
        }

        return back()->with('success', $count.' planning decision(s) unlocked.');
    }

    private function validateBulkLock(Request $request): array
    {
        return $request->validate([
            'company_id' => ['required', 'integer', 'exists:tbl_company,id'],
            'planning_month' => ['required', 'date_format:Y-m'],
            'selections' => ['required', 'array', 'min:1'],
            'selections.*.plant_id' => ['required', 'integer', 'exists:tbl_company,id'],
            'selections.*.material' => ['required', 'string', 'max:50', 'exists:tbl_materials,matnr'],
        ]);
    }

    private function validateSelections(string $companyCode, array $selections): array
    {
        $selections = collect($selections)->unique(fn (array $item) => $item['plant_id'].'|'.$item['material'])->values();
        $plantIds = $selections->pluck('plant_id')->unique()->values();
        $validPlantCount = DB::table('tbl_company')
            ->where('status', 1)
            ->where('record_type', 2)
            ->where('parent_company_id', $companyCode)
            ->whereRaw("LOWER(TRIM(company_name)) NOT IN ('head office', 'other plant')")
            ->whereIn('id', $plantIds)->count();
        abort_unless($validPlantCount === $plantIds->count(), 422, 'One or more selected plants are invalid.');

        $materials = $selections->pluck('material')->unique()->values();
        $materialType = self::COMPANY_MATERIAL_TYPES[$companyCode] ?? null;
        $validMaterialCount = DB::table('tbl_materials')->whereIn('matnr', $materials)->where('status', 1)
            ->whereRaw('UPPER(TRIM(mtart)) = ?', [$materialType])->count();
        abort_unless($validMaterialCount === $materials->count(), 422, 'One or more materials do not belong to the selected company.');

        return $selections->map(fn (array $item) => [
            'plant_id' => (int) $item['plant_id'],
            'material' => (string) $item['material'],
        ])->all();
    }

    private function releaseExpiredLocks(): void
    {
        DB::table('procurement_planning_decisions')
            ->whereDate('planning_month', '<', now('Asia/Kolkata')->startOfMonth()->toDateString())
            ->whereNotNull('locked_at')
            ->update([
                'locked_at' => null,
                'locked_by' => null,
                'updated_at' => now(),
            ]);
    }

    private function isSuperAdmin(Request $request): bool
    {
        return $request->user()?->getRoleNames()->contains(
            fn (string $role): bool => preg_match('/^super\s*admin(?:\b|\()/i', $role) === 1,
        ) ?? false;
    }
}
