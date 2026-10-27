<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'vendor')
            ->update([
                'endpoint' => '/sap/opu/odata/sap/ZPO_ITEM_ODATA_SRV/PurchaseOrderItemSet?$format=json',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Material is supplied dynamically by the import job and must not be
        // persisted in the shared integration endpoint.
    }
};
