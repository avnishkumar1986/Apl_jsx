<?php

namespace App\Services\Rbac;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoleService
{
    /**
     * @param  array{name: string, company_ids?: list<int>, department_id?: int|null, designation_id?: int|null, permissions?: list<string>}  $data
     */
    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data): Role {
            $role = Role::create([
                'name' => $data['name'],
                'guard_name' => 'web',
                'department_id' => $data['department_id'] ?? null,
                'designation_id' => $data['designation_id'] ?? null,
            ]);
            $role->companies()->sync($data['company_ids'] ?? []);
            $role->syncPermissions($data['permissions'] ?? []);

            return $role;
        });
    }

    /**
     * @param  array{name: string, company_ids?: list<int>, department_id?: int|null, designation_id?: int|null, permissions?: list<string>}  $data
     */
    public function update(Role $role, array $data): Role
    {
        if (strcasecmp($role->name, 'Owner') === 0 && strcasecmp($data['name'], 'Owner') !== 0) {
            throw ValidationException::withMessages(['name' => 'The Owner role cannot be renamed.']);
        }

        return DB::transaction(function () use ($role, $data): Role {
            $role->update([
                'name' => $data['name'],
                'department_id' => $data['department_id'] ?? null,
                'designation_id' => $data['designation_id'] ?? null,
            ]);
            $role->companies()->sync($data['company_ids'] ?? []);
            $role->syncPermissions($data['permissions'] ?? []);

            return $role;
        });
    }

    public function delete(Role $role): void
    {
        if (strcasecmp($role->name, 'Owner') === 0) {
            throw ValidationException::withMessages(['role' => 'The Owner role cannot be deleted.']);
        }

        $role->delete();
    }

    /**
     * @param  list<string>  $roles
     */
    public function syncUserRoles(User $user, array $roles, User $actor): void
    {
        if ($user->is($actor) && $user->hasRole('Owner') && ! collect($roles)->contains(fn (string $role): bool => strcasecmp($role, 'Owner') === 0)) {
            throw ValidationException::withMessages(['roles' => 'You cannot remove your own Owner role.']);
        }

        $user->syncRoles($roles);
    }
}
