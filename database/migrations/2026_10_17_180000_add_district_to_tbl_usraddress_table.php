<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_usraddress', function (Blueprint $table) {
            $table->string('district', 100)->nullable()->after('state')->index();
        });
    }

    public function down(): void
    {
        Schema::table('tbl_usraddress', function (Blueprint $table) {
            $table->dropIndex(['district']);
            $table->dropColumn('district');
        });
    }
};
