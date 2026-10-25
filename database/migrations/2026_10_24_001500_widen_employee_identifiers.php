<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->string('unique_id', 50)->change();
        });
        Schema::table('tbl_usrcontact', function (Blueprint $table): void {
            $table->string('user_id', 50)->change();
        });
        Schema::table('tbl_usrdept', function (Blueprint $table): void {
            $table->string('user_id', 50)->change();
        });
    }

    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->string('unique_id', 10)->change();
        });
        Schema::table('tbl_usrcontact', function (Blueprint $table): void {
            $table->string('user_id', 10)->change();
        });
        Schema::table('tbl_usrdept', function (Blueprint $table): void {
            $table->string('user_id', 10)->change();
        });
    }
};
