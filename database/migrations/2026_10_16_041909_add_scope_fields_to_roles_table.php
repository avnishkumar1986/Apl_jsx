<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tbl_roles', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('status')->constrained('tbl_departments')->nullOnDelete();
            $table->foreignId('designation_id')->nullable()->after('department_id')->constrained('tbl_designations')->nullOnDelete();
        });

        Schema::create('tbl_role_company', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained('tbl_roles')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('tbl_company')->cascadeOnDelete();
            $table->primary(['role_id', 'company_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_role_company');

        Schema::table('tbl_roles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('designation_id');
            $table->dropConstrainedForeignId('department_id');
        });
    }
};
