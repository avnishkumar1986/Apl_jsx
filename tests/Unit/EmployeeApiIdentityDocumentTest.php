<?php

use App\Jobs\ImportMaterialsFromApi;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Schema::dropIfExists('tbl_usrdocument');
    Schema::create('tbl_usrdocument', function (Blueprint $table): void {
        $table->id();
        $table->string('user_type', 10)->nullable();
        $table->string('user_id', 30);
        $table->string('document_type', 50);
        $table->string('document_number', 100)->nullable();
        $table->string('document_name');
        $table->string('file_path', 2048)->nullable();
        $table->boolean('status')->default(true);
        $table->unsignedBigInteger('created_by')->nullable();
        $table->unsignedBigInteger('updated_by')->nullable();
        $table->timestamps();
    });
});

test('employee API identity numbers are stored as user documents', function () {
    $job = new ImportMaterialsFromApi(apiId: 1, requestedBy: null);
    $method = new ReflectionMethod($job, 'syncEmployeeIdentityDocuments');

    $method->invoke($job, [
        'aadhaarno' => '1234 5678-9012',
        'pancardnumber' => 'abcde 1234 f',
    ], 'EMP0001', 'USR6', now());

    expect(DB::table('tbl_usrdocument')
        ->where('user_id', 'EMP0001')
        ->where('document_type', 'aadhaar')
        ->value('document_number'))->toBe('123456789012')
        ->and(DB::table('tbl_usrdocument')
            ->where('user_id', 'EMP0001')
            ->where('document_type', 'pan')
            ->value('document_number'))->toBe('ABCDE1234F');
});

test('an employee API update preserves a document when its number is omitted', function () {
    DB::table('tbl_usrdocument')->insert([
        'user_type' => 'USR6',
        'user_id' => 'EMP0002',
        'document_type' => 'aadhaar',
        'document_number' => '111122223333',
        'document_name' => 'AADHAAR',
        'status' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $job = new ImportMaterialsFromApi(apiId: 1, requestedBy: null);
    $method = new ReflectionMethod($job, 'syncEmployeeIdentityDocuments');
    $method->invoke($job, ['panno' => 'AAAAA1111A'], 'EMP0002', 'USR6', now());

    expect(DB::table('tbl_usrdocument')
        ->where('user_id', 'EMP0002')
        ->where('document_type', 'aadhaar')
        ->value('document_number'))->toBe('111122223333');
});
