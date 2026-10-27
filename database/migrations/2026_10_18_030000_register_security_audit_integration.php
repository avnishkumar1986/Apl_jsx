<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')->updateOrInsert(
            ['code' => 'security'],
            [
                'name' => 'OWASP Security Audit',
                'description' => 'OWASP A06-aligned Composer and npm dependency vulnerability audit',
                'base_url' => env('SECURITY_AUDIT_BASE_URL', 'http://127.0.0.1:8001'),
                'endpoint' => env('SECURITY_AUDIT_ENDPOINT', '/api/security-audits/run'),
                'method' => 'POST',
                'auth_type' => 'basic',
                'credential_key' => null,
                'target_table' => json_encode(['security_scans', 'security_findings']),
                'retries' => 1,
                'retry_delay_seconds' => 0,
                'timeout_seconds' => 300,
                'status' => true,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')->where('code', 'security')->delete();
    }
};
