<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_designation_levels')) {
            Schema::create('tbl_designation_levels', function (Blueprint $table): void {
                $table->id();
                $table->string('level_code', 20)->unique();
                $table->string('level_name', 100)->unique();
                $table->unsignedInteger('hierarchy_order')->unique();
                $table->unsignedBigInteger('reports_to_level_id')->nullable()->index();
                $table->boolean('status')->default(true)->index();
                $table->timestamps();
            });
        }
        $now = now();
        foreach ([[1, 'L1', 'Level 1', 1, 2], [2, 'L2', 'Level 2', 2, 3], [3, 'L3', 'Level 3', 3, 4], [4, 'L4', 'Level 4', 4, 5], [5, 'L5', 'Level 5', 5, 6], [6, 'L6', 'Level 6', 6, null]] as [$id, $code, $name, $order, $reportsTo]) {
            DB::table('tbl_designation_levels')->updateOrInsert(['id' => $id], ['level_code' => $code, 'level_name' => $name, 'hierarchy_order' => $order, 'reports_to_level_id' => $reportsTo, 'status' => true, 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        // Preserve an existing business master table when rolling back.
    }
};
