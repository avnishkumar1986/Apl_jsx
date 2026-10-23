<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Login;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            Login::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'username' => $user->email,
                    'password' => $user->pendingPassword() ?? (static::$password ??= Hash::make('password')),
                    'remember_token' => $user->pendingRememberToken(),
                    'status' => $user->status,
                ],
            );

            Contact::query()->firstOrCreate(
                ['user_id' => $user->id, 'is_primary' => true],
                [
                    'contact_type' => 'primary',
                    'email' => $user->email,
                    'is_verified' => $user->email_verified_at !== null,
                    'status' => $user->status,
                ],
            );

            $user->unsetRelation('login');
            $user->unsetRelation('primaryEmail');
        });
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'status' => true,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }
}
