import InputError from '@/components/input-error';
import { MasterDialogHeader } from '@/components/master/master-dialog-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Activity, ChevronRight, Edit3, FileText, Play, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEvent, Fragment, useEffect, useState } from 'react';
type Log = {
    id: number;
    status: string;
    http_status: number | null;
    attempt: number;
    duration_ms: number | null;
    message: string | null;
    created_at: string;
};
type Api = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    base_url: string | null;
    endpoint: string | null;
    method: string;
    auth_type: string;
    credential_key: string | null;
    target_table: string[] | null;
    retries: number;
    retry_delay_seconds: number;
    timeout_seconds: number;
    status: boolean;
    last_run_status: string | null;
    last_run_at: string | null;
    logs: Log[];
};
type Page<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type FormData = {
    name: string;
    code: string;
    description: string;
    base_url: string;
    endpoint: string;
    method: string;
    auth_type: string;
    credential_key: string;
    target_table: string;
    retries: number;
    retry_delay_seconds: number;
    timeout_seconds: number;
    status: boolean;
};
const empty: FormData = {
    name: '',
    code: '',
    description: '',
    base_url: '',
    endpoint: '',
    method: 'GET',
    auth_type: 'none',
    credential_key: '',
    target_table: '',
    retries: 3,
    retry_delay_seconds: 10,
    timeout_seconds: 30,
    status: true,
};
export default function ApiIntegrations({
    integrations,
    filters,
    pageSizeOptions,
    canManage,
    manageableCodes,
}: {
    integrations: Page<Api>;
    filters: { search: string; per_page: number };
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
    manageableCodes: string[];
}) {
    const [search, setSearch] = useState(filters.search),
        [open, setOpen] = useState(false),
        [editing, setEditing] = useState<Api | null>(null),
        [logsFor, setLogsFor] = useState<Api | null>(null),
        [expandedId, setExpandedId] = useState<number | null>(null);
    const form = useForm<FormData>(empty);
    useEffect(() => {
        if (!integrations.data.some((a) => a.last_run_status === 'queued')) return;
        const timer = window.setInterval(() => router.reload({ only: ['integrations'] }), 3000);
        return () => window.clearInterval(timer);
    }, [integrations.data]);
    const load = (s = search, p = filters.per_page) =>
        router.get('/admin/api-integrations', { search: s, per_page: p }, { preserveState: true, replace: true });
    const create = () => {
        setEditing(null);
        form.setData(empty);
        form.clearErrors();
        setOpen(true);
    };
    const edit = (a: Api) => {
        setEditing(a);
        form.setData({
            name: a.name,
            code: a.code,
            description: a.description ?? '',
            base_url: a.base_url ?? '',
            endpoint: a.endpoint ?? '',
            method: a.method,
            auth_type: a.auth_type,
            credential_key: a.credential_key ?? '',
            target_table: a.target_table?.join(', ') ?? '',
            retries: a.retries,
            retry_delay_seconds: a.retry_delay_seconds,
            timeout_seconds: a.timeout_seconds,
            status: a.status,
        });
        form.clearErrors();
        setOpen(true);
    };
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const o = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) form.put(`/admin/api-integrations/${editing.id}`, o);
        else form.post('/admin/api-integrations', o);
    };
    return (
        <AppLayout breadcrumbs={[{ title: 'API Integrations', href: '/admin/api-integrations' }]}>
            <Head title="API Integrations" />
            <div className="mx-auto w-full max-w-[1680px] p-3 md:p-5">
                <section className="overflow-hidden rounded-xl border bg-white shadow-[0_10px_30px_-16px_rgba(15,23,42,.25)]">
                    <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                className="h-10 pl-9"
                                value={search}
                                placeholder="Search API integrations..."
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && load()}
                            />
                        </div>
                        {canManage && (
                            <Button onClick={create} className="bg-brand-teal text-white shadow-lg shadow-cyan-600/20">
                                <Plus className="size-4" />
                                Add API
                            </Button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-left text-sm">
                            <thead className="bg-[#faf8f2] text-[10px] font-bold tracking-wide text-slate-700 uppercase">
                                <tr>
                                    <th className="w-14 px-3 py-3"></th>
                                    {['S.No.', 'Name', 'Endpoint', 'Method', 'Authentication', 'Save to table', 'Retries', 'Status', 'Last run'].map(
                                        (h) => (
                                            <th key={h} className={`px-4 py-3 ${h === 'Last run' ? 'bg-amber-50 text-amber-700' : ''}`}>
                                                {h}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {integrations.data.map((a, i) => (
                                    <Fragment key={a.id}>
                                        <tr className="hover:bg-amber-50/30">
                                            <td className="px-3 py-3">
                                                <button
                                                    type="button"
                                                    aria-label={`${expandedId === a.id ? 'Collapse' : 'Expand'} ${a.name}`}
                                                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                                                    className="grid size-7 place-items-center rounded-full bg-[#f4b400] text-[#073b4c] shadow-md ring-1 shadow-amber-500/30 ring-amber-500/30"
                                                >
                                                    <ChevronRight
                                                        className={`size-4 stroke-[3] transition ${expandedId === a.id ? 'rotate-90' : ''}`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">{(integrations.from ?? 1) + i}</td>
                                            <td className="px-4 py-3">
                                                <b>{a.name}</b>
                                                <span className="block text-xs text-slate-500">{a.description || a.code}</span>
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-xs">{a.endpoint || '—'}</td>
                                            <td className="px-4 py-3">{a.method}</td>
                                            <td className="px-4 py-3 capitalize">
                                                {a.auth_type}
                                                <span className="block text-xs text-slate-500">{a.credential_key || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className="font-semibold text-slate-700">
                                                    {a.target_table?.length ? a.target_table.join(', ') : 'Raw payload only'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {a.retries} × {a.retry_delay_seconds}s
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    disabled={!manageableCodes.includes(a.code.toLowerCase())}
                                                    onClick={() =>
                                                        router.patch(
                                                            `/admin/api-integrations/${a.id}/status`,
                                                            { active: !a.status },
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                    className="flex items-center gap-2 font-semibold"
                                                >
                                                    <span
                                                        className={`relative h-5 w-9 rounded-full ring-1 ${a.status ? 'bg-[#f4b400] ring-amber-500' : 'bg-slate-300 ring-slate-300'}`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 size-4 rounded-full bg-white shadow ${a.status ? 'left-[18px]' : 'left-0.5'}`}
                                                        />
                                                    </span>
                                                    <span className={a.status ? 'text-amber-700' : 'text-slate-500'}>
                                                        {a.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="bg-amber-50/40 px-4 py-3 text-right">
                                                <span className="capitalize">{a.last_run_status || 'Never'}</span>
                                                {a.last_run_at && (
                                                    <span className="block text-xs text-slate-500">{new Date(a.last_run_at).toLocaleString()}</span>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === a.id && (
                                            <tr>
                                                <td colSpan={10} className="border-l-2 border-amber-400 bg-amber-50/20 px-16 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="mr-auto text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                                                            Actions
                                                        </span>
                                                        {manageableCodes.includes(a.code.toLowerCase()) && (
                                                            <Button
                                                                onClick={() =>
                                                                    router.post(`/admin/api-integrations/${a.id}/run`, {}, { preserveScroll: true })
                                                                }
                                                                className="bg-[#f4b400] text-[#073b4c] hover:bg-amber-400"
                                                            >
                                                                <Play className="size-3.5" />
                                                                Run
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" onClick={() => setLogsFor(a)}>
                                                            <FileText className="size-3.5" />
                                                            Logs
                                                        </Button>
                                                        {manageableCodes.includes(a.code.toLowerCase()) && (
                                                            <>
                                                                <Button variant="outline" onClick={() => edit(a)}>
                                                                    <Edit3 className="size-3.5" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    className="border-rose-200 text-rose-600"
                                                                    onClick={() =>
                                                                        window.confirm(`Delete ${a.name} and its logs?`) &&
                                                                        router.delete(`/admin/api-integrations/${a.id}`, { preserveScroll: true })
                                                                    }
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    Delete
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-xs">
                        <div className="flex items-center gap-2">
                            Showing {integrations.from ?? 0}–{integrations.to ?? 0} of {integrations.total}
                            <Select value={String(filters.per_page)} onValueChange={(v) => load(search, Number(v))}>
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
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!integrations.prev_page_url}
                                onClick={() => integrations.prev_page_url && router.get(integrations.prev_page_url)}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!integrations.next_page_url}
                                onClick={() => integrations.next_page_url && router.get(integrations.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl p-0 sm:p-0">
                    <MasterDialogHeader title={editing ? 'Edit API integration' : 'Create API integration'} />
                    <form onSubmit={submit}>
                        <div className="grid gap-4 p-6 sm:grid-cols-2">
                            <Field label="Name" error={form.errors.name}>
                                <Input value={form.data.name} placeholder="API name" onChange={(e) => form.setData('name', e.target.value)} />
                            </Field>
                            <Field label="Code" error={form.errors.code}>
                                <Input value={form.data.code} placeholder="Unique code" onChange={(e) => form.setData('code', e.target.value)} />
                            </Field>
                            <Field label="Description">
                                <Input
                                    value={form.data.description}
                                    placeholder="Description"
                                    onChange={(e) => form.setData('description', e.target.value)}
                                />
                            </Field>
                            <Field label="Base URL" error={form.errors.base_url}>
                                <Input
                                    value={form.data.base_url}
                                    placeholder="https://api.example.com"
                                    onChange={(e) => form.setData('base_url', e.target.value)}
                                />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Endpoint" error={form.errors.endpoint}>
                                    <Input
                                        value={form.data.endpoint}
                                        placeholder="/api/resource"
                                        onChange={(e) => form.setData('endpoint', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <Field label="Method">
                                <Select value={form.data.method} onValueChange={(v) => form.setData('method', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((v) => (
                                            <SelectItem key={v} value={v}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Authentication">
                                <Select value={form.data.auth_type} onValueChange={(v) => form.setData('auth_type', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['none', 'basic', 'bearer'].map((v) => (
                                            <SelectItem key={v} value={v}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Credential environment key">
                                <Input
                                    value={form.data.credential_key}
                                    placeholder="API_TOKEN_KEY"
                                    onChange={(e) => form.setData('credential_key', e.target.value)}
                                />
                            </Field>
                            <Field label="Target tables (comma separated)" error={form.errors.target_table}>
                                <Input value={form.data.target_table} onChange={(e) => form.setData('target_table', e.target.value)} />
                            </Field>
                            <Field label="Retries">
                                <Input type="number" value={form.data.retries} onChange={(e) => form.setData('retries', Number(e.target.value))} />
                            </Field>
                            <Field label="Retry delay (seconds)">
                                <Input
                                    type="number"
                                    value={form.data.retry_delay_seconds}
                                    onChange={(e) => form.setData('retry_delay_seconds', Number(e.target.value))}
                                />
                            </Field>
                            <Field label="Timeout (seconds)">
                                <Input
                                    type="number"
                                    value={form.data.timeout_seconds}
                                    onChange={(e) => form.setData('timeout_seconds', Number(e.target.value))}
                                />
                            </Field>
                            <label className="flex items-center gap-2 text-sm font-semibold">
                                <input type="checkbox" checked={form.data.status} onChange={(e) => form.setData('status', e.target.checked)} />
                                Active
                            </label>
                        </div>
                        <DialogFooter className="border-t px-6 py-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button disabled={form.processing} className="bg-brand-teal text-white">
                                {form.processing ? 'Saving…' : 'Save API'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={!!logsFor} onOpenChange={(o) => !o && setLogsFor(null)}>
                <DialogContent className="max-w-4xl p-0 sm:p-0 [&>button]:hidden">
                    <div className="relative">
                        <MasterDialogHeader title={`${logsFor?.name ?? ''} · Run logs`} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Close run logs"
                            onClick={() => setLogsFor(null)}
                            className="absolute top-5 right-5 border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        >
                            <X className="size-5" />
                        </Button>
                    </div>
                    <div className="max-h-[65vh] overflow-auto p-5">
                        {logsFor?.logs.length ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase">
                                    <tr>
                                        {['Time', 'Status', 'Attempt', 'HTTP', 'Duration', 'Message'].map((h) => (
                                            <th key={h} className="p-3">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {logsFor.logs.map((l) => (
                                        <tr key={l.id}>
                                            <td className="p-3">{new Date(l.created_at).toLocaleString()}</td>
                                            <td className="p-3 font-semibold capitalize">{l.status}</td>
                                            <td className="p-3">{l.attempt}</td>
                                            <td className="p-3">{l.http_status ?? '—'}</td>
                                            <td className="p-3">{l.duration_ms ? `${l.duration_ms} ms` : '—'}</td>
                                            <td className="p-3">{l.message || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid place-items-center py-16 text-slate-500">
                                <Activity className="mb-2 size-8" />
                                No run logs yet.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
