<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_usrdocument', function (Blueprint $table): void {
            $table->string('file_path', 2048)->nullable()->change();
        });

        if (Schema::hasColumn('tbl_users', 'aadhaar_number')) {
            DB::table('tbl_users')->orderBy('id')->each(function (object $user): void {
                foreach ([
                    'aadhaar' => ['number' => $user->aadhaar_number, 'file' => $user->aadhaar_image],
                    'pan' => ['number' => $user->pan_number, 'file' => $user->pan_image],
                ] as $type => $document) {
                    if (blank($document['number']) && blank($document['file'])) {
                        continue;
                    }

                    DB::table('tbl_usrdocument')->updateOrInsert(
                        ['user_id' => $user->unique_id, 'document_type' => $type],
                        [
                            'document_number' => $document['number'],
                            'document_name' => strtoupper($type),
                            'file_path' => $document['file'],
                            'status' => 'active',
                            'updated_at' => now(),
                            'created_at' => now(),
                        ],
                    );
                }
            });

            Schema::table('tbl_users', function (Blueprint $table): void {
                $table->dropUnique('tbl_users_aadhaar_number_unique');
                $table->dropUnique('tbl_users_pan_number_unique');
                $table->dropColumn(['aadhaar_number', 'aadhaar_image', 'pan_number', 'pan_image']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('tbl_users', function (Blueprint $table): void {
            $table->string('aadhaar_number', 12)->nullable()->unique()->after('anniversary_date');
            $table->string('aadhaar_image')->nullable()->after('aadhaar_number');
            $table->string('pan_number', 10)->nullable()->unique()->after('aadhaar_image');
            $table->string('pan_image')->nullable()->after('pan_number');
        });

        DB::table('tbl_usrdocument')->whereIn('document_type', ['aadhaar', 'pan'])->orderBy('id')->each(function (object $document): void {
            DB::table('tbl_users')->where('unique_id', $document->user_id)->update([
                $document->document_type.'_number' => $document->document_number,
                $document->document_type.'_image' => $document->file_path,
            ]);
        });
    }
};
