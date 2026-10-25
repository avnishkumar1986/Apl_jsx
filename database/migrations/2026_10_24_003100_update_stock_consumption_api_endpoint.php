<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'stock')
            ->update([
                'endpoint' => '/sap/opu/odata/sap/ZMAT_STOCK_CUNSUMPTION_SRV/mat_headSet?$format=json',
                'target_table' => json_encode(['tbl_material_stocks']),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'stock')
            ->update([
                'endpoint' => '/sap/opu/odata/sap/ZMAT_STOCK_CDS/ZMAT_STOCK',
                'updated_at' => now(),
            ]);
    }
};
