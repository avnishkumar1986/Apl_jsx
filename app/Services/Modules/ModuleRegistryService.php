<?php

namespace App\Services\Modules;

use App\Contracts\ModuleServiceContract;
use App\Models\ModulePackage;
use Illuminate\Support\Facades\Storage;
use Modules\CorporateChat\Services\CorporateChatService;
use Modules\Procurement\Services\ProcurementService;
use Modules\Sales\Services\SalesService;

class ModuleRegistryService
{
    /** @var array<string,class-string<ModuleServiceContract>> */
    private array $services = [
        'procurement' => ProcurementService::class,
        'sales' => SalesService::class,
        'corporate-chat' => CorporateChatService::class,
    ];

    /** @var array<string,string> */
    private array $serviceFiles = [
        'procurement' => 'Modules/Procurement/Services/ProcurementService.php',
        'sales' => 'Modules/Sales/Services/SalesService.php',
        'corporate-chat' => 'Modules/CorporateChat/Services/CorporateChatService.php',
    ];

    /** @var array<string,array{module_path:string,sections:list<string>}> */
    private array $moduleDefinitions = [
        'procurement' => [
            'module_path' => 'Modules/Procurement',
            'sections' => ['Dashboard', 'Planning / Consumption', 'Planning / Balance Sheet', 'Planning / Material Inventory'],
        ],
        'sales' => [
            'module_path' => 'Modules/Sales',
            'sections' => ['Dashboard'],
        ],
        'corporate-chat' => [
            'module_path' => 'Modules/CorporateChat',
            'sections' => ['Conversations'],
        ],
    ];

    public function isInstalled(ModulePackage $module): bool
    {
        if ($module->source !== 'service') {
            return filled($module->package_path) && Storage::disk('local')->exists($module->package_path);
        }

        $serviceFile = $this->serviceFiles[$module->slug] ?? null;

        return $serviceFile !== null && is_file(base_path($serviceFile));
    }

    public function resolve(ModulePackage $module): ?ModuleServiceContract
    {
        $class = $this->services[$module->slug] ?? null;
        $serviceFile = $this->serviceFiles[$module->slug] ?? null;

        return $class && $serviceFile && $this->isInstalled($module) && class_exists($class)
            ? app($class)
            : null;
    }

    /** @return array<string,mixed>|null */
    public function details(ModulePackage $module): ?array
    {
        $service = $this->resolve($module);

        if ($service) {
            return [...$service->metadata(), 'health' => $service->health()];
        }

        $definition = $this->moduleDefinitions[$module->slug] ?? null;
        if (! $definition) {
            return null;
        }

        $serviceClass = $this->services[$module->slug];

        return [
            ...$definition,
            'service_class' => $serviceClass,
            'capabilities' => $module->manifest['capabilities'] ?? [],
            'health' => [
                'status' => 'missing',
                'message' => "Module not present at {$definition['module_path']}.",
            ],
        ];
    }
}
