import { DataTableSortHeader } from '@/components/master/data-table-sort-header';
import ProcurementPageHeader from '@/components/procurement-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Search, ShoppingCart } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Option = { code: string; name: string | null };
type VendorRow = {
    vendor_code: string | null;
    vendor_name: string;
    material: string;
    material_name: string | null;
    meins: string | null;
    plant_code: string;
    plant_name: string | null;
    po_count: number;
    total_quantity_mt: number;
    last_order_date: string | null;
};
type Page = {
    data: VendorRow[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Filters = {
    search: string;
    material: string;
    plantCode: string;
    perPage: number;
    sort: string;
    direction: 'asc' | 'desc';
};

export default function VendorList({
    vendors,
    materials,
    plants,
    filters,
    pageSizeOptions,
}: {
    vendors: Page;
    materials: Option[];
    plants: Option[];
    filters: Filters;
    pageSizeOptions: number[];
}) {
    const [search, setSearch] = useState(filters.search);
    const [material, setMaterial] = useState(filters.material);
    const [plantCode, setPlantCode] = useState(filters.plantCode);
    const [perPage, setPerPage] = useState(String(filters.perPage));
    const load = (event?: FormEvent, sort = filters.sort, direction = filters.direction, size = perPage) => {
        event?.preventDefault();
        router.get(
            '/admin/procurement/vendor-list',
            { search: search.trim(), material, plant_code: plantCode, per_page: size, sort, direction },
            { preserveState: true, replace: true },
        );
    };
    const sortTable = (column: string) => load(undefined, column, filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc');

    return (
        <AppLayout breadcrumbs={[{ title: 'Procurement', href: '/admin/procurement' }, { title: 'Vendor List', href: '/admin/procurement/vendor-list' }]}>
            <Head title="Vendor List" />
            <div className="procurement-compact mx-auto w-full max-w-full space-y-3 p-3 sm:p-4">
                <ProcurementPageHeader title="Vendor List" subtitle="SAP vendors mapped by material and plant" icon={ShoppingCart} />
                <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <form onSubmit={load} className="grid gap-2 border-b p-3 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
                        <div className="relative">
                            <Search className="absolute top-3 left-3 size-4 text-slate-400" />
                            <Input className="pl-9" placeholder="Search vendor, material or plant..." value={search} onChange={(event) => setSearch(event.target.value)} />
                        </div>
                        <select className="h-10 rounded-md border bg-white px-3 text-sm" value={material} onChange={(event) => setMaterial(event.target.value)}>
                            <option value="">All materials</option>
                            {materials.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name || 'No description'}</option>)}
                        </select>
                        <select className="h-10 rounded-md border bg-white px-3 text-sm" value={plantCode} onChange={(event) => setPlantCode(event.target.value)}>
                            <option value="">All plants</option>
                            {plants.map((item) => <option key={item.code} value={item.code}>{item.name || item.code} · {item.code}</option>)}
                        </select>
                        <Button type="submit">Apply</Button>
                    </form>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-sm">
                            <thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-center">S.No.</th>
                                    <DataTableSortHeader label="Vendor" column="vendor" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" />
                                    <DataTableSortHeader label="Material" column="material" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" />
                                    <DataTableSortHeader label="Plant" column="plant" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" />
                                    <th className="px-4 py-3 text-center">MEINS</th>
                                    <DataTableSortHeader label="PO Count" column="po_count" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3 text-right" />
                                    <DataTableSortHeader label="Total PO (MT)" column="quantity" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3 text-right" />
                                    <DataTableSortHeader label="Last PO Date" column="last_order" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {vendors.data.map((row, index) => (
                                    <tr key={`${row.vendor_code}-${row.material}-${row.plant_code}`} className="hover:bg-cyan-50/40">
                                        <td className="px-4 py-3 text-center text-slate-500">{(vendors.from || 1) + index}</td>
                                        <td className="px-4 py-3"><b>{row.vendor_name}</b><div className="text-xs text-slate-500">{row.vendor_code || 'No vendor code'}</div></td>
                                        <td className="px-4 py-3"><b>{row.material_name || '—'}</b><div className="font-mono text-xs text-slate-500">{row.material}</div></td>
                                        <td className="px-4 py-3"><b>{row.plant_name || '—'}</b><div className="text-xs text-slate-500">{row.plant_code}</div></td>
                                        <td className="px-4 py-3 text-center font-semibold">{row.meins || '—'}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{Number(row.po_count).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{Number(row.total_quantity_mt).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                                        <td className="px-4 py-3">{row.last_order_date || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {vendors.data.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No vendor mapping found for the selected material and plant.</div>}
                    </div>
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <span>Show</span>
                            <select className="h-8 rounded-md border bg-white px-2" value={perPage} onChange={(event) => { setPerPage(event.target.value); load(undefined, filters.sort, filters.direction, event.target.value); }}>
                                {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                            <span>entries · Showing {vendors.from || 0}–{vendors.to || 0} of {vendors.total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" disabled={!vendors.prev_page_url} onClick={() => vendors.prev_page_url && router.get(vendors.prev_page_url)}>Previous</Button>
                            <span className="font-semibold">Page {vendors.current_page} of {vendors.last_page}</span>
                            <Button size="sm" variant="outline" disabled={!vendors.next_page_url} onClick={() => vendors.next_page_url && router.get(vendors.next_page_url)}>Next</Button>
                        </div>
                    </footer>
                </section>
            </div>
        </AppLayout>
    );
}
