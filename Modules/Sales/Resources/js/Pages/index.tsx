import ProjectPageHeader from '@/components/project-page-header';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Building2, IndianRupee, ShoppingBag, Target, TrendingUp, Wallet } from 'lucide-react';
type KPI = { label: string; value: number; suffix?: string; change: number };
type Dashboard = {
    updated_at: string;
    kpis: KPI[];
    companies: Record<string, { sales: number; target: number; achievement: number }>;
    pipeline: { label: string; count: number; amount: number }[];
    outstanding: { label: string; value: number; percent: number }[];
};
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export default function Sales({ dashboard }: { dashboard: Dashboard }) {
    const icons = [IndianRupee, TrendingUp, Target, Wallet];
    return (
        <AppLayout breadcrumbs={[{ title: 'Sales', href: '/admin/sales' }]}>
            <Head title="Sales" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <ProjectPageHeader
                    eyebrow="Sales"
                    title="Sales performance"
                    subtitle="Targets, pipeline and outstanding overview"
                    icon={<TrendingUp className="size-5" />}
                    meta={`Updated ${dashboard.updated_at}`}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {dashboard.kpis.map((k, i) => {
                        const Icon = icons[i];
                        return (
                            <div key={k.label} className="rounded-xl border bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="grid size-9 place-items-center rounded-lg bg-orange-50 text-orange-600">
                                        <Icon className="size-4" />
                                    </span>
                                    <span className={k.change >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                        {k.change >= 0 ? '+' : ''}
                                        {k.change}%
                                    </span>
                                </div>
                                <p className="mt-3 text-xs text-slate-500">{k.label}</p>
                                <b className="text-xl">{k.suffix ? `${k.value}${k.suffix}` : money(k.value)}</b>
                            </div>
                        );
                    })}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="font-bold">Company performance</h2>
                        <div className="mt-4 space-y-4">
                            {Object.entries(dashboard.companies).map(([name, row]) => (
                                <div key={name}>
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2 font-semibold">
                                            <Building2 className="size-4" />
                                            {name}
                                        </span>
                                        <b>{row.achievement}%</b>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div className="bg-brand-teal h-full" style={{ width: `${Math.min(row.achievement, 100)}%` }} />
                                    </div>
                                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                                        <span>{money(row.sales)}</span>
                                        <span>Target {money(row.target)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="font-bold">Order pipeline</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {dashboard.pipeline.map((row) => (
                                <div key={row.label} className="rounded-xl border bg-slate-50 p-4">
                                    <ShoppingBag className="text-brand-teal mb-2 size-4" />
                                    <p className="text-xs text-slate-500">{row.label}</p>
                                    <b>{row.count} orders</b>
                                    <div className="text-xs">{money(row.amount)}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <section className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="font-bold">Outstanding ageing</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {dashboard.outstanding.map((row) => (
                            <div key={row.label} className="rounded-xl border p-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold">{row.label}</span>
                                    <b>{row.percent}%</b>
                                </div>
                                <div className="mt-2 text-lg font-bold">{money(row.value)}</div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full bg-amber-500" style={{ width: `${row.percent}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
