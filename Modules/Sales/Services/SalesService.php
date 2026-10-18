<?php

namespace Modules\Sales\Services;

use App\Contracts\ModuleServiceContract;

class SalesService implements ModuleServiceContract
{
    public function metadata(): array
    {
        return [
            'key' => 'sales',
            'name' => 'Sales',
            'version' => '1.0.0',
            'description' => 'Sales operations and customer order workflow service.',
            'module_path' => 'Modules/Sales',
            'service_class' => self::class,
            'sections' => ['Dashboard'],
            'capabilities' => ['sales enquiries', 'quotations', 'sales orders', 'dispatch tracking'],
        ];
    }

    public function health(): array
    {
        return ['status' => 'available', 'message' => 'Sales service is available.'];
    }
}
