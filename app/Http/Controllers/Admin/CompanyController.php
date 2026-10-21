<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Material;
use App\Models\MaterialStock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    /** @var array<string, string> */
    private const COMPANY_MATERIAL_TYPES = [
        '1000' => 'ZRAW',
        '5000' => 'YRAW',
    ];

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
            ->where('company_code', '!=', '0')
            ->orderBy('record_type')
            ->orderBy('company_name')
            ->get(['id', 'company_code', 'company_name', 'record_type', 'parent_company_id', 'gstin', 'status']);

        $childrenByParent = $companies->whereNotNull('parent_company_id')->groupBy('parent_company_id');
        $roots = $companies->filter(fn (Company $company): bool => $company->record_type === 1 && $company->parent_company_id === null);
        $knownCodes = $companies->pluck('company_code');
        $orphans = $companies->filter(fn (Company $company): bool => $company->record_type !== 3 && $company->parent_company_id !== null && ! $knownCodes->contains($company->parent_company_id));

        $view = in_array($request->string('view')->value(), ['plants', 'materials'], true) ? $request->string('view')->value() : 'companies';
        $materialsByCompany = collect();
        if ($view === 'materials') {
            $companies->where('record_type', 1)->each(function (Company $company) use ($childrenByParent, $materialsByCompany): void {
                $materialType = self::COMPANY_MATERIAL_TYPES[$company->company_code] ?? null;
                if ($materialType === null) {
                    return;
                }

                $materials = Material::query()
                    ->where('mtart', $materialType)
                    ->orderBy('matkl')
                    ->orderBy('maktx')
                    ->orderBy('matnr')
                    ->get(['matnr', 'matkl', 'maktx', 'status']);

                $plantCodes = $childrenByParent->get($company->company_code, collect())
                    ->where('record_type', 2)
                    ->pluck('company_code');
                $stockByMaterial = MaterialStock::query()
                    ->whereIn('plant_code', $plantCodes)
                    ->select('matnr')
                    ->selectRaw('SUM(current_stock) as total_stock')
                    ->groupBy('matnr')
                    ->pluck('total_stock', 'matnr');

                $groups = $materials
                    ->groupBy(fn (Material $material): string => filled($material->matkl) ? $material->matkl : 'Unclassified')
                    ->map(fn (Collection $group, $code): array => [
                        'code' => (string) $code,
                        'total' => $group->count(),
                        'items' => $group->map(fn (Material $material): array => [
                            'code' => $material->matnr,
                            'name' => $material->maktx ?: $material->matnr,
                            'stock' => (float) ($stockByMaterial->get($material->matnr) ?? 0),
                            'active' => (bool) $material->status,
                        ])->values()->all(),
                    ])->values();

                $materialsByCompany->put($company->company_code, [
                    'type' => $materialType,
                    'total' => $materials->count(),
                    'stock' => (float) $materials->sum(fn (Material $material): float => (float) ($stockByMaterial->get($material->matnr) ?? 0)),
                    'groups' => $groups,
                ]);
            });
        }

        return Inertia::render('admin/companies/hierarchy', [
            'view' => $view,
            'materialsByCompany' => $materialsByCompany,
            'hierarchy' => $roots->map(fn (Company $company): array => $this->hierarchyNode($company, $childrenByParent))->values(),
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
                ->sortBy(fn (Company $child): int => $child->record_type === 3 ? 0 : $child->record_type)
                ->map(fn (Company $child): array => $this->hierarchyNode($child, $childrenByParent))
                ->values()
                ->all(),
        ];
    }
}
