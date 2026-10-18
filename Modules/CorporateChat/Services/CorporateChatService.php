<?php

namespace Modules\CorporateChat\Services;

use App\Contracts\ModuleServiceContract;

class CorporateChatService implements ModuleServiceContract
{
    public function metadata(): array
    {
        return [
            'key' => 'corporate-chat',
            'name' => 'Corporate Chat',
            'version' => '1.0.0',
            'description' => 'View-only corporate communication workspace.',
            'module_path' => 'Modules/CorporateChat',
            'service_class' => self::class,
            'sections' => ['Conversations'],
            'capabilities' => ['conversation interface', 'category filtering', 'responsive chat preview'],
        ];
    }

    public function health(): array
    {
        return ['status' => 'available', 'message' => 'Corporate Chat view module is available.'];
    }
}
