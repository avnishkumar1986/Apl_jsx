<?php

namespace App\Http\Middleware;

use App\Models\ModulePackage;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleActive
{
    public function handle(Request $request, Closure $next, string $slug): Response
    {
        if (Schema::hasTable('tbl_modules')) {
            $module = ModulePackage::query()->where('slug', $slug)->first(['name', 'slug', 'description', 'status']);
            if (! $module || ! $module->status) {
                return Inertia::render('modules/coming-soon', [
                    'module' => [
                        'name' => $module?->name ?? str($slug)->replace('-', ' ')->title()->toString(),
                        'slug' => $slug,
                        'description' => $module?->description,
                    ],
                ])->toResponse($request)->setStatusCode(503);
            }
        }

        return $next($request);
    }
}
