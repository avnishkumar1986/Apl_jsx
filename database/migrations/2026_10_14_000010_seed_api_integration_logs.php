<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // API run history is created only by real executions.
    }

    public function down(): void
    {
        // No seeded run history to remove.
    }
};
