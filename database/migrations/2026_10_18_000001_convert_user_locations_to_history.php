<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_locations', function (Blueprint $table) {
            $table->timestamp('captured_at')->nullable()->after('location_name');
            $table->index(['user_id', 'captured_at'], 'user_locations_user_captured_index');
        });

        Schema::table('user_locations', function (Blueprint $table) {
            $table->dropUnique(['user_id']);
        });

        DB::table('user_locations')
            ->whereNull('captured_at')
            ->update(['captured_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        $latestIds = DB::table('user_locations')
            ->selectRaw('MAX(id)')
            ->groupBy('user_id');

        DB::table('user_locations')->whereNotIn('id', $latestIds)->delete();

        Schema::table('user_locations', function (Blueprint $table) {
            $table->unique('user_id');
        });

        Schema::table('user_locations', function (Blueprint $table) {
            $table->dropIndex('user_locations_user_captured_index');
            $table->dropColumn('captured_at');
        });
    }
};
