<?php

namespace App\Http\Middleware;

use App\Models\BlockedIpAddress;
use App\Models\PortalLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RejectBlockedIpAddress
{
    public function handle(Request $request, Closure $next): Response
    {
        $ipAddress = $request->ip();

        if (! $ipAddress || ! $this->isBlocked($ipAddress)) {
            return $next($request);
        }

        try {
            PortalLog::query()->create([
                'action' => 'Blocked request',
                'route_name' => $request->route()?->getName(),
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status_code' => 403,
                'ip_address' => $ipAddress,
                'user_agent' => $request->userAgent(),
                'metadata' => ['blocked' => true, ...$this->locationMetadata($request)],
            ]);
        } catch (\Throwable $exception) {
            report($exception);
        }

        abort(403, 'This IP address has been blocked from the portal.');
    }

    private function isBlocked(string $ipAddress): bool
    {
        try {
            return Cache::remember(
                self::cacheKey($ipAddress),
                now()->addMinute(),
                fn (): bool => BlockedIpAddress::query()->active()->where('ip_address', $ipAddress)->exists(),
            );
        } catch (\Throwable) {
            return false;
        }
    }

    private function locationMetadata(Request $request): array
    {
        return array_filter([
            'country' => $request->header('CF-IPCountry'),
            'region' => $request->header('CF-Region'),
            'city' => $request->header('CF-IPCity'),
        ]);
    }

    public static function cacheKey(string $ipAddress): string
    {
        return 'blocked-ip:'.sha1($ipAddress);
    }
}
