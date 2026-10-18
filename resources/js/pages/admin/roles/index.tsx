import ProjectPageHeader from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';

type Permission = { id: number; name: string };
type Role = { id: number; name: string; status: boolean; users_count: number; permissions: Permission[] };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles & permissions', href: '/admin/roles' }];

export default function RolesIndex({ roles }: { roles: Role[] }) {
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
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {roles.map((role) => (
                        <Card key={role.id} className="border-slate-200 shadow-sm">
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0">
                                    <h2 className="truncate font-bold text-slate-900">{role.name}</h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {role.permissions.length} permissions · {role.users_count} users
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button asChild size="icon" variant="ghost">
                                        <Link href={`/admin/roles/${role.id}/edit`}>
                                            <Pencil className="size-4" />
                                            <span className="sr-only">Edit {role.name}</span>
                                        </Link>
                                    </Button>
                                    {role.name !== 'Super Admin' && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-600"
                                            onClick={() => confirm(`Delete ${role.name}?`) && router.delete(`/admin/roles/${role.id}`)}
                                        >
                                            <Trash2 className="size-4" />
                                            <span className="sr-only">Delete {role.name}</span>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
