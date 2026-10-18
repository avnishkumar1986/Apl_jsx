<?php

namespace Modules\Procurement\Services;

use App\Contracts\ModuleServiceContract;

class ProcurementService implements ModuleServiceContract
{
    public function metadata(): array
    {
        return [
            'key' => 'procurement',
            'name' => 'Procurement',
            'version' => '1.0.0',
            'description' => 'Procurement operations and supplier workflow service.',
            'module_path' => 'Modules/Procurement',
            'service_class' => self::class,
            'sections' => ['Dashboard', 'Planning / Consumption', 'Planning / Balance Sheet', 'Planning / Material Inventory'],
            'capabilities' => ['purchase requisitions', 'purchase orders', 'vendors', 'material receipts'],
        ];
    }

    public function health(): array
    {
        return ['status' => 'available', 'message' => 'Procurement service is available.'];
    }
}
