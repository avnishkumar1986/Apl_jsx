<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\UserLocation;
use App\Services\Auth\AuthenticationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(private readonly AuthenticationService $authenticationService) {}

    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $this->authenticationService->login($request);

        if ($request->filled(['latitude', 'longitude'])) {
            UserLocation::query()->create([
                'user_id' => $request->user()->getKey(),
                ...$request->safe()->only(['latitude', 'longitude', 'location_name']),
                'captured_at' => now(),
            ]);
        }

        $destination = $request->user()->can('dashboard.view')
            ? route('dashboard', absolute: false)
            : route('profile.edit', absolute: false);

        return redirect()->intended($destination);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $this->authenticationService->logout($request);

        return redirect('/');
    }
}
