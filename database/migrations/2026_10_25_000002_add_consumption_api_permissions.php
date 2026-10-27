<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $names = [
            'procurement.api.consumption.view',
            'procurement.api.consumption.manage',
            'procurement.api.consumption.run',
        ];
        $permissions = config('permission.table_names.permissions');
        $roles = config('permission.table_names.roles');
        $pivot = config('permission.table_names.role_has_permissions');
        $now = now();

        foreach ($names as $name) {
            DB::table($permissions)->insertOrIgnore([
                'name' => $name,
                'guard_name' => 'web',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $roleIds = DB::table($roles)->whereIn('name', ['Super Admin', 'Admin', 'Administrator'])->pluck('id');
        $permissionIds = DB::table($permissions)->whereIn('name', $names)->pluck('id');
        foreach ($roleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                DB::table($pivot)->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table(config('permission.table_names.permissions'))->whereIn('name', [
            'procurement.api.consumption.view',
            'procurement.api.consumption.manage',
            'procurement.api.consumption.run',
        ])->delete();
    }
};
