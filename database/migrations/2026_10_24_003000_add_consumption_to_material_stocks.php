<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_material_stocks', function (Blueprint $table): void {
            $table->decimal('auto_monthly_consumption', 20, 3)->default(0)->after('stock_value');
            $table->decimal('auto_perday_consumption', 20, 3)->default(0)->after('auto_monthly_consumption');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_material_stocks', function (Blueprint $table): void {
            $table->dropColumn(['auto_monthly_consumption', 'auto_perday_consumption']);
        });
    }
};
