<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
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
        $sortable = ['sno' => 'id', 'code' => 'department_code', 'name' => 'department_name', 'status' => 'status', 'created_at' => 'created_at'];
        if (! array_key_exists($sort, $sortable)) {
            $sort = 'name';
        }

        $departments = Department::query()
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('department_code', 'like', "%{$search}%")
                    ->orWhere('department_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->orderBy($sortable[$sort], $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/departments/index', [
            'departments' => $departments,
            'filters' => ['search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'pageSizeOptions' => $pageSizeOptions,
            'stats' => [
                'total' => Department::query()->count(),
                'active' => Department::query()->where('status', true)->count(),
            ],
            'canManage' => $request->user()?->can('users.manage') ?? false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Department::create($this->validated($request));

        return back()->with('success', 'Department created successfully.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $department->update($this->validated($request, $department));

        return back()->with('success', 'Department updated successfully.');
    }

    public function toggleStatus(Request $request, Department $department): RedirectResponse
    {
        $department->update(['status' => $request->boolean('active')]);

        return back()->with('success', 'Department status updated successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', Rule::exists('tbl_departments', 'id')],
            'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])],
        ]);

        $query = Department::query()->whereIn('id', $validated['ids']);
        match ($validated['action']) {
            'activate' => $query->update(['status' => true]),
            'deactivate' => $query->update(['status' => false]),
            'delete' => $query->delete(),
        };

        return back()->with('success', 'Bulk action completed successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $department->delete();

        return back()->with('success', 'Department deleted successfully.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Department $department = null): array
    {
        return $request->validate([
            'department_code' => [
                'required', 'string', 'max:20',
                Rule::unique('tbl_departments', 'department_code')->ignore($department?->id),
            ],
            'department_name' => [
                'required', 'string', 'max:100',
                Rule::unique('tbl_departments', 'department_name')->ignore($department?->id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'boolean'],
        ]);
    }
}
