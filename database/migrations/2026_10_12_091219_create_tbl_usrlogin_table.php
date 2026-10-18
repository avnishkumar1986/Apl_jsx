<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbl_usrlogin', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 10)->unique();
            $table->string('login_name')->unique();
            $table->string('password');
            $table->timestamp('last_login_at')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();
        });

        DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
            DB::table('tbl_usrlogin')->insert([
                'user_id' => $user->id,
                'login_name' => $user->email,
                'password' => $user->password ?: Hash::make(str()->random(40)),
                'status' => $user->status,
                'created_by' => $user->created_by,
                'updated_by' => $user->updated_by,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_usrlogin');
    }
};
