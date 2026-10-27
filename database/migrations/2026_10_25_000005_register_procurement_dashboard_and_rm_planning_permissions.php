<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSIONS = [
        'procurement.dashboard.view',
        'procurement.rm_planning.view',
    ];

    public function up(): void
    {
        $permissionTable = config('permission.table_names.permissions');
        $pivotTable = config('permission.table_names.role_has_permissions');
        $now = now();

        foreach (self::PERMISSIONS as $name) {
            DB::table($permissionTable)->insertOrIgnore([
                'name' => $name,
                'guard_name' => 'web',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $permissionIds = DB::table($permissionTable)
            ->where('guard_name', 'web')
            ->whereIn('name', self::PERMISSIONS)
            ->pluck('id', 'name');

        $roleIds = DB::table($pivotTable)
            ->join($permissionTable, $permissionTable.'.id', '=', $pivotTable.'.permission_id')
            ->where($permissionTable.'.guard_name', 'web')
            ->whereIn($permissionTable.'.name', [
                'procurement.overview.view',
                'procurement.daily_consumption.view',
                'procurement.planning_decisions.view',
                'procurement.materials_balance.view',
                'procurement.consumption.view',
                'procurement.rm_inventories.view',
            ])
            ->distinct()
            ->pluck($pivotTable.'.role_id');

        foreach ($roleIds as $roleId) {
            foreach (self::PERMISSIONS as $name) {
                DB::table($pivotTable)->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permissionIds[$name],
                    'status' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        DB::table(config('permission.table_names.permissions'))
            ->where('guard_name', 'web')
            ->whereIn('name', self::PERMISSIONS)
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
