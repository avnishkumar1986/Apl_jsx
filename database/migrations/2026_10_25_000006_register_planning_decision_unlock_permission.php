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

        DB::table($permissions)->insertOrIgnore([
            'name' => self::PERMISSION,
            'guard_name' => 'web',
            'status' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $permissionId = DB::table($permissions)->where('name', self::PERMISSION)->where('guard_name', 'web')->value('id');
        $superAdminId = DB::table($roles)->where('name', 'Super Admin')->where('guard_name', 'web')->value('id');

        if ($permissionId && $superAdminId) {
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
        DB::table(config('permission.table_names.permissions'))
            ->where('name', self::PERMISSION)
            ->where('guard_name', 'web')
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
