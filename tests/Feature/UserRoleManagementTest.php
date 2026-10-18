<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Super Admin');
});

test('an authorized user can assign normalized roles to a user', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)->put(route('admin.users.roles.update', $user), [
        'roles' => ['Administrator', 'Viewer'],
    ])->assertRedirect();

    expect($user->refresh()->hasAllRoles(['Administrator', 'Viewer']))->toBeTrue();
});

test('a super administrator cannot remove their own privileged role', function () {
    $this->actingAs($this->admin)->put(route('admin.users.roles.update', $this->admin), [
        'roles' => ['Viewer'],
    ])->assertSessionHasErrors('roles');

    expect($this->admin->refresh()->hasRole('Super Admin'))->toBeTrue();
});
