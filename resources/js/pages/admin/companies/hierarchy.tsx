import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, ChevronDown, Factory, Landmark, Package, Search, Unlink } from 'lucide-react';

type CompanyNode = {
    id: number;
    code: string;
    name: string;
    type: number;
    parent_code: string | null;
    gstin: string | null;
    active: boolean;
    children: CompanyNode[];
};
type PlantMaterial = { code: string; name: string; stock: number; active: boolean };
type PlantMaterials = { total: number; items: PlantMaterial[] };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Company hierarchy', href: '/admin/companies/hierarchy' },
];
const typeDetails = {
    1: { label: 'Company', icon: Building2, color: 'border-cyan-200 bg-cyan-50 text-cyan-800', iconColor: 'bg-cyan-600 text-white' },
    2: { label: 'Plant', icon: Factory, color: 'border-amber-200 bg-amber-50 text-amber-800', iconColor: 'bg-amber-500 text-white' },
    3: { label: 'Head Office', icon: Landmark, color: 'border-violet-200 bg-violet-50 text-violet-800', iconColor: 'bg-violet-600 text-white' },
} as const;

function HierarchyNode({
    node,
    materialsByPlant,
    depth = 0,
    showChildren = true,
    showMaterials = false,
}: {
    node: CompanyNode;
    materialsByPlant: Record<string, PlantMaterials>;
    depth?: number;
    showChildren?: boolean;
    showMaterials?: boolean;
}) {
    const details = typeDetails[node.type as keyof typeof typeDetails] ?? typeDetails[1];
    const Icon = details.icon;
    return (
        <div
            className={
                depth
                    ? 'relative ml-7 border-l-2 border-slate-200 pl-7 before:absolute before:top-7 before:left-0 before:w-7 before:border-t-2 before:border-slate-200'
                    : ''
            }
        >
            <div
                className={`group relative mb-3 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    depth === 0 ? 'border-cyan-200 shadow-cyan-950/5' : 'border-slate-200 shadow-slate-900/5'
                }`}
            >
                <span
                    className={`absolute inset-y-0 left-0 w-1 ${node.type === 1 ? 'bg-cyan-500' : node.type === 2 ? 'bg-amber-400' : 'bg-violet-500'}`}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className={`grid size-11 shrink-0 place-items-center rounded-xl shadow-sm ring-4 ring-slate-50 ${details.iconColor}`}>
                            <Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-bold text-slate-900">{node.name}</h3>
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${details.color}`}>{details.label}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span className="font-mono font-semibold text-slate-700">{node.code}</span>
                                {node.gstin && <span>GSTIN: {node.gstin}</span>}
                                <span>
                                    {node.children.length} direct unit{node.children.length === 1 ? '' : 's'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${node.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                        {node.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                {showMaterials && node.type === 2 && (materialsByPlant[node.code]?.items.length ?? 0) > 0 && (
                    <Collapsible className="group/materials mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-emerald-100/70">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
                                <Package className="size-4" />
                            </span>
                            <span className="flex-1 font-bold text-emerald-900">Materials</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                                {materialsByPlant[node.code].total.toLocaleString('en-IN')}
                            </span>
                            <ChevronDown className="size-4 text-emerald-700 transition-transform group-data-[state=open]/materials:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-t border-emerald-200 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                                {materialsByPlant[node.code].items.map((material) => (
                                    <div key={material.code} className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-800" title={material.name}>
                                                    {material.name}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-slate-500">{material.code}</p>
                                            </div>
                                            <span
                                                className={`mt-1 size-2 shrink-0 rounded-full ${material.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Stock: <b className="text-slate-700">{material.stock.toLocaleString('en-IN')}</b>
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {materialsByPlant[node.code].total > materialsByPlant[node.code].items.length && (
                                <p className="mt-3 text-center text-xs font-medium text-emerald-700">
                                    Showing first {materialsByPlant[node.code].items.length} of{' '}
                                    {materialsByPlant[node.code].total.toLocaleString('en-IN')} materials
                                </p>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
            {showChildren &&
                node.children.map((child) => (
                    <HierarchyNode
                        key={child.id}
                        node={child}
                        materialsByPlant={materialsByPlant}
                        depth={depth + 1}
                        showChildren
                        showMaterials={showMaterials}
                    />
                ))}
        </div>
    );
}

export default function CompanyHierarchy({
    view,
    materialsByPlant,
    hierarchy,
    headOffices,
    orphans,
}: {
    view: 'companies' | 'plants' | 'materials';
    materialsByPlant: Record<string, PlantMaterials>;
    hierarchy: CompanyNode[];
    headOffices: CompanyNode[];
    orphans: CompanyNode[];
}) {
    const filtered = hierarchy;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company hierarchy" />
            <div className="min-h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-violet-50/40">
                <div className="mx-auto w-full max-w-[1500px] space-y-5 p-4 md:p-6">
                    <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Hierarchy views">
                        {[
                            { key: 'companies', label: 'Companies', icon: Building2 },
                            { key: 'plants', label: 'Plants', icon: Factory },
                            { key: 'materials', label: 'Materials', icon: Package },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/admin/companies/hierarchy',
                                        { view: item.key },
                                        { preserveScroll: false, preserveState: false, replace: true },
                                    )
                                }
                                aria-pressed={view === item.key}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                    view === item.key
                                        ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-md shadow-cyan-500/20'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <item.icon className="size-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur md:p-6">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Organization tree</h2>
                                <p className="text-sm text-slate-500">Companies and their linked operational units</p>
                            </div>
                            <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
                                {filtered.length} root companies
                            </span>
                        </div>
                        {headOffices.length > 0 && (
                            <div className="mb-1">
                                <div className="mx-auto max-w-xl rounded-3xl border border-violet-400/40 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 text-white shadow-xl shadow-violet-300/30">
                                    <div className="flex items-center gap-4">
                                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
                                            <Landmark className="size-6" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-bold">Common Head Office</h3>
                                                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/20">
                                                    Shared by all companies
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-violet-100">
                                                {headOffices.map((office) => `${office.name} (${office.code})`).join(' · ')}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${headOffices.every((office) => office.active) ? 'bg-emerald-400/20 text-emerald-50' : 'bg-white/15 text-white'}`}
                                        >
                                            {headOffices.every((office) => office.active) ? 'Active' : 'Partly inactive'}
                                        </span>
                                    </div>
                                </div>
                                {filtered.length > 0 && (
                                    <>
                                        <div className="mx-auto hidden h-8 w-0.5 bg-violet-300 lg:block" />
                                        <div className="relative mx-auto hidden h-8 w-1/2 border-t-2 border-violet-300 before:absolute before:top-0 before:left-0 before:h-8 before:border-l-2 before:border-violet-300 after:absolute after:top-0 after:right-0 after:h-8 after:border-r-2 after:border-violet-300 lg:block" />
                                        <div className="mx-auto h-6 w-0.5 bg-violet-300 lg:hidden" />
                                    </>
                                )}
                            </div>
                        )}
                        <div className="grid items-start gap-4 lg:grid-cols-2">
                            {filtered.map((node) => (
                                <HierarchyNode
                                    key={node.id}
                                    node={node}
                                    materialsByPlant={materialsByPlant}
                                    showChildren={view !== 'companies'}
                                    showMaterials={view === 'materials'}
                                />
                            ))}
                            {!filtered.length && (
                                <div className="py-16 text-center text-slate-500 lg:col-span-2">
                                    <Search className="mx-auto mb-3 size-8 text-slate-300" />
                                    No matching company found.
                                </div>
                            )}
                        </div>
                    </section>
                    {orphans.length > 0 && (
                        <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <Unlink className="size-5 text-orange-600" />
                                <div>
                                    <h2 className="font-bold text-orange-900">Unlinked records</h2>
                                    <p className="text-sm text-orange-700">
                                        These records reference a parent code that is not present in the company master.
                                    </p>
                                </div>
                            </div>
                            {orphans.map((node) => (
                                <HierarchyNode key={node.id} node={node} materialsByPlant={materialsByPlant} showMaterials={view === 'materials'} />
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
