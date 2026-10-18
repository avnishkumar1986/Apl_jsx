<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'stock')
            ->update([
                'description' => 'Stock · matched to materials by Material Code + Plant',
                'target_table' => 'tbl_materials',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')
            ->where('code', 'stock')
            ->update(['description' => 'Stock', 'updated_at' => now()]);
    }
};
