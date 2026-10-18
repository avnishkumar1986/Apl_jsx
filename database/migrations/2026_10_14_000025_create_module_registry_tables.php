<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_modules', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->string('version', 40)->default('1.0.0');
            $table->string('source', 30)->default('upload');
            $table->string('package_path', 500);
            $table->string('original_filename', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('checksum_sha256', 64);
            $table->json('manifest')->nullable();
            $table->boolean('status')->default(true)->index();
            $table->unsignedBigInteger('uploaded_by')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('tbl_module_uploads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id')->index();
            $table->string('version', 40);
            $table->string('package_path', 500);
            $table->string('original_filename', 255);
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('checksum_sha256', 64);
            $table->unsignedBigInteger('uploaded_by')->nullable()->index();
            $table->timestamp('uploaded_at');
            $table->timestamps();
            $table->unique(['module_id', 'version'], 'module_upload_version_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_module_uploads');
        Schema::dropIfExists('tbl_modules');
    }
};
