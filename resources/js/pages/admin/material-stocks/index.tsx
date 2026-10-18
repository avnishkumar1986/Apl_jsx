import InputError from '@/components/input-error';
import { MasterDialogHeader } from '@/components/master/master-dialog-header';
import { MasterPageHeader } from '@/components/master/master-page-header';
import { StatusToggle } from '@/components/master/status-toggle';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Boxes, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';

type Stock = {
    id: number;
    matnr: string;
    plant_code: string;
    material_desc: string | null;
    current_stock: string | number;
    stock_value: string | number;
    status: boolean;
    synced_at: string | null;
};
type Page = {
    data: Stock[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type StockForm = { matnr: string; plant_code: string; material_desc: string; current_stock: string; stock_value: string; status: boolean };
const blank: StockForm = { matnr: '', plant_code: '', material_desc: '', current_stock: '0', stock_value: '0', status: true };

export default function MaterialStocks({
    stocks,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    stocks: Page;
    filters: { search: string; per_page: number };
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search),
        [formOpen, setFormOpen] = useState(false),
        [editing, setEditing] = useState<Stock | null>(null),
        [selected, setSelected] = useState<number[]>([]),
        [bulkAction, setBulkAction] = useState('');
    const form = useForm<StockForm>(blank);
    const load = useCallback(
        (q = search, per = filters.per_page) =>
            router.get('/admin/material-stocks', { search: q.trim(), per_page: per }, { preserveState: true, replace: true }),
        [filters.per_page, search],
    );
    useEffect(() => {
        const term = search.trim();
        if (search === filters.search || (term.length > 0 && term.length < 3)) return;
        const timer = window.setTimeout(() => load(term), 500);
        return () => window.clearTimeout(timer);
    }, [search, filters.search, load]);
    const create = () => {
        setEditing(null);
        form.setData(blank);
        form.clearErrors();
        setFormOpen(true);
    };
    const edit = (stock: Stock) => {
        setEditing(stock);
        form.setData({
            matnr: stock.matnr,
            plant_code: stock.plant_code,
            material_desc: stock.material_desc ?? '',
            current_stock: String(stock.current_stock),
            stock_value: String(stock.stock_value),
            status: stock.status,
        });
        form.clearErrors();
        setFormOpen(true);
    };
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setFormOpen(false) };
        if (editing) form.put(`/admin/material-stocks/${editing.id}`, options);
        else form.post('/admin/material-stocks', options);
    };
    const applyBulk = () => {
        if (!bulkAction || !selected.length) return;
        if (bulkAction === 'delete' && !confirm('Delete selected stock rows?')) return;
        router.patch(
            '/admin/material-stocks/bulk',
            { ids: selected, action: bulkAction },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelected([]);
                    setBulkAction('');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Material Stock', href: '/admin/material-stocks' }]}>
            <Head title="Material Stock" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <MasterPageHeader
                    icon={<Boxes className="size-[18px]" />}
                    title="Material Stock"
                    description={`${stats.total} stock rows · ${stats.active} active`}
                    action={
                        canManage ? (
                            <Button onClick={create} className="bg-brand-teal h-9 px-4 font-semibold text-white shadow-sm">
                                <Plus className="size-4" /> Add stock
                            </Button>
                        ) : undefined
                    }
                />
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Directory</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Search, update status, or manage plant-wise material stock.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-3 left-3.5 size-4 text-slate-400" />
                                <Input
                                    className="h-10 rounded-lg border-slate-300 bg-slate-50 pl-10 md:w-96"
                                    placeholder="Search material stock"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && load()}
                                />
                            </div>
                            <Button variant="outline" onClick={() => load()}>
                                Search
                            </Button>
                        </div>
                    </div>
                    {canManage && selected.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 border-b bg-cyan-50 px-5 py-2">
                            <b className="text-sm">{selected.length} selected</b>
                            <Select value={bulkAction} onValueChange={setBulkAction}>
                                <SelectTrigger className="h-8 w-40 bg-white">
                                    <SelectValue placeholder="Bulk action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activate">Activate</SelectItem>
                                    <SelectItem value="deactivate">Deactivate</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" disabled={!bulkAction} onClick={applyBulk}>
                                Apply
                            </Button>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-amber-50/60 text-[11px] text-slate-600 uppercase">
                                <tr>
                                    <th className="px-4 py-3">
                                        <Checkbox
                                            aria-label="Select all"
                                            checked={stocks.data.length > 0 && stocks.data.every((row) => selected.includes(row.id))}
                                            onCheckedChange={(value) => setSelected(value ? stocks.data.map((row) => row.id) : [])}
                                        />
                                    </th>
                                    <th className="px-4 py-3">S.No.</th>
                                    <th className="px-4 py-3">Material No.</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Plant</th>
                                    <th className="px-4 py-3 text-right">Current Stock</th>
                                    <th className="px-4 py-3 text-right">Stock Value</th>
                                    <th className="px-4 py-3">Last Sync</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {stocks.data.map((stock, index) => (
                                    <tr key={stock.id} className="hover:bg-amber-50/30">
                                        <td className="px-4 py-3">
                                            <Checkbox
                                                checked={selected.includes(stock.id)}
                                                onCheckedChange={(value) =>
                                                    setSelected(
                                                        value ? [...new Set([...selected, stock.id])] : selected.filter((id) => id !== stock.id),
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {(stocks.current_page - 1) * stocks.per_page + index + 1}
                                        </td>
                                        <td className="px-4 py-3 font-mono font-semibold">{stock.matnr}</td>
                                        <td className="px-4 py-3 font-semibold">{stock.material_desc || '—'}</td>
                                        <td className="px-4 py-3">{stock.plant_code}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {Number(stock.current_stock).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {Number(stock.stock_value).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{stock.synced_at ? new Date(stock.synced_at).toLocaleString() : '—'}</td>
                                        <td className="px-4 py-3">
                                            <StatusToggle
                                                active={stock.status}
                                                disabled={!canManage}
                                                label={stock.matnr}
                                                onChange={() =>
                                                    router.patch(
                                                        `/admin/material-stocks/${stock.id}/status`,
                                                        { active: !stock.status },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button size="icon" variant="ghost" onClick={() => edit(stock)}>
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() =>
                                                                confirm(`Delete ${stock.matnr} for ${stock.plant_code}?`) &&
                                                                router.delete(`/admin/material-stocks/${stock.id}`)
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!stocks.data.length && <div className="p-10 text-center text-sm text-slate-500">No material stock found.</div>}
                    <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            Show{' '}
                            <Select value={String(filters.per_page)} onValueChange={(value) => load(filters.search, Number(value))}>
                                <SelectTrigger className="h-8 w-20 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((number) => (
                                        <SelectItem key={number} value={String(number)}>
                                            {number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>{' '}
                            entries · {stocks.from ?? 0}–{stocks.to ?? 0} of {stocks.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!stocks.prev_page_url}
                                onClick={() => stocks.prev_page_url && router.get(stocks.prev_page_url)}
                            >
                                Previous
                            </Button>
                            <b>
                                Page {stocks.current_page} of {stocks.last_page}
                            </b>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!stocks.next_page_url}
                                onClick={() => stocks.next_page_url && router.get(stocks.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-[760px] overflow-hidden rounded-2xl bg-white p-0 sm:p-0">
                    <form onSubmit={submit}>
                        <MasterDialogHeader title={editing ? 'Edit material stock' : 'Create material stock'} />
                        <fieldset className="form-fieldset">
                            <legend>Stock information</legend>
                            <div className="grid gap-4 py-4 sm:grid-cols-2">
                                <div>
                                    <Input
                                        autoFocus
                                        placeholder="Material number *"
                                        value={form.data.matnr}
                                        onChange={(e) => form.setData('matnr', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.matnr} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Plant code *"
                                        value={form.data.plant_code}
                                        onChange={(e) => form.setData('plant_code', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.plant_code} />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        placeholder="Material description"
                                        value={form.data.material_desc}
                                        onChange={(e) => form.setData('material_desc', e.target.value)}
                                    />
                                    <InputError message={form.errors.material_desc} />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        placeholder="Current stock"
                                        value={form.data.current_stock}
                                        onChange={(e) => form.setData('current_stock', e.target.value)}
                                    />
                                    <InputError message={form.errors.current_stock} />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        placeholder="Stock value"
                                        value={form.data.stock_value}
                                        onChange={(e) => form.setData('stock_value', e.target.value)}
                                    />
                                    <InputError message={form.errors.stock_value} />
                                </div>
                            </div>
                        </fieldset>
                        <DialogFooter className="gap-2 border-t bg-slate-50 px-5 py-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                                Cancel
                            </Button>
                            <Button disabled={form.processing} className="bg-brand-teal">
                                {form.processing ? 'Saving…' : 'Save stock'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
