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
        Schema::create('security_scans', function (Blueprint $table) {
            $table->id();
            $table->string('status')->default('running')->index();
            $table->unsignedTinyInteger('score')->default(100);
            $table->unsignedInteger('total_findings')->default(0);
            $table->unsignedInteger('critical_findings')->default(0);
            $table->unsignedInteger('high_findings')->default(0);
            $table->unsignedInteger('medium_findings')->default(0);
            $table->unsignedInteger('low_findings')->default(0);
            $table->json('summary')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_scans');
    }
};
