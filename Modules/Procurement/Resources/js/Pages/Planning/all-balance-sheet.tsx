import { DataTableSortHeader } from '@/components/master/data-table-sort-header';
import ProcurementPageHeader from '@/components/procurement-page-header';
import { RowExpandButton } from '@/components/row-expand-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    CalendarDays,
    Factory,
    FileSpreadsheet,
    Filter,
    Layers3,
    Maximize2,
    Minimize2,
    Printer,
    Search,
    TrendingDown,
} from 'lucide-react';
import { FormEvent, Fragment, useEffect, useRef, useState } from 'react';

type Row = {
    material: string;
    material_name: string;
    unit: string | null;
    plant_code: string;
    plant_name: string;
    opening_stock: number;
    daily_consumption: number;
    days: number;
    consumption: number;
    planned_buying: number;
    imports: number;
    supplier_receipts: number;
    total_buying: number;
    total_availability: number;
    closing_stock: number;
    shortage: number;
};
type Page<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Filters = {
    month: string;
    plant_code: string;
    material: string;
    search: string;
    per_page: number;
    sort: string;
    direction: 'asc' | 'desc';
};
const number = (value: number) =>
    Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });

export default function AllBalanceSheet({
    rows,
    plants,
    materials,
    filters,
    summary,
}: {
    rows: Page<Row>;
    plants: { id: number; company_code: string; company_name: string }[];
    materials: { matnr: string; maktx: string; meins: string | null }[];
    filters: Filters;
    summary: {
        plants: number;
        materials: number;
        opening_stock: number;
        consumption: number;
        closing_stock: number;
        shortage: number;
    };
}) {
    const month = filters.month;
    const [plantCode, setPlantCode] = useState(filters.plant_code || 'all');
    const [material, setMaterial] = useState(filters.material || 'all');
    const [search, setSearch] = useState(filters.search);
    const [expanded, setExpanded] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const tableRef = useRef<HTMLElement>(null);
    const apply = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(
            '/admin/procurement/all-balance-sheet',
            {
                month,
                plant_code: plantCode === 'all' ? undefined : plantCode,
                material: material === 'all' ? undefined : material,
                search: search || undefined,
                per_page: filters.per_page,
                sort: filters.sort,
                direction: filters.direction,
            },
            { preserveState: true, replace: true },
        );
    };
    const loadTable = (sort = filters.sort, direction = filters.direction, perPage = filters.per_page) =>
        router.get(
            '/admin/procurement/all-balance-sheet',
            {
                month: filters.month,
                plant_code: filters.plant_code || undefined,
                material: filters.material || undefined,
                search: filters.search || undefined,
                per_page: perPage,
                sort,
                direction,
            },
            { preserveState: true, replace: true },
        );
    const sortTable = (column: string) => loadTable(column, filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc');
    const toggleExpanded = async () => (document.fullscreenElement ? document.exitFullscreen() : tableRef.current?.requestFullscreen());
    useEffect(() => {
        const sync = () => setExpanded(document.fullscreenElement === tableRef.current);
        document.addEventListener('fullscreenchange', sync);
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);
    const exportCurrent = () => {
        const columns: (keyof Row)[] = [
            'material',
            'material_name',
            'plant_code',
            'plant_name',
            'opening_stock',
            'daily_consumption',
            'days',
            'consumption',
            'planned_buying',
            'imports',
            'supplier_receipts',
            'total_buying',
            'total_availability',
            'closing_stock',
            'shortage',
        ];
        const csv = [
            columns.join(','),
            ...rows.data.map((row) => columns.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(',')),
        ].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        link.download = `all-material-all-plant-balance-${filters.month}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Procurement', href: '/admin/procurement' },
                {
                    title: 'All Materials Balance Sheet',
                    href: '/admin/procurement/all-balance-sheet',
                },
            ]}
        >
            <Head title="All Materials Balance Sheet" />
            <main className="procurement-compact w-full min-w-0 space-y-3 p-3 sm:p-4">
                <div className="relative z-30 grid items-stretch overflow-visible rounded-xl border-t-[3px] border-orange-500 bg-gradient-to-r from-[#07374b] via-[#075b70] to-[#0b8da3] p-2.5 shadow-md shadow-slate-900/10 xl:grid-cols-[minmax(390px,0.8fr)_minmax(0,2fr)] xl:gap-3 print:hidden">
                    <ProcurementPageHeader
                        title="All Materials Balance Sheet"
                        subtitle="Consolidated monthly balance across every plant and material"
                        icon={FileSpreadsheet}
                        embedded
                        actions={
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-9 border-white/30 bg-white/10 text-white hover:bg-white hover:text-slate-900"
                                    onClick={exportCurrent}
                                    aria-label="Export balance sheet"
                                    title="Export balance sheet"
                                >
                                    <FileSpreadsheet className="size-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-9 border-white/30 bg-white/10 text-white hover:bg-white hover:text-slate-900"
                                    onClick={() => window.print()}
                                    aria-label="Print balance sheet"
                                    title="Print balance sheet"
                                >
                                    <Printer className="size-4" />
                                </Button>
                            </div>
                        }
                    />
                    <section className="rounded-lg border border-white/15 bg-white/8 p-2.5 shadow-inner shadow-black/5 backdrop-blur-sm">
                        <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1.2fr_auto] xl:items-end">
                            <label className="space-y-1 text-xs font-semibold text-white/90">
                                Plant
                                <select
                                    className="border-input flex h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
                                    value={plantCode}
                                    onChange={(e) => setPlantCode(e.target.value)}
                                >
                                    <option value="all">All Plants</option>
                                    {plants.map((plant) => (
                                        <option key={plant.id} value={plant.company_code}>
                                            {plant.company_code} · {plant.company_name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1 text-xs font-semibold text-white/90">
                                Material
                                <select
                                    className="border-input flex h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
                                    value={material}
                                    onChange={(e) => setMaterial(e.target.value)}
                                >
                                    <option value="all">All Materials</option>
                                    {materials.map((item) => (
                                        <option key={item.matnr} value={item.matnr}>
                                            {item.matnr} · {item.maktx}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1 text-xs font-semibold text-white/90">
                                Search
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                                    <Input
                                        className="h-9 bg-white pl-9 text-slate-900"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Material or plant..."
                                    />
                                </div>
                            </label>
                            <Button className="bg-brand-teal h-9 text-white hover:bg-cyan-600">
                                <Filter className="size-4" />
                                Apply
                            </Button>
                        </form>
                    </section>
                </div>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {[
                        [Factory, 'Plants', summary.plants, 'In report scope', 'text-cyan-700 bg-cyan-50'],
                        [Layers3, 'Materials', summary.materials, 'Active materials', 'text-blue-700 bg-blue-50'],
                        [Boxes, 'Opening stock', `${number(summary.opening_stock)} MT`, 'Month opening', 'text-indigo-700 bg-indigo-50'],
                        [CalendarDays, 'Consumption', `${number(summary.consumption)} MT`, 'Expected this month', 'text-amber-700 bg-amber-50'],
                        [TrendingDown, 'Closing stock', `${number(summary.closing_stock)} MT`, 'Projected closing', 'text-emerald-700 bg-emerald-50'],
                        [AlertTriangle, 'Shortage', `${number(summary.shortage)} MT`, 'Purchase attention', 'text-rose-700 bg-rose-50'],
                    ].map(([Icon, label, value, note, color]) => (
                        <article key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${color}`}>
                                    <Icon className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
                                    <p className="truncate text-lg font-bold text-slate-900">{value}</p>
                                    <p className="text-[10px] text-slate-400">{note}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
                <section
                    ref={tableRef}
                    className={`min-w-0 overflow-hidden border bg-white shadow-sm ${expanded ? 'flex h-screen flex-col rounded-none' : 'rounded-xl'}`}
                >
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                        <div>
                            <h2 className="font-semibold text-slate-900">Balance details</h2>
                            <p className="text-xs text-slate-500">
                                {filters.plant_code || 'All Plants'} · {filters.material || 'All Materials'} · {filters.month}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {rows.total.toLocaleString()} rows
                            </span>
                            <Button type="button" size="sm" variant="outline" className="gap-2 print:hidden" onClick={toggleExpanded}>
                                {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                                {expanded ? 'Collapse' : 'Expand'}
                            </Button>
                        </div>
                    </header>
                    <div className={`min-h-[420px] overflow-auto ${expanded ? 'min-h-0 flex-1' : 'max-h-[calc(100vh-330px)]'}`}>
                        <table className="w-full min-w-[1022px] border-separate border-spacing-0 text-xs">
                            <thead className="sticky top-0 z-20 bg-slate-100 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                                <tr>
                                    <th className="sticky left-0 z-30 w-14 min-w-14 border-b bg-slate-100 px-1 py-3 text-center">Action</th>
                                    <th className="sticky left-14 z-30 w-16 min-w-16 border-b bg-slate-100 px-3 py-3 text-center">S.No.</th>
                                    <DataTableSortHeader
                                        label="Material"
                                        column="material_name"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="sticky left-[7.5rem] z-30 min-w-72 border-b bg-slate-100 px-3 py-3 text-left"
                                    />
                                    <DataTableSortHeader
                                        label="Plant"
                                        column="plant_name"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="sticky left-[25.5rem] z-30 min-w-64 border-b bg-slate-100 px-3 py-3 text-left"
                                    />
                                    {[
                                        ['Opening Stock', 'opening_stock'],
                                        ['Avg/Day', 'daily_consumption'],
                                        ['Days', 'days'],
                                    ].map(([label, column]) => (
                                        <DataTableSortHeader
                                            key={column}
                                            label={label}
                                            column={column}
                                            activeColumn={filters.sort}
                                            direction={filters.direction}
                                            onSort={sortTable}
                                            className="border-b px-3 py-3 text-right"
                                        />
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.data.map((row, index) => {
                                    const rowKey = `${row.material}-${row.plant_code}`;
                                    const rowOpen = expandedRow === rowKey;
                                    return (
                                        <Fragment key={rowKey}>
                                            <tr
                                                tabIndex={0}
                                                aria-expanded={rowOpen}
                                                onClick={() => setExpandedRow(rowOpen ? null : rowKey)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        setExpandedRow(rowOpen ? null : rowKey);
                                                    }
                                                }}
                                                className={`cursor-pointer transition-colors hover:bg-cyan-50/40 focus-visible:bg-cyan-50/40 focus-visible:outline-none ${rowOpen ? 'bg-cyan-50/30' : ''}`}
                                            >
                                                <td className="sticky left-0 z-10 w-14 min-w-14 bg-white px-1 py-2 text-center">
                                                    <RowExpandButton
                                                        expanded={rowOpen}
                                                        onClick={() => setExpandedRow(rowOpen ? null : rowKey)}
                                                        label={`${rowOpen ? 'Collapse' : 'Expand'} ${row.material_name} at ${row.plant_name}`}
                                                        className="mx-auto"
                                                    />
                                                </td>
                                                <td className="sticky left-14 z-10 w-16 min-w-16 bg-white px-3 py-3 text-center text-slate-500 hover:bg-cyan-50">
                                                    {(rows.from || 1) + index}
                                                </td>
                                                <td className="sticky left-[7.5rem] z-10 bg-white px-3 py-3 hover:bg-cyan-50">
                                                    <b className="block text-slate-900">{row.material_name}</b>
                                                    <span className="font-mono text-[11px] text-slate-500">
                                                        {row.material} · {row.unit || '—'}
                                                    </span>
                                                </td>
                                                <td className="sticky left-[25.5rem] z-10 bg-white px-3 py-3 hover:bg-cyan-50">
                                                    <b>{row.plant_name}</b>
                                                    <span className="block text-[11px] text-slate-500">{row.plant_code}</span>
                                                </td>
                                                {[row.opening_stock, row.daily_consumption, row.days].map((value, index) => (
                                                    <td key={index} className="px-3 py-3 text-right tabular-nums">
                                                        {index === 2 ? value : number(value)}
                                                    </td>
                                                ))}
                                            </tr>
                                            {rowOpen && (
                                                <tr className="bg-orange-50/40">
                                                    <td colSpan={7} className="border-y border-orange-100 p-0">
                                                        <div
                                                            className={`sticky left-0 px-4 py-5 sm:px-6 ${expanded ? 'w-[calc(100vw-1rem)]' : 'w-[calc(100vw-1rem)] lg:w-[calc(100vw-17rem)]'}`}
                                                        >
                                                            <div className="mx-auto w-full max-w-7xl rounded-xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                                                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-900">{row.material_name}</p>
                                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                                            {row.material} · {row.unit || '—'} · {row.plant_name} ({row.plant_code})
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                                        <span
                                                                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${row.opening_stock <= 0 || row.shortage > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
                                                                        >
                                                                            {row.shortage > 0
                                                                                ? `Shortage ${number(row.shortage)} MT`
                                                                                : row.opening_stock <= 0
                                                                                  ? 'Stock insufficient'
                                                                                  : 'Stock sufficient'}
                                                                        </span>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            asChild
                                                                            className="h-8 gap-2 border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                                                                        >
                                                                            <Link
                                                                                href={`/admin/procurement/balance-sheet?material=${encodeURIComponent(row.material)}&month=${encodeURIComponent(filters.month)}&months=3`}
                                                                            >
                                                                                <FileSpreadsheet className="size-3.5" /> View balance sheet
                                                                            </Link>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                                    {[
                                                                        ['Opening stock', row.opening_stock],
                                                                        ['Average per day', row.daily_consumption],
                                                                        ['Days', row.days],
                                                                        ['Monthly consumption', row.consumption],
                                                                        ['Planned buying', row.planned_buying],
                                                                        ['Imports', row.imports],
                                                                        ['Supplier receipts', row.supplier_receipts],
                                                                        ['Total buying', row.total_buying],
                                                                        ['Availability', row.total_availability],
                                                                        ['Closing stock', row.closing_stock],
                                                                        ['Shortage', row.shortage],
                                                                    ].map(([label, value]) => (
                                                                        <div
                                                                            key={String(label)}
                                                                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                                                                        >
                                                                            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                                                                                {label}
                                                                            </p>
                                                                            <p className="mt-1 text-sm font-bold text-slate-800 tabular-nums">
                                                                                {label === 'Days' ? Number(value) : `${number(Number(value))} MT`}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                        {rows.data.length === 0 && (
                            <div className="grid min-h-72 place-items-center text-sm text-slate-500">
                                No balance data matches the selected filters.
                            </div>
                        )}
                    </div>
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-4 py-3 print:hidden">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                className="h-8 rounded-md border bg-white px-2"
                                value={filters.per_page}
                                onChange={(event) => loadTable(filters.sort, filters.direction, Number(event.target.value))}
                            >
                                {[25, 50, 100, 200].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span>
                                entries · Showing {rows.from || 0}–{rows.to || 0} of {rows.total}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!rows.prev_page_url}
                                onClick={() => rows.prev_page_url && router.get(rows.prev_page_url, {}, { preserveState: true })}
                            >
                                Previous
                            </Button>
                            <span className="text-xs font-semibold">
                                Page {rows.current_page} of {rows.last_page}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!rows.next_page_url}
                                onClick={() => rows.next_page_url && router.get(rows.next_page_url, {}, { preserveState: true })}
                            >
                                Next
                            </Button>
                        </div>
                    </footer>
                </section>
            </main>
        </AppLayout>
    );
}
