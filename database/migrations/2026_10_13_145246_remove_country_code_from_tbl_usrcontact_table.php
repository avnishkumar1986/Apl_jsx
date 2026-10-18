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
        Schema::table('tbl_usrcontact', function (Blueprint $table) {
            $table->dropUnique('tbl_usrcontact_user_id_country_code_contact_number_unique');
            $table->dropColumn('country_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_usrcontact', function (Blueprint $table) {
            $table->string('country_code', 10)->nullable()->after('email');
            $table->unique(['user_id', 'country_code', 'contact_number']);
        });
    }
};
