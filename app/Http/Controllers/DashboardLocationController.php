<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserLocation;
use App\Support\DeviceLabel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardLocationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'location_name' => ['nullable', 'string', 'max:255'],
        ]);

        $location = UserLocation::query()
            ->where('user_id', $request->user()->getKey())
            ->latest('id')
            ->firstOrNew(['user_id' => $request->user()->getKey()]);

        $location->fill([
            ...$validated,
            'device_name' => DeviceLabel::fromUserAgent($request->userAgent()),
            'user_agent' => $request->userAgent(),
            'captured_at' => now(),
        ])->save();

        return back();
    }

    public function report(Request $request): InertiaResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'user_id' => ['nullable', 'integer'],
        ]);
        $isSuperAdmin = $request->user()->hasRole('Super Admin');
        $activeUserIds = DB::table(config('session.table', 'tbl_sessions'))
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', now()->subMinutes((int) config('session.lifetime', 120))->timestamp)
            ->pluck('user_id')
            ->map(fn ($userId): int => (int) $userId)
            ->all();

        $locations = UserLocation::query()
            ->with('user:id,first_name,last_name')
            ->whereIn('id', UserLocation::query()->selectRaw('MAX(id)')->groupBy('user_id'))
            ->when(! $isSuperAdmin, fn ($query) => $query->where('user_id', $request->user()->getKey()))
            ->when($isSuperAdmin && isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
            ->when(isset($validated['from']), fn ($query) => $query->whereDate('captured_at', '>=', $validated['from']))
            ->when(isset($validated['to']), fn ($query) => $query->whereDate('captured_at', '<=', $validated['to']))
            ->latest('captured_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (UserLocation $location): array => [
                'id' => $location->id,
                'userId' => $location->user_id,
                'userName' => $location->user?->name ?? 'Deleted user',
                'locationName' => $location->location_name ?: "{$location->latitude}, {$location->longitude}",
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'deviceName' => $location->device_name ?? DeviceLabel::fromUserAgent($location->user_agent),
                'isOnline' => in_array((int) $location->user_id, $activeUserIds, true),
                'capturedAt' => $location->captured_at?->toIso8601String() ?? $location->created_at->toIso8601String(),
            ]);

        return Inertia::render('location-report', [
            'locations' => $locations,
            'filters' => [
                'from' => $validated['from'] ?? '',
                'to' => $validated['to'] ?? '',
                'userId' => $validated['user_id'] ?? '',
            ],
            'canFilterUsers' => $isSuperAdmin,
            'users' => $isSuperAdmin
                ? User::query()->where('status', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name'])->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                ])
                : [],
        ]);
    }

    public function markSessionClosing(Request $request): Response
    {
        DB::table(config('session.table', 'sessions'))
            ->where('id', $request->session()->getId())
            ->update(['last_activity' => 0]);

        return response()->noContent();
    }
}
