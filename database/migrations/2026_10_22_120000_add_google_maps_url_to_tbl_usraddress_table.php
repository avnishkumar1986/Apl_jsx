<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_usraddress', function (Blueprint $table): void {
            $table->text('google_maps_url')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_usraddress', function (Blueprint $table): void {
            $table->dropColumn('google_maps_url');
        });
    }
};
