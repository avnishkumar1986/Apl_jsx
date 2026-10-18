<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_usrdept', function (Blueprint $table): void {
            $table->id();
            $table->string('user_id', 10)->unique();
            $table->unsignedBigInteger('department_id')->nullable()->index();
            $table->boolean('status')->default(true)->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();
        });

        if (Schema::hasColumn('tbl_users', 'department_id')) {
            DB::table('tbl_users')
                ->whereNotNull('department_id')
                ->orderBy('id')
                ->each(function (object $user): void {
                    DB::table('tbl_usrdept')->insert([
                        'user_id' => (string) $user->id,
                        'department_id' => $user->department_id,
                        'status' => (bool) $user->status,
                        'created_by' => $user->created_by,
                        'updated_by' => $user->updated_by,
                        'created_at' => $user->created_at ?? now(),
                        'updated_at' => $user->updated_at ?? now(),
                    ]);
                });

            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->dropIndex(['department_id']);
                $table->dropColumn('department_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('tbl_users', 'department_id')) {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->unsignedBigInteger('department_id')->nullable()->index()->after('address_id');
            });

            DB::table('tbl_usrdept')->whereNotNull('department_id')->orderBy('id')->each(function (object $assignment): void {
                DB::table('tbl_users')->where('id', $assignment->user_id)->update([
                    'department_id' => $assignment->department_id,
                ]);
            });
        }

        Schema::dropIfExists('tbl_usrdept');
    }
};
