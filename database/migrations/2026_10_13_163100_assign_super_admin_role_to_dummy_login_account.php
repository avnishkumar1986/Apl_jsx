<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            $permissions = collect([
                'dashboard.view',
                'users.view',
                'users.manage',
                'roles.view',
                'roles.manage',
            ])->map(fn (string $permission): Permission => Permission::findOrCreate($permission, 'web'));

            $role = Role::findOrCreate('Super Admin', 'web');
            $role->syncPermissions($permissions);

            User::query()
                ->where('email', 'demo@apollo.local')
                ->firstOrFail()
                ->syncRoles([$role]);

            app(PermissionRegistrar::class)->forgetCachedPermissions();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function (): void {
            $user = User::query()->where('email', 'demo@apollo.local')->first();

            if ($user !== null) {
                $user->removeRole('Super Admin');
            }

            app(PermissionRegistrar::class)->forgetCachedPermissions();
        });
    }
};
