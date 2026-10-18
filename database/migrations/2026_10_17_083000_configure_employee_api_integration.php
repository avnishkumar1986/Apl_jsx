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
                'endpoint' => 'sap/opu/odata/sap/ZSAP_CMS_SRV/ZempMasterSet',
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
