<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'dashboard.view',
            'users.view',
            'users.manage',
            'roles.view',
            'roles.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        Role::findOrCreate('Super Admin', 'web')->syncPermissions($permissions);
        Role::findOrCreate('Administrator', 'web')->syncPermissions($permissions);
        Role::findOrCreate('Viewer', 'web')->syncPermissions(['dashboard.view']);
    }
}
