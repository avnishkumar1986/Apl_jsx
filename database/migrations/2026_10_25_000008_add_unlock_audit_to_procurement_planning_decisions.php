<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurement_planning_decisions', function (Blueprint $table): void {
            $table->timestamp('unlocked_at')->nullable()->after('locked_by');
            $table->unsignedBigInteger('unlocked_by')->nullable()->after('unlocked_at');
        });
    }

    public function down(): void
    {
        Schema::table('procurement_planning_decisions', function (Blueprint $table): void {
            $table->dropColumn(['unlocked_at', 'unlocked_by']);
        });
    }
};
