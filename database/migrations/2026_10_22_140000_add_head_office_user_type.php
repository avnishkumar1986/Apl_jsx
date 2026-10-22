<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_usertype')->updateOrInsert(
            ['uid' => 'USR11'],
            [
                'name' => 'Head Office',
                'description' => 'Head office company location',
                'status' => true,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        $headOffices = DB::table('tbl_company')->where('record_type', 3)->get(['id', 'address_id', 'contact_id']);
        foreach ($headOffices as $company) {
            if ($company->address_id !== null) {
                DB::table('tbl_usraddress')->where('id', $company->address_id)->update([
                    'user_type' => 'USR11',
                    'user_id' => (string) $company->id,
                ]);
            }
            if ($company->contact_id !== null) {
                DB::table('tbl_usrcontact')->where('id', $company->contact_id)->update([
                    'usr_type' => 'USR11',
                    'user_id' => (string) $company->id,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('tbl_usertype')->where('uid', 'USR11')->where('name', 'Head Office')->delete();
    }
};
