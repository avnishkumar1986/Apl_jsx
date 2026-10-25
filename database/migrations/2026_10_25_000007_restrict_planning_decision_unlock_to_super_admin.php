<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSION = 'procurement.planning_decisions.unlock';

    public function up(): void
    {
        $permissions = config('permission.table_names.permissions');
        $roles = config('permission.table_names.roles');
        $pivot = config('permission.table_names.role_has_permissions');
        $now = now();

        $permissionId = DB::table($permissions)
            ->where('name', self::PERMISSION)
            ->where('guard_name', 'web')
            ->value('id');

        if (! $permissionId) {
            return;
        }

        $superAdminIds = DB::table($roles)
            ->where('guard_name', 'web')
            ->whereRaw("LOWER(REPLACE(name, ' ', '')) LIKE 'superadmin%'")
            ->pluck('id');
        if ($superAdminIds->isEmpty()) {
            $superAdminIds = collect([DB::table($roles)->insertGetId([
                'name' => 'Super Admin',
                'guard_name' => 'web',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ])]);
        }

        DB::table($pivot)
            ->where('permission_id', $permissionId)
            ->whereNotIn('role_id', $superAdminIds)
            ->delete();

        foreach ($superAdminIds as $superAdminId) {
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
        // This security restriction is intentionally not reversed.
    }
};
