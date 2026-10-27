<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table): void {
            $table->text('credentials')->nullable()->after('credential_key');
        });

        $username = (string) env('API_AUTH_USERNAME', '');
        $password = (string) env('API_AUTH_PASSWORD', '');
        if ($username !== '' && $password !== '') {
            DB::table('tbl_api_integrations')
                ->whereIn('code', ['material', 'stock', 'vendor', 'production', 'quality'])
                ->update([
                    'credentials' => Crypt::encryptString(json_encode([
                        'username' => $username,
                        'password' => $password,
                    ], JSON_THROW_ON_ERROR)),
                ]);
        }

        $securityUsername = (string) env('SECURITY_AUDIT_USERNAME', '');
        $securityPassword = (string) env('SECURITY_AUDIT_PASSWORD', '');
        if ($securityUsername !== '' && $securityPassword !== '') {
            DB::table('tbl_api_integrations')
                ->where('code', 'security')
                ->update([
                    'auth_type' => 'basic',
                    'credentials' => Crypt::encryptString(json_encode([
                        'username' => $securityUsername,
                        'password' => $securityPassword,
                    ], JSON_THROW_ON_ERROR)),
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('tbl_api_integrations', function (Blueprint $table): void {
            $table->dropColumn('credentials');
        });
    }
};
