<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $names = [
            'procurement.api.material.view',
            'procurement.api.material.manage',
            'procurement.api.stock.view',
            'procurement.api.stock.manage',
            'procurement.api.vendor.view',
            'procurement.api.vendor.manage',
            'procurement.inventory.materials.view',
            'procurement.inventory.materials.manage',
            'procurement.inventory.material_stock.view',
            'procurement.inventory.material_stock.manage',
        ];
        $now = now();
        $permissions = config('permission.table_names.permissions');
        $roles = config('permission.table_names.roles');
        $pivot = config('permission.table_names.role_has_permissions');

        foreach ($names as $name) {
            DB::table($permissions)->insertOrIgnore([
                'name' => $name,
                'guard_name' => 'web',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $roleIds = DB::table($roles)->whereIn('name', ['Super Admin', 'Admin'])->pluck('id');
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
        DB::table(config('permission.table_names.permissions'))
            ->whereIn('name', [
                'procurement.api.material.view',
                'procurement.api.material.manage',
                'procurement.api.stock.view',
                'procurement.api.stock.manage',
                'procurement.api.vendor.view',
                'procurement.api.vendor.manage',
                'procurement.inventory.materials.view',
                'procurement.inventory.materials.manage',
                'procurement.inventory.material_stock.view',
                'procurement.inventory.material_stock.manage',
            ])->delete();
    }
};
