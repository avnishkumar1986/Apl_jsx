<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\JwtLoginRequest;
use App\Models\Login;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

class JwtAuthController extends Controller
{
    public function login(JwtLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $identifier = trim($credentials['email']);
        $login = Login::query()->with('user')
            ->where(function ($query) use ($identifier): void {
                $query->where('username', $identifier)
                    ->orWhereHas('user.primaryEmail', fn ($emailQuery) => $emailQuery->where('email', $identifier));
            })
            ->where('status', true)
            ->first();
        $token = $login && $login->user?->status && Hash::check($credentials['password'], $login->password)
            ? Auth::guard('api')->login($login->user)
            : false;

        if (! $token) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::guard('api')->user();
        $user?->login?->update(['last_login_at' => now()]);
        $this->storeToken($token);

        return $this->tokenResponse($token);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user('api')]);
    }

    public function refresh(): JsonResponse
    {
        $token = Auth::guard('api')->refresh();
        $this->storeToken($token);

        return $this->tokenResponse($token);
    }

    public function logout(): JsonResponse
    {
        $login = Auth::guard('api')->user()?->login;
        Auth::guard('api')->logout();
        $login?->update([
            'jwt_token' => null,
            'jwt_token_expires_at' => null,
            'jwt_token_revoked_at' => now(),
        ]);

        return response()->json(['message' => 'Successfully logged out.']);
    }

    private function tokenResponse(string $token): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
            'user' => Auth::guard('api')->user(),
        ]);
    }

    private function storeToken(string $token): void
    {
        $ttl = Auth::guard('api')->factory()->getTTL();

        Auth::guard('api')->user()?->login?->update([
            'jwt_token' => Crypt::encryptString($token),
            'jwt_token_expires_at' => now()->addMinutes($ttl),
            'jwt_token_revoked_at' => null,
        ]);
    }
}
