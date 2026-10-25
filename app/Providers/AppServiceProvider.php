<?php

namespace App\Providers;

use App\Auth\SeparatedUserProvider;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Microsoft\Provider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::provider('separated-users', function ($app, array $config) {
            return new SeparatedUserProvider($app['hash'], $config['model']);
        });

        Gate::before(function (User $user): ?bool {
            return $user->hasRole('Owner') ? true : null;
        });

        Event::listen(function (SocialiteWasCalled $event): void {
            $event->extendSocialite('microsoft', Provider::class);
        });
    }
}
