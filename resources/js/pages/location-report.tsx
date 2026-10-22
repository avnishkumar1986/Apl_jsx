import ProjectPageHeader from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, MapPin, RotateCcw, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';

type LocationRow = {
    id: number;
    userId: number;
    userName: string;
    locationName: string;
    latitude: number;
    longitude: number;
    deviceName: string;
    isOnline: boolean;
    capturedAt: string;
};

type LocationPage = {
    data: LocationRow[];
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
    { title: 'Location report', href: '/dashboard/location-report' },
];

export default function LocationReport({
    locations,
    filters,
    canFilterUsers,
    organizations,
    users,
}: {
    locations: LocationPage;
    filters: {
        from: string;
        to: string;
        userId: number | string;
        organizationType: string;
        organizationCode: string;
    };
    canFilterUsers: boolean;
    organizations: Array<{ code: string; name: string; type: 'company' | 'plant' | 'head_office' }>;
    users: Array<{ id: number; name: string }>;
}) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [userId, setUserId] = useState(String(filters.userId ?? ''));
    const [organizationType, setOrganizationType] = useState(filters.organizationType ?? '');
    const [organizationCode, setOrganizationCode] = useState(filters.organizationCode ?? '');
    const matchingOrganizations = organizationType ? organizations.filter((organization) => organization.type === organizationType) : [];

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/dashboard/location-report',
            {
                from,
                to,
                user_id: userId || undefined,
                organization_type: organizationType || undefined,
                organization_code: organizationCode || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setFrom('');
        setTo('');
        setUserId('');
        setOrganizationType('');
        setOrganizationCode('');
        router.get('/dashboard/location-report', {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Location report" />
            <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                <div className="mx-auto max-w-[1500px] space-y-4">
                    <ProjectPageHeader
                        eyebrow="Location report"
                        title="User location history"
                        subtitle="Latest captured location for each employee"
                        icon={<MapPin className="size-5" />}
                        actions={
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
                                <ArrowLeft className="size-4" /> Dashboard
                            </Link>
                        }
                    />

                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.25fr_1.25fr_auto_auto] xl:items-end"
                    >
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            From date
                            <input
                                type="date"
                                value={from}
                                onChange={(event) => setFrom(event.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 font-normal"
                            />
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                            To date
                            <input
                                type="date"
                                min={from || undefined}
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 font-normal"
                            />
                        </label>
                        {canFilterUsers && (
                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Location type
                                <select
                                    value={organizationType}
                                    onChange={(event) => {
                                        setOrganizationType(event.target.value);
                                        setOrganizationCode('');
                                    }}
                                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 font-normal"
                                >
                                    <option value="">All types</option>
                                    <option value="plant">Plant</option>
                                    <option value="head_office">Head Office</option>
                                    <option value="company">Company</option>
                                </select>
                            </label>
                        )}
                        {canFilterUsers && (
                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                Company / location
                                <select
                                    value={organizationCode}
                                    onChange={(event) => setOrganizationCode(event.target.value)}
                                    disabled={!organizationType}
                                    className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 font-normal disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="">{organizationType ? 'All matching locations' : 'Select type first'}</option>
                                    {matchingOrganizations.map((organization) => (
                                        <option key={`${organization.type}-${organization.code}`} value={organization.code}>
                                            {organization.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {canFilterUsers && (
                            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                                User
                                <select
                                    value={userId}
                                    onChange={(event) => setUserId(event.target.value)}
                                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 font-normal"
                                >
                                    <option value="">All users</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <Button type="submit" className="bg-brand-teal h-10 gap-2">
                            <Search className="size-4" /> Apply
                        </Button>
                        <Button type="button" variant="outline" onClick={resetFilters} className="h-10 gap-2">
                            <RotateCcw className="size-4" /> Reset
                        </Button>
                    </form>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="text-brand-teal size-4" />
                                <h2 className="text-sm font-bold text-slate-900">Captured locations</h2>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                {locations.total} records
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-xs">
                                <thead className="bg-slate-50 text-[10px] tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">S.No.</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Coordinates</th>
                                        <th className="px-4 py-3">Device</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Captured date and time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {locations.data.map((location, index) => (
                                        <tr key={location.id} className="hover:bg-slate-50/70">
                                            <td className="px-4 py-3 text-slate-500">{(locations.from ?? 1) + index}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{location.userName}</td>
                                            <td className="px-4 py-3 text-slate-700">{location.locationName}</td>
                                            <td className="px-4 py-3 text-slate-600 tabular-nums">
                                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{location.deviceName}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                        location.isOnline
                                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                                            : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${location.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                                    />
                                                    {location.isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
                                                    new Date(location.capturedAt),
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!locations.data.length && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                                                No location records found for the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Showing {locations.from ?? 0}–{locations.to ?? 0} of {locations.total}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!locations.prev_page_url}
                                    onClick={() => locations.prev_page_url && router.get(locations.prev_page_url)}
                                >
                                    Previous
                                </Button>
                                <span className="font-semibold">
                                    Page {locations.current_page} of {locations.last_page}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!locations.next_page_url}
                                    onClick={() => locations.next_page_url && router.get(locations.next_page_url)}
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
