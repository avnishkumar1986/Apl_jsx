<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_materials', function (Blueprint $table) {
            $table->dropUnique('materials_matnr_plant_unique');
            $table->dropIndex('tbl_materials_plant_index');
            $table->dropColumn(['plant', 'current_stock', 'stock_value']);
            $table->json('api_payload')->nullable()->after('maktx');
            $table->unique('matnr', 'materials_matnr_unique');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_materials', function (Blueprint $table) {
            $table->dropUnique('materials_matnr_unique');
            $table->string('plant', 10)->nullable()->index()->after('maktx');
            $table->decimal('current_stock', 20, 3)->default(0)->after('plant');
            $table->decimal('stock_value', 20, 3)->default(0)->after('current_stock');
            $table->dropColumn('api_payload');
            $table->unique(['matnr', 'plant'], 'materials_matnr_plant_unique');
        });
    }
};
