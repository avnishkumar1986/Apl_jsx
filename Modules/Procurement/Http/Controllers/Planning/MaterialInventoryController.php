<?php

namespace Modules\Procurement\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MaterialInventoryController extends Controller
{
    public function inventory(Request $request): Response
    {
        $options = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $options, true)) {
            $perPage = (int) config('datatable.per_page');
        }
        $search = trim((string) $request->string('search'));
        $sortColumns = [
            'material' => 'maktx',
            'type' => 'mtart',
            'group' => 'matkl',
            'unit' => 'meins',
            'plant' => 'plant_name',
            'current_stock' => 'current_stock',
            'stock_value' => 'stock_value',
            'status' => 'status',
        ];
        $sort = (string) $request->string('sort', 'material');
        $sort = array_key_exists($sort, $sortColumns) ? $sort : 'material';
        $direction = strtolower((string) $request->string('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        return Inertia::render('modules/procurement/planning/material-inventory', [
            'inventory' => DB::table('vw_material_inventory')
                ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                    ->where('matnr', 'like', "%{$search}%")
                    ->orWhere('maktx', 'like', "%{$search}%")
                    ->orWhere('mtart', 'like', "%{$search}%")
                    ->orWhere('matkl', 'like', "%{$search}%")
                    ->orWhere('plant_code', 'like', "%{$search}%")
                    ->orWhere('plant_name', 'like', "%{$search}%")))
                ->orderBy($sortColumns[$sort], $direction)
                ->orderBy('plant_name')
                ->paginate($perPage)
                ->withQueryString(),
            'filters' => ['search' => $search, 'per_page' => $perPage, 'sort' => $sort, 'direction' => $direction],
            'pageSizeOptions' => $options,
        ]);
    }
}
