<?php

use App\Jobs\ImportMaterialsFromApi;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Schema::dropIfExists('tbl_material_stocks');
    Schema::create('tbl_material_stocks', function (Blueprint $table): void {
        $table->id();
        $table->string('matnr', 50);
        $table->string('plant_code', 20);
        $table->string('material_desc')->nullable();
        $table->decimal('current_stock', 20, 3)->default(0);
        $table->decimal('stock_value', 20, 3)->default(0);
        $table->decimal('auto_perday_consumption', 20, 3)->default(0);
        $table->boolean('status')->default(true);
        $table->timestamp('synced_at')->nullable();
        $table->timestamps();
        $table->unique(['matnr', 'plant_code']);
    });
});

test('RM consumption API stores the average of current and prior consumption values', function () {
    Carbon::setTestNow('2026-10-24 12:00:00');
    $job = new ImportMaterialsFromApi(apiId: 1);
    $method = new ReflectionMethod($job, 'importStock');

    $result = $method->invoke($job, [
        [
            'MATNR' => 'MAT-100',
            'WERKS' => '1200',
            'LABST' => '450.500',
            'M_CONSUMP' => '18139.000',
            'L_CONSUMP' => '52993.000',
            'LL_CONSUMP' => '30651.000',
        ],
        [
            'MATNR' => 'MAT-100',
            'WERKS' => '1300',
            'LABST' => '200',
            'M_CONSUMP' => '600',
            'L_CONSUMP' => '300',
            'LL_CONSUMP' => '0',
        ],
    ], true);

    $stock = DB::table('tbl_material_stocks')
        ->where('matnr', 'MAT-100')
        ->where('plant_code', '1200')
        ->first();

    $otherPlantStock = DB::table('tbl_material_stocks')
        ->where('matnr', 'MAT-100')
        ->where('plant_code', '1300')
        ->first();

    expect($result)->toBe([2, 0])
        ->and((float) $stock->auto_perday_consumption)->toBe(33927.667)
        ->and((float) $otherPlantStock->auto_perday_consumption)->toBe(300.0);
});
