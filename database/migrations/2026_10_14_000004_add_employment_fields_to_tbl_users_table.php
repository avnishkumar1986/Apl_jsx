<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->string('marital_status', 20)->nullable()->after('gender');
            $table->string('company', 150)->nullable()->after('anniversary_date');
            $table->string('sitting_location', 150)->nullable()->after('company');
            $table->unsignedBigInteger('department_id')->nullable()->index()->after('sitting_location');
            $table->unsignedBigInteger('designation_id')->nullable()->index()->after('department_id');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->dropIndex(['department_id']);
            $table->dropIndex(['designation_id']);
            $table->dropColumn(['marital_status', 'company', 'sitting_location', 'department_id', 'designation_id']);
        });
    }
};
