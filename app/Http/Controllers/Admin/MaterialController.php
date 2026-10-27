<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ImportMaterialsFromApi;
use App\Models\ApiIntegration;
use App\Models\Material;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MaterialController extends Controller
{
    public function index(Request $r): Response
    {
        $opts = config('datatable.page_size_options');
        $pp = (int) $r->integer('per_page', config('datatable.per_page'));
        if (! in_array($pp, $opts, true)) {
            $pp = (int) config('datatable.per_page');
        }$s = trim((string) $r->string('search'));

        return Inertia::render('admin/materials/index', ['materials' => Material::query()->when($s !== '', fn ($q) => $q->where(fn ($q) => $q->where('matnr', 'like', "%{$s}%")->orWhere('maktx', 'like', "%{$s}%")->orWhere('mtart', 'like', "%{$s}%")->orWhere('matkl', 'like', "%{$s}%")))->orderBy('maktx')->paginate($pp)->withQueryString(), 'filters' => ['search' => $s, 'per_page' => $pp], 'pageSizeOptions' => $opts, 'stats' => ['total' => Material::count(), 'active' => Material::where('status', true)->count()], 'canManage' => $r->user()?->can('procurement.inventory.materials.manage') ?? false]);
    }

    public function store(Request $r): RedirectResponse
    {
        Material::create($this->validated($r));

        return back()->with('success', 'Material created.');
    }

    public function update(Request $r, Material $material): RedirectResponse
    {
        $material->update($this->validated($r, $material));

        return back()->with('success', 'Material updated.');
    }

    public function toggleStatus(Request $r, Material $material): RedirectResponse
    {
        $material->update(['status' => $r->boolean('active')]);

        return back()->with('success', 'Material status updated.');
    }

    public function bulkAction(Request $r): RedirectResponse
    {
        $data = $r->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer', 'exists:tbl_materials,id'], 'action' => ['required', Rule::in(['activate', 'deactivate', 'delete'])]]);
        $query = Material::whereIn('id', $data['ids']);
        if ($data['action'] === 'delete') {
            $count = $query->delete();

            return back()->with('success', "{$count} materials deleted.");
        }$active = $data['action'] === 'activate';
        $count = $query->update(['status' => $active]);

        return back()->with('success', "{$count} materials ".($active ? 'activated.' : 'deactivated.'));
    }

    public function destroy(Material $material): RedirectResponse
    {
        $material->delete();

        return back()->with('success', 'Material deleted.');
    }

    public function import(Request $r): RedirectResponse
    {
        $file = $r->validate(['file' => ['required', 'file', 'mimes:xlsx,csv,txt', 'max:20480']])['file'];
        $rows = $this->rows($file);
        $created = 0;
        $updated = 0;
        $failed = 0;
        foreach ($rows as $row) {
            $matnr = trim((string) ($row['matnr'] ?? ''));
            $maktx = trim((string) ($row['maktx'] ?? ''));
            if ($matnr === '' || $maktx === '') {
                $failed++;

                continue;
            }$material = Material::where('matnr', $matnr)->first();
            $values = ['mtart' => $row['mtart'] ?? null, 'matkl' => $row['matkl'] ?? null, 'meins' => $row['meins'] ?? null, 'maktx' => $maktx, 'api_payload' => $row, 'status' => ! isset($row['status']) || ! in_array(strtolower((string) $row['status']), ['0', 'inactive', 'false'], true), 'imported_by' => $r->user()?->id];
            if ($material) {
                $material->update($values);
                $updated++;
            } else {
                Material::create(['matnr' => $matnr, ...$values]);
                $created++;
            }
        }

return back()->with('success', "{$created} materials created, {$updated} updated, {$failed} invalid rows skipped.");
    }

    public function queueApiImport(Request $request): RedirectResponse
    {
        $api = ApiIntegration::where('code', 'material')->where('status', true)->first();
        if (! $api) {
            return back()->withErrors(['api' => 'Active Material API configuration not found.']);
        }
        $runLog = $api->logs()->create([
            'run_id' => (string) \Illuminate\Support\Str::uuid(),
            'status' => 'running',
            'attempt' => 1,
            'message' => 'API run queued.',
            'created_by' => $request->user()?->id,
            'created_at' => now(),
        ]);
        try {
            ImportMaterialsFromApi::dispatch($api->id, $request->user()?->id, null, $runLog->id);
            $api->update(['last_run_status' => 'running', 'last_run_at' => now()]);
        } catch (\Throwable $exception) {
            $runLog->update(['status' => 'failed', 'message' => $exception->getMessage()]);
            $api->update(['last_run_status' => 'failed', 'last_run_at' => now()]);
            throw $exception;
        }

        return back()->with('success', 'Material API import queued. It will continue in the background.');
    }

    public function template(): StreamedResponse
    {
        $headers = ['matnr', 'mtart', 'matkl', 'meins', 'maktx', 'status'];
        $example = ['MAT0001', 'ROH', 'RAW', 'KG', 'Example material', '1'];

        return response()->streamDownload(function () use ($headers, $example) {
            $o = fopen('php://output', 'wb');
            fwrite($o, "\xEF\xBB\xBF");
            fputcsv($o, $headers);
            fputcsv($o, $example);
            fclose($o);
        }, 'material-import-template.csv', ['Content-Type' => 'text/csv']);
    }

    private function validated(Request $r, ?Material $m = null): array
    {
        return $r->validate(['matnr' => ['required', 'string', 'max:40', Rule::unique('tbl_materials', 'matnr')->ignore($m?->id)], 'mtart' => ['nullable', 'string', 'max:20'], 'matkl' => ['nullable', 'string', 'max:40'], 'meins' => ['nullable', 'string', 'max:10'], 'maktx' => ['required', 'string', 'max:255'], 'status' => ['required', 'boolean']]);
    }

    /** @return array<int,array<string,string>> */
    private function rows(UploadedFile $f): array
    {
        if (strtolower($f->getClientOriginalExtension()) !== 'xlsx') {
            $h = fopen($f->getRealPath(), 'rb');
            $raw = [];
            while (($r = fgetcsv($h)) !== false) {
                $raw[] = $r;
            }fclose($h);
        } else {
            $z = new \ZipArchive;
            if ($z->open($f->getRealPath()) !== true) {
                throw ValidationException::withMessages(['file' => 'Unable to read Excel file.']);
            }$shared = [];
            if (($x = $z->getFromName('xl/sharedStrings.xml')) !== false) {
                $sx = simplexml_load_string($x);
                foreach ($sx->si as $i) {
                    $shared[] = (string) ($i->t ?? $i->r->t);
                }
            }$x = $z->getFromName('xl/worksheets/sheet1.xml');
            $z->close();
            if ($x === false) {
                throw ValidationException::withMessages(['file' => 'First worksheet not found.']);
            }$sx = simplexml_load_string($x);
            $raw = [];
            foreach ($sx->sheetData->row as $r) {
                $v = [];
                foreach ($r->c as $c) {
                    preg_match('/([A-Z]+)/', (string) $c['r'], $m);
                    $col = 0;
                    foreach (str_split($m[1] ?? 'A') as $l) {
                        $col = $col * 26 + ord($l) - 64;
                    }$val = (string) $c->v;
                    if ((string) $c['t'] === 's') {
                        $val = $shared[(int) $val] ?? '';
                    } elseif ((string) $c['t'] === 'inlineStr') {
                        $val = (string) $c->is->t;
                    }$v[$col - 1] = $val;
                }if ($v !== []) {
                    ksort($v);
                    $raw[] = array_values($v);
                }
            }
        }if (count($raw) < 2) {
            return [];
        }$headers = array_map(fn ($h) => Str::of((string) $h)->trim()->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->value(), array_shift($raw));

        return array_values(array_map(function ($r) use ($headers) {
            $r = array_pad($r,count($headers),'');

            return array_combine($headers,array_slice($r,0,count($headers)));
        }, $raw));
    }
}
