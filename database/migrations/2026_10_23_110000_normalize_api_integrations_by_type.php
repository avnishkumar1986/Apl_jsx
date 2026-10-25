<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')
            ->whereIn('code', ['material', 'stock', 'vendor', 'production', 'quality'])
            ->update([
                'api_type' => 'sap',
                'method' => 'GET',
                'auth_type' => 'basic',
                'credential_key' => null,
                'updated_at' => now(),
            ]);

        DB::table('tbl_api_integrations')
            ->where('code', 'employee')
            ->update([
                'api_type' => 'external',
                'base_url' => null,
                'endpoint' => env('EMPLOYEE_API_URL', DB::table('tbl_api_integrations')->where('code', 'employee')->value('endpoint')),
                'method' => 'POST',
                'auth_type' => 'none',
                'credential_key' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'employee')
            ->update([
                'api_type' => 'sap',
                'endpoint' => env('EMPLOYEE_API_URL'),
                'method' => 'GET',
                'auth_type' => 'basic',
                'credential_key' => 'PROCUREMENT_STOCK_API_TOKEN',
                'updated_at' => now(),
            ]);
    }
};
