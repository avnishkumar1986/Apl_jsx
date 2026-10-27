<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurement_planning_decisions', function (Blueprint $table): void {
            $table->timestamp('locked_at')->nullable()->after('status');
            $table->unsignedBigInteger('locked_by')->nullable()->after('locked_at');
        });
    }

    public function down(): void
    {
        Schema::table('procurement_planning_decisions', fn (Blueprint $table) => $table->dropColumn(['locked_at', 'locked_by']));
    }
};
