<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_usrdept', 'user_type')) {
            Schema::table('tbl_usrdept', function (Blueprint $table): void {
                $table->string('user_type', 10)->nullable()->after('id')->index();
            });
        }

        $employeeIds = DB::table('tbl_users')
            ->where('user_type', 'USR6')
            ->whereNotNull('unique_id')
            ->pluck('unique_id');

        if ($employeeIds->isNotEmpty()) {
            DB::table('tbl_usrdept')
                ->whereIn('user_id', $employeeIds)
                ->update(['user_type' => 'USR6']);
        }
    }

    public function down(): void
    {
        // Preserve the ownership metadata because the column may predate this application migration.
    }
};
