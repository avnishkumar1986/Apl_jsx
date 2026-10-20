import ProcurementPageHeader from '@/components/procurement-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronDown, Search, ShoppingCart } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Purchase = {
    id: number;
    vendor_name: string;
    quantity_mt: number;
    expected_delivery_date: string;
    delivery_status: string;
    vendor_source: string;
    remarks: string | null;
    is_api?: boolean;
};
type Mou = { id: number; vendor_name: string; vendor_code: string | null; quantity_mt: number; remarks: string | null };
type Summary = {
    opening_stock: number;
    working_days: number;
    total_required: number;
    projected_closing: number;
    gross_shortage: number;
    remaining_shortage: number;
    stock_cover: number;
};
type Plan = { id: number; consumption_date: string; quantity_mt: number };
type NamedEntity = { company_name: string } | null;
type Material = { matnr: string; maktx: string } | null;

export default function SupplyPlan({
    plan,
    plant,
    company,
    material,
    purchases,
    mouPlans,
    vendors = [],
    summary,
}: {
    plan: Plan;
    plant: NamedEntity;
    company: NamedEntity;
    material: Material;
    purchases: Purchase[];
    mouPlans: Mou[];
    vendors: string[];
    summary: Summary;
}) {
    const purchase = useForm({
        vendor_name: '',
        quantity_mt: String(summary.remaining_shortage || ''),
        expected_delivery_date: '',
        delivery_status: 'planned',
        remarks: '',
    });
    const [purchaseUsesLocalVendor, setPurchaseUsesLocalVendor] = useState(false);
    const mou = useForm({ vendor_name: '', vendor_code: '', quantity_mt: '', remarks: '' });
    const savePurchase = (e: FormEvent) => {
        e.preventDefault();
        purchase.post(`/admin/procurement/consumptions/${plan.id}/purchase-orders`, {
            preserveScroll: true,
            onSuccess: () => {
                purchase.reset();
                setPurchaseUsesLocalVendor(false);
            },
        });
    };
    const saveMou = (e: FormEvent) => {
        e.preventDefault();
        mou.post(`/admin/procurement/consumptions/${plan.id}/mou-plans`, { preserveScroll: true, onSuccess: () => mou.reset() });
    };
    const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${plan.consumption_date}T00:00:00`));
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Procurement', href: '/admin/procurement' },
                { title: 'Balance sheet', href: '/admin/procurement/balance-sheet' },
                { title: 'Supply planning', href: '#' },
            ]}
        >
            <Head title="Monthly supply planning" />
            <div className="procurement-compact mx-auto w-full max-w-full space-y-3 p-3 sm:p-4">
                <ProcurementPageHeader
                    title={`${material?.matnr} · ${material?.maktx}`}
                    subtitle={`${month} · ${plant?.company_name} · ${company?.company_name}`}
                    icon={ShoppingCart}
                    actions={
                        <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-slate-900" asChild>
                            <Link href="/admin/procurement/balance-sheet">
                                <ArrowLeft className="size-4" />
                                Balance sheet
                            </Link>
                        </Button>
                    }
                />
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 xl:grid-cols-6">
                    <Kpi label="Opening stock" value={summary.opening_stock} note="MT · stock sync" />
                    <Kpi
                        label="Total required"
                        value={summary.total_required}
                        note={`${Number(plan.quantity_mt).toFixed(3)} MT/day × ${summary.working_days} days`}
                    />
                    <Kpi danger label="Projected closing" value={summary.projected_closing} note="MT · after planned buying/imports" />
                    <Kpi danger label="Gross shortage" value={summary.gross_shortage} note="MT · before mapped purchase orders" />
                    <Kpi danger label="Remaining shortage" value={summary.remaining_shortage} note="MT · suggested additional buy" />
                    <Kpi label="Stock cover" value={summary.stock_cover} note="Days" />
                </div>
                <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-2.5">
                        <h2 className="text-base font-bold text-slate-900">Create purchase order manually</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            The remaining shortage is suggested automatically; no purchase order is created until you save.
                        </p>
                    </div>
                    <form
                        onSubmit={savePurchase}
                        className={`grid items-start gap-x-5 gap-y-4 bg-slate-50/40 p-4 sm:grid-cols-2 sm:p-5 ${purchaseUsesLocalVendor ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}
                    >
                        <Field label="Vendor">
                            <VendorInput
                                value={purchase.data.vendor_name}
                                vendors={vendors}
                                onChange={(v) => purchase.setData('vendor_name', v)}
                                onLocalVendorChange={setPurchaseUsesLocalVendor}
                                showLocalInput={false}
                            />
                        </Field>
                        {purchaseUsesLocalVendor && (
                            <Field label="Local vendor name">
                                <Input
                                    autoFocus
                                    placeholder="Enter local vendor name"
                                    value={purchase.data.vendor_name}
                                    onChange={(event) => purchase.setData('vendor_name', event.target.value)}
                                />
                            </Field>
                        )}
                        <Field label="Quantity (MT)">
                            <Input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="Quantity (MT)"
                                value={purchase.data.quantity_mt}
                                onChange={(e) => purchase.setData('quantity_mt', e.target.value)}
                            />
                        </Field>
                        <Field label="Expected delivery">
                            <Input
                                type="date"
                                value={purchase.data.expected_delivery_date}
                                onChange={(e) => purchase.setData('expected_delivery_date', e.target.value)}
                            />
                        </Field>
                        <Field label="Order status">
                            <Select value={purchase.data.delivery_status} onValueChange={(v) => purchase.setData('delivery_status', v)}>
                                <SelectTrigger>
                                    <SelectValue>{purchase.data.delivery_status.replaceAll('_', ' ')}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {['planned', 'in_transit', 'partially_received', 'received', 'cancelled'].map((v) => (
                                        <SelectItem key={v} value={v}>
                                            {v.replaceAll('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Remarks">
                            <Input
                                placeholder="Optional remarks"
                                value={purchase.data.remarks}
                                onChange={(e) => purchase.setData('remarks', e.target.value)}
                            />
                        </Field>
                        <div className="flex h-full min-h-16 items-end sm:col-span-2 xl:col-span-1 xl:justify-end">
                            <Button className="bg-brand-berry w-full shadow-sm sm:w-auto xl:min-w-60">
                                <ShoppingCart className="size-4" />
                                Save manual purchase order
                            </Button>
                        </div>
                    </form>
                </section>
                <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <div className="p-4">
                        <h2 className="font-bold">Supplier receipts</h2>
                        <p className="text-xs text-slate-500">Purchase orders planned for {month}.</p>
                    </div>
                    <div className="space-y-3 border-t p-3 md:hidden">
                        {purchases.length ? (
                            purchases.map((p) => (
                                <article key={`${p.id}-mobile`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-bold text-slate-900">{p.vendor_name}</h3>
                                            <p className="mt-0.5 text-[10px] text-slate-500">{p.vendor_source} · {month}</p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-bold text-cyan-700">
                                            {p.delivery_status.replaceAll('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white p-2.5">
                                        <div>
                                            <p className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">Expected</p>
                                            <p className="mt-0.5 text-sm font-black text-slate-900">{Number(p.quantity_mt).toFixed(3)} MT</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">Delivery</p>
                                            <p className="mt-0.5 text-xs font-bold text-slate-700">{p.expected_delivery_date || 'Not set'}</p>
                                        </div>
                                    </div>
                                    {p.remarks && <p className="mt-2 text-[10px] leading-4 text-slate-500">{p.remarks}</p>}
                                    <div className="mt-3 flex justify-end">
                                        {p.is_api ? (
                                            <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">SAP managed</span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-500"
                                                onClick={() => confirm('Delete this purchase order?') && router.delete(`/admin/procurement/purchases/${p.id}`)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-slate-500">No supplier receipts available for this period.</div>
                        )}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[850px] text-xs">
                            <thead className="bg-slate-100 text-left uppercase">
                                <tr>
                                    <th className="p-3">Supplier / PO</th>
                                    <th className="p-3">Planned for</th>
                                    <th className="p-3">Source</th>
                                    <th className="p-3 text-right">Expected MT</th>
                                    <th className="p-3">ETA</th>
                                    <th className="p-3">Stage</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {purchases.length ? (
                                    purchases.map((p) => (
                                        <tr key={p.id}>
                                            <td className="p-3 font-semibold">
                                                {p.vendor_name}
                                                {p.remarks && <div className="mt-0.5 text-[10px] font-normal text-slate-500">{p.remarks}</div>}
                                            </td>
                                            <td className="p-3">{month}</td>
                                            <td className="p-3">{p.vendor_source}</td>
                                            <td className="p-3 text-right">{Number(p.quantity_mt).toFixed(3)}</td>
                                            <td className="p-3">{p.expected_delivery_date}</td>
                                            <td className="p-3">{p.delivery_status.replaceAll('_', ' ')}</td>
                                            <td className="p-3">
                                                {p.is_api ? (
                                                    <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">
                                                        SAP managed
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500"
                                                        onClick={() =>
                                                            confirm('Delete this purchase order?') &&
                                                            router.delete(`/admin/procurement/purchases/${p.id}`)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            No supplier receipts available for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="rounded-xl border bg-white p-4 shadow-sm">
                    <p className="text-brand-teal text-[9px] font-bold tracking-wider uppercase">Supplier commitment</p>
                    <h2 className="font-bold">MOU Lifting Plan</h2>
                    <form onSubmit={saveMou} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
                        <VendorInput value={mou.data.vendor_name} vendors={vendors} onChange={(v) => mou.setData('vendor_name', v)} />
                        <Input
                            type="number"
                            min="0"
                            step="0.001"
                            placeholder="Planned quantity (MT)"
                            value={mou.data.quantity_mt}
                            onChange={(e) => mou.setData('quantity_mt', e.target.value)}
                        />
                        <Input placeholder="Remarks" value={mou.data.remarks} onChange={(e) => mou.setData('remarks', e.target.value)} />
                        <Button className="bg-brand-berry w-full sm:col-span-2 lg:col-span-1 lg:w-auto">Save lifting plan</Button>
                    </form>
                    <div className="mt-4 space-y-3 md:hidden">
                        {mouPlans.length ? (
                            mouPlans.map((m) => {
                                const po = purchases.filter((p) => p.vendor_name === m.vendor_name).reduce((sum, p) => sum + Number(p.quantity_mt), 0);
                                const balance = Math.max(0, Number(m.quantity_mt) - po);
                                return (
                                    <article key={`${m.id}-mobile`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                        <div className="border-b bg-cyan-50/60 px-3 py-2.5">
                                            <p className="text-[9px] font-bold tracking-wide text-cyan-700 uppercase">{month}</p>
                                            <h3 className="mt-0.5 truncate text-sm font-bold text-slate-900">{m.vendor_name}</h3>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x px-1 py-3 text-center">
                                            <div className="px-1">
                                                <p className="text-[8px] font-semibold text-slate-400 uppercase">MOU</p>
                                                <p className="mt-1 text-xs font-black">{Number(m.quantity_mt).toFixed(3)}</p>
                                            </div>
                                            <div className="px-1">
                                                <p className="text-[8px] font-semibold text-slate-400 uppercase">Manual PO</p>
                                                <p className="mt-1 text-xs font-black">{po.toFixed(3)}</p>
                                            </div>
                                            <div className="px-1">
                                                <p className="text-[8px] font-semibold text-slate-400 uppercase">Balance</p>
                                                <p className={`mt-1 text-xs font-black ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{balance.toFixed(3)}</p>
                                            </div>
                                        </div>
                                        {m.remarks && <p className="border-t px-3 py-2 text-[10px] text-slate-500">{m.remarks}</p>}
                                    </article>
                                );
                            })
                        ) : (
                            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-slate-500">No lifting plan has been saved.</div>
                        )}
                    </div>
                    <div className="mt-4 hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[750px] text-xs">
                            <thead className="bg-slate-100 text-left uppercase">
                                <tr>
                                    <th className="p-3">Planned month</th>
                                    <th className="p-3">Dealer</th>
                                    <th className="p-3 text-right">MOU commitment</th>
                                    <th className="p-3 text-right">Manual PO quantity</th>
                                    <th className="p-3 text-right">Balance to order</th>
                                    <th className="p-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mouPlans.length ? (
                                    mouPlans.map((m) => {
                                        const po = purchases
                                            .filter((p) => p.vendor_name === m.vendor_name)
                                            .reduce((s, p) => s + Number(p.quantity_mt), 0);
                                        return (
                                            <tr key={m.id} className="border-t">
                                                <td className="p-3">{month}</td>
                                                <td className="p-3 font-semibold">{m.vendor_name}</td>
                                                <td className="p-3 text-right">{Number(m.quantity_mt).toFixed(3)}</td>
                                                <td className="p-3 text-right">{po.toFixed(3)}</td>
                                                <td className="p-3 text-right">{Math.max(0, Number(m.quantity_mt) - po).toFixed(3)}</td>
                                                <td className="p-3">{m.remarks || '—'}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            No lifting plan has been saved.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
function Kpi({ label, value, note, danger = false }: { label: string; value: number; note: string; danger?: boolean }) {
    return (
        <div className={`min-w-0 rounded-lg border-t-2 bg-white p-3 shadow-sm sm:p-4 ${danger ? 'border-red-500 bg-red-50/50' : 'border-blue-500'}`}>
            <p className={`truncate text-[10px] font-semibold sm:text-xs ${danger ? 'text-red-600' : ''}`} title={label}>{label}</p>
            <p className={`mt-1.5 truncate text-base font-bold sm:mt-2 sm:text-xl ${danger ? 'text-red-600' : ''}`}>
                {Number(value).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </p>
            <p className="mt-1.5 line-clamp-2 text-[9px] leading-3 text-slate-500 sm:mt-2 sm:text-[10px]">{note}</p>
        </div>
    );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0 space-y-1.5">
            <div className="text-xs font-semibold text-slate-700">{label}</div>
            {children}
        </div>
    );
}
function VendorInput({
    value,
    vendors,
    onChange,
    onLocalVendorChange,
    showLocalInput = true,
}: {
    value: string;
    vendors: string[];
    onChange: (v: string) => void;
    onLocalVendorChange?: (isLocal: boolean) => void;
    showLocalInput?: boolean;
}) {
    const [localVendor, setLocalVendor] = useState(Boolean(value && !vendors.includes(value)));
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const filteredVendors = vendors.filter((vendor) => vendor.toLowerCase().includes(search.trim().toLowerCase()));

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const selectVendor = (vendor: string) => {
        const isLocal = vendor === '__local__';
        setLocalVendor(isLocal);
        onLocalVendorChange?.(isLocal);
        onChange(isLocal ? '' : vendor);
        setSearch('');
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="relative space-y-2">
            <button
                type="button"
                className="border-input focus:border-ring focus:ring-ring/50 flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus:ring-[3px]"
                onClick={() => setOpen((current) => !current)}
            >
                <span className={value || localVendor ? 'truncate' : 'text-muted-foreground'}>
                    {localVendor ? 'Other / Local vendor' : value || 'Select vendor'}
                </span>
                <ChevronDown className="size-4 shrink-0 text-slate-500" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
                    <div className="flex items-center gap-2 border-b px-3">
                        <Search className="size-4 text-slate-400" />
                        <input
                            autoFocus
                            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                            placeholder="Search vendor..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filteredVendors.length ? (
                            filteredVendors.map((vendor) => (
                                <button
                                    key={vendor}
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-slate-100"
                                    onClick={() => selectVendor(vendor)}
                                >
                                    <span>{vendor}</span>
                                    {!localVendor && value === vendor && <Check className="text-brand-teal size-4" />}
                                </button>
                            ))
                        ) : (
                            <p className="px-2 py-3 text-center text-xs text-slate-500">No vendor found</p>
                        )}
                        <button
                            type="button"
                            className="mt-1 flex w-full items-center justify-between border-t px-2 py-2 text-left text-sm font-medium hover:bg-slate-100"
                            onClick={() => selectVendor('__local__')}
                        >
                            Other / Local vendor
                            {localVendor && <Check className="text-brand-teal size-4" />}
                        </button>
                    </div>
                </div>
            )}
            {localVendor && showLocalInput && (
                <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-slate-700" htmlFor="local-vendor-name">
                        Local vendor name
                    </label>
                    <Input
                        id="local-vendor-name"
                        autoFocus
                        placeholder="Enter local vendor name"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                    />
                </div>
            )}
        </div>
    );
}
