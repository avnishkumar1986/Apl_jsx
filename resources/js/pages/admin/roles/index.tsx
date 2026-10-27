import ProjectPageHeader from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, GitBranch, Globe2, Pencil, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';

type Permission = { id: number; name: string };
type Company = { id: number; company_code: string; company_name: string };
type Role = { id: number; name: string; status: boolean; users_count: number; permissions: Permission[]; companies: Company[] };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles & permissions', href: '/admin/roles' }];

export default function RolesIndex({ roles, companies }: { roles: Role[]; companies: Company[] }) {
    const globalRoles = roles.filter((role) => role.companies.length === 0);
    const companyGroups = companies.map((company) => ({
            key: String(company.id),
            company,
            roles: roles.filter((role) => role.companies.some((assigned) => assigned.id === company.id)),
        }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & permissions" />
            <div className="space-y-5 p-4 sm:p-5 md:p-6">
                <ProjectPageHeader
                    eyebrow="Security"
                    title="Roles & permissions"
                    subtitle="Create reusable roles and control access by company, department, designation, and permission."
                    icon={<ShieldCheck className="size-5" />}
                    actions={
                        <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
                            <Link href="/admin/roles/create">
                                <Plus className="size-4" /> Create role
                            </Link>
                        </Button>
                    }
                />
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <GitBranch className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Organization role hierarchy</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Company access scopes and the roles assigned beneath each scope</p>
                        </div>
                        <span className="ml-auto hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 sm:block">
                            {companyGroups.length} scopes · {roles.length} roles
                        </span>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="relative mx-auto max-w-6xl">
                            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-primary/25 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-white px-5 py-4 sm:px-6">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                        <ShieldCheck className="size-4.5" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900">APL Connect</p>
                                        <p className="text-[11px] text-slate-500">Organization access control</p>
                                    </div>
                                    <span className="ml-auto rounded-full border border-primary/20 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm">
                                        {globalRoles.length} global {globalRoles.length === 1 ? 'role' : 'roles'}
                                    </span>
                                </div>

                                <div className="border-t border-primary/15 bg-white p-4 sm:p-5">
                                    <div className="mb-3 flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Globe2 className="size-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">All Companies</p>
                                            <p className="text-[10px] text-slate-500">Organization-wide access scope</p>
                                        </div>
                                        <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Global scope</span>
                                    </div>
                                    {globalRoles.length > 0 ? (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {globalRoles.map((role, index) => (
                                                <div key={role.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold text-slate-900">{role.name}</p>
                                                        <p className="mt-1 text-[10px] font-medium text-slate-500">{role.permissions.length} permissions&nbsp;&nbsp;•&nbsp;&nbsp;{role.users_count} users</p>
                                                    </div>
                                                    <Button asChild size="icon" variant="ghost" className="size-8 shrink-0">
                                                        <Link href={`/admin/roles/${role.id}/edit`}><Pencil className="size-3.5" /><span className="sr-only">Edit {role.name}</span></Link>
                                                    </Button>
                                                    {role.name.toLowerCase() !== 'owner' && (
                                                        <Button size="icon" variant="ghost" className="size-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => confirm(`Delete ${role.name}?`) && router.delete(`/admin/roles/${role.id}`)}>
                                                            <Trash2 className="size-3.5" /><span className="sr-only">Delete {role.name}</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">No organization-wide roles assigned</p>
                                    )}
                                </div>
                            </div>
                            <div className="mx-auto h-7 w-px bg-slate-300" />

                            <div className="relative grid gap-x-5 gap-y-7 pt-5 md:grid-cols-2">
                                <span className="absolute left-1/4 right-1/4 top-0 hidden h-px bg-slate-300 md:block" />
                                {companyGroups.map((group) => (
                                    <div key={group.key} className="relative min-w-0">
                                        <span className="absolute -top-5 left-1/2 h-5 w-px bg-slate-300" />
                                        <section className="h-full">
                                            <header className="relative flex min-h-20 flex-col gap-3 overflow-hidden rounded-2xl border border-primary/30 bg-white px-4 py-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                                                <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10">
                                                        <Building2 className="size-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-base font-bold leading-tight text-slate-900">
                                                                {group.company.company_name}
                                                            </h3>
                                                            <span className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">Company</span>
                                                        </div>
                                                        <p className="mt-1 text-xs font-semibold text-slate-700">{group.company.company_code}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Active</span>
                                                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">{group.roles.length} {group.roles.length === 1 ? 'role' : 'roles'}</span>
                                                </div>
                                            </header>

                                            <div className="relative ml-8 border-l-2 border-slate-200 py-3 pl-8 sm:ml-10">
                                                {group.roles.length === 0 ? (
                                                    <div className="relative rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
                                                        <span className="absolute -left-8 top-1/2 h-px w-8 bg-slate-200" />
                                                        <p className="text-xs font-semibold text-slate-600">No roles assigned</p>
                                                        <p className="mt-1 text-[11px] text-slate-400">This company is available under APL Connect.</p>
                                                    </div>
                                                ) : <div className="grid gap-3">
                                                    {group.roles.map((role, index) => (
                                                        <Card key={`${group.key}-${role.id}`} className="relative overflow-visible border-slate-200 bg-white shadow-sm transition hover:border-primary/30 hover:shadow-md">
                                                            <span className="absolute -left-8 top-1/2 h-px w-8 bg-slate-200" />
                                                            <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary/70" />
                                                            <CardContent className="p-4 pl-5">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex min-w-0 gap-3">
                                                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/10">{index + 1}</span>
                                                                        <div className="min-w-0">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <h4 className="break-words font-bold leading-tight text-slate-900">{role.name}</h4>
                                                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">Role</span>
                                                                            </div>
                                                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                                                                <span>{role.permissions.length} permissions</span>
                                                                                <span className="inline-flex items-center gap-1"><Users className="size-3" /> {role.users_count} users</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex shrink-0 items-center gap-1">
                                                                        <span className={`mr-1 hidden rounded-full px-2 py-1 text-[9px] font-bold sm:inline-flex ${role.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{role.status ? 'Active' : 'Inactive'}</span>
                                                                        <Button asChild size="icon" variant="ghost" className="size-8">
                                                                            <Link href={`/admin/roles/${role.id}/edit`}><Pencil className="size-3.5" /><span className="sr-only">Edit {role.name}</span></Link>
                                                                        </Button>
                                                                        {role.name.toLowerCase() !== 'owner' && (
                                                                            <Button size="icon" variant="ghost" className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => confirm(`Delete ${role.name}?`) && router.delete(`/admin/roles/${role.id}`)}>
                                                                                <Trash2 className="size-3.5" /><span className="sr-only">Delete {role.name}</span>
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {role.companies.length > 1 && (
                                                                    <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-400">Shared with {role.companies.length - 1} other {role.companies.length === 2 ? 'company' : 'companies'}</p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>}
                                            </div>
                                        </section>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
