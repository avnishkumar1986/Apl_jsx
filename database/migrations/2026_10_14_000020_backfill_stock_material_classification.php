<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
