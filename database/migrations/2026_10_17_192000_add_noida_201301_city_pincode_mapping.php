<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
        DB::table('tbl_india_city_pincodes')
            ->where('city', 'Noida')
            ->where('pin_code', '201301')
            ->delete();
    }
};
