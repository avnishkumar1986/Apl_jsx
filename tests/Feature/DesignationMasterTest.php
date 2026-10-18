<?php

use App\Models\Designation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Super Admin');
});

test('authorized users can view designation master', function () {
    $this->actingAs($this->admin)->get(route('admin.designations.index'))->assertOk();
});

test('designation validation messages are returned', function () {
    $this->actingAs($this->admin)->post(route('admin.designations.store'), [])->assertSessionHasErrors(['designation_name', 'designation_level_id', 'status']);
});

test('authorized users can manage designations', function () {
    $payload = ['des_id' => 101, 'designation_name' => 'Test Lead', 'designation_level_id' => 3, 'reports_to_designation_id' => null, 'department_id' => null, 'sitting_place' => 'Head Office', 'status' => true];
    $this->actingAs($this->admin)->post(route('admin.designations.store'), $payload)->assertRedirect();
    $designation = Designation::query()->where('des_id', 101)->firstOrFail();
    $this->actingAs($this->admin)->put(route('admin.designations.update', $designation), [...$payload, 'designation_name' => 'Quality Test Lead'])->assertRedirect();
    $this->actingAs($this->admin)->patch(route('admin.designations.status', $designation), ['active' => false])->assertRedirect();
    expect($designation->refresh()->designation_name)->toBe('Quality Test Lead')->and($designation->status)->toBeFalse();
});

test('authorized users can bulk update designations', function () {
    $first = Designation::create(['des_id' => 201, 'designation_name' => 'Bulk One', 'designation_level_id' => 1, 'status' => true]);
    $second = Designation::create(['des_id' => 202, 'designation_name' => 'Bulk Two', 'designation_level_id' => 1, 'status' => true]);
    $this->actingAs($this->admin)->patch(route('admin.designations.bulk'), ['ids' => [$first->id, $second->id], 'action' => 'deactivate'])->assertRedirect();
    expect(Designation::query()->whereIn('id', [$first->id, $second->id])->where('status', false)->count())->toBe(2);
});
