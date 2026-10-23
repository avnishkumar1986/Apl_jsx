<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tbl_usrlogin', 'login_name') && ! Schema::hasColumn('tbl_usrlogin', 'username')) {
            Schema::table('tbl_usrlogin', function (Blueprint $table): void {
                $table->renameColumn('login_name', 'username');
            });
        }

        if (! Schema::hasTable('tbl_users') || ! Schema::hasTable('tbl_usrlogin')) {
            return;
        }

        DB::table('tbl_users')->select(['id', 'unique_id', 'user_type'])->whereNotNull('unique_id')->orderBy('id')
            ->each(function (object $user): void {
                DB::table('tbl_usrlogin')
                    ->where(fn ($query) => $query->where('user_id', (string) $user->id)->orWhere('user_id', $user->unique_id))
                    ->update(['user_id' => $user->unique_id, 'usr_type' => $user->user_type]);
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('tbl_usrlogin', 'username') && ! Schema::hasColumn('tbl_usrlogin', 'login_name')) {
            Schema::table('tbl_usrlogin', function (Blueprint $table): void {
                $table->renameColumn('username', 'login_name');
            });
        }
    }
};
