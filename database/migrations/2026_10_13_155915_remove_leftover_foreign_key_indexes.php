<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $indexes = [
            'tbl_role_has_permissions' => 'tbl_role_has_permissions_role_id_foreign',
            'tbl_users' => 'tbl_users_user_type_id_foreign',
        ];

        foreach ($indexes as $tableName => $indexName) {
            Schema::table($tableName, function (Blueprint $table) use ($indexName): void {
                $table->dropIndex($indexName);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $indexes = [
            ['tbl_role_has_permissions', 'role_id', 'tbl_role_has_permissions_role_id_foreign'],
            ['tbl_users', 'user_type_id', 'tbl_users_user_type_id_foreign'],
        ];

        foreach ($indexes as [$tableName, $column, $indexName]) {
            Schema::table($tableName, function (Blueprint $table) use ($column, $indexName): void {
                $table->index($column, $indexName);
            });
        }
    }
};
