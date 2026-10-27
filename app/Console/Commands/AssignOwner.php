<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class AssignOwner extends Command
{
    protected $signature = 'rbac:assign-owner {email : The email address of the existing user}';

    protected $description = 'Assign the Owner role to an existing user';

    public function handle(): int
    {
        $user = User::query()
            ->whereHas('primaryEmail', fn ($query) => $query->where('email', $this->argument('email')))
            ->first();

        if (! $user) {
            $this->error('No user was found with that email address.');

            return self::FAILURE;
        }

        $user->assignRole('Owner');
        $this->info("Owner access assigned to {$user->email}.");

        return self::SUCCESS;
    }
}
