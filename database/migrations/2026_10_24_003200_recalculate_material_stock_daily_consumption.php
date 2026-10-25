<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $daysInCurrentMonth = now()->daysInMonth;

        DB::table('tbl_material_stocks')->update([
            'auto_perday_consumption' => DB::raw("auto_monthly_consumption / {$daysInCurrentMonth}"),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('tbl_material_stocks')->update([
            'auto_perday_consumption' => DB::raw('auto_monthly_consumption / 30'),
            'updated_at' => now(),
        ]);
    }
};
