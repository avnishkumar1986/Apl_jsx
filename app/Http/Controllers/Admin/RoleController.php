<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Models\Company;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Permission;
use App\Models\Role;
use App\Services\Rbac\RoleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $roleService) {}

    public function index(): Response
    {
        return Inertia::render('admin/roles/index', [
            'roles' => Role::query()
                ->with('permissions:id,name')
                ->withCount('users')
                ->orderBy('name')
                ->get(['id', 'name', 'status']),
            'permissions' => Permission::query()->where('status', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return $this->form();
    }

    public function edit(Role $role): Response
    {
        $role->load(['permissions:id,name', 'companies:id']);

        return $this->form($role);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $this->roleService->create($request->validated());

        return back()->with('success', 'Role created successfully.');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->roleService->update($role, $request->validated());

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->roleService->delete($role);

        return back()->with('success', 'Role deleted successfully.');
    }

    private function form(?Role $role = null): Response
    {
        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('status', ['active', '1'])
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/roles/form', [
            'role' => $role ? [
                'id' => $role->id,
                'name' => $role->name,
                'department_id' => $role->department_id,
                'designation_id' => $role->designation_id,
                'company_ids' => $role->companies->pluck('id')->all(),
                'permissions' => $role->permissions->pluck('name')->all(),
            ] : null,
            'companies' => Company::query()->where('status', true)->where('record_type', 1)->orderBy('company_name')->get(['id', 'company_code', 'company_name']),
            'departments' => Department::query()->where('status', true)->orderBy('department_name')->get(['id', 'department_name']),
            'designations' => Designation::query()->where('status', true)->orderBy('designation_name')->get(['id', 'designation_name', 'department_id']),
            'permissions' => $permissions,
        ]);
    }
}
