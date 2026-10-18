<?php

use App\Models\User;

test('active users can authenticate and access protected jwt endpoints', function () {
    $user = User::factory()->create(['email' => 'jwt-user@example.com']);

    $loginResponse = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk()->assertJsonStructure([
        'access_token', 'token_type', 'expires_in', 'user' => ['id', 'email'],
    ]);

    $user->login->refresh();
    expect($user->login->jwt_token)
        ->not->toBeNull()
        ->not->toBe($loginResponse->json('access_token'));
    expect($user->login->jwt_token_expires_at)->not->toBeNull();

    $this->withToken($loginResponse->json('access_token'))
        ->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('user.id', $user->id);

    $this->withToken($loginResponse->json('access_token'))
        ->postJson('/api/auth/logout')
        ->assertOk();

    $user->login->refresh();
    expect($user->login->jwt_token)->toBeNull();
    expect($user->login->jwt_token_revoked_at)->not->toBeNull();
});

test('invalid credentials are rejected', function () {
    $user = User::factory()->create();

    $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'incorrect-password',
    ])->assertUnauthorized()->assertJsonPath('message', 'Invalid credentials.');
});
