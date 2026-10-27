<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_api_integrations')->where('code', 'vendor')->update([
            'target_table' => json_encode(['tbl_vendors', 'tbl_vendor_purchase_orders']),
            'updated_at' => now(),
        ]);

        DB::table('tbl_vendors')->whereNotNull('api_payload')->orderBy('id')->chunkById(200, function ($vendors): void {
            $rows = [];

            foreach ($vendors as $vendor) {
                $payload = json_decode((string) $vendor->api_payload, true);
                if (! is_array($payload)) {
                    continue;
                }

                $data = array_change_key_case($payload, CASE_LOWER);
                $poNumber = trim((string) ($data['purchaseorder'] ?? ''));
                $itemNumber = trim((string) ($data['purchaseorderitem'] ?? '00010')) ?: '00010';
                $material = trim((string) ($data['material'] ?? ''));
                $plantCode = trim((string) ($data['plant'] ?? ''));
                if ($poNumber === '' || $material === '' || $plantCode === '') {
                    continue;
                }

                $unit = strtoupper(trim((string) ($data['orderunit'] ?? 'MT')));
                $orderQuantity = (float) ($data['quantity'] ?? 0);
                $quantityMt = isset($data['mtquantity'])
                    ? (float) $data['mtquantity']
                    : match ($unit) {
                        'KG', 'KGM' => $orderQuantity / 1000,
                        'G', 'GRM' => $orderQuantity / 1000000,
                        'MT', 'MTO', 'TON', 'TO', 'T' => $orderQuantity,
                        default => 0,
                    };
                $received = (float) ($data['grn'] ?? 0);
                $pending = (float) ($data['pendingqty'] ?? max($orderQuantity - $received, 0));
                $deliveryDate = $this->date($data['deliverydate'] ?? null);
                $now = now();

                $rows[] = [
                    'po_number' => $poNumber,
                    'item_number' => $itemNumber,
                    'vendor_code' => trim((string) ($data['supplier'] ?? $vendor->vendor_code ?? '')) ?: null,
                    'vendor_name' => trim((string) ($data['suppliername'] ?? $vendor->vendor_name ?? '')) ?: null,
                    'company_code' => trim((string) ($data['companycode'] ?? $vendor->company_code ?? '')) ?: null,
                    'material' => $material,
                    'plant_code' => $plantCode,
                    'order_date' => null,
                    'expected_delivery_date' => $deliveryDate,
                    'order_quantity' => $orderQuantity,
                    'order_unit' => $unit ?: null,
                    'quantity_mt' => $quantityMt,
                    'received_quantity_mt' => $unit === 'KG' || $unit === 'KGM' ? $received / 1000 : $received,
                    'rate' => (float) ($data['poprice'] ?? 0),
                    'amount' => 0,
                    'currency' => null,
                    'delivery_status' => $pending <= 0 ? 'received' : ($received > 0 ? 'partially_received' : 'planned'),
                    'status' => true,
                    'api_payload' => json_encode($payload),
                    'synced_at' => $vendor->synced_at ?? $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if ($rows !== []) {
                DB::table('tbl_vendor_purchase_orders')->upsert(
                    $rows,
                    ['po_number', 'item_number'],
                    ['vendor_code', 'vendor_name', 'company_code', 'material', 'plant_code', 'expected_delivery_date', 'order_quantity', 'order_unit', 'quantity_mt', 'received_quantity_mt', 'rate', 'delivery_status', 'status', 'api_payload', 'synced_at', 'updated_at'],
                );
            }
        });
    }

    public function down(): void
    {
        DB::table('tbl_api_integrations')->where('code', 'vendor')->update([
            'target_table' => json_encode(['tbl_vendors']),
            'updated_at' => now(),
        ]);
    }

    private function date(mixed $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        if (preg_match('/Date\((\d+)/', (string) $value, $matches)) {
            return CarbonImmutable::createFromTimestampMs((int) $matches[1])->toDateString();
        }

        try {
            return CarbonImmutable::parse((string) $value)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }
};
