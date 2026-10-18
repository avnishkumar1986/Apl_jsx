<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table) {
            DB::table('tbl_api_integrations')->orderBy('id')->each(function (object $integration): void {
                $targets = filled($integration->target_table) ? [(string) $integration->target_table] : [];
                DB::table('tbl_api_integrations')->where('id', $integration->id)->update(['target_table' => json_encode($targets)]);
            });

            Schema::table('tbl_api_integrations', function (Blueprint $table): void {
                $table->json('target_table')->nullable()->change();
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table) {
            Schema::table('tbl_api_integrations', function (Blueprint $table): void {
                $table->text('target_table')->nullable()->change();
            });

            DB::table('tbl_api_integrations')->orderBy('id')->each(function (object $integration): void {
                $targets = json_decode((string) $integration->target_table, true);
                DB::table('tbl_api_integrations')->where('id', $integration->id)->update([
                    'target_table' => is_array($targets) ? ($targets[0] ?? null) : null,
                ]);
            });

            Schema::table('tbl_api_integrations', function (Blueprint $table): void {
                $table->string('target_table', 120)->nullable()->change();
            });
        });
    }
};
