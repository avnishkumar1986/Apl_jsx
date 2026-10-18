<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tbl_usreducation')) {
            Schema::table('tbl_usreducation', function (Blueprint $table) {
                if (! Schema::hasColumn('tbl_usreducation', 'university_name')) $table->string('university_name')->nullable()->after('institution_name');
                if (! Schema::hasColumn('tbl_usreducation', 'grade')) $table->string('grade', 50)->nullable()->after('end_date');
                if (! Schema::hasColumn('tbl_usreducation', 'currently_studying')) $table->boolean('currently_studying')->default(false)->after('grade');
                if (! Schema::hasColumn('tbl_usreducation', 'document_path')) $table->string('document_path')->nullable()->after('currently_studying');
            });
            return;
        }
        Schema::create('tbl_usreducation', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('education_level', 100)->nullable();
            $table->string('degree_name', 150)->nullable();
            $table->string('institution_name')->nullable();
            $table->string('university_name')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('grade', 50)->nullable();
            $table->boolean('currently_studying')->default(false);
            $table->string('document_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // The table may predate this migration; keep existing employee education data intact.
    }
};
