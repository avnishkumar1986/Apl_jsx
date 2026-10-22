<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_usraddress', 'user_type')) {
            Schema::table('tbl_usraddress', function (Blueprint $table): void {
                $table->string('user_type', 20)->nullable()->after('id')->index();
            });
        }

        if (! Schema::hasColumn('tbl_usrcontact', 'usr_type')) {
            Schema::table('tbl_usrcontact', function (Blueprint $table): void {
                $table->string('usr_type', 20)->nullable()->after('id')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_usraddress', 'user_type')) {
            Schema::table('tbl_usraddress', function (Blueprint $table): void {
                $table->dropColumn('user_type');
            });
        }

        if (Schema::hasColumn('tbl_usrcontact', 'usr_type')) {
            Schema::table('tbl_usrcontact', function (Blueprint $table): void {
                $table->dropColumn('usr_type');
            });
        }
    }
};
