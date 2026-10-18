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
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->dropForeign(['user_type_id']);
            });

            return;
        }

        $constraintsByTable = [
            'tbl_model_has_permissions' => ['tbl_model_has_permissions_permission_id_foreign'],
            'tbl_model_has_roles' => ['tbl_model_has_roles_role_id_foreign'],
            'tbl_role_has_permissions' => [
                'tbl_role_has_permissions_permission_id_foreign',
                'tbl_role_has_permissions_role_id_foreign',
            ],
            'tbl_users' => ['tbl_users_user_type_id_foreign'],
        ];

        foreach ($constraintsByTable as $tableName => $constraintNames) {
            Schema::table($tableName, function (Blueprint $table) use ($constraintNames): void {
                foreach ($constraintNames as $constraintName) {
                    $table->dropForeign($constraintName);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->foreign('user_type_id')
                    ->references('id')
                    ->on('tbl_usertype')
                    ->nullOnDelete();
            });

            return;
        }

        $constraints = [
            ['tbl_model_has_permissions', 'permission_id', 'tbl_permissions', 'tbl_model_has_permissions_permission_id_foreign', 'cascade'],
            ['tbl_model_has_roles', 'role_id', 'tbl_roles', 'tbl_model_has_roles_role_id_foreign', 'cascade'],
            ['tbl_role_has_permissions', 'permission_id', 'tbl_permissions', 'tbl_role_has_permissions_permission_id_foreign', 'cascade'],
            ['tbl_role_has_permissions', 'role_id', 'tbl_roles', 'tbl_role_has_permissions_role_id_foreign', 'cascade'],
            ['tbl_users', 'user_type_id', 'tbl_usertype', 'tbl_users_user_type_id_foreign', 'null'],
        ];

        foreach ($constraints as [$tableName, $column, $referencedTable, $constraintName, $deleteRule]) {
            Schema::table($tableName, function (Blueprint $table) use ($column, $referencedTable, $constraintName, $deleteRule): void {
                $foreignKey = $table->foreign($column, $constraintName)
                    ->references('id')
                    ->on($referencedTable);

                if ($deleteRule === 'cascade') {
                    $foreignKey->cascadeOnDelete();
                } else {
                    $foreignKey->nullOnDelete();
                }
            });
        }
    }
};
