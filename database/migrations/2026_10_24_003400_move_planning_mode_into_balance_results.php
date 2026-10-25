<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('procurement_planning_modes');
    }

    public function down(): void
    {
        // No table is recreated.
    }
};
