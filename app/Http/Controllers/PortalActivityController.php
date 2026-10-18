<?php

namespace App\Http\Controllers;

use App\Models\PortalLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'method' => ['nullable', 'in:GET,POST,PUT,PATCH,DELETE'],
            'status' => ['nullable', 'in:success,error'],
        ]);

        $logs = PortalLog::query()
            ->with('user:id,first_name,last_name')
            ->when(! $request->user()->hasRole('Super Admin'), fn ($query) => $query->where('user_id', $request->user()->getKey()))
            ->when(isset($validated['from']), fn ($query) => $query->whereDate('created_at', '>=', $validated['from']))
            ->when(isset($validated['to']), fn ($query) => $query->whereDate('created_at', '<=', $validated['to']))
            ->when(isset($validated['method']), fn ($query) => $query->where('method', $validated['method']))
            ->when(($validated['status'] ?? null) === 'success', fn ($query) => $query->where('status_code', '<', 400))
            ->when(($validated['status'] ?? null) === 'error', fn ($query) => $query->where('status_code', '>=', 400))
            ->when(isset($validated['search']), function ($query) use ($validated): void {
                $search = $validated['search'];
                $query->where(function ($nested) use ($search): void {
                    $nested->where('action', 'like', "%{$search}%")
                        ->orWhere('route_name', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($user) => $user->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(50)
            ->withQueryString()
            ->through(fn (PortalLog $log): array => [
                'id' => $log->id,
                'userName' => $log->user?->name ?? 'Deleted user',
                'action' => $log->action,
                'routeName' => $log->route_name,
                'method' => $log->method,
                'url' => $log->url,
                'statusCode' => $log->status_code,
                'ipAddress' => $log->ip_address,
                'userAgent' => $log->user_agent,
                'durationMs' => $log->metadata['duration_ms'] ?? null,
                'isInertia' => (bool) ($log->metadata['inertia'] ?? false),
                'createdAt' => $log->created_at->toIso8601String(),
            ]);

        return Inertia::render('portal-activity', [
            'logs' => $logs,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'from' => $validated['from'] ?? '',
                'to' => $validated['to'] ?? '',
                'method' => $validated['method'] ?? '',
                'status' => $validated['status'] ?? '',
            ],
        ]);
    }
}
