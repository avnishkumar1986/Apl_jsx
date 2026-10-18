<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_usrdept', function (Blueprint $table): void {
            $table->unsignedBigInteger('company_id')->nullable()->index()->after('user_id');
            $table->string('sitting_location', 150)->nullable()->after('company_id');
        });

        if (Schema::hasColumn('tbl_users', 'company') && Schema::hasColumn('tbl_users', 'sitting_location')) {
            DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
                $companyId = null;
                if (filled($user->company)) {
                    $companyId = DB::table('tbl_company')
                        ->where('company_code', $user->company)
                        ->orWhere('company_name', $user->company)
                        ->value('id');
                }

                if ($companyId !== null || filled($user->sitting_location)) {
                    DB::table('tbl_usrdept')->updateOrInsert(
                        ['user_id' => (string) $user->id],
                        [
                            'company_id' => $companyId,
                            'sitting_location' => $user->sitting_location,
                            'status' => (bool) $user->status,
                            'created_by' => $user->created_by,
                            'updated_by' => $user->updated_by,
                            'created_at' => $user->created_at ?? now(),
                            'updated_at' => $user->updated_at ?? now(),
                        ],
                    );
                }
            });

            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->dropColumn(['company', 'sitting_location']);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('tbl_users', 'company')) {
            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->string('company', 150)->nullable()->after('anniversary_date');
                $table->string('sitting_location', 150)->nullable()->after('company');
            });

            DB::table('tbl_usrdept')->orderBy('id')->each(function (object $assignment): void {
                $companyName = $assignment->company_id
                    ? DB::table('tbl_company')->where('id', $assignment->company_id)->value('company_name')
                    : null;

                DB::table('tbl_users')->where('id', $assignment->user_id)->update([
                    'company' => $companyName,
                    'sitting_location' => $assignment->sitting_location,
                ]);
            });
        }

        Schema::table('tbl_usrdept', function (Blueprint $table): void {
            $table->dropIndex(['company_id']);
            $table->dropColumn(['company_id', 'sitting_location']);
        });
    }
};
