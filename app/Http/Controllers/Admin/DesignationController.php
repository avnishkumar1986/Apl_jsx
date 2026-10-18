<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use App\Models\DesignationLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    public function index(Request $request): Response
    {
        $pageSizeOptions = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $pageSizeOptions, true)) {
            $perPage = (int) config('datatable.per_page');
        }

        $search = trim((string) $request->string('search'));
        $sort = (string) $request->string('sort', 'name');
        $direction = $request->string('direction')->lower()->value() === 'desc' ? 'desc' : 'asc';
        $sortable = ['sno' => 'id', 'code' => 'des_id', 'name' => 'designation_name', 'level' => 'designation_level_id', 'status' => 'status', 'created_at' => 'created_at'];
        if (! array_key_exists($sort, $sortable)) {
            $sort = 'name';
        }

        $designations = Designation::query()
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('des_id', 'like', "%{$search}%")
                    ->orWhere('designation_name', 'like', "%{$search}%");
            }))
            ->orderBy($sortable[$sort], $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/designations/index', [
            'designations' => $designations,
            'allDesignations' => Designation::query()->select('id', 'designation_name')->orderBy('designation_name')->get(),
            'designationLevels' => DesignationLevel::query()->where('status', true)->select('id', 'level_code', 'level_name')->orderBy('hierarchy_order')->get(),
            'filters' => ['search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'pageSizeOptions' => $pageSizeOptions,
            'stats' => ['total' => Designation::query()->count(), 'active' => Designation::query()->where('status', true)->count()],
            'canManage' => $request->user()?->can('users.manage') ?? false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Designation::create($this->validated($request));

        return back()->with('success', 'Designation created successfully.');
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $designation->update($this->validated($request, $designation));

        return back()->with('success', 'Designation updated successfully.');
    }

    public function toggleStatus(Request $request, Designation $designation): RedirectResponse
    {
        $request->validate(['active' => ['required', 'boolean']]);
        $designation->update(['status' => $request->boolean('active')]);

        return back()->with('success', 'Designation status updated successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', Rule::exists('tbl_designations', 'id')],
            'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])],
        ]);

        if ($validated['action'] === 'delete' && Designation::query()->whereIn('reports_to_designation_id', $validated['ids'])->whereNotIn('id', $validated['ids'])->exists()) {
            return back()->withErrors(['bulk_action' => 'One or more selected designations are used for reporting and cannot be deleted.']);
        }

        $query = Designation::query()->whereIn('id', $validated['ids']);
        match ($validated['action']) {
            'activate' => $query->update(['status' => true]),
            'deactivate' => $query->update(['status' => false]),
            'delete' => $query->delete(),
        };

        return back()->with('success', 'Bulk action completed successfully.');
    }

    public function destroy(Designation $designation): RedirectResponse
    {
        if (Designation::query()->where('reports_to_designation_id', $designation->id)->exists()) {
            return back()->withErrors(['designation' => 'This designation is used as a reporting designation and cannot be deleted.']);
        }

        $designation->delete();

        return back()->with('success', 'Designation deleted successfully.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Designation $designation = null): array
    {
        $validated = $request->validate([
            'des_id' => ['nullable', 'integer', 'min:1', Rule::unique('tbl_designations', 'des_id')->ignore($designation?->id)],
            'designation_name' => ['required', 'string', 'max:100', Rule::unique('tbl_designations', 'designation_name')->ignore($designation?->id)],
            'designation_level_id' => ['required', 'integer', Rule::exists('tbl_designation_levels', 'id')],
            'reports_to_designation_id' => ['nullable', 'integer', Rule::exists('tbl_designations', 'id'), Rule::notIn([$designation?->id])],
            'status' => ['required', 'boolean'],
        ], [
            'des_id.unique' => 'This designation ID is already in use.',
            'designation_name.required' => 'Designation name is required.',
            'designation_name.unique' => 'This designation name already exists.',
            'designation_level_id.required' => 'Designation level is required.',
            'reports_to_designation_id.not_in' => 'A designation cannot report to itself.',
        ]);

        $validated['des_id'] = $designation?->des_id ?? $validated['des_id'] ?? ((int) Designation::query()->max('des_id') + 1);

        return $validated;
    }
}
