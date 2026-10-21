<?php

namespace Modules\Support\Services;

use App\Contracts\ModuleServiceContract;

class SupportService implements ModuleServiceContract
{
    public function metadata(): array
    {
        return ['key' => 'support', 'name' => 'Support Desk', 'version' => '1.0.0', 'description' => 'Internal employee support ticket and service desk module.', 'module_path' => 'Modules/Support', 'service_class' => self::class, 'sections' => ['Tickets', 'Assignments', 'History'], 'capabilities' => ['ticketing', 'assignment', 'attachments', 'audit history']];
    }

    public function health(): array
    {
        return ['status' => 'available', 'message' => 'Support Desk module is available.'];
    }
}
