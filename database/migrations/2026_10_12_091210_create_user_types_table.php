<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbl_usertype', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();
        });

        $defaultTypeId = DB::table('tbl_usertype')->insertGetId([
            'name' => 'Standard User',
            'description' => 'Default application user type',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('tbl_users', function (Blueprint $table) {
            $table->foreignId('user_type_id')->nullable()->after('id')->constrained('tbl_usertype')->nullOnDelete();
        });

        DB::table('tbl_users')->whereNull('user_type_id')->update(['user_type_id' => $defaultTypeId]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_type_id');
        });

        Schema::dropIfExists('tbl_usertype');
    }
};
