<?php

namespace App\Jobs;

use App\Models\ApiIntegration;
use App\Models\ApiIntegrationLog;
use App\Models\Material;
use App\Models\MaterialStock;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ImportMaterialsFromApi implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public function __construct(public int $apiId, public ?int $requestedBy = null, public ?string $material = null) {}

    public function handle(): void
    {
        $api = ApiIntegration::findOrFail($this->apiId);
        $runId = (string) Str::uuid();
        $started = microtime(true);

        try {
            $environmentCode = (string) config('services.api_integrations.environment_code', 'production');
            $environmentApi = ApiIntegration::where('code', $environmentCode)->where('status', true)->first();
            $baseUrl = filled($api->base_url) ? (string) $api->base_url : (string) $environmentApi?->base_url;

            if ($baseUrl === '') {
                throw new RuntimeException("Base URL is not configured for API environment [{$environmentCode}].");
            }

            $url = rtrim($baseUrl, '/').'/'.ltrim((string) $api->endpoint, '/');
            if ($api->code === 'vendor' && filled($this->material)) {
                $material = str_replace("'", "''", trim((string) $this->material));
                $separator = str_contains($url, '?') ? '&' : '?';
                $url .= $separator.'$filter='.rawurlencode("Material eq '{$material}'").'&$format=json';
            }
            $host = parse_url($url, PHP_URL_HOST);
            $allowedHosts = array_filter(array_map('trim', explode(',', (string) config('services.api_integrations.allowed_hosts'))));

            if (! $host || ($allowedHosts !== [] && ! in_array($host, $allowedHosts, true))) {
                throw new RuntimeException('Material API host is not in API_ALLOWED_HOSTS.');
            }

            $client = Http::timeout($api->timeout_seconds)->acceptJson();
            $credentialKey = (string) $api->credential_key;
            $credential = config("services.api_integrations.credentials.{$credentialKey}", []);
            $token = is_array($credential) ? (string) ($credential['token'] ?? '') : (string) $credential;
            $username = is_array($credential) ? (string) ($credential['username'] ?? '') : '';
            $password = is_array($credential) ? (string) ($credential['password'] ?? '') : '';

            if ($api->auth_type === 'bearer' && $token !== '') {
                $client = $client->withToken($token);
            } elseif ($api->auth_type === 'basic' && $username !== '' && $password !== '') {
                $client = $client->withBasicAuth($username, $password);
            } elseif ($api->auth_type !== 'none') {
                throw new RuntimeException("Credentials are not configured for [{$credentialKey}].");
            }

            $response = $client->get($url);
            $response->throw();
            $json = $response->json();
            $items = data_get($json, 'd.results') ?? data_get($json, 'value') ?? data_get($json, 'data') ?? $json;

            if (! is_array($items)) {
                throw new RuntimeException('API response does not contain a material list.');
            }

            $apiCode = strtolower((string) $api->code);
            $targets = $api->target_table ?: match ($apiCode) {
                'stock' => ['tbl_material_stocks'],
                'vendor' => ['tbl_vendors', 'tbl_vendor_purchase_orders'],
                'employee' => ['tbl_users', 'tbl_usrcontact', 'tbl_usrdept'],
                default => ['tbl_materials'],
            };
            $messages = [];

            if ($apiCode === 'employee') {
                [$created, $updated, $skipped] = $this->importEmployees($items);
                $messages[] = "employee: {$created} created, {$updated} updated, {$skipped} skipped";
            }

            if (in_array('tbl_materials', $targets, true)) {
                [$created, $updated, $skipped] = $this->importMaterials($items);
                $messages[] = "tbl_materials: {$created} created, {$updated} updated, {$skipped} skipped";
            }

            if (in_array('tbl_material_stocks', $targets, true)) {
                [$synchronized, $skipped] = $this->importStock($items);
                $messages[] = "tbl_material_stocks: {$synchronized} synchronized, {$skipped} skipped";
            }

            $importVendors = in_array('tbl_vendors', $targets, true);
            $importPurchaseOrders = in_array('tbl_vendor_purchase_orders', $targets, true);
            if ($importVendors || $importPurchaseOrders) {
                [$purchaseOrderCount, $vendorCount, $skipped] = $this->importVendorPurchaseOrders($items, $importVendors, $importPurchaseOrders);
                if ($importVendors) {
                    $messages[] = "tbl_vendors: {$vendorCount} synchronized";
                }
                if ($importPurchaseOrders) {
                    $messages[] = "tbl_vendor_purchase_orders: {$purchaseOrderCount} synchronized";
                }
                $messages[] = "vendor payload: {$skipped} skipped";
            }

            $specializedTargets = [
                'tbl_materials', 'tbl_material_stocks', 'tbl_vendors', 'tbl_vendor_purchase_orders',
                'tbl_users', 'tbl_usrcontact', 'tbl_usrdept',
            ];
            foreach (array_diff($targets, $specializedTargets) as $target) {
                [$inserted, $skipped] = $this->importGenericTable($target, $items);
                $messages[] = "{$target}: {$inserted} inserted, {$skipped} skipped";
            }

            if ($messages === []) {
                throw new RuntimeException('No supported target table is configured for this API.');
            }

            ApiIntegrationLog::create([
                'api_integration_id' => $api->id,
                'run_id' => $runId,
                'status' => 'success',
                'http_status' => $response->status(),
                'attempt' => 1,
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                'records_received' => count($items),
                'message' => implode('; ', $messages).'.',
                'created_by' => $this->requestedBy,
            ]);
            $api->update(['last_run_status' => 'success', 'last_run_at' => now()]);
        } catch (Throwable $exception) {
            ApiIntegrationLog::create([
                'api_integration_id' => $api->id,
                'run_id' => $runId,
                'status' => 'failed',
                'attempt' => 1,
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                'message' => $exception->getMessage(),
                'created_by' => $this->requestedBy,
            ]);
            $api->update(['last_run_status' => 'failed', 'last_run_at' => now()]);
            throw $exception;
        }
    }

    /** @return array{int, int, int} */
    private function importMaterials(array $items): array
    {
        $created = $updated = $skipped = 0;

        foreach ($items as $item) {
            if (! is_array($item)) {
                $skipped++;

                continue;
            }

            $row = array_change_key_case($item, CASE_LOWER);
            $matnr = trim((string) ($row['matnr'] ?? $row['material_code'] ?? ''));
            $maktx = trim((string) ($row['maktx'] ?? $row['material_desc'] ?? $row['description'] ?? ''));
            if ($matnr === '' || $maktx === '') {
                $skipped++;

                continue;
            }

            $material = Material::where('matnr', $matnr)->first();
            $values = [
                'mtart' => $row['mtart'] ?? null,
                'matkl' => $row['matkl'] ?? null,
                'meins' => $row['meins'] ?? null,
                'maktx' => $maktx,
                'api_payload' => $item,
                'status' => true,
                'imported_by' => $this->requestedBy,
            ];

            if ($material) {
                $material->update($values);
                $updated++;
            } else {
                Material::create(['matnr' => $matnr, ...$values]);
                $created++;
            }
        }

        return [$created, $updated, $skipped];
    }

    /** @return array{int, int, int} */
    private function importEmployees(array $items): array
    {
        $created = $updated = 0;
        $uniqueItems = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $row = array_change_key_case($item, CASE_LOWER);
            $pernr = trim((string) ($row['pernr'] ?? ''));
            if ($pernr !== '') {
                $uniqueItems[$pernr] = $item;
            }
        }
        $skipped = count($items) - count($uniqueItems);
        $employeeTypeId = DB::table('tbl_usertype')
            ->whereRaw('LOWER(name) = ?', ['employee'])
            ->where('status', true)
            ->value('uid');

        if (! $employeeTypeId) {
            throw new RuntimeException('An active Employee user type is required before importing employees.');
        }

        foreach ($uniqueItems as $item) {
            $row = array_change_key_case($item, CASE_LOWER);
            $pernr = trim((string) ($row['pernr'] ?? ''));
            $fullName = trim((string) ($row['name'] ?? $row['ename'] ?? ''));
            if ($pernr === '' || $fullName === '') {
                $skipped++;

                continue;
            }

            [$firstName, $middleName, $lastName] = $this->splitEmployeeName($fullName);
            $existingUser = DB::table('tbl_users')->where('unique_id', $pernr)->first();
            $now = now();

            DB::transaction(function () use ($row, $pernr, $firstName, $middleName, $lastName, $existingUser, $employeeTypeId, $now): void {
                $userValues = [
                    'user_type_id' => $employeeTypeId,
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'status' => true,
                    'updated_by' => $this->requestedBy,
                    'updated_at' => $now,
                ];

                if ($existingUser) {
                    DB::table('tbl_users')->where('id', $existingUser->id)->update($userValues);
                    $userId = $existingUser->id;
                } else {
                    $userId = DB::table('tbl_users')->insertGetId([
                        'unique_id' => $pernr,
                        'created_by' => $this->requestedBy,
                        'created_at' => $now,
                        ...$userValues,
                    ]);
                }

                $email = strtolower(trim((string) ($row['emailaddress'] ?? $row['email'] ?? $row['emailid'] ?? $row['email_id'] ?? '')));
                $contactNumber = trim((string) ($row['contact_number'] ?? $row['contactnumber'] ?? $row['mobile'] ?? $row['mobileno'] ?? $row['tel_number'] ?? ''));
                if ($email !== '' || $contactNumber !== '') {
                    DB::table('tbl_usrcontact')->updateOrInsert(
                        ['user_id' => $pernr, 'is_primary' => true],
                        [
                            'contact_type' => 'primary',
                            'email' => $email !== '' ? $email : null,
                            'contact_number' => $contactNumber !== '' ? $contactNumber : null,
                            'is_verified' => false,
                            'status' => true,
                            'created_by' => $this->requestedBy,
                            'updated_by' => $this->requestedBy,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                    );
                }

                $departmentValue = trim((string) ($row['zdepartment'] ?? $row['zdepartement'] ?? ''));
                $designationValue = trim((string) ($row['zposition'] ?? ''));
                $departmentId = $this->sapIdOrMasterId(
                    $departmentValue,
                    'tbl_departments',
                    'department_code',
                    'department_name',
                    trim((string) ($row['departmentdesc'] ?? '')),
                );
                $designationId = $this->sapIdOrMasterId(
                    $designationValue,
                    'tbl_designations',
                    'des_id',
                    'designation_name',
                    trim((string) ($row['positiondesc'] ?? '')),
                );

                DB::table('tbl_usrdept')->updateOrInsert(
                    ['user_id' => $pernr],
                    [
                        'department_id' => $departmentId,
                        'designation_id' => $designationId,
                        'status' => true,
                        'created_by' => $this->requestedBy,
                        'updated_by' => $this->requestedBy,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                );
            });

            $existingUser ? $updated++ : $created++;
        }

        return [$created, $updated, $skipped];
    }

    /** @return array{string, string|null, string} */
    private function splitEmployeeName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        $firstName = array_shift($parts) ?? '';
        $lastName = count($parts) > 0 ? array_pop($parts) : '';
        $middleName = $parts !== [] ? implode(' ', $parts) : null;

        return [$firstName, $middleName, $lastName];
    }

    private function resolveMasterId(string $table, string $codeColumn, string $nameColumn, string $value): ?int
    {
        if ($value === '') {
            return null;
        }

        $id = DB::table($table)
            ->whereRaw("LOWER({$codeColumn}) = ?", [strtolower($value)])
            ->orWhereRaw("LOWER({$nameColumn}) = ?", [strtolower($value)])
            ->value('id');

        return $id === null ? null : (int) $id;
    }

    private function sapIdOrMasterId(
        string $sapValue,
        string $table,
        string $codeColumn,
        string $nameColumn,
        string $description = '',
    ): ?int {
        if ($sapValue !== '' && ctype_digit($sapValue)) {
            return (int) $sapValue;
        }

        return $this->resolveMasterId($table, $codeColumn, $nameColumn, $sapValue ?: $description);
    }

    /** @return array{int, int} */
    private function importGenericTable(string $table, array $items): array
    {
        if (preg_match('/^[A-Za-z0-9_]+$/', $table) !== 1 || ! Schema::hasTable($table)) {
            throw new RuntimeException("Target table [{$table}] does not exist.");
        }

        $columns = Schema::getColumnListing($table);
        $writableColumns = array_values(array_diff($columns, ['id', 'created_by', 'updated_by']));
        $rows = [];
        $skipped = 0;
        $now = now();

        foreach ($items as $item) {
            if (! is_array($item)) {
                $skipped++;

                continue;
            }

            $source = array_change_key_case($item, CASE_LOWER);
            $row = array_intersect_key($source, array_flip($writableColumns));
            if (in_array('api_payload', $writableColumns, true)) {
                $row['api_payload'] = json_encode($item);
            }
            if (in_array('status', $writableColumns, true) && ! array_key_exists('status', $row)) {
                $row['status'] = true;
            }
            if (in_array('created_at', $writableColumns, true)) {
                $row['created_at'] = $now;
            }
            if (in_array('updated_at', $writableColumns, true)) {
                $row['updated_at'] = $now;
            }

            if ($row === []) {
                $skipped++;

                continue;
            }
            $rows[] = $row;
        }

        $groups = collect($rows)->groupBy(function (array $row): string {
            $keys = array_keys($row);
            sort($keys);

            return implode('|', $keys);
        });
        foreach ($groups as $group) {
            foreach (array_chunk($group->all(), 500) as $batch) {
                DB::table($table)->insert($batch);
            }
        }

        return [count($rows), $skipped];
    }

    /** @return array{int, int} */
    private function importStock(array $items): array
    {
        $batch = [];
        $synchronized = 0;
        $skipped = 0;

        foreach ($items as $item) {
            if (! is_array($item)) {
                $skipped++;

                continue;
            }

            $item = array_change_key_case($item, CASE_LOWER);
            $matnr = trim((string) ($item['material_code'] ?? $item['matnr'] ?? ''));
            $plantCode = trim((string) ($item['plant'] ?? $item['plant_code'] ?? $item['werks'] ?? ''));
            if ($matnr === '' || $plantCode === '') {
                $skipped++;

                continue;
            }

            $batch[$matnr."\0".$plantCode] = [
                'matnr' => $matnr,
                'plant_code' => $plantCode,
                'material_desc' => trim((string) ($item['material_desc'] ?? $item['maktx'] ?? '')) ?: null,
                'current_stock' => (float) ($item['current_stock'] ?? $item['labst'] ?? 0),
                'stock_value' => (float) ($item['stock_value'] ?? 0),
                'status' => true,
                'synced_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= 500) {
                $synchronized += $this->upsertStockBatch(array_values($batch));
                $batch = [];
            }
        }

        if ($batch !== []) {
            $synchronized += $this->upsertStockBatch(array_values($batch));
        }

        return [$synchronized, $skipped];
    }

    private function upsertStockBatch(array $rows): int
    {
        MaterialStock::upsert(
            $rows,
            ['matnr', 'plant_code'],
            ['material_desc', 'current_stock', 'stock_value', 'status', 'synced_at', 'updated_at'],
        );

        return count($rows);
    }

    /** @return array{int, int, int} */
    private function importVendorPurchaseOrders(array $items, bool $importVendors = true, bool $importPurchaseOrders = true): array
    {
        $vendors = [];
        $purchaseOrders = [];
        $skipped = 0;

        foreach ($items as $item) {
            if (! is_array($item)) {
                $skipped++;

                continue;
            }

            $row = array_change_key_case($item, CASE_LOWER);
            $poNumber = trim((string) ($row['purchaseorder'] ?? $row['purchase_order'] ?? $row['ebeln'] ?? $row['po_number'] ?? ''));
            $itemNumber = trim((string) ($row['purchaseorderitem'] ?? $row['purchase_order_item'] ?? $row['ebelp'] ?? $row['item_number'] ?? '00010'));
            $vendorCode = trim((string) ($row['supplier'] ?? $row['vendor'] ?? $row['vendor_code'] ?? $row['lifnr'] ?? ''));
            $vendorName = trim((string) ($row['suppliername'] ?? $row['vendor_name'] ?? $row['name1'] ?? $vendorCode));
            $material = trim((string) ($row['material'] ?? $row['material_code'] ?? $row['matnr'] ?? ''));
            $plantCode = trim((string) ($row['plant'] ?? $row['plant_code'] ?? $row['werks'] ?? ''));

            if ($poNumber === '' || $material === '' || $plantCode === '') {
                $skipped++;

                continue;
            }

            $quantity = (float) ($row['orderquantity'] ?? $row['purchaseorderquantity'] ?? $row['order_quantity'] ?? $row['menge'] ?? $row['quantity'] ?? 0);
            $receivedQuantity = (float) ($row['receivedquantity'] ?? $row['received_quantity'] ?? $row['wemng'] ?? 0);
            $unit = strtoupper(trim((string) ($row['purchaseorderquantityunit'] ?? $row['orderquantityunit'] ?? $row['order_unit'] ?? $row['meins'] ?? 'MT')));
            $quantityMt = $this->convertToMt($quantity, $unit);
            $receivedQuantityMt = $this->convertToMt($receivedQuantity, $unit);
            $cancelled = filled($row['deletionindicator'] ?? $row['deletion_flag'] ?? $row['loekz'] ?? null);
            $completed = in_array(strtoupper((string) ($row['deliverycompleted'] ?? $row['elikz'] ?? '')), ['1', 'X', 'TRUE'], true);
            $status = $cancelled ? 'cancelled' : ($completed || ($quantity > 0 && $receivedQuantity >= $quantity) ? 'received' : ($receivedQuantity > 0 ? 'partially_received' : 'planned'));
            $now = now();

            if ($vendorCode !== '') {
                $vendors[$vendorCode] = [
                    'vendor_code' => $vendorCode,
                    'vendor_name' => $vendorName ?: $vendorCode,
                    'company_code' => trim((string) ($row['companycode'] ?? $row['company_code'] ?? $row['bukrs'] ?? '')) ?: null,
                    'status' => true,
                    'api_payload' => json_encode($item),
                    'synced_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $purchaseOrders[$poNumber."\0".$itemNumber] = [
                'po_number' => $poNumber,
                'item_number' => $itemNumber ?: '00010',
                'vendor_code' => $vendorCode ?: null,
                'vendor_name' => $vendorName ?: null,
                'company_code' => trim((string) ($row['companycode'] ?? $row['company_code'] ?? $row['bukrs'] ?? '')) ?: null,
                'material' => $material,
                'plant_code' => $plantCode,
                'order_date' => $this->normalizeApiDate($row['purchaseorderdate'] ?? $row['order_date'] ?? $row['bedat'] ?? null),
                'expected_delivery_date' => $this->normalizeApiDate($row['deliverydate'] ?? $row['expected_delivery_date'] ?? $row['eindt'] ?? null),
                'order_quantity' => $quantity,
                'order_unit' => $unit ?: null,
                'quantity_mt' => $quantityMt,
                'received_quantity_mt' => $receivedQuantityMt,
                'delivery_status' => $status,
                'status' => ! $cancelled,
                'api_payload' => json_encode($item),
                'synced_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($importVendors && $vendors !== []) {
            DB::table('tbl_vendors')->upsert(array_values($vendors), ['vendor_code'], ['vendor_name', 'company_code', 'status', 'api_payload', 'synced_at', 'updated_at']);
        }
        if ($importPurchaseOrders && $purchaseOrders !== []) {
            DB::table('tbl_vendor_purchase_orders')->upsert(array_values($purchaseOrders), ['po_number', 'item_number'], ['vendor_code', 'vendor_name', 'company_code', 'material', 'plant_code', 'order_date', 'expected_delivery_date', 'order_quantity', 'order_unit', 'quantity_mt', 'received_quantity_mt', 'delivery_status', 'status', 'api_payload', 'synced_at', 'updated_at']);
        }

        return [$importPurchaseOrders ? count($purchaseOrders) : 0, $importVendors ? count($vendors) : 0, $skipped];
    }

    private function convertToMt(float $quantity, string $unit): float
    {
        return match ($unit) {
            'KG', 'KGM' => $quantity / 1000,
            'G', 'GRM' => $quantity / 1000000,
            'MT', 'MTO', 'TON', 'TO', 'T' => $quantity,
            default => 0.0,
        };
    }

    private function normalizeApiDate(mixed $value): ?string
    {
        if (blank($value)) {
            return null;
        }
        if (preg_match('/\/Date\((\d+)/', (string) $value, $matches)) {
            return CarbonImmutable::createFromTimestampMs((int) $matches[1])->toDateString();
        }

        try {
            return CarbonImmutable::parse((string) $value)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }
}
