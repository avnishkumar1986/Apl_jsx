<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_support_tickets', function (Blueprint $table): void {
            $table->unsignedBigInteger('support_department_id')->nullable()->index()->after('department_id');
        });

        $itDepartmentId = DB::table('tbl_departments')->where('department_code', 'IT')->where('status', true)->value('id');
        if ($itDepartmentId) {
            DB::table('tbl_support_tickets')->whereNull('support_department_id')->update(['support_department_id' => $itDepartmentId]);
        }
    }

    public function down(): void
    {
        Schema::table('tbl_support_tickets', function (Blueprint $table): void {
            $table->dropIndex(['support_department_id']);
            $table->dropColumn('support_department_id');
        });
    }
};
