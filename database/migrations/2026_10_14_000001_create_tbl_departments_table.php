<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_departments')) {
            Schema::create('tbl_departments', function (Blueprint $table): void {
                $table->id();
                $table->string('department_code', 20)->unique();
                $table->string('department_name', 100)->unique();
                $table->string('description', 255)->nullable();
                $table->boolean('status')->default(true)->index();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->timestamps();
                $table->unsignedBigInteger('updated_by')->nullable()->index();
            });
        }

        $now = now();
        $departments = [
            ['HR', 'Human Resources', 'Employee relations and workforce administration'],
            ['FIN', 'Finance and Accounts', 'Finance, accounting and statutory reporting'],
            ['IT', 'Information Technology', 'Business applications and technology support'],
            ['SALES', 'Sales and Marketing', 'Sales operations and market development'],
            ['PROC', 'Procurement', 'Purchasing and vendor management'],
            ['PROD', 'Production', 'Plant production and manufacturing operations'],
            ['QA', 'Quality Assurance', 'Product quality and compliance'],
            ['SCM', 'Supply Chain Management', 'Planning, logistics and inventory operations'],
            ['ADMIN', 'Administration', 'Corporate and facility administration'],
            ['LEGAL', 'Legal and Compliance', 'Legal affairs and regulatory compliance'],
        ];

        foreach ($departments as [$code, $name, $description]) {
            $existing = DB::table('tbl_departments')->where('department_code', $code)->exists();
            $values = [
                'department_name' => $name,
                'description' => $description,
                'status' => true,
                'updated_at' => $now,
            ];

            if ($existing) {
                DB::table('tbl_departments')->where('department_code', $code)->update($values);
            } else {
                DB::table('tbl_departments')->insert([
                    'department_code' => $code,
                    ...$values,
                    'created_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        // Preserve an existing business master table when rolling back.
    }
};
