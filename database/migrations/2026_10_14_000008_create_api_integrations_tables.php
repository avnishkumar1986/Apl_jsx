<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tbl_api_integrations', function (Blueprint $table) {
            $table->id(); $table->string('name', 120)->unique(); $table->string('code', 80)->unique();
            $table->string('description')->nullable(); $table->string('base_url')->nullable(); $table->string('endpoint')->nullable();
            $table->string('method', 10)->default('GET'); $table->string('auth_type', 30)->default('none');
            $table->string('credential_key')->nullable(); $table->string('target_table')->nullable();
            $table->unsignedTinyInteger('retries')->default(3); $table->unsignedSmallInteger('retry_delay_seconds')->default(10);
            $table->unsignedSmallInteger('timeout_seconds')->default(30); $table->boolean('status')->default(true)->index();
            $table->string('last_run_status', 30)->nullable(); $table->timestamp('last_run_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable(); $table->unsignedBigInteger('updated_by')->nullable(); $table->timestamps();
        });
        Schema::create('tbl_api_integration_logs', function (Blueprint $table) {
            $table->id(); $table->foreignId('api_integration_id')->constrained('tbl_api_integrations')->cascadeOnDelete();
            $table->uuid('run_id')->index(); $table->string('status', 30)->index(); $table->unsignedSmallInteger('http_status')->nullable();
            $table->unsignedTinyInteger('attempt')->default(1); $table->unsignedInteger('duration_ms')->nullable();
            $table->unsignedInteger('records_received')->default(0); $table->text('message')->nullable();
            $table->longText('response_excerpt')->nullable(); $table->unsignedBigInteger('created_by')->nullable(); $table->timestamp('created_at')->useCurrent();
        });
    }
    public function down(): void { Schema::dropIfExists('tbl_api_integration_logs'); Schema::dropIfExists('tbl_api_integrations'); }
};
