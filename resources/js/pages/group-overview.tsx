import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { DataTable, type DataTableColumn } from '../Components/data-table';
import { DashboardPanel, DepartmentCard, MetricCard, SectionHeading } from '../Components/group-overview-cards';
import { LineTrendChart, PlanComparisonChart } from '../Components/overview-charts';
import {
    Banknote,
    BriefcaseBusiness,
    Building2,
    ChartPie,
    CircleAlert,
    CircleDollarSign,
    Clock3,
    Factory,
    IndianRupee,
    Landmark,
    RefreshCw,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    Target,
    Truck,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const kpis = [
    { label: 'Yesterday net sales', value: '₹572.1 L', note: '4.8% vs daily plan', trend: 'down', icon: IndianRupee },
    { label: 'This sales month', value: '₹513.8 L', note: '74% of monthly target', trend: 'up', icon: TrendingUp },
    { label: 'Month-to-date value', value: '₹137.2 Cr', note: '₹8.4 Cr ahead of plan', trend: 'up', icon: Target },
    { label: 'Uninvoiced orders', value: '₹24.7 Cr', note: '₹3.1 Cr due this week', trend: 'neutral', icon: Clock3 },
    { label: 'Receivables overdue', value: '₹21.5 Cr', note: '6.2% of total receivables', trend: 'down', icon: CircleAlert },
    { label: 'Inventory value', value: '₹122.6 Cr', note: '28 days of cover', trend: 'neutral', icon: Building2 },
    { label: 'Overall OEE average', value: '12.7%', note: '1.3 pts improvement', trend: 'up', icon: Sparkles },
    { label: 'Open priority items', value: '8', note: '3 require action today', trend: 'neutral', icon: Users },
] as const;

const salesSeries = [72, 74, 77, 75, 79, 82, 80, 83, 78, 81, 86, 82, 88, 84, 89, 87, 91, 88, 90, 92, 89, 94, 91, 93, 90, 95, 92, 94, 96, 93];
const collectionSeries = [69, 71, 72, 74, 73, 76, 75, 78, 80, 79, 81, 83, 82, 84, 83, 86, 85, 87, 88, 87, 89, 90, 91, 89, 92, 93, 91, 94, 95, 96];

const companies = [
    { company: 'Apollo Pipes', revenue: '₹88,780 L', plan: '96.8%', collection: '₹7,770 L', age: '1,320', oee: '78.8%' },
    { company: 'Kisan Mouldings', revenue: '₹2,689 L', plan: '86.8%', collection: '₹2,984 L', age: '460', oee: '62.6%' },
    { company: 'Apollo Tricoat', revenue: '₹3,432 L', plan: '91.4%', collection: '₹3,003 L', age: '790', oee: '71.0%' },
];

const decisions = [
    { company: 'Apollo Pipes', issue: 'Inventory beyond 60 days remains open', priority: 'High', impact: '₹1,800 L held across ageing inventory', owner: 'Central control head', due: 'Oct 29, 2026' },
    { company: 'Kisan Mouldings', issue: 'Dispatch below 30-day baseline', priority: 'High', impact: '72 L tonnes versus 110 tonnes plan', owner: 'Plant head', due: 'Oct 29, 2026' },
    { company: 'Kisan Mouldings', issue: 'PVC resin below reorder threshold', priority: 'High', impact: '6 days cover versus 15-day trigger', owner: 'Purchase head', due: 'Oct 29, 2026' },
    { company: 'Mauria', issue: 'Open ageing file incomplete in controller', priority: 'Medium', impact: '2 overdue cases', owner: 'Quality & service head', due: 'Oct 27, 2026' },
    { company: 'Kisan Mouldings', issue: 'Receivables recovery window exceeded', priority: 'High', impact: 'Revenue dispatch held pending recovery', owner: 'Logistics head', due: 'Oct 30, 2026' },
    { company: 'Mauria', issue: 'Critical equipment downtime elevated', priority: 'High', impact: '₹22 L idle hours and unplanned loss', owner: 'Engineering head', due: 'Oct 28, 2026' },
    { company: 'Mauria', issue: 'Closure approval crossed review trigger', priority: 'Medium', impact: '7 days open versus 5-day trigger', owner: 'Plant head', due: 'Oct 30, 2026' },
    { company: 'Apollo Pipes', issue: 'Manual promotion payout needs review', priority: 'Medium', impact: '₹18.5 L held in manual review', owner: 'Finance controller', due: 'Oct 30, 2026' },
];

type CompanyRow = (typeof companies)[number];
type DecisionRow = (typeof decisions)[number];

const companyColumns: DataTableColumn<CompanyRow>[] = [
    { key: 'company', label: 'Company', value: (row) => row.company, render: (row) => <span className="font-bold">{row.company}</span> },
    { key: 'revenue', label: 'MTD sales', value: (row) => row.revenue },
    { key: 'plan', label: 'Plan achieved', value: (row) => row.plan, render: (row) => <span className="text-brand-teal font-bold">{row.plan}</span> },
    { key: 'collection', label: 'Collections', value: (row) => row.collection },
    { key: 'age', label: 'Age >60d', value: (row) => Number(row.age.replaceAll(',', '')) },
    { key: 'oee', label: 'Current OEE', value: (row) => row.oee, render: (row) => <span className="font-bold">{row.oee}</span> },
];

const decisionColumns: DataTableColumn<DecisionRow>[] = [
    { key: 'company', label: 'Company', value: (row) => row.company, render: (row) => <span className="font-bold">{row.company}</span> },
    { key: 'issue', label: 'Issue / request', value: (row) => row.issue, className: 'min-w-56' },
    { key: 'priority', label: 'Priority', value: (row) => row.priority, render: (row) => <span className={`rounded-md px-2 py-1 text-[9px] font-extrabold ${row.priority === 'High' ? 'bg-brand-berry/10 text-brand-berry' : 'bg-brand-gold/15 text-brand-plum'}`}>{row.priority}</span> },
    { key: 'impact', label: 'Exposure / impact', value: (row) => row.impact, className: 'min-w-64' },
    { key: 'owner', label: 'Owner', value: (row) => row.owner, className: 'min-w-40' },
    { key: 'due', label: 'Due', value: (row) => row.due, className: 'whitespace-nowrap' },
];

const departments = [
    { name: 'Sales & distribution', metric: '93.0% of plan', detail: '₹137.2 Cr MTD · strongest region North', icon: TrendingUp },
    { name: 'Production & capacity', metric: 'Apollo 91.1% · Kisan 83.9% · Trico 89.9%', detail: 'Capacity gain led by optimized production plan', icon: Factory },
    { name: 'Finance & treasury', metric: '₹177.5 Cr debt', detail: '₹24.7 Cr uninvoiced exposure', icon: Landmark },
    { name: 'Receivables & credit', metric: '₹95.8 Cr outstanding', detail: 'Overdue exposure remains within guardrail', icon: Banknote },
    { name: 'Costing & profitability', metric: '14.7% contribution', detail: 'Margin expansion is progressing', icon: ChartPie },
    { name: 'Purchasing', metric: '4 materials below cover', detail: 'Two materials require action this week', icon: ShoppingCart },
    { name: 'Inventory & logistics', metric: '97.1% delivery proof', detail: '12 files are awaiting POD closure', icon: Truck },
    { name: 'Quality & service', metric: '6 complaints overdue', detail: 'Customer response plan active', icon: ShieldCheck },
    { name: 'People & productivity', metric: '92.2% attendance', detail: 'Daily absentee risk trending lower', icon: Users },
    { name: 'Projects & investments', metric: '₹25.5 Cr committed', detail: 'Capital program is on approved budget', icon: BriefcaseBusiness },
    { name: 'Investor & strategy', metric: '6.5% net margin', detail: 'Ahead of the current board plan', icon: CircleDollarSign },
];

export default function GroupOverview() {
    const [selectedCompany, setSelectedCompany] = useState('All companies');

    return (
        <AppLayout>
            <Head title="Group Overview" />
            <div className="bg-background text-foreground min-h-full px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
                <main className="mx-auto w-full max-w-[1480px] space-y-5 sm:space-y-6">
                    <header className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#023047_0%,#075b6d_58%,#219ebc_100%)] px-5 py-6 text-white shadow-[0_18px_45px_-24px_rgba(2,48,71,0.9)] sm:px-7 lg:flex-row lg:items-center">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(142,202,230,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(142,202,230,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
                        <div className="border-brand-gold/20 absolute -top-20 right-[38%] size-52 rounded-full border-[22px]" />
                        <div className="relative z-10">
                            <p className="text-brand-gold mb-1 text-[10px] font-bold tracking-[0.18em] uppercase">Management cockpit</p>
                            <h1 className="text-2xl font-black tracking-[-0.035em] sm:text-[2rem]">Group overview</h1>
                            <p className="mt-1 max-w-xl text-xs leading-5 text-white/70 sm:text-sm">A concise morning view of group performance, operating risk, and decisions requiring attention.</p>
                        </div>
                        <div className="relative z-10 flex w-full flex-col gap-3 rounded-xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm sm:flex-row sm:items-end lg:w-auto">
                            <label className="grid gap-1.5 text-[10px] font-bold tracking-wide text-white/65 uppercase" htmlFor="company-filter">Company
                            <select id="company-filter" value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)} className="text-brand-plum focus:ring-brand-gold/40 h-10 min-w-48 rounded-lg border border-white/30 bg-white px-3 text-xs font-bold shadow-sm outline-none transition focus:ring-2">
                                <option>All companies</option>
                                <option>Apollo Pipes</option>
                                <option>Kisan Mouldings</option>
                                <option>Apollo Tricoat</option>
                            </select>
                            </label>
                            <div className="text-left sm:border-l sm:border-white/20 sm:pl-5 sm:text-right">
                                <p className="text-sm font-extrabold">26 October 2026</p>
                                <p className="mt-1 text-[10px] text-white/60">Reporting cut-off · 08:30 AM</p>
                                <p className="text-brand-aqua mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold sm:justify-end">
                                    <RefreshCw className="size-3" />
                                    Last sync · 08:30 AM
                                </p>
                            </div>
                        </div>
                    </header>

                    <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4">
                        {kpis.map((kpi) => <MetricCard key={kpi.label} {...kpi} />)}
                    </section>

                    <section className="space-y-3">
                        <SectionHeading>Performance at a glance</SectionHeading>
                        <div className="grid gap-4 xl:grid-cols-2">
                            <DashboardPanel title="Daily sales and collections · lakh" meta="Last 30 days">
                                <LineTrendChart sales={salesSeries} collections={collectionSeries} />
                            </DashboardPanel>
                            <DashboardPanel title="Month-to-date sales versus adjusted plan · lakh" meta="Actual / Plan">
                                <PlanComparisonChart />
                            </DashboardPanel>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <SectionHeading>Company scorecard</SectionHeading>
                        <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[0_10px_30px_-22px_rgba(2,48,71,0.45)]">
                            <div className="border-border border-b px-4 py-3"><h3 className="text-xs font-bold">Operating companies <span className="text-muted-foreground ml-1 font-normal">· {selectedCompany}</span></h3></div>
                            <DataTable rows={companies.filter((row) => selectedCompany === 'All companies' || row.company === selectedCompany)} columns={companyColumns} searchPlaceholder="Search companies" initialPageSize={5} />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <SectionHeading>Decisions for today</SectionHeading>
                        <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[0_10px_30px_-22px_rgba(2,48,71,0.45)]">
                            <div className="border-border border-b px-4 py-3"><h3 className="text-xs font-bold">Priority action queue</h3><p className="text-muted-foreground mt-1 text-[10px]">Dummy items for management review</p></div>
                            <DataTable rows={decisions} columns={decisionColumns} searchPlaceholder="Search decisions" initialPageSize={5} />
                        </div>
                    </section>

                    <section className="space-y-3 pb-6">
                        <SectionHeading>Department snapshot</SectionHeading>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {departments.map((department) => <DepartmentCard key={department.name} {...department} />)}
                        </div>
                    </section>

                </main>
            </div>
        </AppLayout>
    );
}
