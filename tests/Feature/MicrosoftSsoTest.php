<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    config()->set('services.microsoft.client_id', 'test-client-id');
    config()->set('services.microsoft.client_secret', 'test-client-secret');
    config()->set('services.microsoft.allowed_domain', 'apollopipes.com');
});

test('a company Microsoft account can sign in and receives the viewer role', function () {
    Socialite::fake('microsoft', SocialiteUser::fake([
        'id' => 'microsoft-user-123',
        'name' => 'Avnish Kumar',
        'email' => 'avnish.kumar@apollopipes.com',
    ]));

    $this->get(route('auth.microsoft.callback'))->assertRedirect(route('dashboard'));

    $user = User::query()->where('email', 'avnish.kumar@apollopipes.com')->firstOrFail();
    $this->assertAuthenticatedAs($user);
    expect($user->hasRole('Viewer'))->toBeTrue();
    $this->assertDatabaseHas('tbl_usrsclaccount', [
        'user_id' => $user->id,
        'provider' => 'microsoft',
        'provider_user_id' => 'microsoft-user-123',
    ]);
});

test('Microsoft accounts outside the company domain are rejected', function () {
    Socialite::fake('microsoft', SocialiteUser::fake([
        'id' => 'external-user-123',
        'name' => 'External User',
        'email' => 'external@example.com',
    ]));

    $this->get(route('auth.microsoft.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('sso');

    $this->assertGuest();
    $this->assertDatabaseMissing('tbl_users', ['email' => 'external@example.com']);
});

test('Microsoft redirect reports missing configuration', function () {
    config()->set('services.microsoft.client_id');

    $this->get(route('auth.microsoft.redirect'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('sso');
});
