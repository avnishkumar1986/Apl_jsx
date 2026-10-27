<?php

use App\Models\Company;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Owner');
});

test('an authorized user can create a role with permissions', function () {
    $company = Company::create(['company_code' => 'TEST1000', 'company_name' => 'Test APL', 'record_type' => 1, 'status' => true]);
    $department = Department::query()->where('department_code', 'IT')->firstOrFail();
    $designation = Designation::query()->firstOrFail();

    $this->actingAs($this->admin)->post(route('admin.roles.store'), [
        'name' => 'User Manager',
        'company_ids' => [$company->id],
        'department_id' => $department->id,
        'designation_id' => $designation->id,
        'permissions' => ['users.view', 'users.manage', 'procurement.planning_decisions.unlock'],
    ])->assertRedirect();

    $role = Role::findByName('User Manager');
    expect($role->hasPermissionTo('users.manage'))->toBeTrue();
    expect($role->hasPermissionTo('procurement.planning_decisions.unlock'))->toBeTrue();
    expect($role->companies()->pluck('tbl_company.id')->all())->toBe([$company->id]);
    expect($role->department_id)->toBe($department->id);
    expect($role->designation_id)->toBe($designation->id);
});

test('an authorized user can update role scopes and permissions', function () {
    $role = Role::create(['name' => 'Operator', 'guard_name' => 'web']);
    $company = Company::create(['company_code' => 'TEST5000', 'company_name' => 'Test KPL', 'record_type' => 1, 'status' => true]);

    $this->actingAs($this->admin)->put(route('admin.roles.update', $role), [
        'name' => 'Operations Manager',
        'company_ids' => [$company->id],
        'department_id' => null,
        'designation_id' => null,
        'permissions' => ['dashboard.view'],
    ])->assertRedirect();

    $role->refresh();
    expect($role->name)->toBe('Operations Manager');
    expect($role->hasPermissionTo('dashboard.view'))->toBeTrue();
    expect($role->companies()->pluck('tbl_company.id')->all())->toBe([$company->id]);
});

test('role scope ids must reference active master data', function () {
    $this->actingAs($this->admin)->post(route('admin.roles.store'), [
        'name' => 'Invalid Scope',
        'company_ids' => [999999],
        'permissions' => [],
    ])->assertSessionHasErrors('company_ids.0');
});

test('the owner role cannot be deleted', function () {
    $role = Role::findByName('Owner');

    $this->actingAs($this->admin)->delete(route('admin.roles.destroy', $role))
        ->assertSessionHasErrors('role');

    expect(Role::findByName('Owner'))->not->toBeNull();
});
