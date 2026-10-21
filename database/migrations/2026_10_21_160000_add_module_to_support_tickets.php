<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_support_tickets', function (Blueprint $table): void {
            $table->unsignedBigInteger('module_id')->nullable()->index()->after('description');
            $table->unsignedBigInteger('category_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tbl_support_tickets', function (Blueprint $table): void {
            $table->dropIndex(['module_id']);
            $table->dropColumn('module_id');
            $table->unsignedBigInteger('category_id')->nullable(false)->change();
        });
    }
};
