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
        Schema::create('tbl_usreducation', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 10);
            $table->string('education_level', 100)->index();
            $table->string('institution_name', 255);
            $table->string('board_or_university', 255)->nullable();
            $table->string('degree_name', 150)->nullable();
            $table->string('field_of_study', 150)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('passing_year')->nullable()->index();
            $table->string('grade', 30)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->boolean('is_highest')->default(false)->index();
            $table->string('status', 20)->default('active')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'education_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_usreducation');
    }
};
