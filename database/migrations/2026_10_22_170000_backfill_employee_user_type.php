<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $userTypeColumn = Schema::hasColumn('tbl_users', 'user_type') ? 'user_type' : 'user_type_id';
        $employees = DB::table('tbl_users')
            ->where($userTypeColumn, 'USR6')
            ->get(['id', 'unique_id']);

        $employeeIds = $employees->pluck('id')->filter()->values();
        $employeeUniqueIds = $employees->pluck('unique_id')->filter()->values();

        if ($employeeIds->isNotEmpty()) {
            DB::table('tbl_usraddress')
                ->whereIn('user_id', $employeeIds)
                ->where(function ($query): void {
                    $query->whereNull('user_type')->orWhere('user_type', 'USR6');
                })
                ->update(['user_type' => 'USR6']);
        }

        if ($employeeUniqueIds->isNotEmpty()) {
            DB::table('tbl_usrcontact')
                ->whereIn('user_id', $employeeUniqueIds)
                ->where(function ($query): void {
                    $query->whereNull('usr_type')->orWhere('usr_type', 'USR6');
                })
                ->update(['usr_type' => 'USR6']);
        }
    }

    public function down(): void
    {
        // This migration corrects existing ownership metadata and is intentionally not reversed.
    }
};
