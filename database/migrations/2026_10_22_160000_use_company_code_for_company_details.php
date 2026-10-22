<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->updateLinkedDetails(useCompanyCode: true);
    }

    public function down(): void
    {
        $this->updateLinkedDetails(useCompanyCode: false);
    }

    private function updateLinkedDetails(bool $useCompanyCode): void
    {
        DB::table('tbl_company')
            ->select(['id', 'company_code', 'record_type', 'address_id', 'contact_id'])
            ->orderBy('id')
            ->each(function (object $company) use ($useCompanyCode): void {
                $detailType = match ((int) $company->record_type) {
                    2 => 'USR9',
                    3 => 'USR11',
                    default => 'USR10',
                };
                $fromUserId = $useCompanyCode ? (string) $company->id : (string) $company->company_code;
                $toUserId = $useCompanyCode ? (string) $company->company_code : (string) $company->id;

                if ($company->address_id !== null) {
                    DB::table('tbl_usraddress')
                        ->where('id', $company->address_id)
                        ->where('user_type', $detailType)
                        ->where('user_id', $fromUserId)
                        ->update(['user_id' => $toUserId]);
                }

                if ($company->contact_id !== null) {
                    DB::table('tbl_usrcontact')
                        ->where('id', $company->contact_id)
                        ->where('usr_type', $detailType)
                        ->where('user_id', $fromUserId)
                        ->update(['user_id' => $toUserId]);
                }
            });
    }
};
