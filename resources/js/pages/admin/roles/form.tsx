import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { FormEventHandler } from 'react';

type Permission = { id: number; name: string };
type Company = { id: number; company_code: string; company_name: string };
type Department = { id: number; department_name: string };
type Designation = { id: number; designation_name: string; department_id: number | null };
type Role = { id: number; name: string; company_ids: number[]; department_id: number | null; designation_id: number | null; permissions: string[] };
const actions = ['view', 'create', 'edit', 'delete', 'all_companies'] as const;
type Action = (typeof actions)[number];
const actionLabels: Record<Action, string> = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', all_companies: 'All Companies' };
const matrixCheckboxClass =
    'size-4 border-slate-300 data-[state=checked]:border-fuchsia-600 data-[state=checked]:bg-fuchsia-600 data-[state=indeterminate]:border-fuchsia-600 data-[state=indeterminate]:bg-fuchsia-600';
const permissionAction = (name: string): Action | 'manage' | null => {
    const suffix = name.split('.').at(-1)?.toLowerCase().replaceAll('-', '_');
    if (suffix === 'manage') return 'manage';
    if (suffix === 'allcompanies') return 'all_companies';
    return actions.find((action) => action === suffix) ?? null;
};
const moduleName = (name: string) => {
    const parts = name.split('.');
    if (permissionAction(name)) parts.pop();
    return parts.join('.');
};
const titleCase = (value: string) => value.replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

export default function RoleForm({
    role,
    permissions,
    companies,
    departments,
    designations,
}: {
    role: Role | null;
    permissions: Permission[];
    companies: Company[];
    departments: Department[];
    designations: Designation[];
}) {
    const isEditing = role !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Roles & permissions', href: '/admin/roles' },
        { title: isEditing ? 'Edit role' : 'Create role', href: isEditing ? `/admin/roles/${role.id}/edit` : '/admin/roles/create' },
    ];
    const { data, setData, post, put, processing, errors } = useForm({
        name: role?.name ?? '',
        company_ids: role?.company_ids ?? ([] as number[]),
        department_id: role?.department_id ? String(role.department_id) : '',
        designation_id: role?.designation_id ? String(role.designation_id) : '',
        permissions: role?.permissions ?? ([] as string[]),
    });
    const rows = Array.from(new Set(permissions.map((permission) => moduleName(permission.name)))).map((module) => ({
        module,
        cells: Object.fromEntries(
            actions.map((action) => [
                action,
                permissions.filter((permission) => {
                    const parsed = permissionAction(permission.name);
                    return (
                        moduleName(permission.name) === module &&
                        (parsed === action || (parsed === 'manage' && ['create', 'edit', 'delete'].includes(action)))
                    );
                }),
            ]),
        ) as Record<Action, Permission[]>,
    }));
    const availablePermissions = permissions.map((permission) => permission.name);
    const allSelected = availablePermissions.length > 0 && availablePermissions.every((permission) => data.permissions.includes(permission));
    const selectedCompanies = companies.filter((company) => data.company_ids.includes(company.id));
    const filteredDesignations = designations.filter(
        (designation) => !data.department_id || designation.department_id === null || String(designation.department_id) === data.department_id,
    );
    const setPermissionNames = (names: string[], checked: boolean) =>
        setData(
            'permissions',
            checked ? Array.from(new Set([...data.permissions, ...names])) : data.permissions.filter((permission) => !names.includes(permission)),
        );
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (isEditing) put(`/admin/roles/${role.id}`);
        else post('/admin/roles');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? `Edit ${role.name}` : 'Create role'} />
            <form onSubmit={submit} className="p-4 sm:p-5 md:p-6">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-x-4 gap-y-3 border-b p-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="role-name" className="mb-1.5 text-xs font-semibold">
                                Role Name
                            </Label>
                            <Input
                                id="role-name"
                                autoFocus
                                value={data.name}
                                disabled={role?.name === 'Super Admin'}
                                onChange={(event) => setData('name', event.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <Label className="mb-1.5 text-xs font-semibold">Companies</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full justify-between bg-white font-normal">
                                        <span className="truncate">
                                            {selectedCompanies.length
                                                ? selectedCompanies.map((company) => `${company.company_code} - ${company.company_name}`).join(', ')
                                                : 'Default — All companies'}
                                        </span>
                                        <ChevronDown className="size-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
                                    {companies.map((company) => (
                                        <DropdownMenuCheckboxItem
                                            key={company.id}
                                            checked={data.company_ids.includes(company.id)}
                                            onSelect={(event) => event.preventDefault()}
                                            onCheckedChange={(checked) =>
                                                setData(
                                                    'company_ids',
                                                    checked ? [...data.company_ids, company.id] : data.company_ids.filter((id) => id !== company.id),
                                                )
                                            }
                                        >
                                            {company.company_code} - {company.company_name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <InputError message={errors.company_ids} />
                        </div>
                        <div>
                            <Label className="mb-1.5 text-xs font-semibold">Department</Label>
                            <Select
                                value={data.department_id || 'all'}
                                onValueChange={(value) => {
                                    setData('department_id', value === 'all' ? '' : value);
                                    setData('designation_id', '');
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Default — All departments</SelectItem>
                                    {departments.map((department) => (
                                        <SelectItem key={department.id} value={String(department.id)}>
                                            {department.department_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.department_id} />
                        </div>
                        <div>
                            <Label className="mb-1.5 text-xs font-semibold">Designation</Label>
                            <Select
                                value={data.designation_id || 'all'}
                                onValueChange={(value) => setData('designation_id', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Default — All designations</SelectItem>
                                    {filteredDesignations.map((designation) => (
                                        <SelectItem key={designation.id} value={String(designation.id)}>
                                            {designation.designation_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.designation_id} />
                        </div>
                    </div>
                    <div className="p-4">
                        <h2 className="mb-3 text-sm font-bold text-slate-900">Permissions</h2>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full min-w-[850px] table-fixed text-xs">
                                <thead className="bg-fuchsia-50/40 text-left text-slate-700">
                                    <tr>
                                        <th className="w-[34%] px-3 py-3">
                                            <label className="flex items-center gap-2 font-semibold">
                                                <Checkbox
                                                    className={matrixCheckboxClass}
                                                    checked={allSelected || (data.permissions.length > 0 ? 'indeterminate' : false)}
                                                    onCheckedChange={(checked) => setData('permissions', checked ? availablePermissions : [])}
                                                />
                                                Select All
                                            </label>
                                        </th>
                                        {actions.map((action) => (
                                            <th key={action} className="px-3 py-3 font-semibold">
                                                {actionLabels[action]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {rows.map((row) => {
                                        const rowPermissions = Array.from(
                                            new Set(actions.flatMap((action) => row.cells[action].map((permission) => permission.name))),
                                        );
                                        const rowSelected =
                                            rowPermissions.length > 0 && rowPermissions.every((permission) => data.permissions.includes(permission));
                                        const rowPartial = rowPermissions.some((permission) => data.permissions.includes(permission));
                                        return (
                                            <tr key={row.module} className="hover:bg-slate-50/70">
                                                <td className="px-3 py-2.5">
                                                    <label className="flex items-center gap-2 font-semibold text-slate-700">
                                                        <Checkbox
                                                            className={matrixCheckboxClass}
                                                            checked={rowSelected || (rowPartial ? 'indeterminate' : false)}
                                                            onCheckedChange={(checked) => setPermissionNames(rowPermissions, Boolean(checked))}
                                                        />
                                                        {titleCase(row.module)}
                                                    </label>
                                                </td>
                                                {actions.map((action) => {
                                                    const names = row.cells[action].map((permission) => permission.name);
                                                    if (!names.length)
                                                        return (
                                                            <td key={action} className="px-3 py-2.5 text-slate-300">
                                                                —
                                                            </td>
                                                        );
                                                    return (
                                                        <td key={action} className="px-3 py-2.5">
                                                            <label className="flex items-center gap-2 text-slate-600">
                                                                <Checkbox
                                                                    className={matrixCheckboxClass}
                                                                    checked={names.every((name) => data.permissions.includes(name))}
                                                                    onCheckedChange={(checked) => setPermissionNames(names, Boolean(checked))}
                                                                />
                                                                {actionLabels[action]}
                                                            </label>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {!rows.length && <p className="p-8 text-center text-sm text-slate-500">No active permissions are configured.</p>}
                        </div>
                        <InputError message={errors.permissions} />
                    </div>
                    <div className="flex gap-2 border-t px-4 py-3">
                        <Button type="button" variant="outline" onClick={() => router.visit('/admin/roles')}>
                            Cancel
                        </Button>
                        <Button disabled={processing} className="bg-fuchsia-600 text-white hover:bg-fuchsia-700">
                            {processing ? 'Saving…' : 'Save role'}
                        </Button>
                    </div>
                </section>
            </form>
        </AppLayout>
    );
}
