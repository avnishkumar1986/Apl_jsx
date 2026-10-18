import InputError from '@/components/input-error';
import { DataTableSortHeader } from '@/components/master/data-table-sort-header';
import { MasterDialogHeader } from '@/components/master/master-dialog-header';
import { StatusToggle } from '@/components/master/status-toggle';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Building2, ChevronLeft, ChevronRight, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Department = { id: number; department_code: string; department_name: string; description: string | null; status: boolean; created_at: string };
type PaginatedDepartments = {
    data: Department[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Filters = { search: string; per_page: number; sort: string; direction: 'asc' | 'desc' };
type DepartmentForm = { department_code: string; department_name: string; description: string; status: boolean };

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Department Master', href: '/admin/departments' }];
const emptyForm: DepartmentForm = { department_code: '', department_name: '', description: '', status: true };
const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));

export default function DepartmentsIndex({
    departments,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    departments: PaginatedDepartments;
    filters: Filters;
    pageSizeOptions: number[];
    stats: { total: number; active: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Department | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const form = useForm<DepartmentForm>(emptyForm);
    const loadTable = (nextSearch: string, perPage = filters.per_page, sort = filters.sort, direction = filters.direction) =>
        router.get('/admin/departments', { search: nextSearch, per_page: perPage, sort, direction }, { preserveState: true, replace: true });
    const sortTable = (column: string) =>
        loadTable(search, filters.per_page, column, filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc');
    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm);
        form.clearErrors();
        setOpen(true);
    };
    const openEdit = (department: Department) => {
        setEditing(department);
        form.setData({
            department_code: department.department_code,
            department_name: department.department_name,
            description: department.description ?? '',
            status: department.status,
        });
        form.clearErrors();
        setOpen(true);
    };
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) form.put(`/admin/departments/${editing.id}`, options);
        else form.post('/admin/departments', options);
    };
    const remove = (department: Department) => {
        if (window.confirm(`Delete ${department.department_name}?`)) router.delete(`/admin/departments/${department.id}`, { preserveScroll: true });
    };
    const allSelected = departments.data.length > 0 && departments.data.every((item) => selectedIds.includes(item.id));
    const runBulkAction = () => {
        if (!bulkAction || !selectedIds.length) return;
        if (bulkAction === 'delete' && !window.confirm(`Delete ${selectedIds.length} selected department(s)?`)) return;
        router.patch(
            '/admin/departments/bulk',
            { ids: selectedIds, action: bulkAction },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    setBulkAction('');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Department Master" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <section className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="bg-brand-teal/10 text-brand-teal grid size-10 place-items-center rounded-lg">
                                <Building2 className="size-[18px]" />
                            </span>
                            <div>
                                <p className="text-brand-teal text-[10px] font-bold tracking-[0.16em] uppercase">Master data</p>
                                <h1 className="text-xl font-bold text-slate-900">Department Master</h1>
                                <p className="text-xs text-slate-500">
                                    {stats.total} departments · {stats.active} active
                                </p>
                            </div>
                        </div>
                        {canManage && (
                            <Button onClick={openCreate} className="bg-brand-teal hover:bg-brand-plum">
                                <Plus className="size-4" /> Add department
                            </Button>
                        )}
                    </div>
                </section>
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm [&_tbody_td]:!py-3 [&>div:first-child]:!py-3">
                    <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-800">Departments</h2>
                            <p className="text-xs text-slate-500">Manage department codes, names, descriptions, and status.</p>
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                loadTable(search);
                            }}
                            className="relative w-full sm:max-w-sm"
                        >
                            <Search className="absolute top-3 left-3 size-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search departments"
                                className="pl-9"
                            />
                        </form>
                    </div>
                    {canManage && selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 border-b bg-cyan-50 px-5 py-2">
                            <span className="text-brand-teal text-xs font-bold">{selectedIds.length} selected</span>
                            <Select value={bulkAction} onValueChange={setBulkAction}>
                                <SelectTrigger className="h-8 w-44 bg-white">
                                    <SelectValue placeholder="Bulk action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="activate">Activate selected</SelectItem>
                                    <SelectItem value="deactivate">Deactivate selected</SelectItem>
                                    <SelectItem value="delete">Delete selected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" disabled={!bulkAction} onClick={runBulkAction}>
                                Apply
                            </Button>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="w-12 px-5 py-3">
                                        <Checkbox
                                            checked={allSelected ? true : selectedIds.length > 0 ? 'indeterminate' : false}
                                            onCheckedChange={(checked) => setSelectedIds(checked ? departments.data.map((item) => item.id) : [])}
                                            aria-label="Select all departments"
                                        />
                                    </th>
                                    <DataTableSortHeader
                                        label="S.No."
                                        column="sno"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="w-24 px-5 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Code"
                                        column="code"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Department"
                                        column="name"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <th className="px-5 py-3">Description</th>
                                    <DataTableSortHeader
                                        label="Status"
                                        column="status"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Created"
                                        column="created_at"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {departments.data.map((department, index) => (
                                    <tr key={department.id} className="hover:bg-cyan-50/30">
                                        <td className="px-5 py-4">
                                            <Checkbox
                                                checked={selectedIds.includes(department.id)}
                                                onCheckedChange={(checked) =>
                                                    setSelectedIds(
                                                        checked ? [...selectedIds, department.id] : selectedIds.filter((id) => id !== department.id),
                                                    )
                                                }
                                                aria-label={`Select ${department.department_name}`}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500">
                                            {(departments.current_page - 1) * departments.per_page + index + 1}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">{department.department_code}</td>
                                        <td className="px-5 py-4 font-bold text-slate-800">{department.department_name}</td>
                                        <td className="max-w-md px-5 py-4 text-slate-500">{department.description || '—'}</td>
                                        <td className="min-w-36 px-5 py-4">
                                            <StatusToggle
                                                active={department.status}
                                                disabled={!canManage}
                                                onChange={() =>
                                                    router.patch(
                                                        `/admin/departments/${department.id}/status`,
                                                        { active: !department.status },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                label={department.department_name}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500">{formatDate(department.created_at)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(department)}
                                                            title="Edit department"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(department)}
                                                            title="Delete department"
                                                            className="text-red-500"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {departments.data.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No departments found.</div>}
                    <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <span>Show</span>
                            <Select value={String(filters.per_page)} onValueChange={(value) => loadTable(filters.search, Number(value))}>
                                <SelectTrigger className="h-8 w-20 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((size) => (
                                        <SelectItem key={size} value={String(size)}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>
                                entries · Showing {departments.from ?? 0}–{departments.to ?? 0} of {departments.total}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!departments.prev_page_url}
                                onClick={() => departments.prev_page_url && router.get(departments.prev_page_url)}
                            >
                                <ChevronLeft className="size-4" /> Previous
                            </Button>
                            <span className="font-semibold">
                                Page {departments.current_page} of {departments.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!departments.next_page_url}
                                onClick={() => departments.next_page_url && router.get(departments.next_page_url)}
                            >
                                Next <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[620px] overflow-hidden rounded-2xl bg-white p-0 sm:p-0">
                    <form onSubmit={submit} className="w-full">
                        <MasterDialogHeader title={editing ? 'Edit department' : 'Create department'} />
                        <fieldset className="form-fieldset">
                            <legend>Department information</legend>
                            <div className="grid gap-5 py-4 sm:grid-cols-2">
                                <div>
                                    <Label className="sr-only">Department code</Label>
                                    <Input
                                        autoFocus
                                        value={form.data.department_code}
                                        onChange={(event) => form.setData('department_code', event.target.value.toUpperCase())}
                                        placeholder="Department code (e.g. HR)"
                                        maxLength={20}
                                        className="uppercase"
                                    />
                                    <InputError message={form.errors.department_code} />
                                </div>
                                <div>
                                    <Label className="sr-only">Department name</Label>
                                    <Input
                                        value={form.data.department_name}
                                        onChange={(event) => form.setData('department_name', event.target.value)}
                                        placeholder="Department name"
                                        maxLength={100}
                                    />
                                    <InputError message={form.errors.department_name} />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label className="sr-only">Description</Label>
                                    <Textarea
                                        value={form.data.description}
                                        onChange={(event) => form.setData('description', event.target.value)}
                                        placeholder="Department description"
                                        rows={4}
                                        maxLength={255}
                                    />
                                    <InputError message={form.errors.description} />
                                </div>
                            </div>
                        </fieldset>
                        <DialogFooter className="gap-2 border-t bg-slate-50 px-5 py-4 sm:px-7">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button disabled={form.processing} className="bg-brand-teal hover:bg-brand-plum w-full sm:w-auto">
                                {form.processing ? 'Saving…' : 'Save department'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
