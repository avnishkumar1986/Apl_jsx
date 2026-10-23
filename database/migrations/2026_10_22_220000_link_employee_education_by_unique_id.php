<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_users') || ! Schema::hasTable('tbl_usreducation')) {
            return;
        }

        $userTypeColumn = Schema::hasColumn('tbl_users', 'user_type') ? 'user_type' : 'user_type_id';

        DB::table('tbl_users')
            ->where($userTypeColumn, 'USR6')
            ->whereNotNull('unique_id')
            ->orderBy('id')
            ->get(['id', 'unique_id'])
            ->each(function ($employee): void {
                DB::table('tbl_usreducation')
                    ->where('user_id', (string) $employee->id)
                    ->update([
                        'user_id' => (string) $employee->unique_id,
                        'user_type' => 'USR6',
                    ]);

                DB::table('tbl_usreducation')
                    ->where('user_id', (string) $employee->unique_id)
                    ->update(['user_type' => 'USR6']);
            });
    }

    public function down(): void
    {
        // Employee unique IDs are the canonical keys for user-owned education records.
    }
};
