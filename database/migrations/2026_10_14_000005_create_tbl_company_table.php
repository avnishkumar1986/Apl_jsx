<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_company')) {
            Schema::create('tbl_company', function (Blueprint $table): void {
                $table->id();
                $table->string('company_code', 30)->unique();
                $table->string('company_name', 255)->unique();
                $table->unsignedTinyInteger('record_type')->default(1)->index()->comment('1 = Company, 2 = Plant, 3 = Head Office');
                $table->string('parent_company_id', 30)->nullable()->index();
                $table->unsignedBigInteger('address_id')->nullable()->index();
                $table->unsignedBigInteger('contact_id')->nullable()->index();
                $table->string('gstin', 15)->nullable()->index();
                $table->string('pan', 10)->nullable()->index();
                $table->boolean('status')->default(true)->index();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
                $table->unsignedBigInteger('updated_by')->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_company');
    }
};
