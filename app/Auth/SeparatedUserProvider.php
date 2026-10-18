<?php

namespace App\Auth;

use App\Models\User;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

class SeparatedUserProvider extends EloquentUserProvider
{
    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        $email = $credentials['email'] ?? $credentials['login_name'] ?? null;

        if (! is_string($email) || $email === '') {
            return null;
        }

        return $this->newModelQuery()
            ->whereHas('login', fn ($query) => $query->where('login_name', $email)->where('status', true))
            ->first();
    }

    public function retrieveByToken($identifier, $token): ?Authenticatable
    {
        return $this->newModelQuery()
            ->whereKey($identifier)
            ->whereHas('login', fn ($query) => $query->where('remember_token', $token))
            ->first();
    }

    public function updateRememberToken(Authenticatable $user, $token): void
    {
        if ($user instanceof User) {
            $user->login()->update(['remember_token' => $token]);
            $user->unsetRelation('login');
        }
    }
}
