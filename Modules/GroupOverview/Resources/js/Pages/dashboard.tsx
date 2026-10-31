import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Banknote,
    BriefcaseBusiness,
    Building2,
    ChartPie,
    CircleAlert,
    CircleDollarSign,
    Factory,
    IndianRupee,
    Landmark,
    ShieldCheck,
    ShoppingCart,
    Target,
    TrendingUp,
    Truck,
    Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { DataTable, type DataTableColumn } from '../Components/data-table';
import { DashboardPanel, DepartmentCard, MetricCard, SectionHeading } from '../Components/group-overview-cards';
import { LineTrendChart, PlanComparisonChart } from '../Components/overview-charts';

const kpis = [
    {
        label: 'Net sales',
        icon: IndianRupee,
        periodValues: [
            {
                period: 'MTD',
                value: '₹ 137.2 Cr',
                note: '₹8.4 Cr ahead of plan',
                trend: 'up',
            },
            {
                period: 'YTD',
                value: '₹ 1,284.6 Cr',
                note: '6.8% growth vs prior year',
                trend: 'up',
            },
        ],
    },
    {
        label: 'Collections',
        icon: TrendingUp,
        periodValues: [
            {
                period: 'MTD',
                value: '₹ 131.8 Cr',
                note: '96.1% of net sales',
                trend: 'up',
            },
            {
                period: 'YTD',
                value: '₹ 1,219.3 Cr',
                note: '94.9% of net sales',
                trend: 'up',
            },
        ],
    },
    {
        label: 'Month-to-date value',
        value: '₹ 137.2 Cr',
        note: '₹8.4 Cr ahead of plan',
        trend: 'up',
        icon: Target,
    },
    {
        label: 'Receivables overdue',
        value: '₹ 21.5 Cr',
        note: '6.2% of total receivables',
        trend: 'down',
        icon: CircleAlert,
    },
    {
        label: 'Inventory value',
        value: '₹ 122.6 Cr',
        note: '28 days of cover',
        trend: 'neutral',
        icon: Building2,
    },
    {
        label: 'Open priority items',
        value: '8',
        note: '3 require action today',
        trend: 'neutral',
        icon: Users,
    },
] as const;

type CompanyRow = {
    code: string;
    company: string;
    ytdSales: number;
    yearlyTarget: number;
    planAchievement: number | null;
    collections: number;
    overdue: number;
    activeCustomers: number;
};
const companyColumns: DataTableColumn<CompanyRow>[] = [
    {
        key: 'company',
        label: 'Company',
        value: (row) => row.company,
        render: (row) => <span className="font-bold">{row.company}</span>,
    },
    {
        key: 'ytdSales',
        label: 'YTD sales',
        value: (row) => row.ytdSales,
        render: (row) => `₹${row.ytdSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`,
    },
    {
        key: 'yearlyTarget',
        label: 'Yearly target',
        value: (row) => row.yearlyTarget,
        render: (row) => `₹${row.yearlyTarget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`,
    },
    {
        key: 'plan',
        label: 'Yearly achieved',
        value: (row) => row.planAchievement ?? -1,
        render: (row) => (
            <span className="text-brand-teal font-bold">
                {row.planAchievement === null
                    ? '—'
                    : `${row.planAchievement.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
            </span>
        ),
    },
    {
        key: 'collections',
        label: 'YTD collections',
        value: (row) => row.collections,
        render: (row) => `₹${row.collections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`,
    },
    {
        key: 'overdue',
        label: 'Current overdue',
        value: (row) => row.overdue,
        render: (row) => `₹${row.overdue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`,
    },
    {
        key: 'activeCustomers',
        label: 'Active customers',
        value: (row) => row.activeCustomers,
        render: (row) => <span className="font-bold">{row.activeCustomers.toLocaleString('en-IN')}</span>,
    },
];

const departments = [
    {
        name: 'Sales & distribution',
        metric: '93.0% of plan',
        detail: '₹137.2 Cr MTD · strongest region North',
        icon: TrendingUp,
    },
    {
        name: 'Production & capacity',
        metric: 'Apollo 91.1% · Kisan 83.9% · Trico 89.9%',
        detail: 'Capacity gain led by optimized production plan',
        icon: Factory,
    },
    {
        name: 'Finance & treasury',
        metric: '₹177.5 Cr debt',
        detail: '₹24.7 Cr uninvoiced exposure',
        icon: Landmark,
    },
    {
        name: 'Receivables & credit',
        metric: '₹95.8 Cr outstanding',
        detail: 'Overdue exposure remains within guardrail',
        icon: Banknote,
    },
    {
        name: 'Costing & profitability',
        metric: '14.7% contribution',
        detail: 'Margin expansion is progressing',
        icon: ChartPie,
    },
    {
        name: 'Purchasing',
        metric: '4 materials below cover',
        detail: 'Two materials require action this week',
        icon: ShoppingCart,
    },
    {
        name: 'Inventory & logistics',
        metric: '97.1% delivery proof',
        detail: '12 files are awaiting POD closure',
        icon: Truck,
    },
    {
        name: 'Quality & service',
        metric: '6 complaints overdue',
        detail: 'Customer response plan active',
        icon: ShieldCheck,
    },
    {
        name: 'People & productivity',
        metric: '92.2% attendance',
        detail: 'Daily absentee risk trending lower',
        icon: Users,
    },
    {
        name: 'Projects & investments',
        metric: '₹25.5 Cr committed',
        detail: 'Capital program is on approved budget',
        icon: BriefcaseBusiness,
    },
    {
        name: 'Investor & strategy',
        metric: '6.5% net margin',
        detail: 'Ahead of the current board plan',
        icon: CircleDollarSign,
    },
];

function formatCrores(value: number): string {
    const crores = value / 10_000_000;

    return `₹\u00A0${crores.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}\u00A0Cr`;
}

export default function GroupOverview({
    netSales = { mtd: 0, ytd: 0 },
    collections = { mtd: 0, ytd: 0 },
    receivablesOverdue = 0,
    inventory = { value: 0, zrawValue: 0, yrawValue: 0, daysOfCover: null },
    priorityItems = { open: 0, due: 0 },
    performance = { year: new Date().getFullYear(), yearlyTarget: 0, targetFiscalYear: '', monthlyTrend: [], planComparison: [] },
    companyScorecard = [],
    salesMeta = { salesDateTime: null, collectionsDateTime: null, inventoryDateTime: null, apiSyncDateTime: null },
    companies: companyOptions = [],
    filters = { company: null },
}: {
    netSales?: { mtd: number; ytd: number };
    collections?: { mtd: number; ytd: number };
    receivablesOverdue?: number;
    inventory?: { value: number; zrawValue: number; yrawValue: number; daysOfCover: number | null };
    priorityItems?: { open: number; due: number };
    performance?: {
        year: number;
        yearlyTarget: number;
        targetFiscalYear: string;
        monthlyTrend: Array<{ date: string; sales: number | null; collections: number | null; target: number }>;
        planComparison: Array<{ name: string; actual: number; plan: number }>;
    };
    companyScorecard?: CompanyRow[];
    salesMeta?: {
        salesDateTime: string | null;
        collectionsDateTime: string | null;
        inventoryDateTime: string | null;
        apiSyncDateTime: string | null;
    };
    companies?: { code: string; name: string }[];
    filters?: { company: string | null };
}) {
    useEffect(() => {
        const refreshNetSales = () => {
            if (document.visibilityState === 'visible') {
                router.reload({
                    only: [
                        'netSales',
                        'collections',
                        'receivablesOverdue',
                        'inventory',
                        'priorityItems',
                        'performance',
                        'companyScorecard',
                        'salesMeta',
                    ],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        };
        const interval = window.setInterval(refreshNetSales, 15_000);

        return () => window.clearInterval(interval);
    }, []);

    const selectedCompany = filters.company ?? '';
    const selectedCompanyName = companyOptions.find(({ code }) => code === selectedCompany)?.name ?? 'All companies';
    const dataCutoff = salesMeta.salesDateTime ?? 'time unavailable';
    const collectionsCutoff = salesMeta.collectionsDateTime ?? 'time unavailable';
    const inventoryCutoff = salesMeta.inventoryDateTime ?? 'time unavailable';
    const salesScopeNote = selectedCompany ? `${selectedCompanyName}\n(${dataCutoff})` : `All companies combined\n(${dataCutoff})`;
    const liveKpis = kpis.map((kpi) => {
        if (kpi.label === 'Net sales') {
            return {
                ...kpi,
                periodValues: [
                    {
                        period: 'MTD' as const,
                        value: formatCrores(netSales.mtd),
                        note: salesScopeNote,
                        trend: 'up' as const,
                    },
                    {
                        period: 'YTD' as const,
                        value: formatCrores(netSales.ytd),
                        note: salesScopeNote,
                        trend: 'up' as const,
                    },
                ],
            };
        }

        if (kpi.label === 'Collections') {
            return {
                ...kpi,
                periodValues: [
                    {
                        period: 'MTD',
                        value: formatCrores(collections.mtd),
                        note: `${selectedCompanyName}\n(${collectionsCutoff})`,
                        trend: 'up' as const,
                    },
                    {
                        period: 'YTD',
                        value: formatCrores(collections.ytd),
                        note: `${selectedCompanyName} — Through ${collectionsCutoff}`,
                        trend: 'up' as const,
                    },
                ],
            };
        }

        if (kpi.label === 'Receivables overdue') {
            return {
                ...kpi,
                value: formatCrores(receivablesOverdue),
                note: `${selectedCompanyName} — Current month overdue`,
            };
        }

        if (kpi.label === 'Month-to-date value') {
            return {
                ...kpi,
                value: formatCrores(netSales.mtd),
                note: `${selectedCompanyName} — Current month net sales`,
            };
        }

        if (kpi.label === 'Inventory value') {
            return {
                ...kpi,
                value: formatCrores(inventory.value),
                note:
                    inventory.daysOfCover === null
                        ? `ZRAW ${formatCrores(inventory.zrawValue)} · YRAW ${formatCrores(inventory.yrawValue)}\n${selectedCompanyName} — Cover unavailable (${inventoryCutoff})`
                        : `ZRAW ${formatCrores(inventory.zrawValue)} · YRAW ${formatCrores(inventory.yrawValue)}\n${inventory.daysOfCover.toLocaleString('en-IN', { maximumFractionDigits: 1 })} days of cover (${inventoryCutoff})`,
            };
        }

        if (kpi.label === 'Open priority items') {
            return {
                ...kpi,
                value: priorityItems.open.toLocaleString('en-IN'),
                note: `${priorityItems.due.toLocaleString('en-IN')} require action today`,
            };
        }

        return kpi;
    });

    return (
        <AppLayout>
            <Head title="Group Overview" />
            <div className="bg-background text-foreground min-h-full px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
                <main className="mx-auto w-full max-w-[1480px] space-y-5 sm:space-y-6">
                    <header className="relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#023047_0%,#075b6d_58%,#219ebc_100%)] px-5 py-4 text-white shadow-[0_18px_45px_-24px_rgba(2,48,71,0.9)] sm:px-7 lg:flex-row lg:items-center">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(142,202,230,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(142,202,230,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
                        <div className="border-brand-gold/20 absolute -top-20 right-[38%] size-52 rounded-full border-[22px]" />
                        <div className="relative z-10">
                            <p className="text-brand-gold mb-1 text-[10px] font-bold tracking-[0.18em] uppercase">Management cockpit</p>
                            <h1 className="text-2xl font-black tracking-[-0.035em] sm:text-[2rem]">Group overview</h1>
                        </div>
                        <div className="relative z-10 w-full rounded-xl border border-white/15 bg-white/[0.08] p-3 backdrop-blur-sm lg:w-auto">
                            <label className="grid gap-1.5 text-[10px] font-bold tracking-wide text-white/65 uppercase" htmlFor="company-filter">
                                Company
                                <select
                                    id="company-filter"
                                    value={selectedCompany}
                                    onChange={(event) => {
                                        const company = event.target.value;

                                        router.get('/admin/group-overview', company ? { company } : {}, {
                                            preserveScroll: true,
                                            preserveState: true,
                                            replace: true,
                                        });
                                    }}
                                    className="text-brand-plum focus:ring-brand-gold/40 h-9 min-w-48 rounded-lg border border-white/30 bg-white px-3 text-xs font-bold shadow-sm transition outline-none focus:ring-2"
                                >
                                    <option value="">All companies</option>
                                    {companyOptions.map((company) => (
                                        <option key={company.code} value={company.code}>
                                            {company.name} ({company.code})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </header>

                    <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {liveKpis.map((kpi) => (
                            <MetricCard key={kpi.label} {...kpi} />
                        ))}
                    </section>

                    <section className="space-y-3">
                        <SectionHeading>Performance at a glance</SectionHeading>
                        <div className="grid gap-4 xl:grid-cols-2">
                            <DashboardPanel title="Monthly sales, collections and target · crore" meta={`${performance.year} · Jan–Dec`}>
                                <LineTrendChart
                                    labels={performance.monthlyTrend.map(({ date }) => date)}
                                    sales={performance.monthlyTrend.map(({ sales }) => sales)}
                                    collections={performance.monthlyTrend.map(({ collections }) => collections)}
                                    target={performance.monthlyTrend.map(({ target }) => target)}
                                    yearlyTarget={performance.yearlyTarget}
                                    targetFiscalYear={performance.targetFiscalYear}
                                />
                            </DashboardPanel>
                            <DashboardPanel title="Month-to-date sales versus target · lakh" meta="Actual / Target">
                                <PlanComparisonChart rows={performance.planComparison} />
                            </DashboardPanel>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <SectionHeading>Company scorecard</SectionHeading>
                        <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[0_10px_30px_-22px_rgba(2,48,71,0.45)]">
                            <div className="border-border border-b px-4 py-3">
                                <h3 className="text-xs font-bold">
                                    Operating companies <span className="text-muted-foreground ml-1 font-normal">· {selectedCompanyName}</span>
                                </h3>
                            </div>
                            <DataTable
                                rows={companyScorecard.filter((row) => selectedCompany === '' || row.code === selectedCompany)}
                                columns={companyColumns}
                                searchPlaceholder="Search companies"
                                initialPageSize={5}
                            />
                        </div>
                    </section>

                    <section className="space-y-3 pb-6">
                        <SectionHeading>Department snapshot</SectionHeading>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {departments.map((department) => (
                                <DepartmentCard key={department.name} {...department} />
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </AppLayout>
    );
}
