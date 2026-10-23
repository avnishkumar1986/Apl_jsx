<?php

namespace App\Auth;

use App\Models\User;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

class SeparatedUserProvider extends EloquentUserProvider
{
    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        $identifier = $credentials['email'] ?? $credentials['username'] ?? null;

        if (! is_string($identifier) || trim($identifier) === '') {
            return null;
        }
        $identifier = trim($identifier);

        return $this->newModelQuery()
            ->whereHas('login', fn ($query) => $query->where('status', true))
            ->where(function ($query) use ($identifier): void {
                $query->whereHas('login', fn ($loginQuery) => $loginQuery->where('username', $identifier))
                    ->orWhereHas('primaryEmail', fn ($emailQuery) => $emailQuery->where('email', $identifier));
            })
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
