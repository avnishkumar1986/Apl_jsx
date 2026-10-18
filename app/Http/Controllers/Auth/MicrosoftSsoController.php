<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\MicrosoftSsoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class MicrosoftSsoController extends Controller
{
    public function __construct(private readonly MicrosoftSsoService $microsoftSsoService) {}

    public function redirect(): SymfonyRedirectResponse|RedirectResponse
    {
        if (blank(config('services.microsoft.client_id')) || blank(config('services.microsoft.client_secret'))) {
            return to_route('login')->withErrors(['sso' => 'Microsoft SSO is not configured yet.']);
        }

        return Socialite::driver('microsoft')
            ->with(['prompt' => 'select_account', 'login_hint' => 'avnish.kumar@apollopipes.com'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $this->microsoftSsoService->authenticate(Socialite::driver('microsoft')->user());
            $request->session()->regenerate();

            return to_route('dashboard');
        } catch (ValidationException $exception) {
            return to_route('login')->withErrors($exception->errors());
        } catch (Throwable $exception) {
            report($exception);

            return to_route('login')->withErrors(['sso' => 'Microsoft sign-in could not be completed. Please try again.']);
        }
    }
}
