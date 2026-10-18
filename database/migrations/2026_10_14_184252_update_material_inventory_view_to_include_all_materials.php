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
                materials.id AS material_id,
                materials.matnr,
                materials.maktx,
                materials.mtart,
                materials.matkl,
                materials.meins,
                GROUP_CONCAT(DISTINCT stocks.plant_code ORDER BY stocks.plant_code SEPARATOR ', ') AS plant_code,
                GROUP_CONCAT(
                    DISTINCT COALESCE(plants.company_name, stocks.plant_code)
                    ORDER BY COALESCE(plants.company_name, stocks.plant_code)
                    SEPARATOR ', '
                ) AS plant_name,
                COALESCE(SUM(CASE WHEN stocks.status = 1 THEN stocks.current_stock ELSE 0 END), 0) AS current_stock,
                COALESCE(SUM(CASE WHEN stocks.status = 1 THEN stocks.stock_value ELSE 0 END), 0) AS stock_value,
                materials.status,
                MAX(stocks.synced_at) AS synced_at,
                GREATEST(materials.updated_at, COALESCE(MAX(stocks.updated_at), materials.updated_at)) AS updated_at
            FROM tbl_materials materials
            LEFT JOIN tbl_material_stocks stocks ON stocks.matnr = materials.matnr
            LEFT JOIN tbl_company plants ON plants.company_code = stocks.plant_code
            GROUP BY
                materials.id,
                materials.matnr,
                materials.maktx,
                materials.mtart,
                materials.matkl,
                materials.meins,
                materials.status,
                materials.updated_at
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
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
};
