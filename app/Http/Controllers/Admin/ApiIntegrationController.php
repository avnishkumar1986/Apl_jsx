<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ImportMaterialsFromApi;
use App\Models\ApiIntegration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        $allowedCodes = collect(['material', 'production', 'quality', 'stock', 'vendor'])
            ->filter(fn (string $code): bool => $user?->can("procurement.api.{$code}.view") ?? false)
            ->values();
        $query = ApiIntegration::query()
            ->whereIn('code', $allowedCodes)
            ->with(['logs' => fn ($q) => $q->latest('id')->limit(20)]);

        return Inertia::render('admin/api-integrations/index', [
            'integrations' => $query
                ->when($search !== '', fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('endpoint', 'like', "%{$search}%")->orWhere('target_table', 'like', "%{$search}%")))
                ->orderByDesc('status')->orderBy('name')->paginate($perPage)->withQueryString(),
            'filters' => ['search' => $search, 'per_page' => $perPage], 'pageSizeOptions' => $options,
            'stats' => [
                'total' => ApiIntegration::whereIn('code', $allowedCodes)->count(),
                'active' => ApiIntegration::whereIn('code', $allowedCodes)->where('status', true)->count(),
            ],
            'canManage' => $allowedCodes->contains(fn (string $code): bool => $user?->can("procurement.api.{$code}.manage") ?? false),
            'manageableCodes' => $allowedCodes
                ->filter(fn (string $code): bool => $user?->can("procurement.api.{$code}.manage") ?? false)
                ->values(),
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
        $apiIntegration->update($this->validated($request, $apiIntegration));

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
        $this->authorizeCode($request, (string) $apiIntegration->code);
        if (! $apiIntegration->status) {
            return back()->withErrors(['run' => 'Activate the API before running it.']);
        }
        if (! filled($apiIntegration->endpoint)) {
            return back()->withErrors(['run' => 'Endpoint must be configured.']);
        }

        if (! in_array(strtolower($apiIntegration->code), ['material', 'stock', 'vendor', 'employee'], true)) {
            return back()->withErrors(['run' => 'A background importer has not been configured for this API yet.']);
        }

        if (strtolower($apiIntegration->code) === 'employee') {
            $apiIntegration->update(['last_run_status' => 'running']);

            try {
                ImportMaterialsFromApi::dispatchSync($apiIntegration->id, auth()->id());
            } catch (\Throwable $exception) {
                return back()->withErrors(['run' => 'Employee API import failed: '.$exception->getMessage()]);
            }

            return back()->with('success', 'Employee API import completed.');
        }

        ImportMaterialsFromApi::dispatch($apiIntegration->id, auth()->id());
        $apiIntegration->update(['last_run_status' => 'queued']);

        return back()->with('success', ucfirst($apiIntegration->code).' API import queued. It is running in the background.');
    }

    private function validated(Request $request, ?ApiIntegration $api = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('tbl_api_integrations', 'name')->ignore($api?->id)], 'code' => ['required', 'alpha_dash', 'max:80', Rule::unique('tbl_api_integrations', 'code')->ignore($api?->id)],
            'description' => ['nullable', 'string', 'max:255'], 'base_url' => ['nullable', 'url', 'max:255'], 'endpoint' => ['nullable', 'string', 'max:500'], 'method' => ['required', Rule::in(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])],
            'auth_type' => ['required', Rule::in(['none', 'basic', 'bearer'])], 'credential_key' => ['nullable', 'string', 'max:120'],
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

        return $validated;
    }

    private function authorizeCode(Request $request, string $code): void
    {
        $code = strtolower($code);
        abort_unless(in_array($code, ['material', 'production', 'quality', 'stock', 'vendor'], true), 403);
        abort_unless($request->user()?->can("procurement.api.{$code}.manage"), 403);
    }
}
