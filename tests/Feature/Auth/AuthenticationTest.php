<?php

use App\Models\User;
use App\Models\UserLocation;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('a repeated login updates the existing user location', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
        'latitude' => 28.596184,
        'longitude' => 77.340232,
        'location_name' => 'Noida, Uttar Pradesh, India',
    ]);

    $this->post('/logout');

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
        'latitude' => 28.612345,
        'longitude' => 77.356789,
        'location_name' => 'Noida Sector 62, Uttar Pradesh, India',
    ]);

    expect(UserLocation::query()->where('user_id', $user->getKey())->count())->toBe(1);

    $location = UserLocation::query()->where('user_id', $user->getKey())->firstOrFail();

    expect($location->latitude)->toBe(28.612345)
        ->and($location->longitude)->toBe(77.356789)
        ->and($location->location_name)->toBe('Noida Sector 62, Uttar Pradesh, India');
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('inactive users can not authenticate', function () {
    $user = User::factory()->create(['status' => false]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
