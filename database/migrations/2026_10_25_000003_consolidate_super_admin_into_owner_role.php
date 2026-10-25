<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            $roles = config('permission.table_names.roles');
            $rolePermissions = config('permission.table_names.role_has_permissions');
            $modelRoles = config('permission.table_names.model_has_roles');

            $owner = DB::table($roles)->whereRaw('LOWER(name) = ?', ['owner'])->where('guard_name', 'web')->first();
            $legacy = DB::table($roles)->where('name', 'Super Admin')->where('guard_name', 'web')->first();

            if (! $owner && $legacy) {
                DB::table($roles)->where('id', $legacy->id)->update(['name' => 'Owner', 'updated_at' => now()]);

                return;
            }

            if (! $owner) {
                return;
            }

            DB::table($roles)->where('id', $owner->id)->update(['name' => 'Owner', 'updated_at' => now()]);

            if (! $legacy || $legacy->id === $owner->id) {
                return;
            }

            DB::table($rolePermissions)->where('role_id', $legacy->id)->get()->each(function ($permission) use ($rolePermissions, $owner): void {
                DB::table($rolePermissions)->updateOrInsert(
                    ['permission_id' => $permission->permission_id, 'role_id' => $owner->id],
                    ['status' => true, 'updated_at' => now(), 'created_at' => $permission->created_at ?? now()],
                );
            });

            DB::table($modelRoles)->where('role_id', $legacy->id)->get()->each(function ($assignment) use ($modelRoles, $owner): void {
                DB::table($modelRoles)->updateOrInsert(
                    ['role_id' => $owner->id, 'model_type' => $assignment->model_type, 'model_id' => $assignment->model_id],
                    [],
                );
            });

            if (DB::getSchemaBuilder()->hasTable('tbl_role_company')) {
                DB::table('tbl_role_company')->where('role_id', $legacy->id)->pluck('company_id')->each(
                    fn ($companyId) => DB::table('tbl_role_company')->insertOrIgnore(['role_id' => $owner->id, 'company_id' => $companyId]),
                );
                DB::table('tbl_role_company')->where('role_id', $legacy->id)->delete();
            }

            if (DB::getSchemaBuilder()->hasColumn('tbl_usrdept', 'role_id')) {
                DB::table('tbl_usrdept')->where('role_id', $legacy->id)->update(['role_id' => $owner->id]);
            }

            DB::table($modelRoles)->where('role_id', $legacy->id)->delete();
            DB::table($rolePermissions)->where('role_id', $legacy->id)->delete();
            DB::table($roles)->where('id', $legacy->id)->delete();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Owner is the canonical protected role; consolidation is intentionally not reversed.
    }
};
