<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_material_stocks', function (Blueprint $table): void {
            if (Schema::hasColumn('tbl_material_stocks', 'auto_m_consump')) {
                $table->renameColumn('auto_m_consump', 'auto_monthly_consumption');
            }
            if (Schema::hasColumn('tbl_material_stocks', 'auto_per_day_consumption')) {
                $table->renameColumn('auto_per_day_consumption', 'auto_perday_consumption');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tbl_material_stocks', function (Blueprint $table): void {
            if (Schema::hasColumn('tbl_material_stocks', 'auto_monthly_consumption')) {
                $table->renameColumn('auto_monthly_consumption', 'auto_m_consump');
            }
            if (Schema::hasColumn('tbl_material_stocks', 'auto_perday_consumption')) {
                $table->renameColumn('auto_perday_consumption', 'auto_per_day_consumption');
            }
        });
    }
};
