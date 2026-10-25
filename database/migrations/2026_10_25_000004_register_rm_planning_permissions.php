<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSIONS = [
        'procurement.planning_decisions.view',
        'procurement.planning_decisions.create',
        'procurement.planning_decisions.edit',
        'procurement.planning_decisions.delete',
        'procurement.materials_balance.view',
        'procurement.materials_balance.edit',
        'procurement.consumption.view',
        'procurement.consumption.create',
        'procurement.consumption.edit',
        'procurement.consumption.delete',
        'procurement.rm_inventories.view',
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

        $legacyAssignments = DB::table($pivotTable)
            ->join($permissionTable, $permissionTable.'.id', '=', $pivotTable.'.permission_id')
            ->where($permissionTable.'.guard_name', 'web')
            ->whereIn($permissionTable.'.name', [
                'procurement.overview.view',
                'procurement.daily_consumption.view',
                'procurement.daily_consumption.create',
                'procurement.all_materials.view',
            ])
            ->get([$pivotTable.'.role_id', $permissionTable.'.name']);

        foreach ($legacyAssignments->groupBy('role_id') as $roleId => $assignments) {
            $legacyNames = $assignments->pluck('name');
            $newNames = [
                'procurement.planning_decisions.view',
                'procurement.materials_balance.view',
                'procurement.consumption.view',
                'procurement.rm_inventories.view',
            ];

            if ($legacyNames->contains('procurement.daily_consumption.create')) {
                array_push(
                    $newNames,
                    'procurement.planning_decisions.create',
                    'procurement.planning_decisions.edit',
                    'procurement.planning_decisions.delete',
                    'procurement.materials_balance.edit',
                    'procurement.consumption.create',
                    'procurement.consumption.edit',
                    'procurement.consumption.delete',
                );
            }

            foreach (array_unique($newNames) as $name) {
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
