<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $integrations = [
            [
                'name' => 'Material API',
                'code' => 'material',
                'description' => 'Material',
                'api_type' => 'sap',
                'base_url' => null,
                'endpoint' => '/sap/opu/odata/sap/ZVENDOR_DATA_SRV/ZMATNRSet',
                'target_table' => ['tbl_materials'],
                'retries' => 3,
                'retry_delay_seconds' => 10,
                'timeout_seconds' => 30,
            ],
            [
                'name' => 'Stock API',
                'code' => 'stock',
                'description' => 'Stock',
                'api_type' => 'sap',
                'base_url' => null,
                'endpoint' => '/sap/opu/odata/sap/ZMAT_STOCK_CDS/ZMAT_STOCK',
                'target_table' => ['tbl_material_stocks'],
                'retries' => 1,
                'retry_delay_seconds' => 5,
                'timeout_seconds' => 30,
            ],
            [
                'name' => 'Vendor API',
                'code' => 'vendor',
                'description' => 'Vendor',
                'api_type' => 'sap',
                'base_url' => null,
                'endpoint' => '/sap/opu/odata/sap/ZPO_ITEM_ODATA_SRV/PurchaseOrderItemSet?$format=json',
                'target_table' => ['tbl_vendors', 'tbl_vendor_purchase_orders'],
                'retries' => 3,
                'retry_delay_seconds' => 10,
                'timeout_seconds' => 30,
            ],
            [
                'name' => 'Quality API',
                'code' => 'quality',
                'description' => 'Quality',
                'api_type' => 'sap',
                'base_url' => null,
                'endpoint' => 'https://103.186.48.158:44321',
                'target_table' => [],
                'retries' => 3,
                'retry_delay_seconds' => 10,
                'timeout_seconds' => 30,
            ],
            [
                'name' => 'Production API',
                'code' => 'production',
                'description' => 'Production · current environment',
                'api_type' => 'sap',
                'base_url' => null,
                'endpoint' => 'https://fiori.apollopipes.com:44301',
                'target_table' => [],
                'retries' => 3,
                'retry_delay_seconds' => 10,
                'timeout_seconds' => 30,
            ],
            [
                'name' => 'Employee Api',
                'code' => 'employee',
                'description' => 'Employee',
                'api_type' => 'external',
                'base_url' => null,
                'endpoint' => env('EMPLOYEE_API_URL'),
                'target_table' => ['tbl_users', 'tbl_usrcontact', 'tbl_usrdept'],
                'retries' => 3,
                'retry_delay_seconds' => 10,
                'timeout_seconds' => 120,
            ],
            [
                'name' => 'OWASP Security Audit',
                'code' => 'security',
                'description' => 'OWASP A06-aligned Composer and npm dependency vulnerability audit',
                'api_type' => 'external',
                'base_url' => env('SECURITY_AUDIT_BASE_URL', 'http://127.0.0.1:8001'),
                'endpoint' => env('SECURITY_AUDIT_ENDPOINT', '/api/security-audits/run'),
                'target_table' => ['security_scans', 'security_findings'],
                'retries' => 1,
                'retry_delay_seconds' => 0,
                'timeout_seconds' => 300,
            ],
            [
                'name' => 'R M Consumption',
                'code' => 'mrmcon',
                'description' => 'Raw material consumption',
                'api_type' => 'sap',
                'base_url' => null,
                'endpoint' => '/sap/opu/odata/sap/ZMAT_STOCK_CUNSUMPTION_SRV/mat_headSet?$format=json',
                'target_table' => ['tbl_material_stocks'],
                'retries' => 3,
                'retry_delay_seconds' => 10,
                'timeout_seconds' => 30,
            ],
        ];

        foreach ($integrations as $integration) {
            $code = $integration['code'];
            $values = array_merge($integration, [
                'target_table' => json_encode($integration['target_table'], JSON_THROW_ON_ERROR),
                'status' => true,
                'updated_at' => $now,
            ]);
            unset($values['code']);

            $credentials = $this->credentialsFor($code);
            if ($credentials !== null) {
                $values['credentials'] = Crypt::encryptString(json_encode($credentials, JSON_THROW_ON_ERROR));
            }

            if (! DB::table('tbl_api_integrations')->where('code', $code)->exists()) {
                $values['created_at'] = $now;
            }

            DB::table('tbl_api_integrations')->updateOrInsert(['code' => $code], $values);
        }
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')->whereIn('code', [
            'material', 'stock', 'vendor', 'quality', 'production', 'employee', 'security', 'mrmcon',
        ])->delete();
    }

    private function credentialsFor(string $code): ?array
    {
        [$username, $password] = match ($code) {
            'security' => [env('SECURITY_AUDIT_USERNAME'), env('SECURITY_AUDIT_PASSWORD')],
            'employee' => [env('EMPLOYEE_API_USERNAME'), env('EMPLOYEE_API_PASSWORD')],
            'production' => [env('PRODUCTION_API_USERNAME'), env('PRODUCTION_API_PASSWORD')],
            default => [env('API_AUTH_USERNAME'), env('API_AUTH_PASSWORD')],
        };

        if (blank($username) || blank($password)) {
            return null;
        }

        return ['username' => (string) $username, 'password' => (string) $password];
    }
};
