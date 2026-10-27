<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $codes = ['material', 'production', 'quality', 'stock', 'vendor'];
        $permissions = config('permission.table_names.permissions');
        $roles = config('permission.table_names.roles');
        $pivot = config('permission.table_names.role_has_permissions');
        $now = now();

        foreach ($codes as $code) {
            $runName = "procurement.api.{$code}.run";
            DB::table($permissions)->insertOrIgnore([
                'name' => $runName,
                'guard_name' => 'web',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $runPermissionId = DB::table($permissions)->where('name', $runName)->value('id');
            $managePermissionId = DB::table($permissions)->where('name', "procurement.api.{$code}.manage")->value('id');
            $roleIds = DB::table($roles)->whereIn('name', ['Super Admin', 'Admin', 'Administrator'])->pluck('id');

            if ($managePermissionId) {
                $roleIds = $roleIds->merge(DB::table($pivot)->where('permission_id', $managePermissionId)->pluck('role_id'))->unique();
            }

            foreach ($roleIds as $roleId) {
                DB::table($pivot)->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $runPermissionId,
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
            'procurement.api.material.run',
            'procurement.api.production.run',
            'procurement.api.quality.run',
            'procurement.api.stock.run',
            'procurement.api.vendor.run',
        ])->delete();
    }
};
