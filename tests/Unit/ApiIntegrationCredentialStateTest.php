<?php

use App\Models\ApiIntegration;
use Illuminate\Support\Facades\Crypt;
use Tests\TestCase;

uses(TestCase::class);

test('it reads credentials encrypted with the current application key', function () {
    $integration = new ApiIntegration;
    $integration->setRawAttributes([
        'credentials' => Crypt::encryptString(json_encode([
            'username' => 'sap-user',
            'password' => 'secret',
        ], JSON_THROW_ON_ERROR)),
    ]);

    expect($integration->credentialState())
        ->toBe([
            'credentials' => ['username' => 'sap-user', 'password' => 'secret'],
            'unreadable' => false,
        ]);
});

test('it reports credentials encrypted with another application key without throwing', function () {
    $integration = new ApiIntegration;
    $integration->setRawAttributes([
        'credentials' => 'eyJpdiI6ImludmFsaWQiLCJ2YWx1ZSI6ImludmFsaWQiLCJtYWMiOiJpbnZhbGlkIiwidGFnIjoiIn0=',
    ]);

    expect($integration->credentialState())
        ->toBe(['credentials' => [], 'unreadable' => true]);
});

test('it treats an empty credential as readable', function () {
    $integration = new ApiIntegration;
    $integration->setRawAttributes(['credentials' => null]);

    expect($integration->credentialState())
        ->toBe(['credentials' => [], 'unreadable' => false]);
});

test('an unreadable credential can be detached before replacement', function () {
    $integration = new ApiIntegration;
    $integration->setRawAttributes([
        'name' => 'Production',
        'credentials' => 'eyJpdiI6ImludmFsaWQiLCJ2YWx1ZSI6ImludmFsaWQiLCJtYWMiOiJpbnZhbGlkIiwidGFnIjoiIn0=',
    ], true);

    $integration->setRawAttributes([
        ...$integration->getAttributes(),
        'credentials' => null,
    ]);
    $integration->syncOriginalAttribute('credentials');
    $integration->setAttribute('credentials', [
        'username' => 'new-user',
        'password' => 'new-secret',
    ]);

    expect(fn () => $integration->getDirty())->not->toThrow(Throwable::class)
        ->and($integration->credentialState())
        ->toBe([
            'credentials' => ['username' => 'new-user', 'password' => 'new-secret'],
            'unreadable' => false,
        ]);
});
