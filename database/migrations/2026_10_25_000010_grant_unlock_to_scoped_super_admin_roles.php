<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = config('permission.table_names.permissions');
        $roles = config('permission.table_names.roles');
        $pivot = config('permission.table_names.role_has_permissions');
        $permissionId = DB::table($permissions)
            ->where('name', 'procurement.planning_decisions.unlock')
            ->where('guard_name', 'web')
            ->value('id');
        $superAdminIds = DB::table($roles)
            ->where('guard_name', 'web')
            ->whereRaw("LOWER(REPLACE(name, ' ', '')) LIKE 'superadmin%'")
            ->pluck('id');

        if (! $permissionId || $superAdminIds->isEmpty()) {
            return;
        }

        DB::table($pivot)
            ->where('permission_id', $permissionId)
            ->whereNotIn('role_id', $superAdminIds)
            ->delete();

        $now = now();
        foreach ($superAdminIds as $roleId) {
            DB::table($pivot)->insertOrIgnore([
                'permission_id' => $permissionId,
                'role_id' => $roleId,
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Scoped Superadmin unlock access is intentionally retained.
    }
};
