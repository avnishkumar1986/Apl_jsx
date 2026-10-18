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
import { BadgeCheck, ChevronLeft, ChevronRight, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, ReactNode, useState } from 'react';

type Level = {
    id: number;
    level_code: string;
    level_name: string;
    hierarchy_order: number;
    reports_to_level_id: number | null;
    status: boolean;
    created_at: string;
};
type Page = {
    data: Level[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Form = { level_code: string; level_name: string; hierarchy_order: string; reports_to_level_id: string; status: boolean };
const empty: Form = { level_code: '', level_name: '', hierarchy_order: '', reports_to_level_id: '', status: true };

export default function Index({
    levels,
    allLevels,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    levels: Page;
    allLevels: Level[];
    filters: { search: string; per_page: number };
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search),
        [open, setOpen] = useState(false),
        [editing, setEditing] = useState<Level | null>(null),
        [selected, setSelected] = useState<number[]>([]),
        [action, setAction] = useState('');
    const form = useForm<Form>(empty);
    const load = (q: string, per = filters.per_page) =>
        router.get('/admin/designation-levels', { search: q, per_page: per }, { preserveState: true, replace: true });
    const create = () => {
        setEditing(null);
        form.setData(empty);
        form.clearErrors();
        setOpen(true);
    };
    const edit = (x: Level) => {
        setEditing(x);
        form.setData({
            level_code: x.level_code,
            level_name: x.level_name,
            hierarchy_order: String(x.hierarchy_order),
            reports_to_level_id: x.reports_to_level_id ? String(x.reports_to_level_id) : '',
            status: x.status,
        });
        form.clearErrors();
        setOpen(true);
    };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const o = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) form.put(`/admin/designation-levels/${editing.id}`, o);
        else form.post('/admin/designation-levels', o);
    };
    const remove = (x: Level) =>
        window.confirm(`Delete ${x.level_name}?`) && router.delete(`/admin/designation-levels/${x.id}`, { preserveScroll: true });
    const allSelected = levels.data.length > 0 && levels.data.every((x) => selected.includes(x.id));
    const runBulk = () => {
        if (!action || !selected.length) return;
        if (action === 'delete' && !window.confirm(`Delete ${selected.length} selected level(s)?`)) return;
        router.patch(
            '/admin/designation-levels/bulk',
            { ids: selected, action },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelected([]);
                    setAction('');
                },
            },
        );
    };
    const report = (id: number | null) => allLevels.find((x) => x.id === id)?.level_name ?? '—';
    return (
        <AppLayout breadcrumbs={[{ title: 'Designation Level Master', href: '/admin/designation-levels' }]}>
            <Head title="Designation Level Master" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <MasterPageHeader
                    title="Designation Level Master"
                    description={`${stats.total} levels · ${stats.active} active`}
                    icon={<BadgeCheck className="size-5" />}
                    action={
                        canManage && (
                            <Button onClick={create} className="bg-orange-500 text-white hover:bg-orange-600">
                                <Plus className="size-4" /> Add level
                            </Button>
                        )
                    }
                />
                <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold">Designation levels</h2>
                            <p className="text-xs text-slate-500">Manage hierarchy levels and reporting flow.</p>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                load(search);
                            }}
                            className="relative w-full sm:max-w-sm"
                        >
                            <Search className="absolute top-3 left-3 size-4 text-slate-400" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search levels" className="pl-9" />
                        </form>
                    </div>
                    {canManage && selected.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 border-b bg-cyan-50 px-5 py-2">
                            <span className="text-brand-teal text-xs font-bold">{selected.length} selected</span>
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger className="h-8 w-44 bg-white">
                                    <SelectValue placeholder="Bulk action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activate">Activate selected</SelectItem>
                                    <SelectItem value="deactivate">Deactivate selected</SelectItem>
                                    <SelectItem value="delete">Delete selected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" disabled={!action} onClick={runBulk}>
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
                                            checked={allSelected ? true : selected.length ? 'indeterminate' : false}
                                            onCheckedChange={(v) => setSelected(v ? levels.data.map((x) => x.id) : [])}
                                        />
                                    </th>
                                    {['S.No.', 'Code', 'Level name', 'Hierarchy order', 'Reports to level', 'Status', 'Created', 'Actions'].map(
                                        (x) => (
                                            <th key={x} className="px-5 py-3">
                                                {x}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {levels.data.map((x, i) => (
                                    <tr key={x.id}>
                                        <td className="px-5 py-4">
                                            <Checkbox
                                                checked={selected.includes(x.id)}
                                                onCheckedChange={(v) => setSelected(v ? [...selected, x.id] : selected.filter((id) => id !== x.id))}
                                            />
                                        </td>
                                        <td className="px-5 py-4">{(levels.current_page - 1) * levels.per_page + i + 1}</td>
                                        <td className="px-5 py-4 font-mono font-bold">{x.level_code}</td>
                                        <td className="px-5 py-4 font-bold">{x.level_name}</td>
                                        <td className="px-5 py-4">{x.hierarchy_order}</td>
                                        <td className="px-5 py-4">{report(x.reports_to_level_id)}</td>
                                        <td className="min-w-36 px-5 py-4">
                                            <StatusToggle
                                                active={x.status}
                                                disabled={!canManage}
                                                onChange={() =>
                                                    router.patch(
                                                        `/admin/designation-levels/${x.id}/status`,
                                                        { active: !x.status },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                label={x.level_name}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs">{new Intl.DateTimeFormat('en-GB').format(new Date(x.created_at))}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => edit(x)}>
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => remove(x)}>
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
                            entries · {levels.from ?? 0}–{levels.to ?? 0} of {levels.total}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!levels.prev_page_url}
                                onClick={() => levels.prev_page_url && router.get(levels.prev_page_url)}
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </Button>
                            <span className="self-center">
                                Page {levels.current_page} of {levels.last_page}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!levels.next_page_url}
                                onClick={() => levels.next_page_url && router.get(levels.next_page_url)}
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[680px] overflow-hidden rounded-2xl bg-white p-0 sm:p-0">
                    <form onSubmit={submit}>
                        <MasterDialogHeader title={editing ? 'Edit designation level' : 'Create designation level'} />
                        <fieldset className="form-fieldset">
                            <legend>Level information</legend>
                            <div className="grid gap-4 py-4 sm:grid-cols-2">
                                <Field error={form.errors.level_code}>
                                    <Input
                                        autoFocus
                                        value={form.data.level_code}
                                        onChange={(e) => form.setData('level_code', e.target.value.toUpperCase())}
                                        placeholder="Level code *"
                                    />
                                </Field>
                                <Field error={form.errors.level_name}>
                                    <Input
                                        value={form.data.level_name}
                                        onChange={(e) => form.setData('level_name', e.target.value)}
                                        placeholder="Level name *"
                                    />
                                </Field>
                                <Field error={form.errors.hierarchy_order}>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={form.data.hierarchy_order}
                                        onChange={(e) => form.setData('hierarchy_order', e.target.value)}
                                        placeholder="Hierarchy order *"
                                    />
                                </Field>
                                <Field error={form.errors.reports_to_level_id}>
                                    <Select
                                        value={form.data.reports_to_level_id || 'none'}
                                        onValueChange={(v) => form.setData('reports_to_level_id', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Reports to level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No reporting level</SelectItem>
                                            {allLevels
                                                .filter((x) => x.id !== editing?.id)
                                                .map((x) => (
                                                    <SelectItem key={x.id} value={String(x.id)}>
                                                        {x.level_code} — {x.level_name}
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
                                {form.processing ? 'Saving…' : 'Save level'}
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
