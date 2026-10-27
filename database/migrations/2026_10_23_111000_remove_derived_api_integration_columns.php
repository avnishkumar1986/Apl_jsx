<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table): void {
            $table->dropColumn(['method', 'auth_type', 'credential_key']);
        });
    }

    public function down(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table): void {
            $table->string('method', 10)->default('GET')->after('endpoint');
            $table->string('auth_type', 30)->default('none')->after('method');
            $table->string('credential_key')->nullable()->after('auth_type');
        });
    }
};
