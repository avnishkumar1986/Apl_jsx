<?php

use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Super Admin');
});

test('authorized users can view department master', function () {
    $this->actingAs($this->admin)->get(route('admin.departments.index'))->assertOk();
});

test('authorized users can create update and change department status', function () {
    $this->actingAs($this->admin)->post(route('admin.departments.store'), [
        'department_code' => 'RND',
        'department_name' => 'Research and Development',
        'description' => 'Product research and innovation',
        'status' => true,
    ])->assertRedirect();

    $department = Department::query()->where('department_code', 'RND')->firstOrFail();

    $this->actingAs($this->admin)->put(route('admin.departments.update', $department), [
        'department_code' => 'RND',
        'department_name' => 'Research & Development',
        'description' => 'Product research, testing and innovation',
        'status' => true,
    ])->assertRedirect();

    $this->actingAs($this->admin)->patch(route('admin.departments.status', $department), [
        'active' => false,
    ])->assertRedirect();

    expect($department->refresh()->department_name)->toBe('Research & Development')
        ->and($department->status)->toBeFalse();
});

test('authorized users can bulk update departments', function () {
    $first = Department::create(['department_code' => 'BULK1', 'department_name' => 'Bulk Department One', 'status' => true]);
    $second = Department::create(['department_code' => 'BULK2', 'department_name' => 'Bulk Department Two', 'status' => true]);
    $ids = [$first->id, $second->id];
    $this->actingAs($this->admin)->patch(route('admin.departments.bulk'), ['ids' => $ids, 'action' => 'deactivate'])->assertRedirect();
    expect(Department::query()->whereIn('id', $ids)->where('status', false)->count())->toBe(2);
});
