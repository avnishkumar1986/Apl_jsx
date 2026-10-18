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
        Schema::create('security_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('security_scan_id')->constrained()->cascadeOnDelete();
            $table->string('ecosystem', 20)->index();
            $table->string('package_name')->index();
            $table->string('installed_version')->nullable();
            $table->text('vulnerable_versions')->nullable();
            $table->string('advisory_id')->nullable()->index();
            $table->string('title');
            $table->string('severity', 20)->index();
            $table->text('advisory_url')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('raw_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_findings');
    }
};
