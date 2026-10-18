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
import { Edit3, Package, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';

type Material = { id: number; matnr: string; mtart: string | null; matkl: string | null; meins: string | null; maktx: string; status: boolean };
type Page = {
    data: Material[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type MaterialForm = { matnr: string; mtart: string; matkl: string; meins: string; maktx: string; status: boolean };
const blank: MaterialForm = { matnr: '', mtart: '', matkl: '', meins: '', maktx: '', status: true };

export default function Materials({
    materials,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    materials: Page;
    filters: { search: string; per_page: number };
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Material | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const form = useForm<MaterialForm>(blank);
    const load = useCallback(
        (q = search, per = filters.per_page) =>
            router.get('/admin/materials', { search: q.trim(), per_page: per }, { preserveState: true, replace: true }),
        [filters.per_page, search],
    );
    useEffect(() => {
        const term = search.trim();
        if (search === filters.search || (term.length > 0 && term.length < 2)) return;
        const timer = window.setTimeout(() => load(term), 400);
        return () => window.clearTimeout(timer);
    }, [search, filters.search, load]);
    const create = () => {
        setEditing(null);
        form.setData(blank);
        form.clearErrors();
        setFormOpen(true);
    };
    const edit = (m: Material) => {
        setEditing(m);
        form.setData({ matnr: m.matnr, mtart: m.mtart ?? '', matkl: m.matkl ?? '', meins: m.meins ?? '', maktx: m.maktx, status: m.status });
        form.clearErrors();
        setFormOpen(true);
    };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setFormOpen(false) };
        if (editing) form.put(`/admin/materials/${editing.id}`, options);
        else form.post('/admin/materials', options);
    };
    const applyBulk = () => {
        if (!bulkAction || !selected.length) return;
        if (bulkAction === 'delete' && !confirm('Delete selected materials?')) return;
        router.patch(
            '/admin/materials/bulk',
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
        <AppLayout breadcrumbs={[{ title: 'Material Master', href: '/admin/materials' }]}>
            <Head title="Material Master" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <MasterPageHeader
                    icon={<Package className="size-[18px]" />}
                    title="Material Master"
                    description={`${stats.total} materials · ${stats.active} active`}
                    action={
                        canManage ? (
                            <Button onClick={create} className="bg-brand-teal h-9 px-4 font-semibold text-white shadow-sm">
                                <Plus className="size-4" /> Add material
                            </Button>
                        ) : undefined
                    }
                />
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Directory</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Search, update status, or manage multiple materials.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-3 left-3.5 size-4 text-slate-400" />
                                <Input
                                    className="h-10 rounded-lg border-slate-300 bg-slate-50 pl-10 md:w-96"
                                    placeholder="Search materials"
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
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-amber-50/60 text-[11px] text-slate-600 uppercase">
                                <tr>
                                    <th className="px-4 py-3">
                                        <Checkbox
                                            aria-label="Select all materials on this page"
                                            checked={materials.data.length > 0 && materials.data.every((m) => selected.includes(m.id))}
                                            onCheckedChange={(v) => setSelected(v ? materials.data.map((m) => m.id) : [])}
                                        />
                                    </th>
                                    <th className="px-4 py-3">S.No.</th>
                                    <th className="px-4 py-3">Material No.</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Group</th>
                                    <th className="px-4 py-3">Unit</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {materials.data.map((m, index) => (
                                    <tr key={m.id} className="hover:bg-amber-50/30">
                                        <td className="px-4 py-3">
                                            <Checkbox
                                                aria-label={`Select ${m.maktx}`}
                                                checked={selected.includes(m.id)}
                                                onCheckedChange={(v) =>
                                                    setSelected(v ? [...new Set([...selected, m.id])] : selected.filter((id) => id !== m.id))
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {(materials.current_page - 1) * materials.per_page + index + 1}
                                        </td>
                                        <td className="px-4 py-3 font-mono font-semibold">{m.matnr}</td>
                                        <td className="px-4 py-3 font-semibold">{m.maktx}</td>
                                        <td className="px-4 py-3">{m.mtart || '—'}</td>
                                        <td className="px-4 py-3">{m.matkl || '—'}</td>
                                        <td className="px-4 py-3">{m.meins || '—'}</td>
                                        <td className="px-4 py-3">
                                            <StatusToggle
                                                active={m.status}
                                                disabled={!canManage}
                                                label={m.maktx}
                                                onChange={() =>
                                                    router.patch(`/admin/materials/${m.id}/status`, { active: !m.status }, { preserveScroll: true })
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button size="icon" variant="ghost" onClick={() => edit(m)}>
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() => confirm(`Delete ${m.maktx}?`) && router.delete(`/admin/materials/${m.id}`)}
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
                    {!materials.data.length && <div className="p-10 text-center text-sm text-slate-500">No materials found.</div>}
                    <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            Show{' '}
                            <Select value={String(filters.per_page)} onValueChange={(v) => load(filters.search, Number(v))}>
                                <SelectTrigger className="h-8 w-20 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>{' '}
                            entries · {materials.from ?? 0}–{materials.to ?? 0} of {materials.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!materials.prev_page_url}
                                onClick={() => materials.prev_page_url && router.get(materials.prev_page_url)}
                            >
                                Previous
                            </Button>
                            <b>
                                Page {materials.current_page} of {materials.last_page}
                            </b>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!materials.next_page_url}
                                onClick={() => materials.next_page_url && router.get(materials.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-[800px] overflow-hidden rounded-2xl bg-white p-0 sm:p-0">
                    <form onSubmit={submit}>
                        <MasterDialogHeader title={editing ? 'Edit material' : 'Create material'} />
                        <fieldset className="form-fieldset">
                            <legend>Material information</legend>
                            <div className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <Input
                                        autoFocus
                                        placeholder="Material number *"
                                        value={form.data.matnr}
                                        onChange={(e) => form.setData('matnr', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.matnr} />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        placeholder="Material description *"
                                        value={form.data.maktx}
                                        onChange={(e) => form.setData('maktx', e.target.value)}
                                    />
                                    <InputError message={form.errors.maktx} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Material type"
                                        value={form.data.mtart}
                                        onChange={(e) => form.setData('mtart', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.mtart} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Material group"
                                        value={form.data.matkl}
                                        onChange={(e) => form.setData('matkl', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.matkl} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Base unit"
                                        value={form.data.meins}
                                        onChange={(e) => form.setData('meins', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.meins} />
                                </div>
                            </div>
                        </fieldset>
                        <DialogFooter className="gap-2 border-t bg-slate-50 px-5 py-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                                Cancel
                            </Button>
                            <Button disabled={form.processing} className="bg-brand-teal">
                                {form.processing ? 'Saving…' : 'Save material'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
