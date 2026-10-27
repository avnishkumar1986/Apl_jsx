<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_blocked_ips', function (Blueprint $table): void {
            $table->id();
            $table->string('ip_address', 45)->unique();
            $table->string('reason', 500)->nullable();
            $table->foreignId('blocked_by')->nullable()->constrained('tbl_users')->nullOnDelete();
            $table->timestamp('blocked_at');
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('unblocked_by')->nullable()->constrained('tbl_users')->nullOnDelete();
            $table->timestamp('unblocked_at')->nullable();
            $table->timestamps();

            $table->index(['unblocked_at', 'expires_at']);
            $table->index(['blocked_at', 'ip_address']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_blocked_ips');
    }
};
