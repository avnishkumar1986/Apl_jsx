<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_company')
            ->whereNotNull('address_id')
            ->orderBy('id')
            ->each(function (object $company): void {
                DB::table('tbl_usraddress')->where('id', $company->address_id)->update([
                    'user_type' => (int) $company->record_type === 2 ? 'USR9' : 'USR10',
                    'user_id' => (string) $company->id,
                ]);
            });

        DB::table('tbl_company')
            ->whereNotNull('contact_id')
            ->orderBy('id')
            ->each(function (object $company): void {
                DB::table('tbl_usrcontact')->where('id', $company->contact_id)->update([
                    'usr_type' => (int) $company->record_type === 2 ? 'USR9' : 'USR10',
                    'user_id' => (string) $company->id,
                ]);
            });
    }

    public function down(): void
    {
        // The previous free-form values cannot be reconstructed safely.
    }
};
