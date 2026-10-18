<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_usrlogin', 'remember_token')) {
            Schema::table('tbl_usrlogin', function (Blueprint $table): void {
                $table->string('remember_token', 100)->nullable()->after('password');
            });
        }

        DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
            $email = isset($user->email) ? strtolower(trim((string) $user->email)) : '';
            $now = now();

            $login = DB::table('tbl_usrlogin')->where('user_id', (string) $user->id);
            if ($login->exists()) {
                $login->update(array_filter([
                    'login_name' => $email !== '' ? $email : null,
                    'password' => $user->password ?? null,
                    'remember_token' => $user->remember_token ?? null,
                    'updated_at' => $now,
                ], fn ($value): bool => $value !== null));
            } elseif ($email !== '') {
                DB::table('tbl_usrlogin')->insert([
                    'user_id' => (string) $user->id,
                    'login_name' => $email,
                    'password' => $user->password ?? Hash::make(str()->random(40)),
                    'remember_token' => $user->remember_token ?? null,
                    'status' => (bool) $user->status,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            if ($email !== '') {
                DB::table('tbl_usrcontact')->updateOrInsert(
                    ['user_id' => (string) $user->id, 'is_primary' => true],
                    [
                        'contact_type' => 'primary',
                        'email' => $email,
                        'is_verified' => $user->email_verified_at !== null,
                        'status' => (bool) $user->status,
                        'updated_at' => $now,
                        'created_at' => $user->created_at ?? $now,
                    ],
                );
            }
        });

        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->dropUnique('tbl_users_email_unique');
            $table->dropColumn(['email', 'email_verified_at', 'password', 'remember_token']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->string('email')->nullable()->unique()->after('name');
            $table->timestamp('email_verified_at')->nullable()->after('email');
            $table->string('password')->nullable()->after('email_verified_at');
            $table->rememberToken();
        });

        DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
            $login = DB::table('tbl_usrlogin')->where('user_id', (string) $user->id)->first();
            $contact = DB::table('tbl_usrcontact')->where('user_id', (string) $user->id)->where('is_primary', true)->first();

            DB::table('tbl_users')->where('id', $user->id)->update([
                'email' => $contact?->email ?? $login?->login_name,
                'email_verified_at' => $contact?->is_verified ? ($contact->updated_at ?? now()) : null,
                'password' => $login?->password,
                'remember_token' => $login?->remember_token,
            ]);
        });

        Schema::table('tbl_usrlogin', function (Blueprint $table): void {
            $table->dropColumn('remember_token');
        });
    }
};
