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
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Company = {
    id: number;
    company_code: string;
    company_name: string;
    record_type: number;
    parent_company_id: string | null;
    address_id: number | null;
    contact_id: number | null;
    gstin: string | null;
    pan: string | null;
    status: boolean;
    created_at: string;
};
type Page = {
    data: Company[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Form = {
    company_code: string;
    company_name: string;
    record_type: string;
    parent_company_id: string;
    address_id: string;
    contact_id: string;
    gstin: string;
    pan: string;
    status: boolean;
};
const blank: Form = {
    company_code: '',
    company_name: '',
    record_type: '1',
    parent_company_id: '',
    address_id: '',
    contact_id: '',
    gstin: '',
    pan: '',
    status: true,
};
const types: Record<number, string> = { 1: 'Company', 2: 'Plant', 3: 'Head Office' };

export default function Companies({
    companies,
    parentCompanies,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    companies: Page;
    parentCompanies: { company_code: string; company_name: string }[];
    filters: { search: string; per_page: number };
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search),
        [open, setOpen] = useState(false),
        [editing, setEditing] = useState<Company | null>(null),
        [selected, setSelected] = useState<number[]>([]),
        [action, setAction] = useState('');
    const form = useForm<Form>(blank);
    const load = (q = search, per = filters.per_page) =>
        router.get('/admin/companies', { search: q, per_page: per }, { preserveState: true, replace: true });
    const create = () => {
        setEditing(null);
        form.setData(blank);
        form.clearErrors();
        setOpen(true);
    };
    const edit = (c: Company) => {
        setEditing(c);
        form.setData({
            company_code: c.company_code,
            company_name: c.company_name,
            record_type: String(c.record_type),
            parent_company_id: c.parent_company_id ?? '',
            address_id: c.address_id ? String(c.address_id) : '',
            contact_id: c.contact_id ? String(c.contact_id) : '',
            gstin: c.gstin ?? '',
            pan: c.pan ?? '',
            status: c.status,
        });
        form.clearErrors();
        setOpen(true);
    };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) form.put(`/admin/companies/${editing.id}`, options);
        else form.post('/admin/companies', options);
    };
    const bulk = () => {
        if (!action || !selected.length) return;
        if (action === 'delete' && !confirm('Delete selected companies?')) return;
        router.patch('/admin/companies/bulk', { ids: selected, action }, { preserveScroll: true, onSuccess: () => setSelected([]) });
    };
    return (
        <AppLayout breadcrumbs={[{ title: 'Company Master', href: '/admin/companies' }]}>
            <Head title="Company Master" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <MasterPageHeader
                    title="Company Master"
                    description={`${stats.total} companies · ${stats.active} active`}
                    action={
                        canManage ? (
                            <Button onClick={create} className="bg-brand-teal">
                                <Plus className="size-4" /> Add company
                            </Button>
                        ) : undefined
                    }
                />
                <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold">Companies</h2>
                            <p className="text-xs text-slate-500">Manage companies, plants and head offices.</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                            <Input
                                className="pl-9 sm:w-80"
                                placeholder="Search companies"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && load()}
                            />
                        </div>
                    </div>
                    {selected.length > 0 && (
                        <div className="flex items-center gap-3 border-b bg-cyan-50 px-5 py-2">
                            <b>{selected.length} selected</b>
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger className="h-8 w-40 bg-white">
                                    <SelectValue placeholder="Bulk action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activate">Activate</SelectItem>
                                    <SelectItem value="deactivate">Deactivate</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={bulk}>
                                Apply
                            </Button>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">
                                        <Checkbox
                                            checked={companies.data.length > 0 && companies.data.every((c) => selected.includes(c.id))}
                                            onCheckedChange={(v) => setSelected(v ? companies.data.map((c) => c.id) : [])}
                                        />
                                    </th>
                                    <th className="px-4 py-3">S.No.</th>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Company</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Parent</th>
                                    <th className="px-4 py-3">GSTIN</th>
                                    <th className="px-4 py-3">PAN</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {companies.data.map((c, index) => (
                                    <tr key={c.id} className="hover:bg-cyan-50/30">
                                        <td className="px-4 py-3">
                                            <Checkbox
                                                checked={selected.includes(c.id)}
                                                onCheckedChange={(v) => setSelected(v ? [...selected, c.id] : selected.filter((id) => id !== c.id))}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {(companies.current_page - 1) * companies.per_page + index + 1}
                                        </td>
                                        <td className="px-4 py-3 font-mono font-bold">{c.company_code}</td>
                                        <td className="px-4 py-3 font-semibold">{c.company_name}</td>
                                        <td className="px-4 py-3">{types[c.record_type]}</td>
                                        <td className="px-4 py-3">{c.parent_company_id || '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{c.gstin || '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{c.pan || '—'}</td>
                                        <td className="px-4 py-3">
                                            <StatusToggle
                                                active={c.status}
                                                disabled={!canManage}
                                                label={c.company_name}
                                                onChange={() =>
                                                    router.patch(`/admin/companies/${c.id}/status`, { active: !c.status }, { preserveScroll: true })
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button size="icon" variant="ghost" onClick={() => edit(c)}>
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() =>
                                                                confirm(`Delete ${c.company_name}?`) && router.delete(`/admin/companies/${c.id}`)
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
                    {!companies.data.length && <div className="p-10 text-center text-sm text-slate-500">No companies found.</div>}
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
                            entries · {companies.from ?? 0}–{companies.to ?? 0} of {companies.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!companies.prev_page_url}
                                onClick={() => companies.prev_page_url && router.get(companies.prev_page_url)}
                            >
                                Previous
                            </Button>
                            <b>
                                Page {companies.current_page} of {companies.last_page}
                            </b>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!companies.next_page_url}
                                onClick={() => companies.next_page_url && router.get(companies.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[760px] overflow-hidden rounded-2xl bg-white p-0 sm:p-0">
                    <form onSubmit={submit}>
                        <MasterDialogHeader title={editing ? 'Edit company' : 'Create company'} />
                        <fieldset className="form-fieldset">
                            <legend>Company information</legend>
                            <div className="grid gap-3 py-4 sm:grid-cols-2">
                                <div>
                                    <Input
                                        autoFocus
                                        placeholder="Company code"
                                        value={form.data.company_code}
                                        onChange={(e) => form.setData('company_code', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.company_code} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Company name"
                                        value={form.data.company_name}
                                        onChange={(e) => form.setData('company_name', e.target.value)}
                                    />
                                    <InputError message={form.errors.company_name} />
                                </div>
                                <div>
                                    <Select value={form.data.record_type} onValueChange={(v) => form.setData('record_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Company</SelectItem>
                                            <SelectItem value="2">Plant</SelectItem>
                                            <SelectItem value="3">Head Office</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.record_type} />
                                </div>
                                <div>
                                    <Select
                                        value={form.data.parent_company_id || undefined}
                                        onValueChange={(v) => form.setData('parent_company_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Parent company (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parentCompanies
                                                .filter((p) => p.company_code !== editing?.company_code)
                                                .map((p) => (
                                                    <SelectItem key={p.company_code} value={p.company_code}>
                                                        {p.company_name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.parent_company_id} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="GSTIN (15 characters)"
                                        maxLength={15}
                                        value={form.data.gstin}
                                        onChange={(e) => form.setData('gstin', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.gstin} />
                                </div>
                                <div>
                                    <Input
                                        placeholder="PAN (10 characters)"
                                        maxLength={10}
                                        value={form.data.pan}
                                        onChange={(e) => form.setData('pan', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={form.errors.pan} />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Address ID (optional)"
                                        value={form.data.address_id}
                                        onChange={(e) => form.setData('address_id', e.target.value)}
                                    />
                                    <InputError message={form.errors.address_id} />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Contact ID (optional)"
                                        value={form.data.contact_id}
                                        onChange={(e) => form.setData('contact_id', e.target.value)}
                                    />
                                    <InputError message={form.errors.contact_id} />
                                </div>
                            </div>
                        </fieldset>
                        <DialogFooter className="gap-2 border-t bg-slate-50 px-5 py-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button disabled={form.processing} className="bg-brand-teal">
                                {form.processing ? 'Saving…' : 'Save company'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
