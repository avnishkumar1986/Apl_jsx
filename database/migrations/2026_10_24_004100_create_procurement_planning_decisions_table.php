<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('procurement_planning_decisions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('company_id')->index();
            $table->unsignedBigInteger('plant_id')->index();
            $table->string('material', 50)->index();
            $table->date('planning_month')->index();
            $table->string('planning_mode', 10);
            $table->boolean('status')->default(true)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'plant_id', 'material', 'planning_month'], 'procurement_planning_decision_scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procurement_planning_decisions');
    }
};
