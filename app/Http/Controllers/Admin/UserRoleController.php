<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRolesRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\Rbac\RoleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    public function __construct(private readonly RoleService $roleService) {}

    public function index(): Response
    {
        return Inertia::render('admin/users/index', [
            'users' => User::query()
                ->with(['roles:id,name', 'primaryEmail:id,user_id,email', 'login:id,user_id,login_name'])
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'status']),
            'roles' => Role::query()->where('status', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateUserRolesRequest $request, User $user): RedirectResponse
    {
        $this->roleService->syncUserRoles($user, $request->validated('roles', []), $request->user());

        return back()->with('success', 'User roles updated successfully.');
    }
}
