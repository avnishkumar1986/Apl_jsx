<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tbl_modules', 'planning_mode')) {
            Schema::table('tbl_modules', fn (Blueprint $table) => $table->dropColumn(['planning_mode', 'planning_mode_month']));
        }
    }

    public function down(): void
    {
        Schema::table('tbl_modules', function (Blueprint $table): void {
            $table->string('planning_mode', 10)->nullable();
            $table->date('planning_mode_month')->nullable();
        });
    }
};
