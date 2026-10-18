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

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_refresh_procurement_consumption_calculation');
        DB::unprepared(<<<'SQL'
            CREATE PROCEDURE sp_refresh_procurement_consumption_calculation(IN p_consumption_id BIGINT UNSIGNED)
            BEGIN
                INSERT INTO procurement_balance_results
                    (material, plant_id, month, calculations, remarks, created_at, updated_at)
                SELECT
                    sheet.material,
                    sheet.plant_id,
                    DATE_FORMAT(sheet.consumption_date, '%Y-%m-01'),
                    JSON_OBJECT(
                        'consumption_id', sheet.id,
                        'day_count', sheet.day_count,
                        'daily_consumption_mt', sheet.quantity_mt,
                        'opening_stock_mt', sheet.opening_stock_mt,
                        'buying_imports_mt', sheet.planned_buying_mt,
                        'total_availability_mt', sheet.total_availability_mt,
                        'total_required_mt', sheet.total_required_mt,
                        'projected_closing_mt', sheet.projected_closing_mt,
                        'gross_shortage_mt', sheet.gross_shortage_mt,
                        'remaining_shortage_mt', sheet.remaining_shortage_mt,
                        'cover_days', sheet.cover_days,
                        'calculated_at', DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s')
                    ),
                    sheet.remarks,
                    NOW(),
                    NOW()
                FROM vw_procurement_consumption_sheet sheet
                WHERE sheet.id = p_consumption_id
                ON DUPLICATE KEY UPDATE
                    calculations = VALUES(calculations),
                    remarks = VALUES(remarks),
                    updated_at = NOW();
            END
            SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_refresh_procurement_consumption_calculation');
    }
};
