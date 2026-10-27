<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RejectBlockedIpAddress;
use App\Models\BlockedIpAddress;
use App\Models\PortalLog;
use App\Models\UserLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class TrafficMonitorController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole('Owner'), 403);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'method' => ['nullable', 'in:GET,POST,PUT,PATCH,DELETE'],
            'status' => ['nullable', 'in:success,error'],
            'ip_status' => ['nullable', 'in:blocked,allowed'],
            'location' => ['nullable', 'string', 'max:100'],
        ]);

        $activeBlockedIps = BlockedIpAddress::query()->active()->pluck('ip_address');
        $query = PortalLog::query()
            ->with('user:id,first_name,last_name')
            ->when(isset($validated['from']), fn ($query) => $query->whereDate('created_at', '>=', $validated['from']))
            ->when(isset($validated['to']), fn ($query) => $query->whereDate('created_at', '<=', $validated['to']))
            ->when(isset($validated['method']), fn ($query) => $query->where('method', $validated['method']))
            ->when(($validated['status'] ?? null) === 'success', fn ($query) => $query->where('status_code', '<', 400))
            ->when(($validated['status'] ?? null) === 'error', fn ($query) => $query->where('status_code', '>=', 400))
            ->when(($validated['ip_status'] ?? null) === 'blocked', fn ($query) => $query->whereIn('ip_address', $activeBlockedIps))
            ->when(($validated['ip_status'] ?? null) === 'allowed', fn ($query) => $query->whereNotIn('ip_address', $activeBlockedIps))
            ->when(isset($validated['location']), fn ($query) => $query->where('metadata', 'like', '%'.addcslashes($validated['location'], '%_').'%'))
            ->when(isset($validated['search']), function ($query) use ($validated): void {
                $search = addcslashes($validated['search'], '%_');
                $query->where(function ($nested) use ($search): void {
                    $nested->where('action', 'like', "%{$search}%")
                        ->orWhere('route_name', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($user) => $user->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"));
                });
            });

        $logs = (clone $query)->latest()->paginate(50)->withQueryString();
        $userIds = $logs->getCollection()->pluck('user_id')->filter()->unique();
        $locations = UserLocation::query()
            ->whereIn('user_id', $userIds)
            ->latest('captured_at')
            ->get(['user_id', 'location_name', 'latitude', 'longitude'])
            ->unique('user_id')
            ->keyBy('user_id');

        $logs->through(function (PortalLog $log) use ($activeBlockedIps, $locations): array {
            $savedLocation = $log->user_id ? $locations->get($log->user_id) : null;
            $headerLocation = collect([$log->metadata['city'] ?? null, $log->metadata['region'] ?? null, $log->metadata['country'] ?? null])
                ->filter()
                ->implode(', ');

            return [
                'id' => $log->id,
                'userName' => $log->user?->name ?? ($log->user_id ? 'Deleted user' : 'Guest'),
                'action' => $log->action,
                'routeName' => $log->route_name,
                'method' => $log->method,
                'url' => $log->url,
                'statusCode' => $log->status_code,
                'ipAddress' => $log->ip_address,
                'isBlocked' => $log->ip_address ? $activeBlockedIps->contains($log->ip_address) : false,
                'locationName' => $headerLocation ?: $savedLocation?->location_name,
                'latitude' => $savedLocation?->latitude,
                'longitude' => $savedLocation?->longitude,
                'userAgent' => $log->user_agent,
                'durationMs' => $log->metadata['duration_ms'] ?? null,
                'isInertia' => (bool) ($log->metadata['inertia'] ?? false),
                'createdAt' => $log->created_at->toIso8601String(),
            ];
        });

        return Inertia::render('admin/traffic-monitor', [
            'logs' => $logs,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'from' => $validated['from'] ?? '',
                'to' => $validated['to'] ?? '',
                'method' => $validated['method'] ?? '',
                'status' => $validated['status'] ?? '',
                'ip_status' => $validated['ip_status'] ?? '',
                'location' => $validated['location'] ?? '',
            ],
            'summary' => [
                'requestsToday' => PortalLog::query()->whereDate('created_at', today())->count(),
                'uniqueIpsToday' => PortalLog::query()->whereDate('created_at', today())->whereNotNull('ip_address')->distinct()->count('ip_address'),
                'errorsToday' => PortalLog::query()->whereDate('created_at', today())->where('status_code', '>=', 400)->count(),
                'blockedIps' => $activeBlockedIps->count(),
            ],
            'blockedIps' => BlockedIpAddress::query()
                ->with(['blockedBy:id,first_name,last_name', 'unblockedBy:id,first_name,last_name'])
                ->latest('blocked_at')
                ->limit(100)
                ->get()
                ->map(fn (BlockedIpAddress $blocked): array => [
                    'id' => $blocked->id,
                    'ipAddress' => $blocked->ip_address,
                    'reason' => $blocked->reason,
                    'isActive' => $blocked->unblocked_at === null && ($blocked->expires_at === null || $blocked->expires_at->isFuture()),
                    'blockedBy' => $blocked->blockedBy?->name,
                    'blockedAt' => $blocked->blocked_at->toIso8601String(),
                    'expiresAt' => $blocked->expires_at?->toIso8601String(),
                    'unblockedBy' => $blocked->unblockedBy?->name,
                    'unblockedAt' => $blocked->unblocked_at?->toIso8601String(),
                ]),
            'currentIp' => $request->ip(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole('Owner'), 403);

        $validated = $request->validate([
            'ip_address' => ['required', 'ip'],
            'reason' => ['nullable', 'string', 'max:500'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        abort_if($validated['ip_address'] === $request->ip(), 422, 'You cannot block your current IP address.');

        BlockedIpAddress::query()->updateOrCreate(
            ['ip_address' => $validated['ip_address']],
            [
                'reason' => $validated['reason'] ?? null,
                'blocked_by' => $request->user()->getKey(),
                'blocked_at' => now(),
                'expires_at' => $validated['expires_at'] ?? null,
                'unblocked_by' => null,
                'unblocked_at' => null,
            ],
        );

        Cache::forget(RejectBlockedIpAddress::cacheKey($validated['ip_address']));

        return back()->with('success', "{$validated['ip_address']} has been blocked.");
    }

    public function destroy(Request $request, BlockedIpAddress $blockedIp): RedirectResponse
    {
        abort_unless($request->user()->hasRole('Owner'), 403);

        $blockedIp->update([
            'unblocked_by' => $request->user()->getKey(),
            'unblocked_at' => now(),
        ]);

        Cache::forget(RejectBlockedIpAddress::cacheKey($blockedIp->ip_address));

        return back()->with('success', "{$blockedIp->ip_address} has been unblocked.");
    }
}
