<?php

use App\Models\DesignationLevel;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Owner');
});

test('authorized users can view designation level master', function () {
    $this->actingAs($this->admin)->get(route('admin.designation-levels.index'))->assertOk();
});

test('designation level validation messages are returned', function () {
    $this->actingAs($this->admin)->post(route('admin.designation-levels.store'), [])->assertSessionHasErrors(['level_code', 'level_name', 'hierarchy_order', 'status']);
});

test('authorized users can manage designation levels', function () {
    $payload = ['level_code' => 'L7', 'level_name' => 'Level 7', 'hierarchy_order' => 7, 'reports_to_level_id' => null, 'status' => true];
    $this->actingAs($this->admin)->post(route('admin.designation-levels.store'), $payload)->assertRedirect();
    $level = DesignationLevel::where('level_code', 'L7')->firstOrFail();
    $this->actingAs($this->admin)->put(route('admin.designation-levels.update', $level), [...$payload, 'level_name' => 'Executive Level'])->assertRedirect();
    $this->actingAs($this->admin)->patch(route('admin.designation-levels.status', $level), ['active' => false])->assertRedirect();
    expect($level->refresh()->level_name)->toBe('Executive Level')->and($level->status)->toBeFalse();
});

test('authorized users can bulk update designation levels', function () {
    $first = DesignationLevel::create(['level_code' => 'L8', 'level_name' => 'Level 8', 'hierarchy_order' => 8, 'status' => true]);
    $second = DesignationLevel::create(['level_code' => 'L9', 'level_name' => 'Level 9', 'hierarchy_order' => 9, 'status' => true]);
    $ids = [$first->id, $second->id];
    $this->actingAs($this->admin)->patch(route('admin.designation-levels.bulk'), ['ids' => $ids, 'action' => 'deactivate'])->assertRedirect();
    expect(DesignationLevel::whereIn('id', $ids)->where('status', false)->count())->toBe(2);
});
