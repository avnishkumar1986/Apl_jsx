<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_modules', function (Blueprint $table): void {
            $table->string('planning_mode', 10)->nullable()->after('status');
            $table->date('planning_mode_month')->nullable()->after('planning_mode');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_modules', function (Blueprint $table): void {
            $table->dropColumn(['planning_mode', 'planning_mode_month']);
        });
    }
};
