<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_material_stocks', function (Blueprint $table) {
            $table->index('material_desc', 'material_stocks_description_index');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_material_stocks', function (Blueprint $table) {
            $table->dropIndex('material_stocks_description_index');
        });
    }
};
