<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class AssignSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rbac:assign-super-admin {email : The email address of the existing user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign the Super Admin role to an existing user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::query()
            ->whereHas('primaryEmail', fn ($query) => $query->where('email', $this->argument('email')))
            ->first();

        if (! $user) {
            $this->error('No user was found with that email address.');

            return self::FAILURE;
        }

        $user->assignRole('Super Admin');
        $this->info("Super Admin access assigned to {$user->email}.");

        return self::SUCCESS;
    }
}
