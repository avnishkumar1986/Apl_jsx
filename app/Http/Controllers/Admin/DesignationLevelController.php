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

class DesignationLevelController extends Controller
{
    public function index(Request $request): Response
    {
        $options = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $options, true)) {
            $perPage = (int) config('datatable.per_page');
        }
        $search = trim((string) $request->string('search'));
        $levels = DesignationLevel::query()->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('level_code', 'like', "%{$search}%")->orWhere('level_name', 'like', "%{$search}%")))->orderBy('hierarchy_order')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/designation-levels/index', [
            'levels' => $levels,
            'allLevels' => DesignationLevel::query()->select('id', 'level_code', 'level_name')->orderBy('hierarchy_order')->get(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'pageSizeOptions' => $options,
            'stats' => ['total' => DesignationLevel::count(), 'active' => DesignationLevel::where('status', true)->count()],
            'canManage' => $request->user()?->can('users.manage') ?? false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        DesignationLevel::create($this->validated($request));

        return back()->with('success', 'Designation level created successfully.');
    }

    public function update(Request $request, DesignationLevel $designationLevel): RedirectResponse
    {
        $designationLevel->update($this->validated($request, $designationLevel));

        return back()->with('success', 'Designation level updated successfully.');
    }

    public function toggleStatus(Request $request, DesignationLevel $designationLevel): RedirectResponse
    {
        $request->validate(['active' => ['required', 'boolean']]);
        $designationLevel->update(['status' => $request->boolean('active')]);

        return back()->with('success', 'Designation level status updated successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer', Rule::exists('tbl_designation_levels', 'id')], 'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])]]);
        if ($data['action'] === 'delete' && (DesignationLevel::whereIn('reports_to_level_id', $data['ids'])->whereNotIn('id', $data['ids'])->exists() || Designation::whereIn('designation_level_id', $data['ids'])->exists())) {
            return back()->withErrors(['bulk_action' => 'One or more selected levels are currently in use and cannot be deleted.']);
        }
        $query = DesignationLevel::whereIn('id', $data['ids']);
        match ($data['action']) {
            'activate' => $query->update(['status' => true]), 'deactivate' => $query->update(['status' => false]), 'delete' => $query->delete()
        };

        return back()->with('success', 'Bulk action completed successfully.');
    }

    public function destroy(DesignationLevel $designationLevel): RedirectResponse
    {
        if (DesignationLevel::where('reports_to_level_id', $designationLevel->id)->exists() || Designation::where('designation_level_id', $designationLevel->id)->exists()) {
            return back()->withErrors(['designation_level' => 'This level is currently in use and cannot be deleted.']);
        }
        $designationLevel->delete();

        return back()->with('success', 'Designation level deleted successfully.');
    }

    private function validated(Request $request, ?DesignationLevel $level = null): array
    {
        return $request->validate([
            'level_code' => ['required', 'string', 'max:20', Rule::unique('tbl_designation_levels', 'level_code')->ignore($level?->id)],
            'level_name' => ['required', 'string', 'max:100', Rule::unique('tbl_designation_levels', 'level_name')->ignore($level?->id)],
            'hierarchy_order' => ['required', 'integer', 'min:1', Rule::unique('tbl_designation_levels', 'hierarchy_order')->ignore($level?->id)],
            'reports_to_level_id' => ['nullable', 'integer', Rule::exists('tbl_designation_levels', 'id'), Rule::notIn([$level?->id])],
            'status' => ['required', 'boolean'],
        ], ['level_code.required' => 'Level code is required.', 'level_code.unique' => 'This level code already exists.', 'level_name.required' => 'Level name is required.', 'hierarchy_order.required' => 'Hierarchy order is required.', 'hierarchy_order.unique' => 'This hierarchy order is already assigned.', 'reports_to_level_id.not_in' => 'A level cannot report to itself.']);
    }
}
