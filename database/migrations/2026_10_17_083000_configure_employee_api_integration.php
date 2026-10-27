<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')
            ->whereRaw('LOWER(code) = ?', ['employee'])
            ->update([
                'code' => 'employee',
                'endpoint' => env('EMPLOYEE_API_URL'),
                'target_table' => json_encode(['tbl_users', 'tbl_usrcontact', 'tbl_usrdept']),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'employee')
            ->update([
                'code' => 'Employee',
                'target_table' => json_encode(['tbl_users', 'tbl_usrcontact', 'tbl_userddept']),
                'updated_at' => now(),
            ]);
    }
};
