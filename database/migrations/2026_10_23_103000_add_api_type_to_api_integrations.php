<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table): void {
            $table->string('api_type', 20)->default('sap')->after('description');
        });

        DB::table('tbl_api_integrations')
            ->where('code', 'security')
            ->update(['api_type' => 'external']);
    }

    public function down(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table): void {
            $table->dropColumn('api_type');
        });
    }
};
