import InputError from '@/components/input-error';
import { MasterDialogHeader } from '@/components/master/master-dialog-header';
import { StatusToggle } from '@/components/master/status-toggle';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { BadgeCheck, ChevronLeft, ChevronRight, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, ReactNode, useState } from 'react';

type Designation = {
    id: number;
    des_id: number;
    designation_name: string;
    designation_level_id: number;
    reports_to_designation_id: number | null;
    status: boolean;
    created_at: string;
};
type Option = { id: number; designation_name?: string; level_code?: string; level_name?: string };
type Page = {
    data: Designation[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Filters = { search: string; per_page: number; sort: string; direction: 'asc' | 'desc' };
type Form = {
    des_id: string;
    designation_name: string;
    designation_level_id: string;
    reports_to_designation_id: string;
    status: boolean;
};
const empty: Form = {
    des_id: '',
    designation_name: '',
    designation_level_id: '',
    reports_to_designation_id: '',
    status: true,
};

export default function Index({
    designations,
    allDesignations,
    designationLevels,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    designations: Page;
    allDesignations: Option[];
    designationLevels: Option[];
    filters: Filters;
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Designation | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const form = useForm<Form>(empty);
    const load = (q: string, per = filters.per_page) =>
        router.get('/admin/designations', { search: q, per_page: per }, { preserveState: true, replace: true });
    const create = () => {
        setEditing(null);
        form.setData(empty);
        form.clearErrors();
        setOpen(true);
    };
    const edit = (d: Designation) => {
        setEditing(d);
        form.setData({
            des_id: String(d.des_id),
            designation_name: d.designation_name,
            designation_level_id: String(d.designation_level_id),
            reports_to_designation_id: d.reports_to_designation_id ? String(d.reports_to_designation_id) : '',
            status: d.status,
        });
        form.clearErrors();
        setOpen(true);
    };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) form.put(`/admin/designations/${editing.id}`, options);
        else form.post('/admin/designations', options);
    };
    const remove = (d: Designation) =>
        window.confirm(`Delete ${d.designation_name}?`) && router.delete(`/admin/designations/${d.id}`, { preserveScroll: true });
    const reportName = (id: number | null) => allDesignations.find((x) => x.id === id)?.designation_name ?? '—';
    const levelName = (id: number) => designationLevels.find((x) => x.id === id)?.level_name ?? `Level ${id}`;
    const allSelected = designations.data.length > 0 && designations.data.every((item) => selectedIds.includes(item.id));
    const runBulkAction = () => {
        if (!bulkAction || !selectedIds.length) return;
        if (bulkAction === 'delete' && !window.confirm(`Delete ${selectedIds.length} selected designation(s)?`)) return;
        router.patch(
            '/admin/designations/bulk',
            { ids: selectedIds, action: bulkAction },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    setBulkAction('');
                },
            },
        );
    };
    return (
        <AppLayout breadcrumbs={[{ title: 'Designation Master', href: '/admin/designations' }]}>
            <Head title="Designation Master" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <section className="rounded-xl border bg-white px-5 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="bg-brand-teal/10 text-brand-teal grid size-10 place-items-center rounded-lg">
                                <BadgeCheck className="size-5" />
                            </span>
                            <div>
                                <p className="text-brand-teal text-[10px] font-bold tracking-[.16em] uppercase">Master data</p>
                                <h1 className="text-xl font-bold">Designation Master</h1>
                                <p className="text-xs text-slate-500">
                                    {stats.total} designations · {stats.active} active
                                </p>
                            </div>
                        </div>
                        {canManage && (
                            <Button onClick={create} className="bg-brand-teal hover:bg-brand-plum">
                                <Plus className="size-4" /> Add designation
                            </Button>
                        )}
                    </div>
                </section>
                <section className="overflow-hidden rounded-xl border bg-white shadow-sm [&_tbody_td]:!py-3">
                    <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold">Designations</h2>
                            <p className="text-xs text-slate-500">Manage hierarchy, reporting, department, and status.</p>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                load(search);
                            }}
                            className="relative w-full sm:max-w-sm"
                        >
                            <Search className="absolute top-3 left-3 size-4 text-slate-400" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search designations" className="pl-9" />
                        </form>
                    </div>
                    {canManage && selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 border-b bg-cyan-50 px-5 py-2">
                            <span className="text-brand-teal text-xs font-bold">{selectedIds.length} selected</span>
                            <Select value={bulkAction} onValueChange={setBulkAction}>
                                <SelectTrigger className="h-8 w-44 bg-white">
                                    <SelectValue placeholder="Bulk action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activate">Activate selected</SelectItem>
                                    <SelectItem value="deactivate">Deactivate selected</SelectItem>
                                    <SelectItem value="delete">Delete selected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" disabled={!bulkAction} onClick={runBulkAction}>
                                Apply
                            </Button>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase">
                                <tr>
                                    <th className="w-12 px-5 py-3">
                                        <Checkbox
                                            checked={allSelected ? true : selectedIds.length > 0 ? 'indeterminate' : false}
                                            onCheckedChange={(checked) => setSelectedIds(checked ? designations.data.map((item) => item.id) : [])}
                                            aria-label="Select all designations"
                                        />
                                    </th>
                                    {['S.No.', 'Designation', 'Level', 'Reports to', 'Status', 'Created', 'Actions'].map((x) => (
                                        <th key={x} className="px-5 py-3">
                                            {x}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {designations.data.map((d, i) => (
                                    <tr key={d.id} className="hover:bg-cyan-50/30">
                                        <td className="px-5 py-4">
                                            <Checkbox
                                                checked={selectedIds.includes(d.id)}
                                                onCheckedChange={(checked) =>
                                                    setSelectedIds(checked ? [...selectedIds, d.id] : selectedIds.filter((id) => id !== d.id))
                                                }
                                                aria-label={`Select ${d.designation_name}`}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500">
                                            {(designations.current_page - 1) * designations.per_page + i + 1}
                                        </td>
                                        <td className="px-5 py-4 font-bold">{d.designation_name}</td>
                                        <td className="px-5 py-4">{levelName(d.designation_level_id)}</td>
                                        <td className="px-5 py-4">{reportName(d.reports_to_designation_id)}</td>
                                        <td className="min-w-36 px-5 py-4">
                                            <StatusToggle
                                                active={d.status}
                                                disabled={!canManage}
                                                onChange={() =>
                                                    router.patch(
                                                        `/admin/designations/${d.id}/status`,
                                                        { active: !d.status },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                label={d.designation_name}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs">{new Intl.DateTimeFormat('en-GB').format(new Date(d.created_at))}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => edit(d)}>
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => remove(d)}>
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
                    {!designations.data.length && <div className="p-8 text-center text-sm text-slate-500">No designations found.</div>}
                    <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            Show{' '}
                            <Select value={String(filters.per_page)} onValueChange={(v) => load(filters.search, Number(v))}>
                                <SelectTrigger className="h-8 w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((x) => (
                                        <SelectItem key={x} value={String(x)}>
                                            {x}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>{' '}
                            entries · {designations.from ?? 0}–{designations.to ?? 0} of {designations.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!designations.prev_page_url}
                                onClick={() => designations.prev_page_url && router.get(designations.prev_page_url)}
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </Button>
                            <span>
                                Page {designations.current_page} of {designations.last_page}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!designations.next_page_url}
                                onClick={() => designations.next_page_url && router.get(designations.next_page_url)}
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[620px] overflow-hidden rounded-2xl bg-white p-0 sm:p-0">
                    <form onSubmit={submit}>
                        <MasterDialogHeader title={editing ? 'Edit designation' : 'Create designation'} />
                        <fieldset className="form-fieldset">
                            <legend>Designation information</legend>
                            <div className="grid grid-cols-1 gap-4 py-4">
                                <Field error={form.errors.designation_name}>
                                    <Input
                                        autoFocus
                                        value={form.data.designation_name}
                                        onChange={(e) => form.setData('designation_name', e.target.value)}
                                        placeholder="Designation name *"
                                    />
                                </Field>
                                <Field error={form.errors.designation_level_id}>
                                    <Select
                                        value={form.data.designation_level_id}
                                        onValueChange={(value) => form.setData('designation_level_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Designation level *" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {designationLevels.map((level) => (
                                                <SelectItem key={level.id} value={String(level.id)}>
                                                    {level.level_code} — {level.level_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field error={form.errors.reports_to_designation_id}>
                                    <Select
                                        value={form.data.reports_to_designation_id || 'none'}
                                        onValueChange={(v) => form.setData('reports_to_designation_id', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Reports to" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No reporting designation</SelectItem>
                                            {allDesignations
                                                .filter((x) => x.id !== editing?.id)
                                                .map((x) => (
                                                    <SelectItem key={x.id} value={String(x.id)}>
                                                        {x.designation_name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </fieldset>
                        <DialogFooter className="border-t bg-slate-50 px-5 py-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button disabled={form.processing} className="bg-brand-teal hover:bg-brand-plum">
                                {form.processing ? 'Saving…' : 'Save designation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
function Field({ children, error }: { children: ReactNode; error?: string }) {
    return (
        <div>
            {children}
            <InputError message={error} />
        </div>
    );
}
