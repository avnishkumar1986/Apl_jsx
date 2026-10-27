<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_modules', 'display_locations')) {
            Schema::table('tbl_modules', function (Blueprint $table): void {
                $table->json('display_locations')->nullable()->after('manifest');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_modules', 'display_locations')) {
            Schema::table('tbl_modules', function (Blueprint $table): void {
                $table->dropColumn('display_locations');
            });
        }
    }
};
