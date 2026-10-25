<?php

use App\Jobs\ImportMaterialsFromApi;
use App\Models\ApiIntegration;
use App\Models\ApiIntegrationLog;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('api-logs:prune', function () {
    $deleted = ApiIntegrationLog::query()
        ->where('created_at', '<', now()->subDay())
        ->delete();

    $this->info("Deleted {$deleted} API run log(s) older than 24 hours.");
})->purpose('Delete API integration logs older than 24 hours');

Artisan::command('procurement:release-expired-planning-locks', function () {
    $released = DB::table('procurement_planning_decisions')
        ->whereDate('planning_month', '<', now('Asia/Kolkata')->startOfMonth()->toDateString())
        ->whereNotNull('locked_at')
        ->update([
            'locked_at' => null,
            'locked_by' => null,
            'updated_at' => now(),
        ]);

    $this->info("Released {$released} expired planning lock(s).");
})->purpose('Automatically unlock procurement planning decisions after their month ends');

Artisan::command('procurement:sync-planning-data', function () {
    $integrations = ApiIntegration::query()
        ->where('status', true)
        ->whereIn('code', ['stock', 'mrmcon', 'vendor'])
        ->get();

    if ($integrations->isEmpty()) {
        $this->warn('No active Stock, RM Consumption, or Vendor integration is configured.');

        return self::SUCCESS;
    }

    foreach ($integrations as $integration) {
        ImportMaterialsFromApi::dispatchSync($integration->id);
        $this->info("Synchronized {$integration->name} ({$integration->code}).");
    }

    return self::SUCCESS;
})->purpose('Refresh source data used by automatic procurement calculations');

Artisan::command('procurement:sync-vendor-orders {material?}', function (?string $material = null) {
    $integration = ApiIntegration::query()
        ->where('code', 'vendor')
        ->where('status', true)
        ->first();

    if (! $integration || blank($integration->endpoint)) {
        $this->error('No active Vendor integration is configured.');

        return self::FAILURE;
    }

    ImportMaterialsFromApi::dispatchSync($integration->id, null, $material ? trim($material) : null);
    $received = (int) $integration->logs()->latest('id')->value('records_received');
    $count = DB::table('tbl_vendor_purchase_orders')
        ->when($material, fn ($query) => $query->where('material', trim($material)))
        ->count();
    $this->info("Vendor purchase orders synchronized. {$received} item(s) received from SAP; {$count} total stored item(s) match the requested scope.");

    return self::SUCCESS;
})->purpose('Synchronize SAP vendor purchase-order items, optionally for one material');

Schedule::command('api-logs:prune')
    ->hourly()
    ->withoutOverlapping();

Schedule::command('procurement:release-expired-planning-locks')
    ->dailyAt('00:05')
    ->timezone('Asia/Kolkata')
    ->withoutOverlapping();

Schedule::command('procurement:sync-planning-data')
    ->everyFifteenMinutes()
    ->timezone('Asia/Kolkata')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('security:audit')
    ->monthlyOn(1, '02:00')
    ->timezone('Asia/Kolkata')
    ->withoutOverlapping()
    ->runInBackground();
