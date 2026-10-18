<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement(<<<'SQL'
                UPDATE tbl_materials
                SET
                    mtart = COALESCE(
                        mtart,
                        (SELECT master.mtart
                         FROM tbl_materials AS master
                         WHERE master.matnr = tbl_materials.matnr
                           AND master.plant IS NULL
                         LIMIT 1)
                    ),
                    matkl = COALESCE(
                        matkl,
                        (SELECT master.matkl
                         FROM tbl_materials AS master
                         WHERE master.matnr = tbl_materials.matnr
                           AND master.plant IS NULL
                         LIMIT 1)
                    ),
                    meins = COALESCE(
                        meins,
                        (SELECT master.meins
                         FROM tbl_materials AS master
                         WHERE master.matnr = tbl_materials.matnr
                           AND master.plant IS NULL
                         LIMIT 1)
                    ),
                    updated_at = CURRENT_TIMESTAMP
                WHERE plant IS NOT NULL
                  AND (mtart IS NULL OR matkl IS NULL OR meins IS NULL)
                  AND EXISTS (
                      SELECT 1
                      FROM tbl_materials AS master
                      WHERE master.matnr = tbl_materials.matnr
                        AND master.plant IS NULL
                  )
            SQL);

            return;
        }

        DB::statement(<<<'SQL'
            UPDATE tbl_materials AS stock
            INNER JOIN tbl_materials AS master
                ON master.matnr = stock.matnr
                AND master.plant IS NULL
            SET
                stock.mtart = COALESCE(stock.mtart, master.mtart),
                stock.matkl = COALESCE(stock.matkl, master.matkl),
                stock.meins = COALESCE(stock.meins, master.meins),
                stock.updated_at = CURRENT_TIMESTAMP
            WHERE stock.plant IS NOT NULL
              AND (stock.mtart IS NULL OR stock.matkl IS NULL OR stock.meins IS NULL)
        SQL);
    }

    public function down(): void
    {
        // Classification is valid material data and should not be erased on rollback.
    }
};
