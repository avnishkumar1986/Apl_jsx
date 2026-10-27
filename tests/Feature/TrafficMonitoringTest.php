<?php

use App\Models\BlockedIpAddress;
use App\Models\PortalLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->withoutVite();
});

test('an owner can block and unblock an IP address', function () {
    $owner = User::query()->where('unique_id', 'USR0000002')->firstOrFail();

    $this->actingAs($owner)
        ->post(route('admin.traffic-monitor.block'), [
            'ip_address' => '203.0.113.10',
            'reason' => 'Automated suspicious traffic',
        ])
        ->assertRedirect();

    $blocked = BlockedIpAddress::query()->where('ip_address', '203.0.113.10')->firstOrFail();

    expect($blocked->reason)->toBe('Automated suspicious traffic')
        ->and($blocked->blocked_by)->toBe($owner->id)
        ->and($blocked->unblocked_at)->toBeNull();

    $this->actingAs($owner)
        ->delete(route('admin.traffic-monitor.unblock', $blocked))
        ->assertRedirect();

    expect($blocked->fresh()->unblocked_at)->not->toBeNull()
        ->and($blocked->fresh()->unblocked_by)->toBe($owner->id);
});

test('blocked traffic is rejected and recorded', function () {
    BlockedIpAddress::query()->create([
        'ip_address' => '203.0.113.20',
        'reason' => 'Test block',
        'blocked_at' => now(),
    ]);

    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.20'])
        ->get('/login')
        ->assertForbidden();

    expect(PortalLog::query()
        ->where('ip_address', '203.0.113.20')
        ->where('status_code', 403)
        ->where('action', 'Blocked request')
        ->exists())->toBeTrue();
});

test('only owners can open the traffic monitor', function () {
    $owner = User::query()->where('unique_id', 'USR0000002')->firstOrFail();
    $regularUserId = DB::table('tbl_users')->insertGetId([
        'unique_id' => 'USRTEST001',
        'user_type' => 'USR5',
        'first_name' => 'Regular',
        'last_name' => 'User',
        'name' => 'Regular User',
        'status' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $regularUser = User::query()->findOrFail($regularUserId);

    $this->actingAs($owner)->get(route('admin.traffic-monitor.index'))->assertOk();
    $this->actingAs($regularUser)->get(route('admin.traffic-monitor.index'))->assertForbidden();
});
