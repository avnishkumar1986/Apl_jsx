<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ApiIntegration;
use App\Models\SecurityScan;
use App\Services\Security\ProjectSecurityAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SecurityAuditController extends Controller
{
    public function latest(Request $request): JsonResponse
    {
        $this->authorizeAudit($request);
        $scan = SecurityScan::query()->with('findings')->latest('id')->first();

        return response()->json(['data' => $scan]);
    }

    public function run(Request $request, ProjectSecurityAuditService $auditService): JsonResponse|RedirectResponse
    {
        $this->authorizeAudit($request);
        $integration = ApiIntegration::query()->where('code', 'security')->first();
        $started = microtime(true);
        $runLog = $integration?->logs()->create([
            'run_id' => (string) Str::uuid(),
            'status' => 'running',
            'attempt' => 1,
            'message' => 'Security audit started.',
            'created_by' => $request->user()?->getKey(),
            'created_at' => now(),
        ]);

        try {
            $scan = $auditService->run();

            if ($integration && $runLog) {
                $status = $scan->status === 'completed' ? 'success' : 'warning';
                $runLog->update([
                    'status' => $status,
                    'http_status' => 200,
                    'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                    'records_received' => $scan->total_findings,
                    'message' => "OWASP-aligned audit completed with score {$scan->score}/100 and {$scan->total_findings} finding(s).",
                ]);
                $integration->update([
                    'last_run_status' => $status,
                    'last_run_at' => $scan->completed_at ?? now(),
                ]);
            }
        } catch (\Throwable $exception) {
            $runLog?->update([
                'status' => 'failed',
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                'message' => $exception->getMessage(),
            ]);
            $integration?->update(['last_run_status' => 'failed', 'last_run_at' => now()]);
            throw $exception;
        }

        if ($request->expectsJson()) {
            return response()->json(['data' => $scan->load('findings')]);
        }

        return back()->with('success', "Security audit completed: {$scan->score}/100.");
    }

    private function authorizeAudit(Request $request): void
    {
        abort_unless($request->user()?->hasRole('Owner'), 403);
    }
}
