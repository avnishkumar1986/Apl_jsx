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
        $scan = $auditService->run();
        $integration = ApiIntegration::query()->where('code', 'security')->first();

        if ($integration) {
            $integration->logs()->create([
                'run_id' => (string) Str::uuid(),
                'status' => $scan->status === 'completed' ? 'success' : 'warning',
                'http_status' => 200,
                'attempt' => 1,
                'records_received' => $scan->total_findings,
                'message' => "OWASP-aligned audit completed with score {$scan->score}/100 and {$scan->total_findings} finding(s).",
                'created_by' => $request->user()?->getKey(),
                'created_at' => now(),
            ]);
            $integration->update([
                'last_run_status' => $scan->status,
                'last_run_at' => $scan->completed_at ?? now(),
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json(['data' => $scan->load('findings')]);
        }

        return back()->with('success', "Security audit completed: {$scan->score}/100.");
    }

    private function authorizeAudit(Request $request): void
    {
        abort_unless($request->user()?->hasRole('Super Admin'), 403);
    }
}
