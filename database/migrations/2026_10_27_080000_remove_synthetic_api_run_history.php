<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const SYNTHETIC_MESSAGE = 'Initial reference run imported successfully.';

    public function up(): void
    {
        if (! Schema::hasTable('tbl_api_integrations') || ! Schema::hasTable('tbl_api_integration_logs')) {
            return;
        }

        DB::transaction(function (): void {
            $integrationIds = DB::table('tbl_api_integration_logs')
                ->where('message', self::SYNTHETIC_MESSAGE)
                ->distinct()
                ->pluck('api_integration_id');

            DB::table('tbl_api_integration_logs')
                ->where('message', self::SYNTHETIC_MESSAGE)
                ->delete();

            foreach ($integrationIds as $integrationId) {
                $latestRealRun = DB::table('tbl_api_integration_logs')
                    ->where('api_integration_id', $integrationId)
                    ->latest('created_at')
                    ->latest('id')
                    ->first(['status', 'created_at']);

                DB::table('tbl_api_integrations')
                    ->where('id', $integrationId)
                    ->update([
                        'last_run_status' => $latestRealRun?->status,
                        'last_run_at' => $latestRealRun?->created_at,
                        'updated_at' => now(),
                    ]);
            }
        });
    }

    public function down(): void
    {
        // Synthetic run history must not be recreated during a rollback.
    }
};
