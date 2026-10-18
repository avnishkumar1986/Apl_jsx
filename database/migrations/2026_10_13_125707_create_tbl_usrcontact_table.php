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
        Schema::create('tbl_usrcontact', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 10);
            $table->string('contact_type', 30)->default('primary');
            $table->string('email')->nullable()->index();
            $table->string('country_code', 10)->nullable();
            $table->string('contact_number', 30)->nullable()->index();
            $table->boolean('is_primary')->default(false)->index();
            $table->boolean('is_verified')->default(false)->index();
            $table->string('status', 20)->default('active')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->unique(['user_id', 'email']);
            $table->unique(['user_id', 'country_code', 'contact_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_usrcontact');
    }
};
