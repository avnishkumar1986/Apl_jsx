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
        Schema::create('tbl_email', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('tbl_users')->cascadeOnDelete();
            $table->string('email_type', 30)->default('primary');
            $table->string('email_address')->unique();
            $table->timestamp('verified_at')->nullable();
            $table->boolean('is_primary')->default(false)->index();
            $table->string('status', 20)->default('active')->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();
        });

        DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
            DB::table('tbl_email')->insert([
                'user_id' => $user->id,
                'email_type' => 'primary',
                'email_address' => $user->email,
                'verified_at' => $user->email_verified_at,
                'is_primary' => true,
                'status' => $user->status,
                'created_by' => $user->created_by,
                'updated_by' => $user->updated_by,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_email');
    }
};
