<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tbl_api_integration_logs')
            && Schema::hasColumn('tbl_api_integration_logs', 'message')) {
            Schema::table('tbl_api_integration_logs', function (Blueprint $table): void {
                $table->longText('message')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Large API exceptions cannot safely be converted back to TEXT.
    }
};
