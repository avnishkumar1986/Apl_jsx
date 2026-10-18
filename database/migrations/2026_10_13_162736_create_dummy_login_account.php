<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();
            $password = Hash::make('Password@123');

            DB::table('tbl_users')->updateOrInsert(
                ['email' => 'demo@apollo.local'],
                [
                    'unique_id' => 'USR0000001',
                    'first_name' => 'Demo',
                    'last_name' => 'User',
                    'name' => 'Demo User',
                    'email_verified_at' => $now,
                    'password' => $password,
                    'status' => 'active',
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );

            $userId = DB::table('tbl_users')
                ->where('email', 'demo@apollo.local')
                ->value('id');

            DB::table('tbl_usrlogin')->updateOrInsert(
                ['login_name' => 'demo@apollo.local'],
                [
                    'user_id' => (string) $userId,
                    'password' => $password,
                    'status' => 'active',
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function (): void {
            DB::table('tbl_usrlogin')
                ->where('login_name', 'demo@apollo.local')
                ->delete();

            DB::table('tbl_users')
                ->where('email', 'demo@apollo.local')
                ->where('unique_id', 'USR0000001')
                ->delete();
        });
    }
};
