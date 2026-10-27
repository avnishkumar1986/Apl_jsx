<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_modules', function (Blueprint $table): void {
            if (! Schema::hasColumn('tbl_modules', 'planning_mode')) {
                $table->string('planning_mode', 10)->nullable()->after('status');
            }
            if (! Schema::hasColumn('tbl_modules', 'planning_mode_month')) {
                $table->date('planning_mode_month')->nullable()->after('planning_mode');
            }
        });

        $legacy = DB::table('procurement_balance_results')
            ->where('material', '__PLANNING_MODE__')
            ->where('plant_id', 0)
            ->latest('month')
            ->first();
        if ($legacy && in_array($legacy->planning_mode ?? null, ['auto', 'manual'], true)) {
            DB::table('tbl_modules')->where('slug', 'procurement')->update([
                'planning_mode' => $legacy->planning_mode,
                'planning_mode_month' => $legacy->month,
                'updated_at' => now(),
            ]);
        }

        DB::table('procurement_balance_results')
            ->where('material', '__PLANNING_MODE__')
            ->where('plant_id', 0)
            ->delete();

        if (Schema::hasColumn('procurement_balance_results', 'planning_mode')) {
            Schema::table('procurement_balance_results', fn (Blueprint $table) => $table->dropColumn('planning_mode'));
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('procurement_balance_results', 'planning_mode')) {
            Schema::table('procurement_balance_results', fn (Blueprint $table) => $table->string('planning_mode', 10)->nullable()->after('month'));
        }
        Schema::table('tbl_modules', fn (Blueprint $table) => $table->dropColumn(['planning_mode', 'planning_mode_month']));
    }
};
