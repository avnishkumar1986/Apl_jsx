<?php

use App\Models\Material;
use App\Models\MaterialStock;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('company materials are filtered by material type and grouped by material group', function () {
    $user = User::factory()->create();
    $user->assignRole('Owner');

    Material::query()->insert([
        ['matnr' => 'APL-1', 'mtart' => 'ZRAW', 'matkl' => 'PIPE', 'maktx' => 'Apollo pipe resin', 'status' => true],
        ['matnr' => 'APL-2', 'mtart' => 'ZRAW', 'matkl' => 'PIPE', 'maktx' => 'Apollo pipe compound', 'status' => true],
        ['matnr' => 'KML-1', 'mtart' => 'YRAW', 'matkl' => 'MOULD', 'maktx' => 'Kisan moulding resin', 'status' => true],
        ['matnr' => 'OTHER-1', 'mtart' => 'FERT', 'matkl' => 'OTHER', 'maktx' => 'Unrelated material', 'status' => true],
    ]);
    MaterialStock::query()->insert([
        ['matnr' => 'APL-1', 'plant_code' => '1200', 'current_stock' => 12.5, 'stock_value' => 0, 'status' => true],
        ['matnr' => 'APL-1', 'plant_code' => '1300', 'current_stock' => 7.5, 'stock_value' => 0, 'status' => true],
        ['matnr' => 'APL-1', 'plant_code' => '5300', 'current_stock' => 99, 'stock_value' => 0, 'status' => true],
        ['matnr' => 'KML-1', 'plant_code' => '5300', 'current_stock' => 3.25, 'stock_value' => 0, 'status' => true],
    ]);

    $this->actingAs($user)
        ->get(route('admin.companies.hierarchy', ['view' => 'materials']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/companies/hierarchy')
            ->where('materialsByCompany.1000.type', 'ZRAW')
            ->where('materialsByCompany.1000.total', 2)
            ->where('materialsByCompany.1000.stock', 20)
            ->where('materialsByCompany.1000.groups.0.code', 'PIPE')
            ->where('materialsByCompany.1000.groups.0.total', 2)
            ->where('materialsByCompany.1000.groups.0.items.0.code', 'APL-2')
            ->where('materialsByCompany.1000.groups.0.items.1.code', 'APL-1')
            ->where('materialsByCompany.1000.groups.0.items.1.stock', 20)
            ->where('materialsByCompany.5000.type', 'YRAW')
            ->where('materialsByCompany.5000.total', 1)
            ->where('materialsByCompany.5000.stock', 3.25)
            ->where('materialsByCompany.5000.groups.0.code', 'MOULD')
            ->where('materialsByCompany.5000.groups.0.items.0.code', 'KML-1')
            ->where('materialsByCompany.5000.groups.0.items.0.stock', 3.25)
            ->missing('materialsByCompany.1000.groups.1')
        );
});
