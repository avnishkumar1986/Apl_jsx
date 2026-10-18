import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, History, RotateCcw, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Log = {
    id: number;
    userName: string;
    action: string;
    routeName: string | null;
    method: string;
    url: string | null;
    statusCode: number | null;
    ipAddress: string | null;
    userAgent: string | null;
    durationMs: number | null;
    isInertia: boolean;
    createdAt: string;
};
type LogPage = {
    data: Log[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portal activity', href: '/dashboard/activity' },
];

export default function PortalActivity({ logs, filters }: { logs: LogPage; filters: Record<string, string> }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [method, setMethod] = useState(filters.method ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get('/dashboard/activity', { search, from, to, method, status }, { preserveState: true, replace: true });
    };
    const reset = () => {
        setSearch('');
        setFrom('');
        setTo('');
        setMethod('');
        setStatus('');
        router.get('/dashboard/activity', {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portal activity" />
            <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                <div className="mx-auto max-w-[1500px] space-y-4">
                    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07374b] to-[#0e8ca6] p-5 text-white shadow-lg">
                        <History className="absolute -right-8 -bottom-10 size-44 text-white/5" />
                        <div className="relative flex items-center justify-between gap-3">
                            <div>
                                <p className="text-brand-aqua text-[10px] font-bold tracking-widest uppercase">Audit trail</p>
                                <h1 className="mt-1 text-2xl font-bold">Portal activity</h1>
                                <p className="mt-1 text-xs text-white/75">Complete user request history and technical details</p>
                            </div>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold">
                                <ArrowLeft className="size-4" /> Dashboard
                            </Link>
                        </div>
                    </header>
                    <form
                        onSubmit={apply}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_.8fr_.8fr_auto_auto] xl:items-end"
                    >
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            Search
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="User, action, route, URL or IP"
                                    className="h-10 w-full rounded-lg border border-slate-200 pr-3 pl-9 font-normal"
                                />
                            </div>
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            From
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 font-normal"
                            />
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            To
                            <input
                                type="date"
                                min={from || undefined}
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 font-normal"
                            />
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            Method
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-2 font-normal"
                            >
                                <option value="">All</option>
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => (
                                    <option key={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            Status
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-2 font-normal"
                            >
                                <option value="">All</option>
                                <option value="success">Success</option>
                                <option value="error">Error</option>
                            </select>
                        </label>
                        <Button type="submit" className="bg-brand-teal h-10">
                            Apply
                        </Button>
                        <Button type="button" variant="outline" onClick={reset} className="h-10 gap-1">
                            <RotateCcw className="size-3.5" /> Reset
                        </Button>
                    </form>
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <h2 className="text-sm font-bold text-slate-900">Activity records</h2>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                {logs.total} records
                            </span>
                        </div>
                        <div className="space-y-2 p-3">
                            {logs.data.map((log) => {
                                const success = log.statusCode !== null && log.statusCode < 400;
                                const time = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                                    new Date(log.createdAt),
                                );
                                return (
                                    <details
                                        key={log.id}
                                        className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 open:bg-white"
                                    >
                                        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-3 py-2 marker:hidden">
                                            <span className={`size-2 shrink-0 rounded-full ${success ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <p className="min-w-0 flex-1 truncate text-xs">
                                                <b>{log.userName}</b>
                                                <span className="mx-2 text-slate-300">•</span>
                                                {log.action}
                                                <span className="mx-2 text-slate-300">•</span>
                                                <span className="text-slate-500">{time}</span>
                                            </p>
                                            <span className="rounded bg-white px-2 py-1 text-[9px] font-bold ring-1 ring-slate-200">
                                                {log.method}
                                            </span>
                                            <span className="hidden text-[10px] font-semibold text-cyan-700 sm:inline">View details</span>
                                            <ChevronDown className="size-3.5 text-cyan-700 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div className="grid gap-3 border-t border-slate-200 bg-white p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                                            <Detail label="Status" value={String(log.statusCode ?? 'Not recorded')} />
                                            <Detail label="Response time" value={log.durationMs === null ? 'Not recorded' : `${log.durationMs} ms`} />
                                            <Detail label="Route" value={log.routeName ?? 'Unnamed route'} />
                                            <Detail label="Request type" value={log.isInertia ? 'Inertia navigation' : 'Standard request'} />
                                            <Detail label="IP address" value={log.ipAddress ?? 'Not recorded'} />
                                            <Detail label="Date and time" value={time} />
                                            <div className="sm:col-span-2">
                                                <Detail label="URL" value={log.url ?? 'Not recorded'} />
                                            </div>
                                            <div className="sm:col-span-2 lg:col-span-4">
                                                <Detail label="Browser and device" value={log.userAgent ?? 'Not recorded'} />
                                            </div>
                                        </div>
                                    </details>
                                );
                            })}
                            {!logs.data.length && <p className="p-10 text-center text-sm text-slate-500">No activity records found.</p>}
                        </div>
                        <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Showing {logs.from ?? 0}–{logs.to ?? 0} of {logs.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!logs.prev_page_url}
                                    onClick={() => logs.prev_page_url && router.get(logs.prev_page_url)}
                                >
                                    Previous
                                </Button>
                                <b>
                                    Page {logs.current_page} of {logs.last_page}
                                </b>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!logs.next_page_url}
                                    onClick={() => logs.next_page_url && router.get(logs.next_page_url)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-[9px] font-bold tracking-wide text-slate-400 uppercase">{label}</p>
            <p className="mt-1 font-medium break-all text-slate-700">{value}</p>
        </div>
    );
}
