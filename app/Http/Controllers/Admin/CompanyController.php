<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\MaterialStock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $options = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $options, true)) {
            $perPage = (int) config('datatable.per_page');
        }
        $search = trim((string) $request->string('search'));
        $sort = (string) $request->string('sort', 'name');
        $direction = $request->string('direction')->lower()->value() === 'desc' ? 'desc' : 'asc';
        $sortable = ['code' => 'company_code', 'name' => 'company_name', 'type' => 'record_type', 'status' => 'status', 'created_at' => 'created_at'];
        if (! isset($sortable[$sort])) {
            $sort = 'name';
        }

        return Inertia::render('admin/companies/index', [
            'companies' => Company::query()->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('company_code', 'like', "%{$search}%")->orWhere('company_name', 'like', "%{$search}%")->orWhere('gstin', 'like', "%{$search}%")->orWhere('pan', 'like', "%{$search}%")))->orderBy($sortable[$sort], $direction)->paginate($perPage)->withQueryString(),
            'parentCompanies' => Company::query()->where('status', true)->where('record_type', 1)->orderBy('company_name')->get(['company_code', 'company_name']),
            'filters' => ['search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'pageSizeOptions' => $options,
            'stats' => ['total' => Company::count(), 'active' => Company::where('status', true)->count()],
            'canManage' => $request->user()?->can('users.manage') ?? false,
        ]);
    }

    public function hierarchy(Request $request): Response
    {
        $companies = Company::query()
            ->orderBy('record_type')
            ->orderBy('company_name')
            ->get(['id', 'company_code', 'company_name', 'record_type', 'parent_company_id', 'gstin', 'status']);

        $childrenByParent = $companies->whereNotNull('parent_company_id')->groupBy('parent_company_id');
        $roots = $companies->filter(fn (Company $company): bool => $company->record_type === 1 && $company->parent_company_id === null);
        $headOffices = $companies->where('record_type', 3);
        $knownCodes = $companies->pluck('company_code');
        $orphans = $companies->filter(fn (Company $company): bool => $company->record_type !== 3 && $company->parent_company_id !== null && ! $knownCodes->contains($company->parent_company_id));

        $view = in_array($request->string('view')->value(), ['plants', 'materials'], true) ? $request->string('view')->value() : 'companies';
        $materialsByPlant = collect();
        if ($view === 'materials') {
            $companies->where('record_type', 2)->each(function (Company $plant) use ($materialsByPlant): void {
                $query = MaterialStock::query()->where('plant_code', $plant->company_code);
                $total = (clone $query)->count();
                $items = $query
                    ->leftJoin('tbl_materials', 'tbl_materials.matnr', '=', 'tbl_material_stocks.matnr')
                    ->orderBy('tbl_material_stocks.material_desc')
                    ->limit(24)
                    ->get(['tbl_material_stocks.matnr', 'tbl_material_stocks.material_desc', 'tbl_material_stocks.current_stock', 'tbl_material_stocks.status', 'tbl_materials.maktx'])
                    ->map(fn ($material): array => [
                        'code' => $material->matnr,
                        'name' => $material->maktx ?: $material->material_desc ?: $material->matnr,
                        'stock' => (float) $material->current_stock,
                        'active' => (bool) $material->status,
                    ])->values();

                $materialsByPlant->put($plant->company_code, [
                    'total' => $total,
                    'items' => $items,
                ]);
            });
        }

        return Inertia::render('admin/companies/hierarchy', [
            'view' => $view,
            'materialsByPlant' => $materialsByPlant,
            'hierarchy' => $roots->map(fn (Company $company): array => $this->hierarchyNode($company, $childrenByParent))->values(),
            'headOffices' => $headOffices->map(fn (Company $company): array => $this->hierarchyNode($company, collect()))->values(),
            'orphans' => $orphans->map(fn (Company $company): array => $this->hierarchyNode($company, $childrenByParent))->values(),
            'stats' => [
                'companies' => $companies->where('record_type', 1)->count(),
                'plants' => $companies->where('record_type', 2)->count(),
                'head_offices' => $companies->where('record_type', 3)->count(),
                'active' => $companies->where('status', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Company::create($this->validated($request));

        return back()->with('success', 'Company created successfully.');
    }

    public function update(Request $request, Company $company): RedirectResponse
    {
        $company->update($this->validated($request, $company));

        return back()->with('success', 'Company updated successfully.');
    }

    public function toggleStatus(Request $request, Company $company): RedirectResponse
    {
        $company->update(['status' => $request->boolean('active')]);

        return back()->with('success', 'Company status updated.');
    }

    public function destroy(Company $company): RedirectResponse
    {
        $company->delete();

        return back()->with('success', 'Company deleted successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer', Rule::exists('tbl_company', 'id')], 'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])]]);
        $query = Company::whereIn('id', $data['ids']);
        match ($data['action']) {
            'activate' => $query->update(['status' => true]), 'deactivate' => $query->update(['status' => false]), 'delete' => $query->delete()
        };

        return back()->with('success', 'Bulk action completed successfully.');
    }

    private function validated(Request $request, ?Company $company = null): array
    {
        return $request->validate([
            'company_code' => ['required', 'string', 'max:30', Rule::unique('tbl_company', 'company_code')->ignore($company?->id)],
            'company_name' => ['required', 'string', 'max:255', Rule::unique('tbl_company', 'company_name')->ignore($company?->id)],
            'record_type' => ['required', 'integer', Rule::in([1, 2, 3])],
            'parent_company_id' => ['nullable', 'string', 'max:30', Rule::exists('tbl_company', 'company_code'), Rule::notIn([$company?->company_code])],
            'address_id' => ['nullable', 'integer', 'min:1'], 'contact_id' => ['nullable', 'integer', 'min:1'],
            'gstin' => ['nullable', 'string', 'size:15'], 'pan' => ['nullable', 'string', 'size:10'], 'status' => ['required', 'boolean'],
        ], ['parent_company_id.not_in' => 'A company cannot be its own parent.']);
    }

    /**
     * @param  Collection<string, Collection<int, Company>>  $childrenByParent
     * @return array{id: int, code: string, name: string, type: int, parent_code: string|null, gstin: string|null, active: bool, children: array<int, mixed>}
     */
    private function hierarchyNode(Company $company, $childrenByParent): array
    {
        return [
            'id' => $company->id,
            'code' => $company->company_code,
            'name' => $company->company_name,
            'type' => $company->record_type,
            'parent_code' => $company->parent_company_id,
            'gstin' => $company->gstin,
            'active' => $company->status,
            'children' => $childrenByParent->get($company->company_code, collect())
                ->where('record_type', '!=', 3)
                ->map(fn (Company $child): array => $this->hierarchyNode($child, $childrenByParent))
                ->values()
                ->all(),
        ];
    }
}
