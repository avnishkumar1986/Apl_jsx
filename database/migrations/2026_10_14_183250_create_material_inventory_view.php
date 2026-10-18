<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('DROP VIEW IF EXISTS vw_material_inventory');
        DB::statement(<<<'SQL'
            CREATE VIEW vw_material_inventory AS
            SELECT
                stocks.id AS stock_id,
                materials.id AS material_id,
                materials.matnr,
                materials.maktx,
                materials.mtart,
                materials.matkl,
                materials.meins,
                stocks.plant_code,
                COALESCE(plants.company_name, stocks.plant_code) AS plant_name,
                stocks.current_stock,
                stocks.stock_value,
                CASE WHEN materials.status = 1 AND stocks.status = 1 THEN 1 ELSE 0 END AS status,
                stocks.synced_at,
                stocks.updated_at
            FROM tbl_material_stocks stocks
            INNER JOIN tbl_materials materials ON materials.matnr = stocks.matnr
            LEFT JOIN tbl_company plants ON plants.company_code = stocks.plant_code
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS vw_material_inventory');
    }
};
