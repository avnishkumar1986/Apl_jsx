<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tbl_users', 'user_type_id') && ! Schema::hasColumn('tbl_users', 'user_type')) {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->renameColumn('user_type_id', 'user_type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_users', 'user_type') && ! Schema::hasColumn('tbl_users', 'user_type_id')) {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->renameColumn('user_type', 'user_type_id');
            });
        }
    }
};
