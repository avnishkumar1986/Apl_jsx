<?php

use App\Models\User;
use App\Models\UserType;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Super Admin');
    $this->userType = UserType::query()->firstOrFail();
});

test('authorized users can view user master', function () {
    $this->actingAs($this->admin)->get(route('admin.user-master.index'))->assertOk();
});

test('authorized users can create a normalized user master record', function () {
    $this->actingAs($this->admin)->post(route('admin.user-master.store'), [
        'first_name' => 'Procurement',
        'last_name' => 'User',
        'user_type_id' => $this->userType->uid,
        'email' => 'procurement@example.com',
        'password' => 'secure-password',
        'contacts' => [
            ['contact_type' => 'mobile', 'contact_value' => '9999999999', 'is_primary' => true],
            ['contact_type' => 'office', 'contact_value' => '01123456789', 'is_primary' => false],
        ],
        'address_line_1' => 'Apollo House',
        'city' => 'Delhi',
        'state' => 'Delhi',
        'postal_code' => '110001',
        'country' => 'India',
    ])->assertRedirect();

    $user = User::query()->where('email', 'procurement@example.com')->firstOrFail();
    expect($user->user_type_id)->toBe($this->userType->uid)
        ->and($user->primaryEmail->email)->toBe('procurement@example.com')
        ->and(Hash::check('secure-password', $user->login->password))->toBeTrue()
        ->and($user->contacts()->where('is_primary', true)->value('contact_number'))->toBe('9999999999')
        ->and($user->contacts()->where('is_primary', false)->value('contact_number'))->toBe('01123456789')
        ->and($user->contacts()->count())->toBe(2)
        ->and($user->addresses()->where('is_primary', true)->value('city'))->toBe('Delhi')
        ->and($user->hasRole('Viewer'))->toBeTrue();
});

test('authorized users can update and delete user master records', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)->put(route('admin.user-master.update', $user), [
        'first_name' => 'Updated',
        'last_name' => 'User',
        'user_type_id' => $this->userType->uid,
        'email' => 'updated@example.com',
        'password' => 'new-password',
        'contact_type' => 'office',
        'contact_value' => '01123456789',
        'address_line_1' => 'Corporate Office',
        'city' => 'Noida',
        'country' => 'India',
    ])->assertRedirect();

    $user->refresh();
    expect($user->name)->toBe('Updated User')
        ->and($user->status)->toBeTrue()
        ->and($user->primaryEmail->email)->toBe('updated@example.com')
        ->and($user->login->username)->toBe('updated@example.com')
        ->and(Hash::check('new-password', $user->login->password))->toBeTrue();

    $this->actingAs($this->admin)->delete(route('admin.user-master.destroy', $user))->assertRedirect();
    expect($user->fresh())->toBeNull();
});

test('users without management permission cannot change user master', function () {
    $viewer = User::factory()->create();
    $viewer->assignRole('Viewer');

    $this->actingAs($viewer)->post(route('admin.user-master.store'), [])->assertForbidden();
});

test('administrator cannot delete their own account from user master', function () {
    $this->actingAs($this->admin)->delete(route('admin.user-master.destroy', $this->admin))->assertStatus(422);
    expect($this->admin->fresh())->not->toBeNull();
});
