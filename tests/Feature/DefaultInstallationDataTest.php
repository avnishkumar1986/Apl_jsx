<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('a fresh installation contains the default owner login', function () {
    $user = DB::table('tbl_users')->where('unique_id', 'USR0000002')->first();
    $login = DB::table('tbl_usrlogin')->where('username', 'superadmin@aplconnect.local')->first();

    expect($user)->not->toBeNull()
        ->and($login)->not->toBeNull()
        ->and($login->user_id)->toBe('USR0000002')
        ->and($login->usr_type)->toBe('USR5')
        ->and(Hash::check('aplconnect@1234', $login->password))->toBeTrue();

    $hasOwnerRole = DB::table('tbl_model_has_roles')
        ->join('tbl_roles', 'tbl_roles.id', '=', 'tbl_model_has_roles.role_id')
        ->where('tbl_model_has_roles.model_type', 'App\\Models\\User')
        ->where('tbl_model_has_roles.model_id', $user->id)
        ->where('tbl_roles.name', 'Owner')
        ->where('tbl_roles.guard_name', 'web')
        ->exists();

    expect($hasOwnerRole)->toBeTrue();
});

test('a fresh installation contains every default API integration', function () {
    $expected = [
        'material',
        'stock',
        'vendor',
        'quality',
        'production',
        'employee',
        'security',
        'mrmcon',
    ];

    $actual = DB::table('tbl_api_integrations')
        ->whereIn('code', $expected)
        ->orderBy('id')
        ->pluck('code')
        ->all();

    expect($actual)->toHaveCount(count($expected))
        ->and($actual)->toEqualCanonicalizing($expected);

    expect(json_decode(
        DB::table('tbl_api_integrations')->where('code', 'security')->value('target_table'),
        true,
        flags: JSON_THROW_ON_ERROR,
    ))->toBe(['security_scans', 'security_findings']);
});

test('a fresh installation has no fabricated API run history', function () {
    expect(DB::table('tbl_api_integrations')->whereNotNull('last_run_status')->count())->toBe(0)
        ->and(DB::table('tbl_api_integrations')->whereNotNull('last_run_at')->count())->toBe(0)
        ->and(DB::table('tbl_api_integration_logs')->count())->toBe(0);
});

test('the cleanup removes synthetic history while preserving a real run', function () {
    $integrationId = DB::table('tbl_api_integrations')->where('code', 'material')->value('id');
    $realRunAt = now()->subMinute();

    DB::table('tbl_api_integration_logs')->insert([
        [
            'api_integration_id' => $integrationId,
            'run_id' => (string) Str::uuid(),
            'status' => 'success',
            'message' => 'Initial reference run imported successfully.',
            'created_at' => now()->subMinutes(2),
        ],
        [
            'api_integration_id' => $integrationId,
            'run_id' => (string) Str::uuid(),
            'status' => 'failed',
            'message' => 'Actual API request failed.',
            'created_at' => $realRunAt,
        ],
    ]);

    $migration = require database_path('migrations/2026_10_27_080000_remove_synthetic_api_run_history.php');
    $migration->up();

    expect(DB::table('tbl_api_integration_logs')->where('api_integration_id', $integrationId)->count())->toBe(1)
        ->and(DB::table('tbl_api_integration_logs')->where('message', 'Initial reference run imported successfully.')->exists())->toBeFalse()
        ->and(DB::table('tbl_api_integrations')->where('id', $integrationId)->value('last_run_status'))->toBe('failed');
});
