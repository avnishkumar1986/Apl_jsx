import ProjectPageHeader from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Ban, MapPin, Network, RotateCcw, Search, ShieldCheck, TriangleAlert, Unlock } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type TrafficLog = {
    id: number;
    userName: string;
    action: string;
    routeName: string | null;
    method: string;
    url: string;
    statusCode: number | null;
    ipAddress: string | null;
    isBlocked: boolean;
    locationName: string | null;
    latitude: string | null;
    longitude: string | null;
    userAgent: string | null;
    durationMs: number | null;
    isInertia: boolean;
    createdAt: string;
};

type BlockedIp = {
    id: number;
    ipAddress: string;
    reason: string | null;
    isActive: boolean;
    blockedBy: string | null;
    blockedAt: string;
    expiresAt: string | null;
    unblockedBy: string | null;
    unblockedAt: string | null;
};

type Page<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    logs: Page<TrafficLog>;
    filters: Record<string, string>;
    summary: { requestsToday: number; uniqueIpsToday: number; errorsToday: number; blockedIps: number };
    blockedIps: BlockedIp[];
    currentIp: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Traffic monitor', href: '/admin/traffic-monitor' },
];
const inputClass =
    'h-10 w-full rounded-lg border border-slate-200 px-3 font-normal text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

export default function TrafficMonitor({ logs, filters, summary, blockedIps, currentIp }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [location, setLocation] = useState(filters.location ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [method, setMethod] = useState(filters.method ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [ipStatus, setIpStatus] = useState(filters.ip_status ?? '');
    const [ipAddress, setIpAddress] = useState('');
    const [reason, setReason] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/traffic-monitor',
            { search, location, from, to, method, status, ip_status: ipStatus },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setLocation('');
        setFrom('');
        setTo('');
        setMethod('');
        setStatus('');
        setIpStatus('');
        router.get('/admin/traffic-monitor', {}, { replace: true });
    };

    const blockIp = (event: FormEvent) => {
        event.preventDefault();
        router.post(
            '/admin/traffic-monitor/blocked-ips',
            { ip_address: ipAddress, reason, expires_at: expiresAt || null },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIpAddress('');
                    setReason('');
                    setExpiresAt('');
                },
            },
        );
    };

    const unblock = (blocked: BlockedIp) => {
        if (window.confirm(`Unblock ${blocked.ipAddress}?`)) {
            router.delete(`/admin/traffic-monitor/blocked-ips/${blocked.id}`, { preserveScroll: true });
        }
    };

    const selectIpForBlocking = (ip: string | null) => {
        if (ip && ip !== currentIp) {
            setIpAddress(ip);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Traffic monitor" />
            <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                <div className="mx-auto max-w-[1600px] space-y-5">
                    <ProjectPageHeader
                        eyebrow="Portal security"
                        title="Traffic monitor"
                        subtitle="Monitor incoming requests, review locations, and control IP access"
                        icon={<Network className="size-5" />}
                        actions={
                            <Link href="/dashboard/activity" className="text-sm font-semibold text-white hover:underline">
                                View user activity
                            </Link>
                        }
                    />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard icon={<Network />} label="Requests today" value={summary.requestsToday} tone="cyan" />
                        <SummaryCard icon={<MapPin />} label="Unique IPs today" value={summary.uniqueIpsToday} tone="blue" />
                        <SummaryCard icon={<TriangleAlert />} label="Errors today" value={summary.errorsToday} tone="amber" />
                        <SummaryCard icon={<Ban />} label="Currently blocked" value={summary.blockedIps} tone="red" />
                    </div>

                    <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
                        <form onSubmit={blockIp} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <ShieldCheck className="size-5 text-cyan-700" />
                                <div>
                                    <h2 className="font-bold text-slate-900">Block an IP address</h2>
                                    <p className="text-xs text-slate-500">Your current IP ({currentIp ?? 'unknown'}) cannot be blocked.</p>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="IP address">
                                    <input
                                        required
                                        value={ipAddress}
                                        onChange={(event) => setIpAddress(event.target.value)}
                                        placeholder="203.0.113.10"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Expires at (optional)">
                                    <input
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(event) => setExpiresAt(event.target.value)}
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="Reason">
                                        <input
                                            value={reason}
                                            onChange={(event) => setReason(event.target.value)}
                                            placeholder="Suspicious automated traffic"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </div>
                            <Button type="submit" className="mt-4 gap-2 bg-red-600 hover:bg-red-700" disabled={!ipAddress || ipAddress === currentIp}>
                                <Ban className="size-4" /> Block IP
                            </Button>
                        </form>

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                <h2 className="font-bold text-slate-900">IP block history</h2>
                                <span className="text-xs text-slate-500">{blockedIps.length} stored</span>
                            </div>
                            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                                {blockedIps.map((blocked) => (
                                    <div key={blocked.id} className="flex items-start gap-3 px-4 py-3 text-xs">
                                        <span className={`mt-1 size-2 rounded-full ${blocked.isActive ? 'bg-red-500' : 'bg-slate-300'}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <b className="font-mono text-sm text-slate-900">{blocked.ipAddress}</b>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-semibold ${blocked.isActive ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {blocked.isActive ? 'Blocked' : 'Unblocked'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-slate-600">{blocked.reason || 'No reason recorded'}</p>
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                Blocked {formatDate(blocked.blockedAt)} by {blocked.blockedBy ?? 'System'}
                                                {blocked.expiresAt ? ` · expires ${formatDate(blocked.expiresAt)}` : ''}
                                            </p>
                                        </div>
                                        {blocked.isActive && (
                                            <Button size="sm" variant="outline" onClick={() => unblock(blocked)} className="gap-1">
                                                <Unlock className="size-3.5" /> Unblock
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {!blockedIps.length && <p className="p-8 text-center text-sm text-slate-500">No IP addresses have been blocked.</p>}
                            </div>
                        </section>
                    </section>

                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-8 xl:items-end"
                    >
                        <Field label="Search">
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="User, URL or IP"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Location">
                            <input
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="City or country"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="From">
                            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
                        </Field>
                        <Field label="To">
                            <input
                                type="date"
                                min={from || undefined}
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Method">
                            <Select value={method} onChange={setMethod} options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} />
                        </Field>
                        <Field label="Status">
                            <Select value={status} onChange={setStatus} options={['success', 'error']} />
                        </Field>
                        <Field label="IP access">
                            <Select value={ipStatus} onChange={setIpStatus} options={['allowed', 'blocked']} />
                        </Field>
                        <div className="flex gap-2">
                            <Button type="submit" className="gap-1">
                                <Search className="size-4" /> Apply
                            </Button>
                            <Button type="button" variant="outline" onClick={resetFilters}>
                                <RotateCcw className="size-4" />
                            </Button>
                        </div>
                    </form>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <h2 className="font-bold text-slate-900">Incoming traffic</h2>
                            <span className="text-xs text-slate-500">{logs.total} requests</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">IP address</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Request</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Response</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.data.map((log) => (
                                        <tr key={log.id} className="align-top hover:bg-slate-50/70">
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(log.createdAt)}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{log.userName}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono">{log.ipAddress ?? '—'}</span>
                                                {log.isBlocked && (
                                                    <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                                                        BLOCKED
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {log.locationName ?? 'Unknown'}
                                                {log.latitude && log.longitude && (
                                                    <a
                                                        className="ml-1 text-cyan-700 hover:underline"
                                                        href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Map
                                                    </a>
                                                )}
                                            </td>
                                            <td className="max-w-xs px-4 py-3">
                                                <b>{log.method}</b>
                                                <p className="mt-1 truncate text-slate-500" title={log.url}>
                                                    {log.routeName ?? log.url}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2 py-1 font-bold ${(log.statusCode ?? 500) < 400 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                                                >
                                                    {log.statusCode ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{log.durationMs === null ? '—' : `${log.durationMs} ms`}</td>
                                            <td className="px-4 py-3 text-right">
                                                {log.ipAddress && !log.isBlocked && log.ipAddress !== currentIp && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => selectIpForBlocking(log.ipAddress)}
                                                        className="gap-1 text-red-700"
                                                    >
                                                        <Ban className="size-3.5" /> Block
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!logs.data.length && <p className="p-10 text-center text-sm text-slate-500">No traffic records match these filters.</p>}
                        </div>
                        <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-xs text-slate-600">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
            {label}
            {children}
        </label>
    );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
    return (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} bg-white capitalize`}>
            <option value="">All</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

function SummaryCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: 'cyan' | 'blue' | 'amber' | 'red' }) {
    const colors = {
        cyan: 'bg-cyan-50 text-cyan-700',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        red: 'bg-red-50 text-red-700',
    };
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`grid size-10 place-items-center rounded-xl [&>svg]:size-5 ${colors[tone]}`}>{icon}</span>
            <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value.toLocaleString('en-IN')}</p>
            </div>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
