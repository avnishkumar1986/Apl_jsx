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
        Schema::create('tbl_usrbanking', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 10);
            $table->string('account_holder_name', 150);
            $table->string('bank_name', 150);
            $table->string('account_number', 50);
            $table->string('account_type', 30)->nullable();
            $table->string('branch_name', 150)->nullable();
            $table->string('ifsc_code', 20)->nullable()->index();
            $table->string('swift_code', 20)->nullable();
            $table->boolean('is_primary')->default(false)->index();
            $table->string('status', 20)->default('active')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->unique(['user_id', 'account_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_usrbanking');
    }
};
