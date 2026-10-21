<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_support_categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 30)->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('department_id')->nullable()->index();
            $table->string('default_assignee_id', 20)->nullable()->index();
            $table->unsignedSmallInteger('sla_hours')->nullable();
            $table->boolean('status')->default(true)->index();
            $table->string('created_by', 20)->nullable();
            $table->string('updated_by', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('tbl_support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->string('ticket_number', 30)->nullable()->unique();
            $table->string('subject', 255);
            $table->longText('description');
            $table->unsignedBigInteger('category_id')->index();
            $table->string('raised_by', 20)->index();
            $table->string('assigned_to', 20)->nullable()->index();
            $table->string('assigned_by', 20)->nullable();
            $table->unsignedBigInteger('company_id')->nullable()->index();
            $table->unsignedBigInteger('department_id')->nullable()->index();
            $table->string('location', 150)->nullable();
            $table->string('priority', 20)->default('medium')->index();
            $table->string('ticket_status', 30)->default('open')->index();
            $table->string('source', 20)->default('portal');
            $table->timestamp('due_at')->nullable()->index();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->text('resolution_summary')->nullable();
            $table->boolean('record_status')->default(true)->index();
            $table->string('created_by', 20)->nullable();
            $table->string('updated_by', 20)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['assigned_to', 'ticket_status']);
            $table->index(['raised_by', 'ticket_status']);
            $table->index(['ticket_status', 'priority', 'created_at'], 'support_queue_index');
        });

        Schema::create('tbl_support_messages', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('ticket_id')->index();
            $table->string('user_id', 20)->index();
            $table->longText('message');
            $table->string('message_type', 20)->default('reply');
            $table->boolean('is_internal')->default(false)->index();
            $table->boolean('record_status')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('tbl_support_attachments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('ticket_id')->index();
            $table->unsignedBigInteger('message_id')->nullable()->index();
            $table->string('uploaded_by', 20)->index();
            $table->string('original_name', 255);
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->boolean('record_status')->default(true);
            $table->timestamps();
        });

        Schema::create('tbl_support_ticket_history', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('ticket_id')->index();
            $table->string('action', 50)->index();
            $table->string('field_name', 100)->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('remarks')->nullable();
            $table->string('changed_by', 20)->index();
            $table->timestamp('created_at')->useCurrent();
        });

        $now = now();
        foreach ([
            ['IT Support', 'IT_SUPPORT', 'Laptop, software, email, network and access issues', 24],
            ['Application Support', 'APPLICATION', 'APL Connect and business application issues', 12],
            ['HR Support', 'HR_SUPPORT', 'Employee records, attendance and HR requests', 48],
            ['Procurement Support', 'PROCUREMENT', 'Procurement planning and material issues', 24],
            ['Other', 'OTHER', 'Requests that do not match another category', 48],
        ] as [$name, $code, $description, $slaHours]) {
            DB::table('tbl_support_categories')->insert([
                'name' => $name,
                'code' => $code,
                'description' => $description,
                'sla_hours' => $slaHours,
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        DB::table('tbl_modules')->updateOrInsert(['slug' => 'support'], [
            'name' => 'Support Desk',
            'description' => 'Internal employee support ticket and service desk module.',
            'version' => '1.0.0',
            'source' => 'service',
            'package_path' => 'Modules/Support',
            'original_filename' => 'SupportService.php',
            'mime_type' => 'text/x-php',
            'file_size' => 0,
            'checksum_sha256' => hash('sha256', 'Modules\\Support\\Services\\SupportService'),
            'manifest' => json_encode(['service_class' => 'Modules\\Support\\Services\\SupportService', 'module_path' => 'Modules/Support', 'capabilities' => ['ticketing', 'assignment', 'attachments', 'audit history']]),
            'status' => true,
            'uploaded_by' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach (['support.view-all', 'support.manage', 'support.internal-notes', 'support.reports'] as $permission) {
            DB::table('tbl_permissions')->updateOrInsert(
                ['name' => $permission, 'guard_name' => 'web'],
                ['status' => true, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $superAdmin = DB::table('tbl_roles')->where('name', 'Super Admin')->where('guard_name', 'web')->first();
        if ($superAdmin) {
            $permissionIds = DB::table('tbl_permissions')->whereIn('name', ['support.view-all', 'support.manage', 'support.internal-notes', 'support.reports'])->pluck('id');
            foreach ($permissionIds as $permissionId) {
                DB::table('tbl_role_has_permissions')->updateOrInsert(
                    ['permission_id' => $permissionId, 'role_id' => $superAdmin->id],
                    ['status' => true],
                );
            }
        }
    }

    public function down(): void
    {
        DB::table('tbl_modules')->where('slug', 'support')->delete();
        DB::table('tbl_permissions')->whereIn('name', ['support.view-all', 'support.manage', 'support.internal-notes', 'support.reports'])->delete();
        Schema::dropIfExists('tbl_support_ticket_history');
        Schema::dropIfExists('tbl_support_attachments');
        Schema::dropIfExists('tbl_support_messages');
        Schema::dropIfExists('tbl_support_tickets');
        Schema::dropIfExists('tbl_support_categories');
    }
};
