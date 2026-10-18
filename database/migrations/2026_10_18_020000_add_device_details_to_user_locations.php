<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_locations', function (Blueprint $table) {
            $table->string('device_name')->nullable()->after('location_name');
            $table->text('user_agent')->nullable()->after('device_name');
        });
    }

    public function down(): void
    {
        Schema::table('user_locations', function (Blueprint $table) {
            $table->dropColumn(['device_name', 'user_agent']);
        });
    }
};
