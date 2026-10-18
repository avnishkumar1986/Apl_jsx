import { Head } from '@inertiajs/react';
import { BadgeCheck, Building2, ChevronDown, MapPin, Network, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

type Assignment = {
    id: number;
    employeeId: string | null;
    employeeName: string;
    employeeActive: boolean;
    companyCode: string | null;
    companyName: string;
    sittingLocation: string;
    departmentName: string;
    designationName: string;
    reportsTo: string | null;
    roleName: string;
};

type Hierarchy = Record<string, Record<string, Record<string, Record<string, Assignment[]>>>>;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Master Control', href: '/admin/companies' },
    { title: 'Employee hierarchy', href: '/admin/employee-hierarchy' },
];

export default function EmployeeHierarchy({ assignments, summary }: { assignments: Assignment[]; summary: Record<string, number> }) {
    const [search, setSearch] = useState('');
    const hierarchy = useMemo(
        () =>
            assignments
                .filter((item) =>
                    [
                        item.employeeName,
                        item.employeeId,
                        item.companyName,
                        item.sittingLocation,
                        item.departmentName,
                        item.designationName,
                        item.roleName,
                    ]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(search.toLowerCase())),
                )
                .reduce<Hierarchy>((tree, item) => {
                    tree[item.companyName] ??= {};
                    tree[item.companyName][item.sittingLocation] ??= {};
                    tree[item.companyName][item.sittingLocation][item.departmentName] ??= {};
                    tree[item.companyName][item.sittingLocation][item.departmentName][item.designationName] ??= [];
                    tree[item.companyName][item.sittingLocation][item.departmentName][item.designationName].push(item);
                    return tree;
                }, {}),
        [assignments, search],
    );

    const statCards = [
        ['Companies', summary.companies ?? 0, Building2],
        ['Locations', summary.locations ?? 0, MapPin],
        ['Departments', summary.departments ?? 0, Network],
        ['Employees', summary.employees ?? 0, Users],
    ] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee hierarchy" />
            <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5 lg:p-6">
                <div className="mx-auto max-w-[1500px] space-y-5">
                    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07374b] via-[#075b70] to-[#0b8da3] p-5 text-white shadow-lg">
                        <Network className="absolute -right-8 -bottom-12 size-48 text-white/5" />
                        <div className="relative">
                            <p className="text-brand-aqua text-[10px] font-bold tracking-[0.18em] uppercase">Organization structure</p>
                            <h1 className="mt-1 text-2xl font-bold">Employee hierarchy</h1>
                            <p className="mt-1 text-xs text-white/75">Company → Location → Department → Designation → Employee</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {statCards.map(([label, value, Icon]) => (
                            <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <span className="bg-brand-aqua/10 text-brand-teal grid size-10 place-items-center rounded-xl">
                                    <Icon className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xl font-bold text-slate-900">{value}</p>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase">{label}</p>
                                </div>
                            </div>
                        ))}
                    </section>

                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search employee, company, location, department, designation, or role..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm shadow-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                        />
                    </div>

                    <section className="space-y-3">
                        {Object.entries(hierarchy).map(([company, locations], companyIndex) => (
                            <details
                                key={company}
                                open={companyIndex === 0}
                                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                                <summary className="flex cursor-pointer list-none items-center gap-3 bg-slate-50 px-4 py-4 marker:hidden">
                                    <span className="bg-brand-teal grid size-10 place-items-center rounded-xl text-white">
                                        <Building2 className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate text-sm font-bold text-slate-900">{company}</h2>
                                        <p className="text-[10px] text-slate-500">{Object.keys(locations).length} locations</p>
                                    </div>
                                    <ChevronDown className="text-brand-teal size-4 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="space-y-3 p-3 sm:p-4">
                                    {Object.entries(locations).map(([location, departments]) => (
                                        <details key={location} open className="group/location overflow-hidden rounded-xl border border-slate-200">
                                            <summary className="flex cursor-pointer list-none items-center gap-2 bg-cyan-50/60 px-3 py-3 marker:hidden">
                                                <MapPin className="text-brand-teal size-4" />
                                                <span className="flex-1 text-xs font-bold text-slate-800">{location}</span>
                                                <ChevronDown className="size-3.5 text-slate-400 transition-transform group-open/location:rotate-180" />
                                            </summary>
                                            <div className="space-y-3 p-3">
                                                {Object.entries(departments).map(([department, designations]) => (
                                                    <div key={department} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-800">
                                                            <Network className="size-4 text-indigo-500" />
                                                            {department}
                                                        </h3>
                                                        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                                                            {Object.entries(designations).map(([designation, employees]) => (
                                                                <article
                                                                    key={designation}
                                                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                                                                >
                                                                    <header className="border-b border-slate-100 px-3 py-2">
                                                                        <p className="text-[11px] font-bold text-slate-800">{designation}</p>
                                                                        <p className="text-[9px] text-slate-400">
                                                                            Reports to: {employees[0]?.reportsTo ?? 'Not configured'}
                                                                        </p>
                                                                    </header>
                                                                    <div className="divide-y divide-slate-100">
                                                                        {employees.map((employee) => (
                                                                            <div key={employee.id} className="flex items-center gap-2.5 px-3 py-2.5">
                                                                                <span className="bg-brand-aqua/10 text-brand-teal grid size-8 place-items-center rounded-full text-[10px] font-bold">
                                                                                    {employee.employeeName
                                                                                        .split(' ')
                                                                                        .map((part) => part[0])
                                                                                        .slice(0, 2)
                                                                                        .join('')}
                                                                                </span>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="truncate text-[11px] font-semibold text-slate-800">
                                                                                        {employee.employeeName}
                                                                                    </p>
                                                                                    <p className="truncate text-[9px] text-slate-500">
                                                                                        {employee.employeeId ?? 'No ID'} · {employee.roleName}
                                                                                    </p>
                                                                                </div>
                                                                                <BadgeCheck
                                                                                    className={
                                                                                        employee.employeeActive
                                                                                            ? 'size-4 text-emerald-500'
                                                                                            : 'size-4 text-slate-300'
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </article>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </details>
                        ))}
                        {!Object.keys(hierarchy).length && (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                                No employees match your search.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
