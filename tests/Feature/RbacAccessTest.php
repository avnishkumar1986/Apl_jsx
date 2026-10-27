<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('guests are redirected to login from RBAC screens', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('login'));
});

test('users without permission cannot access RBAC screens', function () {
    $user = User::factory()->create();
    $user->assignRole('Viewer');

    $this->actingAs($user)->get(route('admin.users.index'))->assertForbidden();
});

test('owners can access RBAC screens', function () {
    $user = User::factory()->create();
    $user->assignRole('Owner');

    $this->actingAs($user)->get(route('admin.users.index'))->assertOk();
    $this->actingAs($user)->get(route('admin.roles.index'))->assertOk();
});
