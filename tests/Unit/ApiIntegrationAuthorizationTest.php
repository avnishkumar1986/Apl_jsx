<?php

use App\Http\Controllers\Admin\ApiIntegrationController;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

uses(TestCase::class);

function authorizeApiCode(User $user, string $code): void
{
    $request = Request::create('/admin/api-integrations', 'POST');
    $request->setUserResolver(fn () => $user);

    $controller = new ApiIntegrationController;
    $method = new ReflectionMethod($controller, 'authorizeCode');
    $method->invoke($controller, $request, $code);
}

test('owner can manage a custom API integration code', function () {
    $user = Mockery::mock(User::class)->makePartial();
    $user->shouldReceive('hasRole')->with('Owner')->once()->andReturnTrue();

    authorizeApiCode($user, 'custom-employee-feed');

    expect(true)->toBeTrue();
});

test('a non owner cannot manage a custom API integration code', function () {
    $user = Mockery::mock(User::class)->makePartial();
    $user->shouldReceive('hasRole')->with('Owner')->once()->andReturnFalse();

    expect(fn () => authorizeApiCode($user, 'custom-employee-feed'))
        ->toThrow(HttpException::class);
});
