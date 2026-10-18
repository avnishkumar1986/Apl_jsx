<?php

namespace App\Http\Middleware;

use App\Models\ModulePackage;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleActive
{
    public function handle(Request $request, Closure $next, string $slug): Response
    {
        if (Schema::hasTable('tbl_modules')) {
            $status = ModulePackage::query()->where('slug', $slug)->value('status');
            abort_if($status !== null && ! (bool) $status, 404, 'This module is inactive.');
        }

        return $next($request);
    }
}
