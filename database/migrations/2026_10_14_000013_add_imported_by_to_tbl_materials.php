<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_materials', 'imported_by')) {
            Schema::table('tbl_materials', function (Blueprint $table) {
                $table->unsignedBigInteger('imported_by')->nullable()->index()->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_materials', 'imported_by')) {
            Schema::table('tbl_materials', fn (Blueprint $table) => $table->dropColumn('imported_by'));
        }
    }
};
