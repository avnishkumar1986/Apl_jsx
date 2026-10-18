<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables() as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'status')) {
                continue;
            }

            DB::table($tableName)->update([
                'status' => DB::raw("CASE WHEN LOWER(CAST(status AS CHAR)) IN ('0', 'inactive', 'disabled', 'failed', 'deleted', 'revoked') THEN 0 ELSE 1 END"),
            ]);

            Schema::table($tableName, function (Blueprint $table): void {
                $table->boolean('status')->default(true)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables() as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'status')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table): void {
                $table->string('status', 20)->default('active')->change();
            });

            DB::table($tableName)->update([
                'status' => DB::raw("CASE WHEN status = '1' THEN 'active' ELSE 'inactive' END"),
            ]);
        }
    }

    /** @return list<string> */
    private function tables(): array
    {
        return [
            'tbl_cache',
            'tbl_cache_locks',
            'tbl_failed_jobs',
            'tbl_jobs',
            'tbl_job_batches',
            'tbl_model_has_permissions',
            'tbl_model_has_roles',
            'tbl_password_reset_tokens',
            'tbl_permissions',
            'tbl_roles',
            'tbl_role_has_permissions',
            'tbl_sessions',
            'tbl_users',
            'tbl_usertype',
            'tbl_addresses',
            'tbl_contact',
            'tbl_email',
            'tbl_usraddress',
            'tbl_usrbanking',
            'tbl_usrcontact',
            'tbl_usrdocument',
            'tbl_usreducation',
            'tbl_usrlogin',
            'tbl_usrphotos',
            'tbl_usrsclaccount',
        ];
    }
};
