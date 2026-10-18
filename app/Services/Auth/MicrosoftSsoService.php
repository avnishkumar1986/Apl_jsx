<?php

namespace App\Services\Auth;

use App\Models\Contact;
use App\Models\Login;
use App\Models\Role;
use App\Models\SocialAccount;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Two\User as SocialiteUser;

class MicrosoftSsoService
{
    public function authenticate(SocialiteUser $microsoftUser): User
    {
        $email = Str::lower(trim((string) $microsoftUser->getEmail()));
        $allowedDomain = Str::lower((string) config('services.microsoft.allowed_domain'));

        if ($email === '' || ! Str::endsWith($email, '@'.$allowedDomain)) {
            throw ValidationException::withMessages([
                'sso' => "Only {$allowedDomain} Microsoft accounts can sign in.",
            ]);
        }

        $user = DB::transaction(function () use ($microsoftUser, $email): User {
            $socialAccount = SocialAccount::query()
                ->with('user')
                ->where('provider', 'microsoft')
                ->where('provider_user_id', $microsoftUser->getId())
                ->first();
            $user = $socialAccount?->user ?? User::query()
                ->whereHas('primaryEmail', fn ($query) => $query->where('email', $email))
                ->first();

            if (! $user) {
                $user = User::create([
                    'user_type_id' => UserType::query()->where('status', true)->value('uid'),
                    'name' => $microsoftUser->getName() ?: Str::headline(Str::before($email, '@')),
                    'status' => true,
                ]);
                $user->assignRole(Role::findOrCreate('Viewer', 'web'));
            }

            if (! $user->status) {
                throw ValidationException::withMessages(['sso' => 'Your account is inactive. Contact an administrator.']);
            }

            $login = Login::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'login_name' => $email,
                    'password' => Str::password(40),
                    'status' => true,
                ],
            );

            $login->update([
                'login_name' => $email,
                'status' => true,
                'last_login_at' => now(),
                'updated_by' => $user->id,
            ]);

            Contact::query()->updateOrCreate(
                ['user_id' => $user->unique_id, 'is_primary' => true],
                [
                    'contact_type' => 'primary',
                    'email' => $email,
                    'is_verified' => true,
                    'status' => true,
                    'updated_by' => $user->id,
                ],
            );

            SocialAccount::query()->updateOrCreate(
                ['provider' => 'microsoft', 'provider_user_id' => $microsoftUser->getId()],
                ['user_id' => $user->id, 'provider_email' => $email, 'status' => true],
            );

            return $user;
        });

        Auth::login($user, remember: true);

        return $user;
    }
}
