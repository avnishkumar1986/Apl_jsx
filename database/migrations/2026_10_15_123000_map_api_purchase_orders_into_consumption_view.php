<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement(<<<'SQL'
            CREATE OR REPLACE VIEW vw_procurement_consumption_sheet AS
            SELECT
                base.*,
                (COALESCE(base.opening_stock_mt, 0) + base.planned_buying_mt) AS total_availability_mt,
                (base.quantity_mt * base.day_count) AS total_required_mt,
                ((COALESCE(base.opening_stock_mt, 0) + base.planned_buying_mt) - (base.quantity_mt * base.day_count)) AS projected_closing_mt,
                GREATEST((base.quantity_mt * base.day_count) - COALESCE(base.opening_stock_mt, 0), 0) AS gross_shortage_mt,
                GREATEST((base.quantity_mt * base.day_count) - (COALESCE(base.opening_stock_mt, 0) + base.planned_buying_mt), 0) AS remaining_shortage_mt,
                CASE WHEN base.quantity_mt > 0 AND base.opening_stock_mt IS NOT NULL THEN base.opening_stock_mt / base.quantity_mt ELSE NULL END AS cover_days
            FROM (
                SELECT
                    d.id, d.company_id, d.plant_id, d.consumption_date, d.effective_to, d.period_type,
                    COALESCE(d.day_count, 1) AS day_count, d.material, d.quantity_mt, d.remarks, d.status,
                    d.created_at, d.updated_at, company.company_name, plant.company_name AS plant_name,
                    plant.company_code AS plant_code,
                    CASE WHEN stock.current_stock IS NULL THEN NULL ELSE stock.current_stock / 1000 END AS opening_stock_mt,
                    (
                        GREATEST(COALESCE(d.total_buying_mt, 0), COALESCE(d.planned_buying_mt, 0) + COALESCE(d.imports_mt, 0))
                        + COALESCE(manual_po.quantity_mt, 0)
                        + COALESCE(api_po.quantity_mt, 0)
                    ) AS planned_buying_mt
                FROM procurement_daily_consumptions d
                LEFT JOIN tbl_company company ON company.id = d.company_id
                LEFT JOIN tbl_company plant ON plant.id = d.plant_id
                LEFT JOIN (
                    SELECT matnr, plant_code, SUM(current_stock) AS current_stock
                    FROM tbl_material_stocks WHERE status = 1 GROUP BY matnr, plant_code
                ) stock ON stock.matnr = d.material AND stock.plant_code = plant.company_code
                LEFT JOIN (
                    SELECT consumption_id, SUM(quantity_mt) AS quantity_mt
                    FROM procurement_purchases
                    WHERE status = 1 AND delivery_status <> 'cancelled' AND consumption_id IS NOT NULL
                    GROUP BY consumption_id
                ) manual_po ON manual_po.consumption_id = d.id
                LEFT JOIN (
                    SELECT material, plant_code, DATE_FORMAT(expected_delivery_date, '%Y-%m') AS delivery_month, SUM(quantity_mt) AS quantity_mt
                    FROM tbl_vendor_purchase_orders
                    WHERE status = 1 AND delivery_status <> 'cancelled'
                    GROUP BY material, plant_code, DATE_FORMAT(expected_delivery_date, '%Y-%m')
                ) api_po ON api_po.material = d.material
                    AND api_po.plant_code = plant.company_code
                    AND api_po.delivery_month = DATE_FORMAT(d.consumption_date, '%Y-%m')
            ) base
            SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // The previous view definition remains available in migration 2026_10_15_120000.
    }
};
