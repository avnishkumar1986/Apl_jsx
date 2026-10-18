<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_usrcontact', function (Blueprint $table): void {
            $table->timestamp('email_verified_at')->nullable()->after('is_verified');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_usrcontact', function (Blueprint $table): void {
            $table->dropColumn(['email_verified_at', 'phone_verified_at']);
        });
    }
};
