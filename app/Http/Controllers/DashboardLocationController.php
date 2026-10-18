<?php

namespace App\Http\Controllers;

use App\Models\UserLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class DashboardLocationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'location_name' => ['nullable', 'string', 'max:255'],
        ]);

        UserLocation::query()->updateOrCreate(
            ['user_id' => $request->user()->getKey()],
            $validated,
        );

        return back();
    }

    public function markSessionClosing(Request $request): Response
    {
        DB::table(config('session.table', 'sessions'))
            ->where('id', $request->session()->getId())
            ->update(['last_activity' => 0]);

        return response()->noContent();
    }
}
