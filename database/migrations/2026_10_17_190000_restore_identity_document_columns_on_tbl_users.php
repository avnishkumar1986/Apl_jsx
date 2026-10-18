<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tbl_users', 'aadhaar_number')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('aadhaar_number', 12)->nullable()->unique()->after('anniversary_date');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'aadhaar_image')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('aadhaar_image')->nullable()->after('aadhaar_number');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'pan_number')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('pan_number', 10)->nullable()->unique()->after('aadhaar_image');
            });
        }

        if (! Schema::hasColumn('tbl_users', 'pan_image')) {
            Schema::table('tbl_users', function (Blueprint $table) {
                $table->string('pan_image')->nullable()->after('pan_number');
            });
        }
    }

    public function down(): void
    {
        $columns = collect(['aadhaar_number', 'aadhaar_image', 'pan_number', 'pan_image'])
            ->filter(fn (string $column) => Schema::hasColumn('tbl_users', $column))
            ->all();

        if ($columns !== []) {
            Schema::table('tbl_users', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
