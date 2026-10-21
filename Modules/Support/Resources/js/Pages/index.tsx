import ProjectPageHeader from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock3, Headphones, Plus, Search, TicketCheck, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Module = { id: number; name: string; description: string | null };
type Ticket = {
    id: number;
    ticket_number: string;
    subject: string;
    module: string;
    support_team: string;
    requester: string;
    assignee: string | null;
    priority: string;
    status: string;
    due_at: string | null;
    created_at: string;
};
type TicketPage = {
    data: Ticket[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusColor: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    assigned: 'bg-violet-50 text-violet-700',
    in_progress: 'bg-amber-50 text-amber-700',
    waiting_for_user: 'bg-orange-50 text-orange-700',
    waiting_for_vendor: 'bg-orange-50 text-orange-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-slate-100 text-slate-600',
    reopened: 'bg-rose-50 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
};
const priorityColor: Record<string, string> = { low: 'text-slate-500', medium: 'text-cyan-700', high: 'text-orange-600', critical: 'text-red-600' };

export default function SupportIndex({
    tickets,
    modules,
    filters,
    stats,
    statuses,
    priorities,
    canManage,
    supportTeam,
}: {
    tickets: TicketPage;
    modules: Module[];
    filters: Record<string, string>;
    stats: Record<string, number>;
    statuses: string[];
    priorities: string[];
    canManage: boolean;
    supportTeam: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const form = useForm<{ subject: string; description: string; module_id: string; priority: string; attachments: File[] }>({
        subject: '',
        description: '',
        module_id: '',
        priority: 'medium',
        attachments: [],
    });
    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get('/support', { search, status, priority }, { preserveState: true, replace: true });
    };
    const create = (event: FormEvent) => {
        event.preventDefault();
        form.post('/support', {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };

    if (!canManage) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Create Ticket', href: '/support' }]}>
                <Head title="Create Support Ticket" />
                <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                    <div className="mx-auto max-w-3xl space-y-4">
                        <ProjectPageHeader
                            eyebrow="Employee support"
                            title="Create Ticket"
                            subtitle="Tell us what you need help with and the support team will respond."
                            icon={<Headphones className="size-5" />}
                        />
                        <form onSubmit={create} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4 sm:px-7">
                                <h2 className="font-black text-slate-900">Support request</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    All required fields are marked below. Add screenshots or documents if helpful.
                                </p>
                            </div>
                            <div className="grid gap-5 p-5 sm:p-7">
                                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                                    Subject <span className="sr-only">required</span>
                                    <Input
                                        value={form.data.subject}
                                        onChange={(e) => form.setData('subject', e.target.value)}
                                        placeholder="Short summary of the issue"
                                    />
                                    {form.errors.subject && <span className="text-xs text-red-600">{form.errors.subject}</span>}
                                </label>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                                        Module
                                        <select
                                            className="h-10 rounded-md border border-slate-200 bg-white px-3 font-normal"
                                            value={form.data.module_id}
                                            onChange={(e) => form.setData('module_id', e.target.value)}
                                        >
                                            <option value="">Select module</option>
                                            {modules.map((module) => (
                                                <option key={module.id} value={module.id}>
                                                    {module.name}
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.module_id && <span className="text-xs text-red-600">{form.errors.module_id}</span>}
                                        {!modules.length && (
                                            <span className="text-xs text-amber-700">No active module is allocated to your account.</span>
                                        )}
                                    </label>
                                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                                        Support Team
                                        <Input value={supportTeam} readOnly className="bg-slate-50 text-slate-600" />
                                    </label>
                                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                                        Priority
                                        <select
                                            className="h-10 rounded-md border border-slate-200 bg-white px-3 font-normal"
                                            value={form.data.priority}
                                            onChange={(e) => form.setData('priority', e.target.value)}
                                        >
                                            {priorities.map((item) => (
                                                <option key={item} value={item}>
                                                    {label(item)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                                    Description
                                    <Textarea
                                        rows={8}
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Explain what happened, what you expected, and any troubleshooting already attempted."
                                    />
                                    {form.errors.description && <span className="text-xs text-red-600">{form.errors.description}</span>}
                                </label>
                                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                                    Attachments <span className="font-normal text-slate-500">Optional · maximum 5 files, 10 MB each</span>
                                    <Input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                        onChange={(e) => form.setData('attachments', Array.from(e.target.files ?? []))}
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                                <Button disabled={form.processing || !modules.length} className="bg-brand-berry min-w-36 text-white">
                                    {form.processing ? 'Creating…' : 'Create Ticket'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Support Desk', href: '/support' }]}>
            <Head title="Support Desk" />
            <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                <div className="mx-auto max-w-[1500px] space-y-4">
                    <ProjectPageHeader
                        eyebrow="Employee service desk"
                        title="Support Desk"
                        subtitle={
                            canManage ? 'Manage employee requests, assignments and resolution progress' : 'Raise and track your support requests'
                        }
                        icon={<Headphones className="size-5" />}
                        actions={
                            <Button onClick={() => setOpen(true)} className="bg-brand-berry hover:bg-brand-berry/90 gap-2 text-white">
                                <Plus className="size-4" /> New ticket
                            </Button>
                        }
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            ['Total tickets', stats.total, TicketCheck, 'text-cyan-700 bg-cyan-50'],
                            ['Active', stats.open, AlertCircle, 'text-blue-700 bg-blue-50'],
                            ['Waiting', stats.waiting, Clock3, 'text-amber-700 bg-amber-50'],
                            ['Resolved', stats.resolved, CheckCircle2, 'text-emerald-700 bg-emerald-50'],
                        ].map(([title, value, Icon, color]) => (
                            <div key={String(title)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <span className={`grid size-10 place-items-center rounded-xl ${color}`}>
                                    <Icon className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">{title as string}</p>
                                    <p className="text-2xl font-black text-slate-900">{value as number}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form
                        onSubmit={apply}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto] md:items-end"
                    >
                        <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                            <span>Search</span>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Ticket number or subject"
                                />
                            </div>
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                            Status
                            <select
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 font-normal"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">All statuses</option>
                                {statuses.map((item) => (
                                    <option key={item} value={item}>
                                        {label(item)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                            Priority
                            <select
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 font-normal"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="">All priorities</option>
                                {priorities.map((item) => (
                                    <option key={item} value={item}>
                                        {label(item)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button type="submit" className="bg-brand-teal">
                            Apply
                        </Button>
                    </form>
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b px-5 py-4">
                            <h2 className="font-bold text-slate-900">{canManage ? 'Support queue' : 'My tickets'}</h2>
                            <p className="text-xs text-slate-500">
                                {tickets.total} ticket{tickets.total === 1 ? '' : 's'}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Ticket</th>
                                        <th className="px-5 py-3">Module</th>
                                        <th className="px-5 py-3">Team</th>
                                        {canManage && <th className="px-5 py-3">Requester</th>}
                                        <th className="px-5 py-3">Assigned to</th>
                                        <th className="px-5 py-3">Priority</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tickets.data.map((ticket) => (
                                        <tr key={ticket.id} className="transition hover:bg-cyan-50/30">
                                            <td className="px-5 py-4">
                                                <Link href={`/support/${ticket.id}`} className="font-bold text-slate-900 hover:text-cyan-700">
                                                    {ticket.subject}
                                                </Link>
                                                <p className="mt-1 font-mono text-[10px] text-cyan-700">{ticket.ticket_number}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">{ticket.module}</td>
                                            <td className="px-5 py-4 text-slate-600">{ticket.support_team}</td>
                                            {canManage && <td className="px-5 py-4 text-slate-600">{ticket.requester}</td>}
                                            <td className="px-5 py-4 text-slate-600">{ticket.assignee ?? 'Unassigned'}</td>
                                            <td className={`px-5 py-4 font-bold ${priorityColor[ticket.priority]}`}>{label(ticket.priority)}</td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor[ticket.status]}`}>
                                                    {label(ticket.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-500">
                                                {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                                                    new Date(ticket.created_at),
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!tickets.data.length && (
                            <div className="p-12 text-center">
                                <Headphones className="mx-auto size-9 text-slate-300" />
                                <p className="mt-3 text-sm font-semibold text-slate-600">No support tickets found</p>
                            </div>
                        )}
                        <div className="flex items-center justify-between border-t bg-slate-50 px-5 py-3 text-xs text-slate-600">
                            <span>
                                Showing {tickets.from ?? 0}–{tickets.to ?? 0} of {tickets.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!tickets.prev_page_url}
                                    onClick={() => tickets.prev_page_url && router.get(tickets.prev_page_url)}
                                >
                                    Previous
                                </Button>
                                <b>
                                    {tickets.current_page} / {tickets.last_page}
                                </b>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!tickets.next_page_url}
                                    onClick={() => tickets.next_page_url && router.get(tickets.next_page_url)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            {open && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
                    onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
                >
                    <form onSubmit={create} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Create support ticket</h2>
                                <p className="mt-1 text-sm text-slate-500">Describe the issue clearly for a faster resolution.</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="grid gap-5 p-6">
                            <label className="grid gap-1.5 text-sm font-bold">
                                Subject
                                <Input
                                    value={form.data.subject}
                                    onChange={(e) => form.setData('subject', e.target.value)}
                                    placeholder="Short summary of the issue"
                                />
                                {form.errors.subject && <span className="text-xs text-red-600">{form.errors.subject}</span>}
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="grid gap-1.5 text-sm font-bold">
                                    Module
                                    <select
                                        className="h-10 rounded-md border border-slate-200 bg-white px-3 font-normal"
                                        value={form.data.module_id}
                                        onChange={(e) => form.setData('module_id', e.target.value)}
                                    >
                                        <option value="">Select module</option>
                                        {modules.map((module) => (
                                            <option key={module.id} value={module.id}>
                                                {module.name}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.module_id && <span className="text-xs text-red-600">{form.errors.module_id}</span>}
                                    {!modules.length && (
                                        <span className="text-xs text-amber-700">No active module is allocated to your account.</span>
                                    )}
                                </label>
                                <label className="grid gap-1.5 text-sm font-bold">
                                    Support Team
                                    <Input value={supportTeam} readOnly className="bg-slate-50 text-slate-600" />
                                </label>
                                <label className="grid gap-1.5 text-sm font-bold">
                                    Priority
                                    <select
                                        className="h-10 rounded-md border border-slate-200 bg-white px-3 font-normal"
                                        value={form.data.priority}
                                        onChange={(e) => form.setData('priority', e.target.value)}
                                    >
                                        {priorities.map((item) => (
                                            <option key={item} value={item}>
                                                {label(item)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="grid gap-1.5 text-sm font-bold">
                                Description
                                <Textarea
                                    rows={7}
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="What happened, what did you expect, and what have you already tried?"
                                />
                                {form.errors.description && <span className="text-xs text-red-600">{form.errors.description}</span>}
                            </label>
                            <label className="grid gap-1.5 text-sm font-bold">
                                Attachments <span className="font-normal text-slate-500">Up to 5 files, 10 MB each</span>
                                <Input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    onChange={(e) => form.setData('attachments', Array.from(e.target.files ?? []))}
                                />
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button disabled={form.processing || !modules.length} className="bg-brand-berry text-white">
                                {form.processing ? 'Creating…' : 'Create ticket'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
