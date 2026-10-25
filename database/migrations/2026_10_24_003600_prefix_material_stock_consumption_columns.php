<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tbl_material_stocks', 'm_consump')) {
            Schema::table('tbl_material_stocks', fn (Blueprint $table) => $table->renameColumn('m_consump', 'auto_m_consump'));
        }
        if (Schema::hasColumn('tbl_material_stocks', 'per_day_consumption')) {
            Schema::table('tbl_material_stocks', fn (Blueprint $table) => $table->renameColumn('per_day_consumption', 'auto_per_day_consumption'));
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_material_stocks', 'auto_m_consump')) {
            Schema::table('tbl_material_stocks', fn (Blueprint $table) => $table->renameColumn('auto_m_consump', 'm_consump'));
        }
        if (Schema::hasColumn('tbl_material_stocks', 'auto_per_day_consumption')) {
            Schema::table('tbl_material_stocks', fn (Blueprint $table) => $table->renameColumn('auto_per_day_consumption', 'per_day_consumption'));
        }
    }
};
