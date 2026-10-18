<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_materials_stock_sync_backup_20261014')) {
            DB::statement(<<<'SQL'
                CREATE TABLE tbl_materials_stock_sync_backup_20261014 AS
                SELECT * FROM tbl_materials
                WHERE plant IS NOT NULL
                  AND created_at BETWEEN '2026-10-14 09:11:00' AND '2026-10-14 09:11:59'
            SQL);
        }

        DB::table('tbl_materials')
            ->whereNotNull('plant')
            ->whereBetween('created_at', ['2026-10-14 09:11:00', '2026-10-14 09:11:59'])
            ->delete();

        DB::table('tbl_api_integrations')
            ->where('code', 'stock')
            ->update([
                'description' => 'Stock',
                'target_table' => 'tbl_material_stocks',
                'last_run_status' => null,
                'last_run_at' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (Schema::hasTable('tbl_materials_stock_sync_backup_20261014')) {
            DB::statement('INSERT IGNORE INTO tbl_materials SELECT * FROM tbl_materials_stock_sync_backup_20261014');
        }

        DB::table('tbl_api_integrations')
            ->where('code', 'stock')
            ->update([
                'description' => 'Stock · matched to materials by Material Code + Plant',
                'target_table' => 'tbl_materials',
                'updated_at' => now(),
            ]);
    }
};
