<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_vendors', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_code', 50)->unique();
            $table->string('vendor_name');
            $table->string('company_code', 30)->nullable()->index();
            $table->boolean('status')->default(true)->index();
            $table->json('api_payload')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tbl_vendor_purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number', 50);
            $table->string('item_number', 30)->default('00010');
            $table->string('vendor_code', 50)->nullable()->index();
            $table->string('vendor_name')->nullable();
            $table->string('company_code', 30)->nullable()->index();
            $table->string('material', 50)->index();
            $table->string('plant_code', 30)->index();
            $table->date('order_date')->nullable();
            $table->date('expected_delivery_date')->nullable()->index();
            $table->decimal('order_quantity', 20, 3)->default(0);
            $table->string('order_unit', 20)->nullable();
            $table->decimal('quantity_mt', 20, 3)->default(0);
            $table->decimal('received_quantity_mt', 20, 3)->default(0);
            $table->string('delivery_status', 30)->default('planned')->index();
            $table->boolean('status')->default(true)->index();
            $table->json('api_payload')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            $table->unique(['po_number', 'item_number'], 'vendor_po_item_unique');
            $table->index(['material', 'plant_code', 'expected_delivery_date'], 'vendor_po_balance_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_vendor_purchase_orders');
        Schema::dropIfExists('tbl_vendors');
    }
};
