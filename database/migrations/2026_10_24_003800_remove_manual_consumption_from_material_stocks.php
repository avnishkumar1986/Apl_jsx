<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_material_stocks', 'man_perday_consumption')) {
            Schema::table('tbl_material_stocks', fn (Blueprint $table) => $table->decimal('man_perday_consumption', 20, 3)->default(0)->after('auto_perday_consumption'));
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_material_stocks', 'man_perday_consumption')) {
            Schema::table('tbl_material_stocks', fn (Blueprint $table) => $table->dropColumn('man_perday_consumption'));
        }
    }
};
