<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_users', 'name')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('name')->after('last_name');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'email')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('email')->unique()->after('name');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'email_verified_at')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'password')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('password')->after('email_verified_at');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'remember_token')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->rememberToken()->after('password');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table) {
            $table->dropUnique('tbl_users_email_unique');
            $table->dropColumn([
                'name',
                'email',
                'email_verified_at',
                'password',
                'remember_token',
            ]);
        });
    }
};
