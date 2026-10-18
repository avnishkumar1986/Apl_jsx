<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_india_city_pincodes')) {
            return;
        }

        if (! DB::table('tbl_india_city_pincodes')->where('city', 'Noida')->where('pin_code', '201301')->exists()) {
            DB::table('tbl_india_city_pincodes')->insert([
                'id' => ((int) DB::table('tbl_india_city_pincodes')->max('id')) + 1,
                'city' => 'Noida',
                'pin_code' => '201301',
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('tbl_india_city_pincodes')) {
            return;
        }

        DB::table('tbl_india_city_pincodes')
            ->where('city', 'Noida')
            ->where('pin_code', '201301')
            ->delete();
    }
};
