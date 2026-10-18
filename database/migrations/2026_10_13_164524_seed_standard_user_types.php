<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_usertype', 'uid')) {
            Schema::table('tbl_usertype', function (Blueprint $table) {
                $table->string('uid', 10)->nullable()->after('id');
            });
        }

        DB::transaction(function (): void {
            $now = now();
            $userTypes = [
                ['uid' => 'USR1', 'name' => 'Distributor', 'description' => 'Authorized product distributor'],
                ['uid' => 'USR2', 'name' => 'Retailer', 'description' => 'Authorized retail partner'],
                ['uid' => 'USR3', 'name' => 'Plumber', 'description' => 'Registered plumber or installation professional'],
                ['uid' => 'USR4', 'name' => 'Customer', 'description' => 'Customer purchasing products or services'],
                ['uid' => 'USR5', 'name' => 'User', 'description' => 'Standard application user'],
                ['uid' => 'USR6', 'name' => 'Employee', 'description' => 'Employee of head office'],
                ['uid' => 'USR7', 'name' => 'Supplier', 'description' => 'External supplier or vendor account'],
            ];

            $standardUser = DB::table('tbl_usertype')->where('name', 'Standard User')->first();
            if ($standardUser !== null) {
                DB::table('tbl_usertype')->where('id', $standardUser->id)->update([
                    ...$userTypes[4],
                    'status' => 'active',
                    'updated_at' => $now,
                ]);
            }

            foreach ($userTypes as $userType) {
                DB::table('tbl_usertype')->updateOrInsert(
                    ['uid' => $userType['uid']],
                    [
                        ...$userType,
                        'status' => 'active',
                        'updated_at' => $now,
                        'created_at' => $now,
                    ],
                );
            }

            DB::table('tbl_users')
                ->where('email', 'demo@apollo.local')
                ->update(['user_type_id' => 'USR5']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tbl_users')
            ->whereIn('user_type_id', ['USR1', 'USR2', 'USR3', 'USR4', 'USR5', 'USR6', 'USR7'])
            ->update(['user_type_id' => null]);

        DB::table('tbl_usertype')
            ->whereIn('uid', ['USR1', 'USR2', 'USR3', 'USR4', 'USR5', 'USR6', 'USR7'])
            ->delete();

        Schema::table('tbl_usertype', function (Blueprint $table) {
            $table->dropColumn('uid');
        });
    }
};
