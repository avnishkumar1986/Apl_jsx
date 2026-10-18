<?php

use App\Models\User;
use App\Models\UserType;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Super Admin');
});

test('authorized users can view user types', function () {
    $this->actingAs($this->admin)->get(route('admin.user-types.index'))->assertOk();
});

test('authorized users can create and update a user type', function () {
    $this->actingAs($this->admin)->post(route('admin.user-types.store'), [
        'uid' => 'USR8',
        'name' => 'Consultant',
        'description' => 'External company consultant',
        'status' => true,
    ])->assertRedirect();

    $type = UserType::query()->where('uid', 'USR8')->firstOrFail();
    expect($type->created_by)->toBe($this->admin->id);

    $this->actingAs($this->admin)->put(route('admin.user-types.update', $type), [
        'uid' => 'USR9',
        'name' => 'Permanent Employee',
        'description' => 'Permanent company employee',
        'status' => false,
    ])->assertRedirect();

    expect($type->refresh()->uid)->toBe('USR9')
        ->and($type->name)->toBe('Permanent Employee')
        ->and($type->status)->toBeFalse()
        ->and($type->updated_by)->toBe($this->admin->id);
});

test('authorized users can toggle user type status', function () {
    $type = UserType::create(['name' => 'Vendor', 'status' => true]);

    $this->actingAs($this->admin)->patch(route('admin.user-types.status', $type), [
        'active' => false,
    ])->assertRedirect();

    expect($type->refresh()->status)->toBeFalse();
});

test('authorized users can apply bulk status actions', function () {
    $first = UserType::create(['name' => 'Vendor', 'status' => true]);
    $second = UserType::create(['name' => 'Contractor', 'status' => true]);

    $this->actingAs($this->admin)->patch(route('admin.user-types.bulk'), [
        'ids' => [$first->id, $second->id],
        'action' => 'deactivate',
    ])->assertRedirect();

    expect($first->refresh()->status)->toBeFalse()
        ->and($second->refresh()->status)->toBeFalse();
});

test('bulk delete protects assigned user types', function () {
    $assigned = UserType::query()->firstOrFail();
    $unassigned = UserType::create(['name' => 'Temporary', 'status' => true]);
    User::factory()->create(['user_type_id' => $assigned->uid]);

    $this->actingAs($this->admin)->patch(route('admin.user-types.bulk'), [
        'ids' => [$assigned->id, $unassigned->id],
        'action' => 'delete',
    ])->assertSessionHasErrors('bulk_action');

    expect($assigned->fresh())->not->toBeNull()
        ->and($unassigned->fresh())->not->toBeNull();
});

test('unassigned user types can be deleted', function () {
    $type = UserType::create(['name' => 'Temporary', 'status' => true]);

    $this->actingAs($this->admin)->delete(route('admin.user-types.destroy', $type))->assertRedirect();
    expect($type->fresh())->toBeNull();
});

test('assigned user types cannot be deleted', function () {
    $type = UserType::query()->firstOrFail();
    User::factory()->create(['user_type_id' => $type->uid]);

    $this->actingAs($this->admin)->delete(route('admin.user-types.destroy', $type))
        ->assertSessionHasErrors('user_type');
    expect($type->fresh())->not->toBeNull();
});

test('users without management permission cannot change user types', function () {
    $viewer = User::factory()->create();
    $viewer->assignRole('Viewer');

    $this->actingAs($viewer)->post(route('admin.user-types.store'), [])->assertForbidden();
});
