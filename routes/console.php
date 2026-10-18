<?php

use App\Models\ApiIntegrationLog;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
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

Schedule::command('api-logs:prune')
    ->hourly()
    ->withoutOverlapping();

Schedule::command('security:audit')
    ->monthlyOn(1, '02:00')
    ->timezone('Asia/Kolkata')
    ->withoutOverlapping()
    ->runInBackground();
