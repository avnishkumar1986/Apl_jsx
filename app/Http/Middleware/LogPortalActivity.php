<?php

namespace App\Http\Middleware;

use App\Models\PortalLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogPortalActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);
        $response = $next($request);

        if ($request->user() && $request->route()?->getName() !== 'dashboard.session-closing') {
            try {
                $routeName = $request->route()?->getName();

                PortalLog::query()->create([
                    'user_id' => $request->user()->getKey(),
                    'action' => $routeName ? str($routeName)->replace('.', ' ')->headline()->toString() : 'Portal request',
                    'route_name' => $routeName,
                    'method' => $request->method(),
                    'url' => $request->fullUrl(),
                    'status_code' => $response->getStatusCode(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'metadata' => [
                        'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
                        'inertia' => $request->header('X-Inertia') === 'true',
                    ],
                ]);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return $response;
    }
}
