<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ImportMaterialsFromApi;
use App\Models\ApiIntegration;
use App\Services\Security\ProjectSecurityAuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApiIntegrationController extends Controller
{
    public function index(Request $request): Response
    {
        $options = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $options, true)) {
            $perPage = (int) config('datatable.per_page');
        }
        $search = trim((string) $request->string('search'));
        $user = $request->user();
        $isSuperAdmin = $user?->hasRole('Owner') ?? false;
        if ($isSuperAdmin) {
            $allowedCodes = ApiIntegration::query()->pluck('code')->push('security')->unique()->values();
            $manageableCodes = $allowedCodes;
            $runnableCodes = $allowedCodes;
        } else {
            $allowedCodes = collect(['material', 'production', 'quality', 'stock', 'mrmcon', 'vendor'])
                ->filter(fn (string $code): bool => $user?->can('procurement.api.'.$this->permissionCode($code).'.view') ?? false)
                ->values();
            if ($user?->can('users.view')) {
                $allowedCodes->push('employee');
            }
            $manageableCodes = $allowedCodes
                ->filter(fn (string $code): bool => $code === 'employee'
                    ? ($user?->can('users.manage') ?? false)
                    : ($user?->can('procurement.api.'.$this->permissionCode($code).'.manage') ?? false))
                ->values();
            $runnableCodes = $allowedCodes
                ->filter(fn (string $code): bool => $code === 'employee'
                    ? ($user?->can('users.manage') ?? false)
                    : ($user?->can('procurement.api.'.$this->permissionCode($code).'.run') ?? false))
                ->values();
        }
        $runnableCodes = ApiIntegration::query()
            ->whereIn('code', $runnableCodes)
            ->get()
            ->filter(fn (ApiIntegration $integration): bool => strtolower($integration->code) === 'security' || $this->hasBackgroundImporter($integration))
            ->pluck('code')
            ->map(fn (string $code): string => strtolower($code))
            ->values();
        $query = ApiIntegration::query()
            ->whereIn('code', $allowedCodes)
            ->with(['logs' => fn ($q) => $q
                ->select([
                    'id',
                    'api_integration_id',
                    'run_id',
                    'status',
                    'http_status',
                    'attempt',
                    'duration_ms',
                    'records_received',
                    DB::raw('LEFT(message, 2000) as message'),
                    'created_at',
                ])
                ->latest('id')
                ->limit(20)]);

        $procurementCodes = collect(['material', 'stock', 'vendor', 'mrmcon']);
        $canSeeProcurementSync = $procurementCodes->every(fn (string $code): bool => $allowedCodes->contains($code));
        $canRunProcurementSync = $canSeeProcurementSync
            && $procurementCodes->every(fn (string $code): bool => $runnableCodes->contains($code));
        $procurementIntegrations = $canSeeProcurementSync
            ? ApiIntegration::query()->whereIn('code', $procurementCodes)->get()->keyBy(fn (ApiIntegration $api): string => strtolower($api->code))
            : collect();

        return Inertia::render('admin/api-integrations/index', [
            'integrations' => $query
                ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('endpoint', 'like', "%{$search}%")->orWhere('target_table', 'like', "%{$search}%")))
                ->orderByDesc('status')->orderBy('name')->paginate($perPage)->withQueryString()
                ->through(function (ApiIntegration $integration): ApiIntegration {
                    $credentialState = $integration->credentialState();
                    $credentials = $credentialState['credentials'];
                    $integration->setAttribute('credential_username', (string) ($credentials['username'] ?? ''));
                    $integration->setAttribute('has_credential_password', filled($credentials['password'] ?? null));
                    $integration->setAttribute('subscription_name', (string) ($credentials['subscription_name'] ?? ''));
                    $integration->setAttribute('has_api_token', filled($credentials['token'] ?? null));
                    $integration->setAttribute('credentials_unreadable', $credentialState['unreadable']);

                    return $integration;
                }),
            'filters' => ['search' => $search, 'per_page' => $perPage], 'pageSizeOptions' => $options,
            'stats' => [
                'total' => ApiIntegration::whereIn('code', $allowedCodes)->count(),
                'active' => ApiIntegration::whereIn('code', $allowedCodes)->where('status', true)->count(),
            ],
            'canManage' => $manageableCodes->isNotEmpty(),
            'manageableCodes' => $manageableCodes,
            'runnableCodes' => $runnableCodes,
            'procurementSync' => $canSeeProcurementSync ? [
                'canRun' => $canRunProcurementSync,
                'steps' => $procurementCodes->values()->map(function (string $code, int $index) use ($procurementIntegrations): array {
                    /** @var ApiIntegration|null $integration */
                    $integration = $procurementIntegrations->get($code);

                    return [
                        'step' => $index + 1,
                        'code' => $code,
                        'name' => $code === 'mrmcon' ? 'Consumption API' : ucfirst($code).' API',
                        'configured' => $integration !== null && filled($integration->endpoint),
                        'active' => (bool) $integration?->status,
                        'lastRunStatus' => $integration?->last_run_status,
                        'lastRunAt' => $integration?->last_run_at?->toIso8601String(),
                    ];
                }),
            ] : null,
            'credentialSourceCode' => (string) config('services.api_integrations.environment_code', 'production'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $this->authorizeCode($request, (string) $data['code']);
        ApiIntegration::create($data);

        return back()->with('success', 'API integration created.');
    }

    public function update(Request $request, ApiIntegration $apiIntegration): RedirectResponse
    {
        $this->authorizeCode($request, (string) $apiIntegration->code);
        $data = $this->validated($request, $apiIntegration);

        // Eloquent compares cast values while determining dirty attributes. If
        // the existing value was encrypted with an obsolete APP_KEY, that
        // comparison attempts to decrypt it again and prevents replacement.
        if ($apiIntegration->credentialState()['unreadable']) {
            $apiIntegration->setRawAttributes([
                ...$apiIntegration->getAttributes(),
                'credentials' => null,
            ]);
            $apiIntegration->syncOriginalAttribute('credentials');
        }

        $apiIntegration->update($data);

        return back()->with('success', 'API integration updated.');
    }

    public function toggleStatus(Request $request, ApiIntegration $apiIntegration): RedirectResponse
    {
        $this->authorizeCode($request, (string) $apiIntegration->code);
        $apiIntegration->update(['status' => $request->boolean('active')]);

        return back()->with('success', 'API status updated.');
    }

    public function destroy(Request $request, ApiIntegration $apiIntegration): RedirectResponse
    {
        $this->authorizeCode($request, (string) $apiIntegration->code);
        $apiIntegration->delete();

        return back()->with('success', 'API integration deleted.');
    }

    public function run(Request $request, ApiIntegration $apiIntegration): RedirectResponse
    {
        $this->authorizeRunCode($request, (string) $apiIntegration->code);
        if (! $apiIntegration->status) {
            return back()->withErrors(['run' => 'Activate the API before running it.']);
        }
        if (! filled($apiIntegration->endpoint)) {
            return back()->withErrors(['run' => 'Endpoint must be configured.']);
        }

        if (strtolower($apiIntegration->code) === 'security') {
            $started = microtime(true);
            $runLog = $apiIntegration->logs()->create([
                'run_id' => (string) Str::uuid(),
                'status' => 'running',
                'attempt' => 1,
                'message' => 'Security audit started.',
                'created_by' => auth()->id(),
                'created_at' => now(),
            ]);

            try {
                $scan = app(ProjectSecurityAuditService::class)->run();
                $status = $scan->status === 'completed' ? 'success' : 'warning';
                $runLog->update([
                    'status' => $status,
                    'http_status' => 200,
                    'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                    'records_received' => $scan->total_findings,
                    'message' => "OWASP-aligned audit completed with score {$scan->score}/100 and {$scan->total_findings} finding(s).",
                ]);
                $apiIntegration->update([
                    'last_run_status' => $status,
                    'last_run_at' => $scan->completed_at ?? now(),
                ]);
            } catch (\Throwable $exception) {
                $runLog->update([
                    'status' => 'failed',
                    'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                    'message' => $exception->getMessage(),
                ]);
                $apiIntegration->update(['last_run_status' => 'failed', 'last_run_at' => now()]);
                throw $exception;
            }

            return back()->with('success', "Security audit completed: {$scan->score}/100.");
        }

        if (! $this->hasBackgroundImporter($apiIntegration)) {
            return back()->withErrors(['run' => 'This entry is an environment connection profile. Configure a destination table or a dedicated importer before running it.']);
        }

        $runLog = $apiIntegration->logs()->create([
            'run_id' => (string) Str::uuid(),
            'status' => 'running',
            'attempt' => 1,
            'message' => 'API run queued.',
            'created_by' => auth()->id(),
            'created_at' => now(),
        ]);
        try {
            ImportMaterialsFromApi::dispatch($apiIntegration->id, auth()->id(), null, $runLog->id);
            $apiIntegration->update(['last_run_status' => 'running', 'last_run_at' => now()]);
        } catch (\Throwable $exception) {
            $runLog->update(['status' => 'failed', 'message' => $exception->getMessage()]);
            $apiIntegration->update(['last_run_status' => 'failed', 'last_run_at' => now()]);
            throw $exception;
        }

        return back()->with('success', ucfirst($apiIntegration->code).' API import queued. It is running in the background.');
    }

    private function hasBackgroundImporter(ApiIntegration $integration): bool
    {
        if (in_array(strtolower((string) $integration->code), ['material', 'stock', 'mrmcon', 'vendor', 'employee'], true)) {
            return true;
        }

        return collect($integration->target_table)->filter()->isNotEmpty();
    }

    public function runProcurement(Request $request): RedirectResponse
    {
        $codes = ['material', 'stock', 'vendor', 'mrmcon'];
        foreach ($codes as $code) {
            $this->authorizeRunCode($request, $code);
        }

        $integrations = ApiIntegration::query()
            ->whereIn('code', $codes)
            ->get()
            ->keyBy(fn (ApiIntegration $api): string => strtolower($api->code));

        $missing = collect($codes)->reject(fn (string $code): bool => $integrations->has($code));
        if ($missing->isNotEmpty()) {
            return back()->withErrors(['run' => 'Configure the following APIs before starting procurement sync: '.$missing->map(fn (string $code): string => $code === 'mrmcon' ? 'Consumption' : ucfirst($code))->join(', ').'.']);
        }

        $unavailable = collect($codes)->filter(function (string $code) use ($integrations): bool {
            /** @var ApiIntegration $integration */
            $integration = $integrations->get($code);

            return ! $integration->status || ! filled($integration->endpoint);
        });
        if ($unavailable->isNotEmpty()) {
            return back()->withErrors(['run' => 'Activate and configure an endpoint for: '.$unavailable->map(fn (string $code): string => $code === 'mrmcon' ? 'Consumption' : ucfirst($code))->join(', ').'.']);
        }

        DB::transaction(function () use ($codes, $integrations, $request): void {
            foreach ($codes as $code) {
                /** @var ApiIntegration $integration */
                $integration = $integrations->get($code);
                $runLog = $integration->logs()->create([
                    'run_id' => (string) Str::uuid(),
                    'status' => 'queued',
                    'attempt' => 1,
                    'message' => 'Procurement parallel sync queued.',
                    'created_by' => $request->user()?->id,
                    'created_at' => now(),
                ]);

                ImportMaterialsFromApi::dispatch($integration->id, $request->user()?->id, null, $runLog->id);
                $integration->update(['last_run_status' => 'queued', 'last_run_at' => now()]);
            }
        });

        return back()->with('success', 'Material, Stock, Vendor, and Consumption APIs were queued together. Available queue workers will process them in parallel.');
    }

    private function validated(Request $request, ?ApiIntegration $api = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('tbl_api_integrations', 'name')->ignore($api?->id)], 'code' => ['required', 'alpha_dash', 'max:80', Rule::unique('tbl_api_integrations', 'code')->ignore($api?->id)],
            'description' => ['nullable', 'string', 'max:255'], 'api_type' => ['required', Rule::in(['sap', 'external'])], 'endpoint' => ['required', 'string', 'max:500'],
            'credential_username' => ['nullable', 'string', 'max:255'], 'credential_password' => ['nullable', 'string', 'max:1000'],
            'subscription_name' => ['nullable', 'string', 'max:255'], 'api_token' => ['nullable', 'string', 'max:2000'],
            'target_table' => ['nullable', 'string', 'max:4000'],
            'retries' => ['required', 'integer', 'between:1,10'], 'retry_delay_seconds' => ['required', 'integer', 'between:0,300'], 'timeout_seconds' => ['required', 'integer', 'between:1,300'], 'status' => ['required', 'boolean'],
        ]);

        $targets = collect(explode(',', (string) ($validated['target_table'] ?? '')))
            ->map(fn (string $table): string => trim($table))
            ->filter()
            ->unique()
            ->values();
        if ($targets->contains(fn (string $table): bool => preg_match('/^[A-Za-z0-9_]+$/', $table) !== 1)) {
            throw ValidationException::withMessages(['target_table' => 'Table names may contain only letters, numbers, and underscores.']);
        }

        $validated['target_table'] = $targets->all();
        $existingCredentials = $api?->credentialState()['credentials'] ?? [];

        if ($validated['api_type'] === 'external') {
            if (filter_var($validated['endpoint'], FILTER_VALIDATE_URL) === false) {
                throw ValidationException::withMessages(['endpoint' => 'External API URL must be a complete valid URL.']);
            }
            $validated['credentials'] = [
                'subscription_name' => filled($validated['subscription_name'] ?? null) ? $validated['subscription_name'] : ($existingCredentials['subscription_name'] ?? ''),
                'token' => filled($validated['api_token'] ?? null) ? $validated['api_token'] : ($existingCredentials['token'] ?? ''),
            ];
            if ($validated['credentials']['subscription_name'] === '' || $validated['credentials']['token'] === '') {
                throw ValidationException::withMessages(['api_token' => 'External API subscription name and token are required.']);
            }
        } else {
            $credentialSourceCode = (string) config('services.api_integrations.environment_code', 'production');
            $credentialHostCodes = ['production', 'quality'];
            if (in_array($validated['code'], $credentialHostCodes, true)) {
                $validated['credentials'] = [
                    'username' => filled($validated['credential_username'] ?? null) ? $validated['credential_username'] : ($existingCredentials['username'] ?? ''),
                    'password' => filled($validated['credential_password'] ?? null) ? $validated['credential_password'] : ($existingCredentials['password'] ?? ''),
                ];
                if ($validated['credentials']['username'] === '' || $validated['credentials']['password'] === '') {
                    throw ValidationException::withMessages(['credential_password' => 'SAP username and password are required on Production and Quality environment APIs.']);
                }
            } else {
                $validated['credentials'] = collect($existingCredentials)->except(['username', 'password'])->all();
            }
        }

        unset($validated['credential_username'], $validated['credential_password'], $validated['subscription_name'], $validated['api_token']);

        return $validated;
    }

    private function authorizeCode(Request $request, string $code): void
    {
        $code = strtolower($code);
        if ($request->user()?->hasRole('Owner')) {
            return;
        }

        if ($code === 'employee') {
            abort_unless($request->user()?->can('users.manage'), 403);

            return;
        }

        if ($code === 'security') {
            abort_unless($request->user()?->hasRole('Owner'), 403);

            return;
        }

        abort_unless(in_array($code, ['material', 'production', 'quality', 'stock', 'mrmcon', 'vendor'], true), 403);
        abort_unless($request->user()?->can('procurement.api.'.$this->permissionCode($code).'.manage'), 403);
    }

    private function authorizeRunCode(Request $request, string $code): void
    {
        $code = strtolower($code);
        if ($request->user()?->hasRole('Owner')) {
            return;
        }

        if ($code === 'employee') {
            abort_unless($request->user()?->can('users.manage'), 403);

            return;
        }

        abort_unless(in_array($code, ['material', 'production', 'quality', 'stock', 'mrmcon', 'vendor'], true), 403);
        abort_unless($request->user()?->can('procurement.api.'.$this->permissionCode($code).'.run'), 403);
    }

    private function permissionCode(string $integrationCode): string
    {
        return strtolower($integrationCode) === 'mrmcon' ? 'consumption' : strtolower($integrationCode);
    }
}
