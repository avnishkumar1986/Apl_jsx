<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'employee')
            ->update([
                'credential_key' => 'PROCUREMENT_STOCK_API_TOKEN',
                'last_run_status' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'employee')
            ->update([
                'credential_key' => null,
                'updated_at' => now(),
            ]);
    }
};
