import ProcurementFilterBar from '@/components/procurement-filter-bar';
import ProcurementPageHeader from '@/components/procurement-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Boxes, Clock3, PackageCheck, ShoppingCart, TrendingUp } from 'lucide-react';
import { FormEvent, memo, useMemo, useState } from 'react';

type MetricRow = { label: string | null; value: number };
type MaterialDemand = { code: string; name: string | null; value: number };
type DeliveryStatus = {
    source: 'sap' | 'local';
    id: number;
    po_number: string;
    vendor_name: string;
    label: string;
    quantity_mt: number;
    expected_delivery_date: string;
};
type Props = {
    filters: { company_code: string; plant_code: string; material: string };
    companies: { company_code: string; company_name: string }[];
    plants: { company_code: string; company_name: string; parent_company_id: string | null }[];
    materials: { matnr: string; maktx: string | null }[];
    updatedAt: string;
    kpis: {
        active_consumptions: number;
        monthly_demand_mt: number;
        purchase_quantity_mt: number;
        open_orders: number;
        open_order_quantity_mt: number;
        inventory_mt: number;
    };
    plantDemand: MetricRow[];
    materialDemand: MaterialDemand[];
    stockByPlant: MetricRow[];
    deliveryStatus: DeliveryStatus[];
};

const number = (value: number) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ProcurementDashboard({
    filters,
    companies,
    plants,
    materials,
    updatedAt,
    kpis,
    plantDemand,
    materialDemand,
    stockByPlant,
    deliveryStatus,
}: Props) {
    const [companyCode, setCompanyCode] = useState(filters.company_code || 'all');
    const [plantCode, setPlantCode] = useState(filters.plant_code || 'all');
    const [materialCode, setMaterialCode] = useState(filters.material || 'all');
    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/procurement/dashboard',
            {
                company_code: companyCode === 'all' ? undefined : companyCode,
                plant_code: plantCode === 'all' ? undefined : plantCode,
                material: materialCode === 'all' ? undefined : materialCode,
            },
            { preserveState: true, replace: true },
        );
    };
    const resetFilters = () => {
        setCompanyCode('all');
        setPlantCode('all');
        setMaterialCode('all');
        router.get('/admin/procurement/dashboard', {}, { preserveState: false, replace: true });
    };
    const plantDemandGraph = useMemo(
        () => plantDemand.map((item) => ({ label: item.label ?? 'Unknown plant', value: Number(item.value) })),
        [plantDemand],
    );
    const materialDemandGraph = useMemo(
        () => materialDemand.map((item) => ({ label: item.code, value: Number(item.value), description: item.name ?? 'Material' })),
        [materialDemand],
    );
    const stockGraph = useMemo(
        () => stockByPlant.map((item) => ({ label: item.label ?? 'Unknown plant', value: Number(item.value) })),
        [stockByPlant],
    );
    const deliveryGraph = useMemo(
        () =>
            deliveryStatus.map((item) => ({
                label: item.po_number,
                value: Number(item.quantity_mt),
                description: `${item.source === 'sap' ? 'SAP API' : 'Local'} · ${label(item.label)} · ${item.vendor_name}`,
                color: item.source === 'sap' ? 'bg-orange-500' : 'bg-sky-500',
            })),
        [deliveryStatus],
    );
    const cards = [
        {
            title: 'Monthly demand',
            value: `${number(kpis.monthly_demand_mt)} MT`,
            note: `${kpis.active_consumptions} active plans`,
            icon: TrendingUp,
        },
        { title: 'Purchase quantity', value: `${number(kpis.purchase_quantity_mt)} MT`, note: 'All active purchase plans', icon: ShoppingCart },
        { title: 'Open orders', value: number(kpis.open_orders), note: `${number(kpis.open_order_quantity_mt)} MT pending`, icon: Clock3 },
        { title: 'Current inventory', value: `${number(kpis.inventory_mt)} MT`, note: 'Across active material stocks', icon: Boxes },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Procurement', href: '/admin/procurement/dashboard' },
                { title: 'Dashboard', href: '/admin/procurement/dashboard' },
            ]}
        >
            <Head title="Procurement Dashboard" />
            <div className="mx-auto w-full max-w-[1680px] space-y-5 p-3 md:p-5 lg:p-6">
                <ProcurementPageHeader
                    title="Procurement Dashboard"
                    subtitle="Live demand, purchasing, inventory and delivery overview"
                    icon={PackageCheck}
                    meta={`Updated ${updatedAt}`}
                />

                <ProcurementFilterBar
                    companyCode={companyCode}
                    plantCode={plantCode}
                    materialCode={materialCode}
                    companies={companies}
                    plants={plants}
                    materials={materials}
                    onCompanyChange={(value) => {
                        setCompanyCode(value);
                        setPlantCode('all');
                    }}
                    onPlantChange={setPlantCode}
                    onMaterialChange={setMaterialCode}
                    onApply={applyFilters}
                    onReset={resetFilters}
                />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ title, value, note, icon: Icon }) => (
                        <Card key={title} className="border-slate-200 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">{title}</p>
                                        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                                        <p className="mt-2 text-[11px] text-slate-400">{note}</p>
                                    </div>
                                    <span className="bg-brand-teal/10 text-brand-teal grid size-10 place-items-center rounded-xl">
                                        <Icon className="size-5" />
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm">Demand by plant</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <HorizontalComparisonGraph items={plantDemandGraph} />
                            {plantDemand.length === 0 && <EmptyState text="No active consumption demand." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm">Demand by material</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <RankedMaterialGraph items={materialDemandGraph} />
                            {materialDemand.length === 0 && <EmptyState text="No material demand available." />}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm">Current stock by plant</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <StockLineGraph items={stockGraph} />
                            {stockByPlant.length === 0 && <EmptyState text="No stock data for the selected filters." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-4">
                            <CardTitle className="text-sm">Delivery pipeline</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <DeliveryTimeline items={deliveryGraph} />
                            {deliveryStatus.length === 0 && <EmptyState text="No purchase delivery data." />}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

type GraphItem = { label: string; value: number; description?: string; color?: string };

const HorizontalComparisonGraph = memo(function HorizontalComparisonGraph({ items }: { items: GraphItem[] }) {
    if (!items.length) return null;
    const visibleItems = items.slice(0, 10);
    const maximum = Math.max(...visibleItems.map((item) => item.value), 1);

    return (
        <div className="max-h-72 space-y-3 overflow-y-auto pr-2 [scrollbar-width:thin]">
            {visibleItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
                    <span className="truncate text-xs font-semibold text-slate-700" title={item.label}>
                        {item.label}
                    </span>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
                            style={{ width: `${Math.max((item.value / maximum) * 100, 2)}%` }}
                        />
                    </div>
                    <strong className="w-20 text-right text-xs text-slate-900 tabular-nums">{number(item.value)} MT</strong>
                </div>
            ))}
        </div>
    );
});

const RankedMaterialGraph = memo(function RankedMaterialGraph({ items }: { items: GraphItem[] }) {
    if (!items.length) return null;
    const visibleItems = items.slice(0, 10);
    const total = Math.max(
        visibleItems.reduce((sum, item) => sum + item.value, 0),
        1,
    );
    const colors = ['bg-amber-500', 'bg-orange-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500'];

    return (
        <div className="grid max-h-72 gap-2 overflow-y-auto pr-2 [scrollbar-width:thin] sm:grid-cols-2">
            {visibleItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-start gap-2">
                        <span
                            className={`grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white ${colors[index % colors.length]}`}
                        >
                            {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900" title={item.label}>
                                {item.label}
                            </p>
                            <p className="truncate text-[10px] text-slate-500" title={item.description}>
                                {item.description || 'Material'}
                            </p>
                        </div>
                        <strong className="text-xs text-slate-900 tabular-nums">{number(item.value)}</strong>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                        <div
                            className={`h-full rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${Math.max((item.value / total) * 100, 1)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
});

const StockLineGraph = memo(function StockLineGraph({ items }: { items: GraphItem[] }) {
    if (!items.length) return null;
    const visibleItems = items.slice(0, 10);
    const maximum = Math.max(...visibleItems.map((item) => item.value), 1);
    const points = visibleItems.map((item, index) => {
        const x = visibleItems.length === 1 ? 350 : 24 + (index / (visibleItems.length - 1)) * 652;
        const y = 185 - (item.value / maximum) * 145;
        return { ...item, x, y };
    });
    const pointList = points.map((item) => `${item.x},${item.y}`).join(' ');

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[560px]">
                <svg viewBox="0 0 700 210" className="h-52 w-full" role="img" aria-label="Current stock by plant line chart">
                    <defs>
                        <linearGradient id="stock-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                    {[40, 90, 140, 190].map((y) => (
                        <line key={y} x1="20" y1={y} x2="680" y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
                    ))}
                    <polygon points={`24,190 ${pointList} 676,190`} fill="url(#stock-fill)" />
                    <polyline points={pointList} fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((item, index) => (
                        <g key={`${item.label}-${index}`}>
                            <circle cx={item.x} cy={item.y} r="6" fill="white" stroke="#059669" strokeWidth="4" />
                            <text x={item.x} y={Math.max(item.y - 13, 14)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                                {number(item.value)}
                            </text>
                        </g>
                    ))}
                </svg>
                <div className="grid auto-cols-fr grid-flow-col gap-2 px-2">
                    {points.map((item, index) => (
                        <span
                            key={`${item.label}-${index}`}
                            className="truncate text-center text-[10px] font-semibold text-slate-600"
                            title={item.label}
                        >
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
});

const DeliveryTimeline = memo(function DeliveryTimeline({ items }: { items: GraphItem[] }) {
    if (!items.length) return null;

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-start px-3 pt-5">
                {items.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="relative w-40 pr-6">
                        {index < items.length - 1 && <span className="absolute top-3 left-5 h-0.5 w-full bg-slate-200" />}
                        <span
                            className={`relative z-10 grid size-7 place-items-center rounded-full border-4 border-white shadow ${item.color || 'bg-sky-500'}`}
                        />
                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <p className="truncate text-xs font-bold text-slate-900" title={item.label}>
                                {item.label}
                            </p>
                            <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                                {number(item.value)} <small className="text-[10px] font-medium text-slate-500">MT</small>
                            </p>
                            <p className="mt-1 line-clamp-2 text-[10px] text-slate-500" title={item.description}>
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

function EmptyState({ text }: { text: string }) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">{text}</div>;
}
