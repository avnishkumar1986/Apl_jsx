<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('procurement_balance_results')->updateOrInsert([
            'material' => '__PLANNING_MODE__',
            'plant_id' => 0,
            'month' => now()->startOfMonth()->toDateString(),
        ], [
            'calculations' => json_encode(['planning_mode' => 'manual']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('procurement_balance_results')
            ->where('material', '__PLANNING_MODE__')
            ->where('plant_id', 0)
            ->delete();
    }
};
