<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $companies = [
            [1, '1000', 'APL', 1, null, 1, 1, '27ABCDE1234F1Z5', 'ABCDE1234F', 1, '2026-09-17 22:35:38', 1, '2026-10-08 12:07:18', 1],
            [2, '5000', 'KPL', 1, null, 2, 2, '27ABCDE1234F1Z5', 'ABCDE1234F', 1, '2026-09-17 22:37:21', 1, '2026-10-06 09:22:35', 1],
            [3, '1200', 'Dadri Plant', 2, '1000', 3, 3, '27ABCDE1234F1Z5', 'ABCDE1234F', 1, '2026-09-17 22:39:40', 1, '2026-09-28 14:55:18', 1],
            [4, '1300', 'Sikandrabad Plant', 2, '1000', 4, 4, '453534534534', 'ABCDE1234F', 1, '2026-09-17 22:43:59', 1, '2026-09-28 14:55:18', 1],
            [5, '1400', 'Ahmedabad Plant', 2, '1000', 15, 34, '27ABCDE1234F1Z5', 'ABCDE1234F', 1, '2026-09-17 22:50:43', 1, '2026-10-03 07:28:30', 1],
            [9, '1600', 'Tumkur Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [10, '1700', 'Raipur Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [11, '1500', 'Head Office', 3, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [12, '0', 'Other Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', 1],
            [13, '1900', 'Chunar Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [14, '3200', 'Boisar Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [15, '3300', 'Ludhiana Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [16, '6800', 'Ludhiana Plant-2', 2, '5000', 8, 19, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 11:53:17', 1],
            [17, '5300', 'Silvassa Plant', 2, '5000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-28 14:55:18', null],
            [18, '5200', 'Tarapur Plant', 2, '5000', 6, 15, '27ABCDE1234F1Z5', 'ABCDE1234F', 1, '2026-09-18 04:31:08', null, '2026-09-28 09:57:02', 1],
            [19, '6600', 'KML-Warehouse Plant', 2, '1000', null, null, null, null, 1, '2026-09-18 04:31:08', null, '2026-09-18 04:31:08', null],
        ];

        foreach ($companies as [$id, $code, $name, $type, $parent, $address, $contact, $gstin, $pan, $status, $createdAt, $createdBy, $updatedAt, $updatedBy]) {
            DB::table('tbl_company')->updateOrInsert(
                ['id' => $id],
                [
                    'company_code' => $code,
                    'company_name' => $name,
                    'record_type' => $type,
                    'parent_company_id' => $parent,
                    'address_id' => $address,
                    'contact_id' => $contact,
                    'gstin' => $gstin,
                    'pan' => $pan,
                    'status' => $status,
                    'created_at' => $createdAt,
                    'created_by' => $createdBy,
                    'updated_at' => $updatedAt,
                    'updated_by' => $updatedBy,
                ],
            );
        }
    }

    public function down(): void
    {
        DB::table('tbl_company')->whereIn('id', [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])->delete();
    }
};
