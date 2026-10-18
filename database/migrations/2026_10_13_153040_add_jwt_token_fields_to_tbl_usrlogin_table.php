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
        Schema::table('tbl_usrlogin', function (Blueprint $table) {
            $table->text('jwt_token')->nullable()->after('last_login_at');
            $table->timestamp('jwt_token_expires_at')->nullable()->after('jwt_token');
            $table->timestamp('jwt_token_revoked_at')->nullable()->after('jwt_token_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_usrlogin', function (Blueprint $table) {
            $table->dropColumn([
                'jwt_token',
                'jwt_token_expires_at',
                'jwt_token_revoked_at',
            ]);
        });
    }
};
