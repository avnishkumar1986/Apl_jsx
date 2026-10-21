import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    Download,
    FileText,
    Headphones,
    Layers3,
    LockKeyhole,
    MessageSquare,
    Paperclip,
    Send,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { FormEvent } from 'react';

type Attachment = { id: number; name: string; size: number };
type Message = { id: number; message: string; author: string; user_id: string; is_internal: boolean; created_at: string; attachments: Attachment[] };
type History = {
    id: number;
    action: string;
    field: string | null;
    old_value: string | null;
    new_value: string | null;
    user: string;
    created_at: string;
};
type Ticket = {
    id: number;
    ticket_number: string;
    subject: string;
    description: string;
    module: string;
    support_team: string;
    requester: string;
    assignee: string | null;
    assigned_to: string | null;
    priority: string;
    status: string;
    location: string | null;
    due_at: string | null;
    created_at: string;
    resolution_summary: string | null;
    attachments: Attachment[];
    messages: Message[];
    history: History[];
};
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SupportShow({
    ticket,
    canManage,
    canInternalNote,
    agents,
    statuses,
    priorities,
}: {
    ticket: Ticket;
    canManage: boolean;
    canInternalNote: boolean;
    agents: { id: string; name: string }[];
    statuses: string[];
    priorities: string[];
}) {
    const { auth } = usePage<SharedData>().props;
    const reply = useForm<{ message: string; is_internal: boolean; attachments: File[] }>({ message: '', is_internal: false, attachments: [] });
    const manage = useForm({
        assigned_to: ticket.assigned_to ?? '',
        ticket_status: ticket.status,
        priority: ticket.priority,
        resolution_summary: ticket.resolution_summary ?? '',
    });
    const sendReply = (event: FormEvent) => {
        event.preventDefault();
        reply.post(`/support/${ticket.id}/replies`, { forceFormData: true, preserveScroll: true, onSuccess: () => reply.reset() });
    };
    const update = (event: FormEvent) => {
        event.preventDefault();
        manage.patch(`/support/${ticket.id}`, { preserveScroll: true });
    };
    const date = (value: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Support Desk', href: '/support' },
                { title: ticket.ticket_number, href: `/support/${ticket.id}` },
            ]}
        >
            <Head title={ticket.ticket_number} />
            <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                <div className="mx-auto max-w-[1400px] space-y-4">
                    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="h-1 bg-gradient-to-r from-orange-500 via-cyan-600 to-slate-900" />
                        <div className="p-5 sm:p-6">
                            <Link
                                href="/support"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 transition hover:text-cyan-900"
                            >
                                <ArrowLeft className="size-3.5" /> Back to Support Desk
                            </Link>
                            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex min-w-0 items-start gap-4">
                                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                                        <Headphones className="size-6" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-white">
                                                {ticket.ticket_number}
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-emerald-50 text-emerald-700' : ticket.status.includes('waiting') ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'}`}
                                            >
                                                {label(ticket.status)}
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${ticket.priority === 'critical' ? 'bg-red-50 text-red-700' : ticket.priority === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {label(ticket.priority)} priority
                                            </span>
                                        </div>
                                        <h1 className="mt-3 text-xl leading-tight font-black text-slate-950 sm:text-2xl">{ticket.subject}</h1>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Support request submitted by <b className="text-slate-700">{ticket.requester}</b>
                                        </p>
                                    </div>
                                </div>
                                <div className="grid shrink-0 gap-2 text-xs sm:grid-cols-3 lg:min-w-[540px]">
                                    <HeaderDetail icon={Layers3} label="Application module" value={ticket.module} />
                                    <HeaderDetail icon={UsersRound} label="Support team" value={ticket.support_team} />
                                    <HeaderDetail icon={CalendarDays} label="Submitted" value={date(ticket.created_at)} />
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                        <main className="space-y-4">
                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="text-sm font-black text-slate-900">Issue description</h2>
                                <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">{ticket.description}</p>
                                {ticket.attachments.length > 0 && (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {ticket.attachments.map((file) => (
                                            <AttachmentLink key={file.id} file={file} />
                                        ))}
                                    </div>
                                )}
                            </section>
                            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b px-5 py-4">
                                    <div>
                                        <h2 className="font-black text-slate-900">Conversation</h2>
                                        <p className="text-xs text-slate-500">Replies and progress updates</p>
                                    </div>
                                    <MessageSquare className="size-5 text-cyan-700" />
                                </div>
                                <div className="space-y-4 bg-slate-50 p-4 sm:p-5">
                                    {ticket.messages.map((message) => {
                                        const mine = message.user_id === String(auth.user.unique_id);
                                        return (
                                            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                <article
                                                    className={`max-w-[88%] rounded-2xl border p-4 shadow-sm sm:max-w-[75%] ${message.is_internal ? 'border-amber-200 bg-amber-50' : mine ? 'border-cyan-700 bg-cyan-700 text-white' : 'border-slate-200 bg-white'}`}
                                                >
                                                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold">
                                                        <span>{message.author}</span>
                                                        {message.is_internal && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-amber-900">
                                                                <LockKeyhole className="size-3" /> Internal note
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm leading-6 whitespace-pre-wrap">{message.message}</p>
                                                    {message.attachments.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {message.attachments.map((file) => (
                                                                <AttachmentLink key={file.id} file={file} dark={mine && !message.is_internal} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p
                                                        className={`mt-2 text-right text-[9px] ${mine && !message.is_internal ? 'text-cyan-100' : 'text-slate-400'}`}
                                                    >
                                                        {date(message.created_at)}
                                                    </p>
                                                </article>
                                            </div>
                                        );
                                    })}
                                    {!ticket.messages.length && <p className="py-8 text-center text-sm text-slate-500">No replies yet.</p>}
                                </div>
                                <form onSubmit={sendReply} className="space-y-3 border-t p-4 sm:p-5">
                                    <Textarea
                                        rows={4}
                                        value={reply.data.message}
                                        onChange={(e) => reply.setData('message', e.target.value)}
                                        placeholder="Write a reply or update…"
                                    />
                                    {reply.errors.message && <p className="text-xs text-red-600">{reply.errors.message}</p>}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                                <Paperclip className="size-4" /> Attach files
                                                <input
                                                    className="sr-only"
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => reply.setData('attachments', Array.from(e.target.files ?? []))}
                                                />
                                            </label>
                                            {reply.data.attachments.length > 0 && (
                                                <span className="text-xs text-slate-500">{reply.data.attachments.length} selected</span>
                                            )}
                                            {canInternalNote && (
                                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={reply.data.is_internal}
                                                        onChange={(e) => reply.setData('is_internal', e.target.checked)}
                                                    />{' '}
                                                    Internal note
                                                </label>
                                            )}
                                        </div>
                                        <Button disabled={reply.processing} className="bg-brand-teal gap-2">
                                            <Send className="size-4" /> {reply.processing ? 'Sending…' : 'Send'}
                                        </Button>
                                    </div>
                                </form>
                            </section>
                        </main>
                        <aside className="space-y-4">
                            {canManage && (
                                <form onSubmit={update} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div>
                                        <h2 className="font-black text-slate-900">Manage ticket</h2>
                                        <p className="text-xs text-slate-500">Assignment and workflow</p>
                                    </div>
                                    <Field label="Assigned agent">
                                        <select value={manage.data.assigned_to} onChange={(e) => manage.setData('assigned_to', e.target.value)}>
                                            <option value="">Unassigned</option>
                                            {agents.map((agent) => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Status">
                                        <select value={manage.data.ticket_status} onChange={(e) => manage.setData('ticket_status', e.target.value)}>
                                            {statuses.map((status) => (
                                                <option key={status} value={status}>
                                                    {label(status)}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Priority">
                                        <select value={manage.data.priority} onChange={(e) => manage.setData('priority', e.target.value)}>
                                            {priorities.map((priority) => (
                                                <option key={priority} value={priority}>
                                                    {label(priority)}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                                        Resolution summary
                                        <Textarea
                                            rows={4}
                                            value={manage.data.resolution_summary}
                                            onChange={(e) => manage.setData('resolution_summary', e.target.value)}
                                            placeholder="Required when resolving a ticket"
                                        />
                                    </label>
                                    <Button className="bg-brand-berry w-full text-white" disabled={manage.processing}>
                                        Save changes
                                    </Button>
                                </form>
                            )}
                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="font-black text-slate-900">Ticket details</h2>
                                <div className="mt-4 space-y-4">
                                    <Detail icon={UserRound} label="Assigned to" value={ticket.assignee ?? 'Unassigned'} />
                                    <Detail icon={Clock3} label="SLA due" value={ticket.due_at ? date(ticket.due_at) : 'No SLA deadline'} />
                                    <Detail icon={FileText} label="Location" value={ticket.location ?? 'Not available'} />
                                </div>
                            </section>
                            {canManage && (
                                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h2 className="font-black text-slate-900">Activity history</h2>
                                    <div className="mt-4 space-y-4 border-l border-slate-200 pl-4">
                                        {ticket.history.map((item) => (
                                            <div
                                                key={item.id}
                                                className="relative text-xs before:absolute before:top-1 before:-left-[21px] before:size-2.5 before:rounded-full before:bg-cyan-600 before:ring-4 before:ring-white"
                                            >
                                                <p className="font-bold text-slate-700">{label(item.action)}</p>
                                                {item.field && (
                                                    <p className="mt-1 text-slate-500">
                                                        {label(item.field)}: {item.old_value || 'None'} → {item.new_value || 'None'}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {item.user} · {date(item.created_at)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function AttachmentLink({ file, dark = false }: { file: Attachment; dark?: boolean }) {
    return (
        <a
            href={`/support/attachments/${file.id}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${dark ? 'border-white/30 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
        >
            <Download className="size-3.5" /> {file.name}
        </a>
    );
}
function Field({ label: text, children }: { label: string; children: React.ReactElement<{ className?: string }> }) {
    return (
        <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            {text}
            <div className="[&>select]:h-10 [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:px-3 [&>select]:font-normal">
                {children}
            </div>
        </label>
    );
}
function Detail({ icon: Icon, label: text, value }: { icon: typeof UserRound; label: string; value: string }) {
    return (
        <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                <Icon className="size-4" />
            </span>
            <div>
                <p className="text-[9px] font-bold tracking-wide text-slate-400 uppercase">{text}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{value}</p>
            </div>
        </div>
    );
}

function HeaderDetail({ icon: Icon, label: text, value }: { icon: typeof UserRound; label: string; value: string }) {
    return (
        <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-cyan-700" />
            <div className="min-w-0">
                <p className="text-[9px] font-bold tracking-wide text-slate-400 uppercase">{text}</p>
                <p className="mt-1 truncate font-bold text-slate-700" title={value}>
                    {value}
                </p>
            </div>
        </div>
    );
}
