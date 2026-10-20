import { IndiaMapSilhouette } from '@/components/india-map-silhouette';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
    RefreshCw,
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
    organizationStats: {
        companies: number;
        plants: number;
        materials: number;
        employees: number;
    };
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
    const procurementActive = activeModules.includes('procurement');
    const salesActive = activeModules.includes('sales');
    const canViewProcurement = isSuperAdmin || auth.permissions.some((permission) => permission.startsWith('procurement.'));
    const canViewSales = isSuperAdmin || auth.permissions.some((permission) => permission.startsWith('sales.'));
    const [selectedUserType, setSelectedUserType] = useState('all');
    const [securityScanRunning, setSecurityScanRunning] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(1);
    const [activeOffers, setActiveOffers] = useState([
        {
            id: 1,
            title: 'Festive Purchase Offer',
            detail: '10% discount on selected materials',
            validUntil: '31 Oct 2026',
        },
        {
            id: 2,
            title: 'Bulk Order Benefit',
            detail: 'Additional savings on bulk quantities',
            validUntil: '15 Nov 2026',
        },
        {
            id: 3,
            title: 'Priority Distributor Offer',
            detail: 'Special pricing for approved distributors',
            validUntil: '30 Nov 2026',
        },
        {
            id: 4,
            title: 'Early Payment Reward',
            detail: '2% benefit on early invoice payment',
            validUntil: '31 Dec 2026',
        },
        {
            id: 5,
            title: 'Year-end Material Offer',
            detail: 'Limited pricing on available stock',
            validUntil: '15 Jan 2027',
        },
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
    const profileFields = [
        auth.user.first_name,
        auth.user.last_name,
        auth.user.email,
        auth.user.email_verified_at,
        auth.user.unique_id,
        auth.user.gender,
        auth.user.date_of_birth,
        auth.user.company,
        auth.user.department_id,
        auth.user.designation_id,
    ];
    const completedProfileFields = profileFields.filter((value) => value !== null && value !== undefined && value !== '').length;
    const profileScore = Math.round((completedProfileFields / profileFields.length) * 100);
    const remainingProfileFields = profileFields.length - completedProfileFields;
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
        const document = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
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
            styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                valign: 'middle',
                overflow: 'linebreak',
            },
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
            href: '/admin/employee-hierarchy',
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
              {
                  resource: 'Permissions',
                  capability: 'Full access',
                  source: 'Super Admin',
              },
              { resource: 'Profile', capability: 'Manage own', source: 'Account' },
          ]
        : auth.permissions.slice(0, 6).map((permission) => {
              const [resource, capability = 'access'] = permission.split('.');
              return {
                  resource: resource.replaceAll('_', ' '),
                  capability: capability.replaceAll('_', ' '),
                  source: 'Assigned role',
              };
          });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="dashboard-shell mx-auto min-h-full w-full max-w-[1760px] flex-1 bg-[linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)] p-3 sm:p-4 md:p-6 xl:p-7">
                {((procurementActive && canViewProcurement) || (salesActive && canViewSales)) && (
                    <nav className="mb-6 flex flex-wrap items-center gap-2.5" aria-label="Business modules">
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

                <div className="grid items-start gap-6 xl:grid-cols-12">
                    <div className="min-w-0 space-y-6 xl:col-span-4">
                        <Card className="border-brand-teal/30 relative overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#023047_0%,#075b6d_58%,#0e8294_100%)] text-white shadow-[0_18px_40px_-24px_rgba(2,48,71,0.85)]">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(142,202,230,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(142,202,230,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
                            <div className="border-brand-gold/15 absolute -top-20 right-16 size-52 rounded-full border-[24px]" />
                            <div className="border-brand-aqua/15 absolute -right-16 -bottom-24 size-60 rounded-full border-[24px]" />
                            <CardContent className="relative p-5 sm:p-6">
                                <div className="flex flex-col items-start gap-4 min-[380px]:flex-row min-[380px]:items-center min-[380px]:gap-5">
                                    <div
                                        className="relative grid size-20 shrink-0 place-items-center min-[380px]:size-24"
                                        aria-label={`Profile ${profileScore}% complete`}
                                    >
                                        <svg viewBox="0 0 88 88" className="size-20 -rotate-90 min-[380px]:size-24" aria-hidden="true">
                                            <circle cx="44" cy="44" r="36" fill="none" stroke="#164e63" strokeWidth="7" />
                                            <circle
                                                cx="44"
                                                cy="44"
                                                r="36"
                                                fill="none"
                                                stroke="url(#profile-progress)"
                                                strokeWidth="7"
                                                strokeLinecap="round"
                                                strokeDasharray="226.2"
                                                strokeDashoffset={226.2 - (226.2 * profileScore) / 100}
                                            />
                                            <defs>
                                                <linearGradient id="profile-progress" x1="0" y1="0" x2="88" y2="88">
                                                    <stop stopColor="var(--brand-aqua)" />
                                                    <stop offset="1" stopColor="var(--brand-teal)" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute text-center">
                                            <span className="block text-xl font-bold tracking-tight text-white">{profileScore}%</span>
                                            <span className="text-brand-aqua block text-[9px] font-bold tracking-wide uppercase">Complete</span>
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-brand-aqua text-[10px] font-bold tracking-[0.16em] uppercase">Profile overview</p>
                                        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Welcome, {auth.user.name.split(' ')[0]}!</h2>
                                        <p className="mt-1.5 text-xs leading-5 text-white/75">
                                            {profileScore === 100
                                                ? 'Your profile is complete and up to date.'
                                                : `Your profile is ${profileScore}% complete. ${remainingProfileFields} essential ${remainingProfileFields === 1 ? 'detail remains' : 'details remain'}.`}
                                        </p>
                                        <Link
                                            href="/settings/profile"
                                            className="bg-brand-gold text-brand-plum hover:bg-brand-berry mt-3 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold shadow-sm transition hover:text-white"
                                        >
                                            View profile <ArrowRight className="size-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="corporate-card overflow-hidden">
                            <CardHeader className="border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="flex min-w-0 items-center gap-2 text-sm whitespace-nowrap">
                                        <span className="bg-brand-teal h-5 w-1 shrink-0 rounded-full" />
                                        User locations
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/dashboard/location-report"
                                            aria-label="View location report"
                                            className="text-brand-teal hover:bg-brand-aqua/10 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition"
                                        >
                                            <span className="hidden sm:inline">Report</span> <ArrowRight className="size-3" />
                                        </Link>
                                        <div className="min-w-16 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                                                <span className="text-lg leading-none font-bold text-emerald-700">{visibleUserLocations.length}</span>
                                            </div>
                                            <p className="mt-1 text-[8px] font-bold tracking-wide text-emerald-700 uppercase">
                                                {visibleUserLocations.length === 1 ? 'Active user' : 'Active users'}
                                            </p>
                                        </div>
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
                                        {isSuperAdmin
                                            ? `${visibleUserLocations.length} active ${visibleUserLocations.length === 1 ? 'employee' : 'employees'} across ${mapLocationGroups.length} ${mapLocationGroups.length === 1 ? 'location' : 'locations'}`
                                            : auth.user.name}
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

                    <div className="min-w-0 space-y-6 xl:col-span-8">
                        <section className="grid min-w-0 gap-4 min-[350px]:grid-cols-2 md:grid-cols-4">
                            {stats.map(({ label, value, href, icon: Icon, color, surface, accent }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="group block min-w-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
                                >
                                    <Card className="corporate-card relative h-full min-h-[132px] overflow-hidden rounded-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-xl">
                                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
                                        <CardContent className="relative flex min-h-[132px] items-center gap-3 p-4 sm:gap-4 sm:p-5">
                                            <div
                                                className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ${surface}`}
                                                style={{ color }}
                                            >
                                                <Icon className="size-6" strokeWidth={1.8} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-3xl font-bold tracking-tight text-slate-950 tabular-nums">
                                                    {value.toLocaleString()}
                                                </p>
                                                <p className="mt-1 text-xs leading-4 font-semibold break-words text-slate-500">{label}</p>
                                            </div>
                                            <ArrowRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-700" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                            {[
                                {
                                    label: 'Total vendors',
                                    value: 24,
                                    color: 'text-pink-700',
                                    surface: 'bg-pink-100',
                                    accent: 'from-pink-500 to-rose-500',
                                },
                                {
                                    label: 'Distributors',
                                    value: 16,
                                    color: 'text-violet-700',
                                    surface: 'bg-violet-100',
                                    accent: 'from-violet-500 to-purple-600',
                                },
                                {
                                    label: 'Plumbers',
                                    value: 8,
                                    color: 'text-amber-700',
                                    surface: 'bg-amber-100',
                                    accent: 'from-amber-400 to-orange-500',
                                },
                                {
                                    label: 'Active users',
                                    value: visibleUserLocations.length,
                                    color: 'text-cyan-700',
                                    surface: 'bg-cyan-100',
                                    accent: 'from-cyan-500 to-blue-600',
                                },
                            ].map((metric) => (
                                <Card key={metric.label} className="corporate-card relative min-h-[132px] min-w-0 overflow-hidden">
                                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${metric.accent}`} />
                                    <CardContent className="relative flex min-h-[132px] items-center gap-3 p-4 sm:gap-4 sm:p-5">
                                        <div
                                            className={`grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm ${metric.surface} ${metric.color}`}
                                        >
                                            {metric.label === 'Active users' ? (
                                                <MapPin className="size-6" strokeWidth={1.8} />
                                            ) : (
                                                <Store className="size-6" strokeWidth={1.8} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-3xl font-bold tracking-tight text-slate-950 tabular-nums">
                                                {metric.value.toLocaleString()}
                                            </p>
                                            <p className="mt-1 text-xs leading-4 font-semibold break-words text-slate-500">{metric.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </section>
                        <Card className="corporate-card flex min-h-[420px] flex-col">
                            <CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <span className="bg-brand-gold h-4 w-1 rounded-full" />
                                    Product sales
                                </CardTitle>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                    Monthly performance
                                </span>
                            </CardHeader>
                            <CardContent className="flex-1 p-6">
                                <div className="flex h-full flex-col items-stretch gap-5 sm:flex-row">
                                    <div className="min-w-0 shrink-0 sm:w-44 sm:max-w-44">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Product portfolio</p>
                                            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold text-cyan-700">
                                                {dummyProducts.length}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pb-1 min-[430px]:grid-cols-3 sm:flex sm:max-h-80 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                                            {dummyProducts.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => setSelectedProductId(product.id)}
                                                    aria-pressed={product.id === selectedProductId}
                                                    className={`group/product flex min-h-10 min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[10px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none sm:shrink-0 sm:px-3 ${
                                                        product.id === selectedProductId
                                                            ? 'border-brand-teal bg-brand-teal text-white shadow-sm'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-cyan-800'
                                                    }`}
                                                >
                                                    <span
                                                        className={`grid size-6 shrink-0 place-items-center rounded-lg ${
                                                            product.id === selectedProductId
                                                                ? 'bg-white/15 text-white'
                                                                : 'bg-slate-100 text-slate-400 group-hover/product:bg-white group-hover/product:text-cyan-600'
                                                        }`}
                                                    >
                                                        <Package className="size-3.5" strokeWidth={1.8} />
                                                    </span>
                                                    <span className="min-w-0 flex-1 leading-4 break-words">{product.name}</span>
                                                    {product.id === selectedProductId && <CheckCircle2 className="size-3.5 shrink-0 text-white/90" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col overflow-x-auto pb-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
                                        <div className="flex h-64 min-w-full flex-none items-end gap-1 border-b border-l border-slate-200 px-1 sm:h-auto sm:min-h-80 sm:min-w-[430px] sm:flex-1 sm:gap-2 sm:px-3">
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
                                                    <span className="mt-2 text-[8px] font-semibold text-slate-500 sm:text-[9px]">{sale.month}</span>
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
                    </div>

                    <div className="grid grid-cols-1 items-stretch gap-6 xl:col-span-12 xl:grid-cols-2">
                        <Card className="corporate-card h-full overflow-hidden">
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
                                        {isSuperAdmin && (
                                            <button
                                                type="button"
                                                disabled={securityScanRunning}
                                                onClick={() => {
                                                    setSecurityScanRunning(true);
                                                    router.post(
                                                        '/api/security-audits/run',
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onFinish: () => setSecurityScanRunning(false),
                                                        },
                                                    );
                                                }}
                                                className="hover:bg-brand-aqua/15 hover:text-brand-teal grid size-8 place-items-center rounded-md text-slate-400 transition disabled:cursor-wait disabled:opacity-50"
                                                aria-label="Run OWASP security audit"
                                                title="Run security audit"
                                            >
                                                <RefreshCw className={`size-4 ${securityScanRunning ? 'animate-spin' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:items-stretch">
                                    <div className="flex flex-col justify-center rounded-2xl bg-slate-50/70 p-5">
                                        <div
                                            className="mx-auto grid size-36 place-items-center rounded-full border-[13px] bg-white"
                                            style={{
                                                borderColor:
                                                    portalSecurity.score >= 80 ? '#10b981' : portalSecurity.score >= 50 ? '#f59e0b' : '#ef4444',
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
                                            <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
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
                                    </div>
                                    <div className="max-h-[310px] space-y-2 overflow-y-auto border-t border-slate-100 pt-4 pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
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
                        <Card className="corporate-card h-full overflow-hidden">
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
                                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
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
                                                    <summary className="flex min-h-11 cursor-pointer list-none items-start gap-2 px-3 py-2.5 marker:hidden sm:items-center">
                                                        <span
                                                            className={`size-2 shrink-0 rounded-full ${successful ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                        />
                                                        <p className="min-w-0 flex-1 text-[11px] leading-4 break-words text-slate-700">
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

                <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.7fr)]">
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
                                        : [
                                              {
                                                  resource: 'No permissions',
                                                  capability: 'Pending',
                                                  source: 'Administrator',
                                              },
                                          ]
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
