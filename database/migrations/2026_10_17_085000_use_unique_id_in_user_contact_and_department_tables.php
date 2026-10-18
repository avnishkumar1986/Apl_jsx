<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_users')->select(['id', 'unique_id'])->orderBy('id')->each(function (object $user): void {
            if (blank($user->unique_id)) {
                return;
            }

            DB::table('tbl_usrcontact')->where('user_id', (string) $user->id)->update([
                'user_id' => (string) $user->unique_id,
            ]);
            DB::table('tbl_usrdept')->where('user_id', (string) $user->id)->update([
                'user_id' => (string) $user->unique_id,
            ]);
        });
    }

    public function down(): void
    {
        DB::table('tbl_users')->select(['id', 'unique_id'])->orderBy('id')->each(function (object $user): void {
            if (blank($user->unique_id)) {
                return;
            }

            DB::table('tbl_usrcontact')->where('user_id', (string) $user->unique_id)->update([
                'user_id' => (string) $user->id,
            ]);
            DB::table('tbl_usrdept')->where('user_id', (string) $user->unique_id)->update([
                'user_id' => (string) $user->id,
            ]);
        });
    }
};
