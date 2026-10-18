import { IndiaMapSilhouette } from '@/components/india-map-silhouette';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    ChevronDown,
    Download,
    Eye,
    Factory,
    History,
    MapPin,
    Package,
    Pencil,
    Settings2,
    ShieldCheck,
    ShoppingCart,
    Store,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];
const dummyProducts = [
    { id: 1, name: 'uPVC Pipes', factor: 1 },
    { id: 2, name: 'CPVC Pipes', factor: 0.82 },
    { id: 3, name: 'SWR Pipes', factor: 0.74 },
    { id: 4, name: 'Column Pipes', factor: 0.68 },
    { id: 5, name: 'Casing Pipes', factor: 0.61 },
    { id: 6, name: 'HDPE Pipes', factor: 0.89 },
    { id: 7, name: 'Water Tanks', factor: 0.56 },
    { id: 8, name: 'Pipe Fittings', factor: 0.78 },
    { id: 9, name: 'Solvent Cement', factor: 0.47 },
];

export default function Dashboard({
    organizationStats,
    userTypes,
    portalSecurity,
    userLocations,
    portalLogs,
}: {
    organizationStats: { companies: number; plants: number; materials: number; employees: number };
    userTypes: Array<{ uid: string; name: string }>;
    portalSecurity: {
        score: number;
        checks: Array<{
            title: string;
            description: string;
            passedDescription?: string;
            severity: 'critical' | 'high' | 'medium' | 'low';
            passed: boolean;
            advisoryUrl?: string | null;
            ecosystem?: string;
            packageName?: string;
            installedVersion?: string | null;
            affectedVersions?: string | null;
        }>;
        issues: Array<{
            title: string;
            description: string;
            passedDescription?: string;
            severity: 'critical' | 'high' | 'medium' | 'low';
            passed: boolean;
            advisoryUrl?: string | null;
            ecosystem?: string;
            packageName?: string;
            installedVersion?: string | null;
            affectedVersions?: string | null;
        }>;
        latestScan: {
            scannedAt: string | null;
            status: string;
            score: number;
            totalFindings: number;
            composerFindings: number;
            npmFindings: number;
            criticalFindings: number;
            highFindings: number;
            mediumFindings: number;
            lowFindings: number;
        } | null;
    };
    userLocations: Array<{
        userId: number;
        name: string;
        employeeId: string | null;
        companyName: string | null;
        departmentName: string | null;
        designationName: string | null;
        latitude: number;
        longitude: number;
        locationName: string;
        lastSeen: string;
        devices: string[];
    }>;
    portalLogs: Array<{
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
    }>;
}) {
    const { auth, activeModules } = usePage<SharedData>().props;
    const isSuperAdmin = auth.roles.includes('Super Admin');
    const isActive = auth.user.status;
    const procurementActive = activeModules.includes('procurement');
    const salesActive = activeModules.includes('sales');
    const canViewProcurement = isSuperAdmin || auth.permissions.some((permission) => permission.startsWith('procurement.'));
    const canViewSales = isSuperAdmin || auth.permissions.some((permission) => permission.startsWith('sales.'));
    const [selectedUserType, setSelectedUserType] = useState('all');
    const [selectedProductId, setSelectedProductId] = useState(1);
    const [activeOffers, setActiveOffers] = useState([
        { id: 1, title: 'Festive Purchase Offer', detail: '10% discount on selected materials', validUntil: '31 Oct 2026' },
        { id: 2, title: 'Bulk Order Benefit', detail: 'Additional savings on bulk quantities', validUntil: '15 Nov 2026' },
        { id: 3, title: 'Priority Distributor Offer', detail: 'Special pricing for approved distributors', validUntil: '30 Nov 2026' },
        { id: 4, title: 'Early Payment Reward', detail: '2% benefit on early invoice payment', validUntil: '31 Dec 2026' },
        { id: 5, title: 'Year-end Material Offer', detail: 'Limited pricing on available stock', validUntil: '15 Jan 2027' },
    ]);
    const editDummyOffer = (offerId: number) => {
        const offer = activeOffers.find((activeOffer) => activeOffer.id === offerId);

        if (!offer) {
            return;
        }

        const title = window.prompt('Edit offer title', offer.title)?.trim();

        if (title) {
            setActiveOffers((offers) => offers.map((activeOffer) => (activeOffer.id === offerId ? { ...activeOffer, title } : activeOffer)));
        }
    };
    const postureScore = Math.min(100, (isActive ? 40 : 0) + (auth.roles.length ? 30 : 0) + (isSuperAdmin || auth.permissions.length ? 30 : 0));
    const visibleUserLocations = userLocations;
    const currentUserLocation = userLocations.find((location) => location.userId === auth.user.id);
    const mapLocationGroups = Object.values(
        visibleUserLocations.reduce<
            Record<
                string,
                {
                    locationName: string;
                    latitude: number;
                    longitude: number;
                    users: Array<{
                        userId: number;
                        name: string;
                        employeeId: string | null;
                        companyName: string | null;
                        departmentName: string | null;
                        designationName: string | null;
                        devices: string[];
                    }>;
                }
            >
        >((groups, location) => {
            const key = location.locationName;
            const group = groups[key] ?? {
                locationName: location.locationName,
                latitude: location.latitude,
                longitude: location.longitude,
                users: [],
            };
            group.users.push({
                userId: location.userId,
                name: location.name,
                employeeId: location.employeeId,
                companyName: location.companyName,
                departmentName: location.departmentName,
                designationName: location.designationName,
                devices: location.devices,
            });
            groups[key] = group;

            return groups;
        }, {}),
    );
    const mapPositionFor = (latitude: number, longitude: number) => ({
        left: `${Math.min(86, Math.max(14, ((longitude - 68) / 29.5) * 100))}%`,
        top: `${Math.min(88, Math.max(10, ((37.5 - latitude) / 31) * 100))}%`,
    });
    const downloadSecurityReport = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const document = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const generatedAt = new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date());
        const configurationChecks = portalSecurity.checks.filter((check) => !check.ecosystem);
        const libraryFindings = portalSecurity.checks.filter((check) => check.ecosystem);

        document.setFillColor(15, 118, 145);
        document.rect(0, 0, 210, 34, 'F');
        document.setTextColor(255, 255, 255);
        document.setFontSize(20);
        document.text('Portal Security Report', 14, 17);
        document.setFontSize(9);
        document.text(`Generated: ${generatedAt}`, 14, 25);

        document.setTextColor(15, 23, 42);
        document.setFontSize(15);
        document.text(`Overall security score: ${portalSecurity.score}/100`, 14, 47);

        autoTable(document, {
            startY: 54,
            head: [['Total findings', 'Critical', 'High', 'Medium', 'Low', 'Composer', 'npm']],
            body: [
                [
                    portalSecurity.latestScan?.totalFindings ?? 0,
                    portalSecurity.latestScan?.criticalFindings ?? 0,
                    portalSecurity.latestScan?.highFindings ?? 0,
                    portalSecurity.latestScan?.mediumFindings ?? 0,
                    portalSecurity.latestScan?.lowFindings ?? 0,
                    portalSecurity.latestScan?.composerFindings ?? 0,
                    portalSecurity.latestScan?.npmFindings ?? 0,
                ],
            ],
            headStyles: { fillColor: [30, 41, 59], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
        });

        const summaryEndY = (document as typeof document & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;
        document.setFontSize(12);
        document.text('Portal configuration checks', 14, summaryEndY + 9);

        autoTable(document, {
            startY: summaryEndY + 13,
            head: [['#', 'Security check', 'Status', 'Details / recommended action']],
            body: configurationChecks.map((check, index) => [
                index + 1,
                check.title,
                check.passed ? 'PASSED' : `${check.severity.toUpperCase()} RISK`,
                check.passed ? (check.passedDescription ?? 'Security control is configured correctly.') : check.description,
            ]),
            headStyles: { fillColor: [15, 118, 145], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 48 },
                2: { cellWidth: 25 },
                3: { cellWidth: 95 },
            },
        });

        const configurationEndY = (document as typeof document & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 110;
        document.setFontSize(12);
        document.setTextColor(15, 23, 42);
        document.text('Vulnerable libraries', 14, configurationEndY + 10);

        autoTable(document, {
            startY: configurationEndY + 14,
            head: [['#', 'Ecosystem', 'Package', 'Installed', 'Severity', 'Affected versions / advisory']],
            body: libraryFindings.length
                ? libraryFindings.map((finding, index) => [
                      index + 1,
                      finding.ecosystem?.toUpperCase() ?? '-',
                      finding.packageName ?? finding.title,
                      finding.installedVersion ?? 'Unknown',
                      finding.severity.toUpperCase(),
                      [finding.affectedVersions, finding.advisoryUrl].filter(Boolean).join('\n') || finding.description,
                  ])
                : [['-', '-', 'No vulnerable libraries detected', '-', 'SECURE', '-']],
            headStyles: { fillColor: [15, 118, 145], textColor: 255 },
            styles: { fontSize: 7.5, cellPadding: 2.5, valign: 'middle', overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 20 },
                2: { cellWidth: 38 },
                3: { cellWidth: 25 },
                4: { cellWidth: 20 },
                5: { cellWidth: 76 },
            },
        });

        const pageCount = document.getNumberOfPages();
        for (let page = 1; page <= pageCount; page += 1) {
            document.setPage(page);
            document.setFontSize(8);
            document.setTextColor(100, 116, 139);
            document.text(`Apollo Pipes Portal Security Audit · Page ${page} of ${pageCount}`, 14, 290);
            document.text('Generated from stored Composer/npm advisories and runtime configuration checks.', 196, 290, { align: 'right' });
        }
        document.save(`portal-security-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    };
    const stats = [
        {
            label: 'Companies',
            value: organizationStats.companies,
            href: '/admin/companies/hierarchy?view=companies',
            icon: Building2,
            color: '#7c55d9',
            surface: 'bg-violet-100',
            accent: 'from-violet-500 to-purple-600',
            halo: 'bg-violet-100',
        },
        {
            label: 'Plants',
            value: organizationStats.plants,
            href: '/admin/companies/hierarchy?view=plants',
            icon: Factory,
            color: '#219ebc',
            surface: 'bg-sky-100',
            accent: 'from-cyan-500 to-sky-600',
            halo: 'bg-sky-100',
        },
        {
            label: 'Materials',
            value: organizationStats.materials,
            href: '/admin/companies/hierarchy?view=materials',
            icon: Package,
            color: '#059669',
            surface: 'bg-emerald-100',
            accent: 'from-emerald-500 to-teal-600',
            halo: 'bg-emerald-100',
        },
        {
            label: 'Employees',
            value: organizationStats.employees,
            href: '/admin/user-master',
            icon: Users,
            color: '#fb8500',
            surface: 'bg-orange-100',
            accent: 'from-orange-400 to-amber-600',
            halo: 'bg-orange-100',
        },
    ];
    const selectedProduct = dummyProducts.find((product) => product.id === selectedProductId) ?? dummyProducts[0]!;
    const monthlyProductSales = [58, 66, 63, 74, 69, 82, 77, 71, 79, 86, 91, 95].map((value, index) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
        value: Math.round(value * selectedProduct.factor),
    }));
    const accessRows = isSuperAdmin
        ? [
              { resource: 'Users', capability: 'Full access', source: 'Super Admin' },
              { resource: 'Roles', capability: 'Full access', source: 'Super Admin' },
              { resource: 'Permissions', capability: 'Full access', source: 'Super Admin' },
              { resource: 'Profile', capability: 'Manage own', source: 'Account' },
          ]
        : auth.permissions.slice(0, 6).map((permission) => {
              const [resource, capability = 'access'] = permission.split('.');
              return { resource: resource.replaceAll('_', ' '), capability: capability.replaceAll('_', ' '), source: 'Assigned role' };
          });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-full flex-1 bg-[#f1f3f8] p-4 md:p-5 lg:p-6">
                <section className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back, {auth.user.name.split(' ')[0]}!</h1>
                        <p className="mt-1 text-sm text-slate-500">Monitor your access, permissions, and administrative workspace.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
                            <span className={`size-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                            Systems operational
                        </span>
                        <Link
                            href="/settings/profile"
                            className="bg-brand-teal hover:bg-brand-plum inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        >
                            <Settings2 className="size-4" /> Settings
                        </Link>
                    </div>
                </section>

                {((procurementActive && canViewProcurement) || (salesActive && canViewSales)) && (
                    <nav className="mb-5 flex flex-wrap items-center gap-2" aria-label="Business modules">
                        {procurementActive && canViewProcurement && (
                            <Link
                                href="/admin/procurement/dashboard"
                                prefetch
                                className="group inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-100 px-3.5 py-2 text-sm font-semibold text-cyan-950 shadow-sm transition-all hover:-translate-y-px hover:border-cyan-400 hover:shadow-md"
                            >
                                <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-sm">
                                    <ShoppingCart className="size-4 text-white" />
                                </span>
                                Procurement
                                <ArrowRight className="size-3.5 text-cyan-700 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        )}
                        {salesActive && canViewSales && (
                            <Link
                                href="/admin/sales"
                                prefetch
                                className="group inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-100 px-3.5 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-all hover:-translate-y-px hover:border-emerald-400 hover:shadow-md"
                            >
                                <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                                    <TrendingUp className="size-4 text-white" />
                                </span>
                                Sales
                                <ArrowRight className="size-3.5 text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        )}
                    </nav>
                )}

                <div className="grid gap-5 xl:grid-cols-[0.72fr_1.48fr_0.8fr]">
                    <div className="space-y-5">
                        <Card className="bg-brand-plum overflow-hidden border-0 text-white shadow-sm">
                            <CardContent className="relative p-6">
                                <div className="bg-brand-aqua/25 absolute -top-14 -right-10 size-44 rounded-full" />
                                <div className="bg-brand-gold/15 absolute -right-4 -bottom-16 size-36 rounded-full" />
                                <div className="relative">
                                    <div className="mb-5 grid size-10 place-items-center rounded-full bg-white/15 ring-1 ring-white/20">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <h2 className="text-xl font-semibold">
                                        Your access is {postureScore === 100 ? 'fully configured' : 'being configured'}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-white/70">
                                        Identity, account status, and permission coverage combine into your security posture.
                                    </p>
                                    <div className="mt-6 flex items-end justify-between">
                                        <Link
                                            href="/settings/profile"
                                            className="decoration-brand-gold inline-flex items-center gap-1 text-sm font-semibold underline decoration-2 underline-offset-4"
                                        >
                                            Review profile <ArrowRight className="size-4" />
                                        </Link>
                                        <div className="border-t-brand-gold grid size-16 place-items-center rounded-full border-[5px] border-white/20 text-sm font-bold">
                                            {postureScore}%
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="corporate-card overflow-hidden">
                            <CardHeader className="border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <span className="bg-brand-teal h-4 w-1 rounded-full" />
                                        Logged-in user locations
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/dashboard/location-report"
                                            className="text-brand-teal hover:bg-brand-aqua/10 rounded-md px-2 py-1 text-[10px] font-semibold"
                                        >
                                            View report
                                        </Link>
                                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                            {isSuperAdmin ? `${visibleUserLocations.length} active` : 'My location'}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="relative mx-auto h-[330px] w-full overflow-hidden rounded-2xl border border-cyan-100 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.95),transparent_36%),linear-gradient(145deg,#effaff,#dffafb)]">
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
                                    <IndiaMapSilhouette className="absolute inset-0 size-full p-5 text-[#0e8ca6] drop-shadow-[0_12px_24px_rgba(14,140,166,0.12)]" />
                                    <span className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold tracking-widest text-slate-500 shadow-sm">
                                        INDIA
                                    </span>
                                    {mapLocationGroups.map((location, index) => (
                                        <div
                                            key={location.locationName}
                                            className="group/location absolute z-10 -translate-x-1/2 -translate-y-1/2 hover:z-50"
                                            style={mapPositionFor(location.latitude, location.longitude)}
                                        >
                                            <span className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-red-400/35" />
                                            <MapPin className="relative size-8 fill-red-500 text-white drop-shadow-lg" />
                                            <span className="peer absolute top-7 left-1/2 z-20 w-max max-w-40 -translate-x-1/2 cursor-help rounded-md bg-white/95 px-2 py-1 text-center text-[9px] leading-3 font-semibold text-slate-900 shadow-md">
                                                {location.locationName} · {location.users.length}
                                            </span>
                                            <div
                                                className={`absolute top-1/2 z-50 hidden w-48 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-2 shadow-xl peer-hover:block ${
                                                    location.longitude > 82 || index % 2 === 1 ? 'right-8' : 'left-8'
                                                }`}
                                            >
                                                <div className="max-h-32 divide-y divide-slate-100 overflow-y-auto text-left [scrollbar-width:thin]">
                                                    {location.users.map((user) => (
                                                        <div key={user.userId} className="py-1.5 first:pt-0 last:pb-0">
                                                            <p className="truncate text-[10px] font-bold text-slate-900">
                                                                {user.name} {user.employeeId ? `(${user.employeeId})` : ''}
                                                            </p>
                                                            <p className="truncate text-[9px] text-slate-500">
                                                                {[user.companyName, user.departmentName, user.designationName]
                                                                    .filter(Boolean)
                                                                    .join(' · ') || 'Organization details not assigned'}
                                                            </p>
                                                            {user.devices.map((device) => (
                                                                <p key={device} className="mt-0.5 truncate text-[9px] text-slate-400">
                                                                    Device: {device}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {!visibleUserLocations.length && (
                                        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/80 bg-white/90 p-3 text-center shadow-sm backdrop-blur">
                                            <MapPin className="text-brand-teal mx-auto size-5" />
                                            <p className="mt-1 text-xs font-semibold text-slate-700">Location not displayed yet</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {isSuperAdmin ? 'Logged-in users with location' : auth.user.name}
                                    </p>
                                    {currentUserLocation ? (
                                        <div className="mt-1 text-[11px] text-slate-500">
                                            <p>{currentUserLocation.locationName}</p>
                                            <p>
                                                {currentUserLocation.latitude.toFixed(4)}° N, {currentUserLocation.longitude.toFixed(4)}° E
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {isSuperAdmin
                                                ? 'Users appear after their login location is captured.'
                                                : 'Your location will appear after it is captured during login.'}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-5">
                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {stats.map(({ label, value, href, icon: Icon, color, surface, accent, halo }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
                                >
                                    <Card className="corporate-card relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-lg">
                                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
                                        <div
                                            className={`absolute -top-12 -right-12 size-32 rounded-full opacity-60 transition-transform duration-300 group-hover:scale-110 ${halo}`}
                                        />
                                        <CardContent className="relative p-5 sm:p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className={`grid size-12 place-items-center rounded-xl shadow-sm ${surface}`} style={{ color }}>
                                                    <Icon className="size-6" strokeWidth={1.8} />
                                                </div>
                                                <span className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:border-transparent group-hover:bg-slate-900 group-hover:text-white">
                                                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                                </span>
                                            </div>
                                            <div className="mt-6">
                                                <p className="text-sm font-semibold text-slate-500">{label}</p>
                                                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 tabular-nums">
                                                    {value.toLocaleString()}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </section>
                        <Card className="corporate-card min-h-[324px]">
                            <CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <span className="bg-brand-gold h-4 w-1 rounded-full" />
                                    Product sales
                                </CardTitle>
                                <span className="text-xs text-slate-400">Dummy monthly data</span>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="shrink-0 sm:w-36">
                                        <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Products</p>
                                        <div className="flex max-h-56 gap-2 overflow-x-auto pb-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pr-1">
                                            {dummyProducts.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => setSelectedProductId(product.id)}
                                                    className={`shrink-0 rounded-lg px-3 py-2 text-left text-[10px] font-semibold transition ${
                                                        product.id === selectedProductId
                                                            ? 'bg-brand-teal text-white shadow-sm'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {product.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                                        <div className="flex h-52 min-w-[430px] items-end gap-2 border-b border-l border-slate-200 px-3">
                                            {monthlyProductSales.map((sale) => (
                                                <div key={sale.month} className="group flex h-full min-w-0 flex-1 flex-col justify-end text-center">
                                                    <span className="mb-1 text-[9px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                                                        {sale.value}K
                                                    </span>
                                                    <div
                                                        className="bg-brand-teal relative w-full rounded-t-sm opacity-80 group-hover:opacity-100"
                                                        style={{ height: `${sale.value}%` }}
                                                        title={`${sale.month}: ${sale.value}K units`}
                                                    />
                                                    <span className="mt-2 text-[9px] font-semibold text-slate-500">{sale.month}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex justify-center text-xs text-slate-500">
                                            <span className="flex items-center gap-2">
                                                <span className="bg-brand-teal size-2 rounded-full" />
                                                {selectedProduct.name} sales (thousand units)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                { label: 'Total vendors', value: 24, color: 'bg-pink-100 text-pink-700', accent: 'bg-pink-500' },
                                { label: 'Distributors', value: 16, color: 'bg-violet-100 text-violet-700', accent: 'bg-violet-500' },
                                { label: 'Plumbers', value: 8, color: 'bg-amber-100 text-amber-700', accent: 'bg-amber-500' },
                            ].map((vendor) => (
                                <Card key={vendor.label} className="corporate-card relative overflow-hidden">
                                    <span className={`absolute inset-x-0 top-0 h-1 ${vendor.accent}`} />
                                    <CardContent className="p-5">
                                        <div className={`grid size-10 place-items-center rounded-xl ${vendor.color}`}>
                                            <Store className="size-5" />
                                        </div>
                                        <p className="mt-5 text-3xl font-bold text-slate-900">{vendor.value}</p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">{vendor.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <Card className="corporate-card overflow-hidden">
                            <CardHeader className="border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <span className="bg-brand-berry h-4 w-1 rounded-full" />
                                        Portal security
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                                portalSecurity.issues.length ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}
                                        >
                                            {portalSecurity.issues.length ? `${portalSecurity.issues.length} risks` : 'Secure'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={downloadSecurityReport}
                                            className="hover:bg-brand-aqua/15 hover:text-brand-teal grid size-8 place-items-center rounded-md text-slate-400 transition"
                                            aria-label="Download portal security report as PDF"
                                            title="Download PDF report"
                                        >
                                            <Download className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div
                                    className="mx-auto grid size-36 place-items-center rounded-full border-[13px] bg-white"
                                    style={{
                                        borderColor: portalSecurity.score >= 80 ? '#10b981' : portalSecurity.score >= 50 ? '#f59e0b' : '#ef4444',
                                    }}
                                >
                                    <div className="grid size-full place-items-center rounded-full bg-white text-center shadow-inner">
                                        <div>
                                            <p className="text-xs text-slate-500">Score</p>
                                            <p className="text-3xl font-bold text-slate-900">{portalSecurity.score}</p>
                                            <p className="text-[10px] font-semibold text-slate-500">OUT OF 100</p>
                                        </div>
                                    </div>
                                </div>
                                {portalSecurity.latestScan && (
                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                                                <ShieldCheck className="size-5" />
                                            </span>
                                            <div>
                                                <p className="text-xs font-semibold text-emerald-800">Latest library audit</p>
                                                <p className="mt-0.5 text-[10px] text-emerald-600">
                                                    {portalSecurity.latestScan.totalFindings === 0
                                                        ? 'No vulnerable libraries detected'
                                                        : `${portalSecurity.latestScan.totalFindings} findings detected`}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-emerald-700">
                                            {portalSecurity.latestScan.score}
                                            <span className="text-xs font-semibold">/100</span>
                                        </p>
                                    </div>
                                )}
                                <div className="mt-5 max-h-[174px] space-y-2 overflow-y-auto border-t border-slate-100 pt-4 pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                                    {portalSecurity.checks.map((check) => (
                                        <div
                                            key={check.title}
                                            className={`flex gap-3 rounded-lg border p-3 ${
                                                check.passed ? 'border-emerald-100 bg-emerald-50/60' : 'border-red-100 bg-red-50/50'
                                            }`}
                                        >
                                            {check.passed ? (
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                            ) : (
                                                <AlertTriangle
                                                    className={`mt-0.5 size-4 shrink-0 ${
                                                        ['critical', 'high'].includes(check.severity) ? 'text-red-500' : 'text-amber-500'
                                                    }`}
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xs font-semibold text-slate-700">{check.title}</p>
                                                    <span
                                                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                                            check.passed
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : ['critical', 'high'].includes(check.severity)
                                                                  ? 'bg-red-100 text-red-600'
                                                                  : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {check.passed ? 'Passed' : `${check.severity} risk`}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                                    {check.passed
                                                        ? (check.passedDescription ?? 'Security control is configured correctly.')
                                                        : check.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                                    {portalSecurity.latestScan ? (
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span>
                                                Library scan:{' '}
                                                {portalSecurity.latestScan.scannedAt
                                                    ? new Intl.DateTimeFormat('en-IN', {
                                                          dateStyle: 'medium',
                                                          timeStyle: 'short',
                                                      }).format(new Date(portalSecurity.latestScan.scannedAt))
                                                    : 'Date unavailable'}
                                            </span>
                                            <span>
                                                Composer {portalSecurity.latestScan.composerFindings} · npm {portalSecurity.latestScan.npmFindings}
                                            </span>
                                        </div>
                                    ) : (
                                        <span>Library audit has not run yet. The first automatic scan runs monthly.</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="corporate-card overflow-hidden">
                            <CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <span className="bg-brand-teal h-4 w-1 rounded-full" />
                                    Portal activity
                                </CardTitle>
                                <Link
                                    href="/dashboard/activity"
                                    className="text-brand-teal hover:bg-brand-aqua/10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold"
                                >
                                    View all <History className="size-3.5" />
                                </Link>
                            </CardHeader>
                            <CardContent className="p-3">
                                {portalLogs.length ? (
                                    <div className="max-h-[216px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                                        {portalLogs.map((log) => {
                                            const activityTime = new Intl.DateTimeFormat('en-IN', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            }).format(new Date(log.createdAt));
                                            const successful = log.statusCode !== null && log.statusCode < 400;

                                            return (
                                                <details
                                                    key={log.id}
                                                    className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 open:bg-white"
                                                >
                                                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2.5 marker:hidden">
                                                        <span
                                                            className={`size-2 shrink-0 rounded-full ${successful ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        />
                                                        <p className="min-w-0 flex-1 truncate text-[11px] text-slate-700">
                                                            <span className="font-bold text-slate-900">{log.userName}</span>
                                                            <span className="mx-1.5 text-slate-300">•</span>
                                                            <span className="font-medium">{log.action}</span>
                                                            <span className="mx-1.5 text-slate-300">•</span>
                                                            <span className="text-slate-500">{activityTime}</span>
                                                        </p>
                                                        <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600 ring-1 ring-slate-200">
                                                            {log.method}
                                                        </span>
                                                        <span className="text-brand-teal flex shrink-0 items-center gap-1 text-[10px] font-semibold">
                                                            <span className="hidden sm:inline sm:group-open:hidden">View more</span>
                                                            <span className="hidden sm:group-open:inline">View less</span>
                                                            <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                                                        </span>
                                                    </summary>
                                                    <div className="border-t border-slate-200 bg-white px-3 py-3">
                                                        <div className="grid gap-x-4 gap-y-2 text-[10px] sm:grid-cols-2">
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase">Status</p>
                                                                <p
                                                                    className={
                                                                        successful ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'
                                                                    }
                                                                >
                                                                    {log.statusCode ?? 'Not recorded'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase">Response time</p>
                                                                <p className="font-medium text-slate-700">
                                                                    {log.durationMs !== null ? `${log.durationMs} ms` : 'Not recorded'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase">Route</p>
                                                                <p className="font-medium break-all text-slate-700">
                                                                    {log.routeName ?? 'Unnamed route'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase">Request type</p>
                                                                <p className="font-medium text-slate-700">
                                                                    {log.isInertia ? 'Inertia navigation' : 'Standard request'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase">IP address</p>
                                                                <p className="font-medium text-slate-700">{log.ipAddress ?? 'Not recorded'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-400 uppercase">Date and time</p>
                                                                <p className="font-medium text-slate-700">{activityTime}</p>
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <p className="font-semibold text-slate-400 uppercase">URL</p>
                                                                <p className="font-medium break-all text-slate-700">{log.url ?? 'Not recorded'}</p>
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <p className="font-semibold text-slate-400 uppercase">Browser and device</p>
                                                                <p className="leading-4 break-words text-slate-600">
                                                                    {log.userAgent ?? 'Not recorded'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </details>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                                        <History className="mx-auto size-6 text-black" />
                                        <p className="mt-2 text-xs font-semibold text-black">Activity will appear as users work in the portal.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_0.8fr]">
                    <Card className="corporate-card overflow-hidden">
                        <CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <span className="bg-brand-teal h-4 w-1 rounded-full" />
                                Access matrix
                            </CardTitle>
                            <Link href="/admin/roles" className="flex items-center gap-1 text-xs font-medium text-black hover:underline">
                                View details <ArrowRight className="size-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full min-w-[620px] text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] tracking-wider text-black uppercase">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Resource</th>
                                        <th className="px-5 py-3 font-semibold">Capability</th>
                                        <th className="px-5 py-3 font-semibold">Granted through</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 text-right font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(accessRows.length
                                        ? accessRows
                                        : [{ resource: 'No permissions', capability: 'Pending', source: 'Administrator' }]
                                    ).map((row) => (
                                        <tr key={`${row.resource}-${row.capability}`} className="text-black transition hover:bg-slate-50/70">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-brand-aqua/15 text-brand-teal grid size-8 place-items-center rounded-full text-xs font-bold">
                                                        {row.resource.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="font-semibold text-black capitalize">{row.resource}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 capitalize">{row.capability}</td>
                                            <td className="px-5 py-3.5">{row.source}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    href="/admin/roles"
                                                    aria-label={`View ${row.resource} access`}
                                                    className="hover:bg-brand-aqua/15 hover:text-brand-teal inline-grid size-8 place-items-center rounded-md text-black"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className="corporate-card">
                        <CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <span className="bg-brand-gold h-4 w-1 rounded-full" />
                                Active offers
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedUserType}
                                    onChange={(event) => setSelectedUserType(event.target.value)}
                                    className="h-8 max-w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                                    aria-label="Select user type"
                                >
                                    <option value="all">All user types</option>
                                    {userTypes.map((userType) => (
                                        <option key={userType.uid} value={userType.uid}>
                                            {userType.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                    {activeOffers.length} active
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="max-h-[285px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                                {activeOffers.map((offer) => (
                                    <div key={offer.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                                                    <p className="truncate text-xs font-semibold text-slate-800">{offer.title}</p>
                                                </div>
                                                <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{offer.detail}</p>
                                                <p className="mt-2 text-[9px] font-medium text-slate-400">Valid until {offer.validUntil}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => editDummyOffer(offer.id)}
                                                className="hover:bg-brand-aqua/15 hover:text-brand-teal grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition"
                                                aria-label={`Edit ${offer.title}`}
                                                title="Edit offer"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
