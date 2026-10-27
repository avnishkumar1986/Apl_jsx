<?php

namespace Modules\Procurement\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VendorListController extends Controller
{
    public function index(Request $request): Response
    {
        $options = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $options, true)) {
            $perPage = (int) config('datatable.per_page');
        }

        $search = trim((string) $request->string('search'));
        $material = trim((string) $request->string('material'));
        $plantCode = trim((string) $request->string('plant_code'));
        $sortColumns = [
            'vendor' => 'po.vendor_name',
            'material' => 'po.material',
            'plant' => 'po.plant_code',
            'po_count' => 'po_count',
            'quantity' => 'total_quantity_mt',
            'last_order' => 'last_order_date',
        ];
        $sort = (string) $request->string('sort', 'vendor');
        $sort = array_key_exists($sort, $sortColumns) ? $sort : 'vendor';
        $direction = strtolower((string) $request->string('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $base = DB::table('tbl_vendor_purchase_orders as po')
            ->leftJoin('tbl_materials as material', 'material.matnr', '=', 'po.material')
            ->leftJoin('tbl_company as plant', function ($join): void {
                $join->on('plant.company_code', '=', 'po.plant_code')->where('plant.record_type', 2);
            })
            ->where('po.status', 1)
            ->whereNotNull('po.vendor_name')
            ->where('po.vendor_name', '!=', '')
            ->when($material !== '', fn ($query) => $query->where('po.material', $material))
            ->when($plantCode !== '', fn ($query) => $query->where('po.plant_code', $plantCode))
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('po.vendor_name', 'like', "%{$search}%")
                ->orWhere('po.vendor_code', 'like', "%{$search}%")
                ->orWhere('po.material', 'like', "%{$search}%")
                ->orWhere('material.maktx', 'like', "%{$search}%")
                ->orWhere('po.plant_code', 'like', "%{$search}%")
                ->orWhere('plant.company_name', 'like', "%{$search}%")))
            ->select(
                'po.vendor_code',
                'po.vendor_name',
                'po.material',
                'material.maktx as material_name',
                'material.meins',
                'po.plant_code',
                'plant.company_name as plant_name',
                DB::raw('COUNT(*) as po_count'),
                DB::raw('SUM(po.quantity_mt) as total_quantity_mt'),
                DB::raw('MAX(po.order_date) as last_order_date'),
            )
            ->groupBy('po.vendor_code', 'po.vendor_name', 'po.material', 'material.maktx', 'material.meins', 'po.plant_code', 'plant.company_name');

        return Inertia::render('modules/procurement/planning/vendor-list', [
            'vendors' => $base->orderBy($sortColumns[$sort], $direction)->paginate($perPage)->withQueryString(),
            'materials' => DB::table('tbl_vendor_purchase_orders as po')
                ->leftJoin('tbl_materials as material', 'material.matnr', '=', 'po.material')
                ->where('po.status', 1)->distinct()->orderBy('po.material')
                ->get(['po.material as code', 'material.maktx as name']),
            'plants' => DB::table('tbl_vendor_purchase_orders as po')
                ->leftJoin('tbl_company as plant', function ($join): void {
                    $join->on('plant.company_code', '=', 'po.plant_code')->where('plant.record_type', 2);
                })
                ->where('po.status', 1)->distinct()->orderBy('po.plant_code')
                ->get(['po.plant_code as code', 'plant.company_name as name']),
            'filters' => compact('search', 'material', 'plantCode', 'perPage', 'sort', 'direction'),
            'pageSizeOptions' => $options,
        ]);
    }
}
