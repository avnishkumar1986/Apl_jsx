<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSIONS = [
        'procurement.rm_planning.view',
        'procurement.planning_decisions.view',
        'procurement.planning_decisions.create',
        'procurement.planning_decisions.edit',
        'procurement.planning_decisions.delete',
        'procurement.planning_decisions.unlock',
    ];

    public function up(): void
    {
        $permissions = config('permission.table_names.permissions');
        $roles = config('permission.table_names.roles');
        $pivot = config('permission.table_names.role_has_permissions');
        $now = now();
        $superAdminId = DB::table($roles)->where('name', 'Super Admin')->where('guard_name', 'web')->value('id');

        if (! $superAdminId) {
            return;
        }

        $permissionIds = DB::table($permissions)
            ->where('guard_name', 'web')
            ->whereIn('name', self::PERMISSIONS)
            ->pluck('id');

        foreach ($permissionIds as $permissionId) {
            DB::table($pivot)->insertOrIgnore([
                'permission_id' => $permissionId,
                'role_id' => $superAdminId,
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Super Admin planning access is intentionally retained.
    }
};
