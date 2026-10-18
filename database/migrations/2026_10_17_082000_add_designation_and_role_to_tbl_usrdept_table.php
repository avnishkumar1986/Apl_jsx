<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_usrdept', 'designation_id')) {
            Schema::table('tbl_usrdept', function (Blueprint $table): void {
                $table->unsignedBigInteger('designation_id')->nullable()->index()->after('department_id');
            });
        }
        if (! Schema::hasColumn('tbl_usrdept', 'role_id')) {
            Schema::table('tbl_usrdept', function (Blueprint $table): void {
                $table->unsignedBigInteger('role_id')->nullable()->index()->after('designation_id');
            });
        }

        DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
            $roleId = DB::table(config('permission.table_names.model_has_roles'))
                ->where('model_type', 'App\\Models\\User')
                ->where('model_id', $user->id)
                ->value('role_id');
            $designationId = Schema::hasColumn('tbl_users', 'designation_id') ? $user->designation_id : null;

            if ($designationId !== null || $roleId !== null) {
                DB::table('tbl_usrdept')->updateOrInsert(
                    ['user_id' => (string) $user->id],
                    [
                        'designation_id' => $designationId,
                        'role_id' => $roleId,
                        'status' => (bool) $user->status,
                        'created_by' => $user->created_by,
                        'updated_by' => $user->updated_by,
                        'created_at' => $user->created_at ?? now(),
                        'updated_at' => $user->updated_at ?? now(),
                    ],
                );
            }
        });

        if (Schema::hasColumn('tbl_users', 'designation_id')) {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->dropIndex(['designation_id']);
                $table->dropColumn('designation_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('tbl_users', 'designation_id')) {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->unsignedBigInteger('designation_id')->nullable()->index();
            });

            DB::table('tbl_usrdept')->whereNotNull('designation_id')->orderBy('id')->each(function (object $assignment): void {
                DB::table('tbl_users')->where('id', $assignment->user_id)->update([
                    'designation_id' => $assignment->designation_id,
                ]);
            });
        }

        Schema::table('tbl_usrdept', function (Blueprint $table): void {
            $table->dropIndex(['designation_id']);
            $table->dropIndex(['role_id']);
            $table->dropColumn(['designation_id', 'role_id']);
        });
    }
};
