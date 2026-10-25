<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurement_mou_plans', function (Blueprint $table): void {
            $table->dropUnique(['consumption_id', 'vendor_name']);
            $table->unsignedBigInteger('consumption_id')->nullable()->change();
            $table->unsignedBigInteger('company_id')->nullable()->after('consumption_id')->index();
            $table->unsignedBigInteger('plant_id')->nullable()->after('company_id')->index();
            $table->string('material', 50)->nullable()->after('plant_id')->index();
            $table->date('planning_month')->nullable()->after('material')->index();
            $table->unique(
                ['company_id', 'plant_id', 'material', 'planning_month', 'vendor_name'],
                'procurement_mou_auto_scope_vendor_unique',
            );
            $table->unique(['consumption_id', 'vendor_name']);
        });
    }

    public function down(): void
    {
        DB::table('procurement_mou_plans')->whereNull('consumption_id')->delete();
        Schema::table('procurement_mou_plans', function (Blueprint $table): void {
            $table->dropUnique('procurement_mou_auto_scope_vendor_unique');
            $table->dropUnique(['consumption_id', 'vendor_name']);
            $table->dropColumn(['company_id', 'plant_id', 'material', 'planning_month']);
            $table->unsignedBigInteger('consumption_id')->nullable(false)->change();
            $table->unique(['consumption_id', 'vendor_name']);
        });
    }
};
