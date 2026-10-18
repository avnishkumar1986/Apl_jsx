<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tbl_modules')->updateOrInsert(
            ['slug' => 'corporate-chat'],
            [
                'name' => 'Corporate Chat',
                'description' => 'View-only corporate communication workspace.',
                'version' => '1.0.0',
                'source' => 'service',
                'package_path' => 'Modules/CorporateChat',
                'original_filename' => 'CorporateChatService.php',
                'mime_type' => 'text/x-php',
                'file_size' => 0,
                'checksum_sha256' => hash('sha256', 'Modules\\CorporateChat\\Services\\CorporateChatService'),
                'manifest' => json_encode([
                    'service_class' => 'Modules\\CorporateChat\\Services\\CorporateChatService',
                    'module_path' => 'Modules/CorporateChat',
                    'capabilities' => ['conversation interface', 'category filtering', 'responsive chat preview'],
                ]),
                'status' => true,
                'uploaded_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('tbl_modules')->where('slug', 'corporate-chat')->delete();
    }
};
