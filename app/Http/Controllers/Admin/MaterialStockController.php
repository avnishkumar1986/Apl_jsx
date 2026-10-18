<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaterialStock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MaterialStockController extends Controller
{
    public function index(Request $request): Response
    {
        $options = config('datatable.page_size_options');
        $perPage = (int) $request->integer('per_page', config('datatable.per_page'));
        if (! in_array($perPage, $options, true)) {
            $perPage = (int) config('datatable.per_page');
        }
        $search = trim((string) $request->string('search'));

        return Inertia::render('admin/material-stocks/index', [
            'stocks' => MaterialStock::query()
                ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                    ->where('matnr', 'like', "{$search}%")
                    ->orWhere('plant_code', 'like', "{$search}%")
                    ->orWhere('material_desc', 'like', "{$search}%")))
                ->orderBy('matnr')->orderBy('plant_code')->paginate($perPage)->withQueryString(),
            'filters' => ['search' => $search, 'per_page' => $perPage],
            'pageSizeOptions' => $options,
            'stats' => ['total' => MaterialStock::count(), 'active' => MaterialStock::where('status', true)->count()],
            'canManage' => $request->user()?->can('procurement.inventory.material_stock.manage') ?? false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        MaterialStock::create($this->validated($request));

        return back()->with('success', 'Material stock created.');
    }

    public function update(Request $request, MaterialStock $materialStock): RedirectResponse
    {
        $materialStock->update($this->validated($request, $materialStock));

        return back()->with('success', 'Material stock updated.');
    }

    public function toggleStatus(Request $request, MaterialStock $materialStock): RedirectResponse
    {
        $materialStock->update(['status' => $request->boolean('active')]);

        return back()->with('success', 'Material stock status updated.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer', 'exists:tbl_material_stocks,id'], 'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])]]);
        $query = MaterialStock::whereIn('id', $data['ids']);
        if ($data['action'] === 'delete') {
            return back()->with('success', $query->delete().' stock rows deleted.');
        }
        $count = $query->update(['status' => $data['action'] === 'activate']);

        return back()->with('success', "{$count} stock rows updated.");
    }

    public function destroy(MaterialStock $materialStock): RedirectResponse
    {
        $materialStock->delete();

        return back()->with('success', 'Material stock deleted.');
    }

    private function validated(Request $request, ?MaterialStock $stock = null): array
    {
        return $request->validate([
            'matnr' => ['required', 'string', 'max:50', Rule::unique('tbl_material_stocks', 'matnr')->where(fn ($query) => $query->where('plant_code', $request->input('plant_code')))->ignore($stock?->id)],
            'plant_code' => ['required', 'string', 'max:20'],
            'material_desc' => ['nullable', 'string', 'max:255'],
            'current_stock' => ['required', 'numeric'],
            'stock_value' => ['required', 'numeric'],
            'status' => ['required', 'boolean'],
        ]);
    }
}
