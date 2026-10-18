import ProcurementPageHeader from '@/components/procurement-page-header';
import { DataTableSortHeader } from '@/components/master/data-table-sort-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Database, PackageSearch, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Row = { material_id: number; matnr: string; maktx: string; mtart: string | null; matkl: string | null; meins: string | null; plant_code: string; plant_name: string; current_stock: number; stock_value: number; status: number };
type Page = { data: Row[]; current_page: number; last_page: number; per_page: number; from: number | null; to: number | null; total: number; prev_page_url: string | null; next_page_url: string | null };
type Filters = { search: string; per_page: number; sort: string; direction: 'asc' | 'desc' };

export default function MaterialInventory({ inventory, filters, pageSizeOptions }: { inventory: Page; filters: Filters; pageSizeOptions: number[] }) {
    const [search, setSearch] = useState(filters.search);
    const [perPage, setPerPage] = useState(String(filters.per_page));
    const load = (e?: FormEvent, sort = filters.sort, direction = filters.direction, pageSize = perPage) => {
        e?.preventDefault();
        router.get('/admin/procurement/material-inventory', { search: search.trim(), per_page: pageSize, sort, direction }, { preserveState: true, replace: true });
    };
    const sortTable = (column: string) => load(undefined, column, filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc');

    return (
        <AppLayout breadcrumbs={[{ title: 'Procurement', href: '/admin/procurement' }, { title: 'Material inventory', href: '/admin/procurement/material-inventory' }]}>
            <Head title="Material inventory" />
            <div className="mx-auto w-full max-w-full min-w-0 space-y-4 p-4 lg:p-6">
                <ProcurementPageHeader title="Material Inventory" subtitle="Combined material master and plant-wise stock" icon={PackageSearch} actions={<Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-slate-900" asChild><Link href="/admin/procurement"><ArrowLeft className="size-4" />Procurement</Link></Button>} />
                <section className="min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={load} className="flex w-full max-w-xl gap-2"><div className="relative flex-1"><Search className="absolute top-3 left-3 size-4 text-slate-400" /><Input className="pl-9" placeholder="Search material, type, group or plant..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><Button type="submit">Search</Button></form>
                        <div className="flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800"><Database className="size-4" />{inventory.total.toLocaleString()} records</div>
                    </div>
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[1150px] text-sm"><thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><tr><th className="w-20 px-4 py-3 text-right">S.No.</th><DataTableSortHeader label="Material" column="material" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" /><DataTableSortHeader label="Type" column="type" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" /><DataTableSortHeader label="Group" column="group" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" /><DataTableSortHeader label="Unit" column="unit" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" /><DataTableSortHeader label="Plant name" column="plant" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" /><DataTableSortHeader label="Current stock" column="current_stock" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3 text-right" /><DataTableSortHeader label="Stock value" column="stock_value" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3 text-right" /><DataTableSortHeader label="Status" column="status" activeColumn={filters.sort} direction={filters.direction} onSort={sortTable} className="px-4 py-3" /></tr></thead>
                            <tbody className="divide-y">{inventory.data.map((row, index) => <tr key={row.material_id} className="hover:bg-slate-50"><td className="px-4 py-3 text-right text-slate-500">{(inventory.from || 1) + index}</td><td className="px-4 py-3"><b>{row.maktx}</b><div className="text-xs text-slate-500">{row.matnr}</div></td><td className="px-4 py-3">{row.mtart || '—'}</td><td className="px-4 py-3">{row.matkl || '—'}</td><td className="px-4 py-3">{row.meins || '—'}</td><td className="px-4 py-3"><b>{row.plant_name || 'No stock mapped'}</b>{row.plant_code && <div className="text-xs text-slate-500">{row.plant_code}</div>}</td><td className="px-4 py-3 text-right tabular-nums">{Number(row.current_stock).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td><td className="px-4 py-3 text-right tabular-nums">{Number(row.stock_value).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td><td className={`px-4 py-3 font-semibold ${row.status ? 'text-emerald-600' : 'text-slate-400'}`}>{row.status ? 'Active' : 'Inactive'}</td></tr>)}</tbody>
                        </table>
                        {inventory.data.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No materials found.</div>}
                    </div>
                    <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2">Show <select className="h-8 rounded-md border bg-white px-2" value={perPage} onChange={(e) => { setPerPage(e.target.value); load(undefined, filters.sort, filters.direction, e.target.value); }}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select><span>entries · Showing {inventory.from || 0}–{inventory.to || 0} of {inventory.total}</span></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={!inventory.prev_page_url} onClick={() => inventory.prev_page_url && router.get(inventory.prev_page_url, {}, { preserveState: true })}>Previous</Button><span className="min-w-24 text-center font-semibold">Page {inventory.current_page} of {inventory.last_page}</span><Button size="sm" variant="outline" disabled={!inventory.next_page_url} onClick={() => inventory.next_page_url && router.get(inventory.next_page_url, {}, { preserveState: true })}>Next</Button></div></div>
                </section>
            </div>
        </AppLayout>
    );
}
