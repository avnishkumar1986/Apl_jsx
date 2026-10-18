<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Modules\Procurement\Services\ProcurementService;
use Modules\Sales\Services\SalesService;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $modules = [['name' => 'Procurement', 'slug' => 'procurement', 'description' => 'Procurement operations and supplier workflow service.', 'service' => ProcurementService::class, 'path' => 'Modules/Procurement', 'capabilities' => ['purchase requisitions', 'purchase orders', 'vendors', 'material receipts']], ['name' => 'Sales', 'slug' => 'sales', 'description' => 'Sales operations and customer order workflow service.', 'service' => SalesService::class, 'path' => 'Modules/Sales', 'capabilities' => ['sales enquiries', 'quotations', 'sales orders', 'dispatch tracking']]];
        foreach ($modules as $module) {
            DB::table('tbl_modules')->updateOrInsert(['slug' => $module['slug']], ['name' => $module['name'], 'description' => $module['description'], 'version' => '1.0.0', 'source' => 'service', 'package_path' => $module['path'], 'original_filename' => class_basename($module['service']).'.php', 'mime_type' => 'text/x-php', 'file_size' => 0, 'checksum_sha256' => hash('sha256', $module['service']), 'manifest' => json_encode(['service_class' => $module['service'], 'module_path' => $module['path'], 'capabilities' => $module['capabilities']]), 'status' => true, 'uploaded_by' => null, 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        DB::table('tbl_modules')->whereIn('slug', ['procurement', 'sales'])->where('source', 'service')->delete();
    }
};
