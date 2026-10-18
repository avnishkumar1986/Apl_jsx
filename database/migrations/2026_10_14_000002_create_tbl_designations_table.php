<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tbl_designations')) {
            Schema::create('tbl_designations', function (Blueprint $table): void {
                $table->id();
                $table->unsignedInteger('des_id')->unique();
                $table->string('designation_name', 100)->unique();
                $table->unsignedBigInteger('designation_level_id')->index();
                $table->unsignedBigInteger('reports_to_designation_id')->nullable()->index();
                $table->string('reporting_to', 100)->nullable();
                $table->unsignedBigInteger('department_id')->nullable()->index();
                $table->string('department', 100)->nullable();
                $table->string('sitting_place', 100)->nullable();
                $table->boolean('status')->default(true)->index();
                $table->timestamps();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->unsignedBigInteger('updated_by')->nullable()->index();
            });
        }

        $rows = [
            [10, 'Chairman Managing Dr', 6, null], [11, 'Associate VP', 6, null], [12, 'Joint Managing Dir.', 6, null],
            [20, 'Sr. General Manager', 5, 2], [29, 'Asst General Manager', 4, 6], [30, 'General Manager', 5, 2],
            [31, 'Dy. General Manager', 4, 6], [32, 'Regional Sales Mgr.', 4, 6], [33, 'Dy. RSM', 3, 7],
            [40, 'Sr. Manager', 3, 7], [50, 'Manager', 3, 25], [51, 'Area sales manager', 3, 7],
            [60, 'Dy. Manager', 2, 11], [70, 'Assistant Manager', 2, 25], [80, 'Sr. Executive', 1, 14],
            [90, 'Executive', 1, 14], [91, 'Sr. Officer', 1, 14], [92, 'Officer', 1, 14],
            [93, 'Sales Co-Ordinator', 1, 14], [94, 'Engineer', 1, 14], [95, 'Business Head', 5, 2],
            [96, 'Supervisor', 1, 14], [97, 'Technician', 1, 14], [98, 'Operator', 1, 14], [99, 'HOD', 5, 2],
        ];
        $now = now();
        foreach ($rows as [$code, $name, $level, $reportsTo]) {
            $existing = DB::table('tbl_designations')->where('des_id', $code)->exists();
            $values = ['designation_name' => $name, 'designation_level_id' => $level, 'reports_to_designation_id' => $reportsTo, 'status' => true, 'updated_at' => $now];
            if ($existing) {
                DB::table('tbl_designations')->where('des_id', $code)->update($values);
            } else {
                DB::table('tbl_designations')->insert(['des_id' => $code, ...$values, 'created_at' => $now]);
            }
        }
    }

    public function down(): void
    {
        // Preserve an existing business master table when rolling back.
    }
};
