import InputError from '@/components/input-error';
import { DataTableSortHeader } from '@/components/master/data-table-sort-header';
import { MasterDialogHeader } from '@/components/master/master-dialog-header';
import { MasterPageHeader } from '@/components/master/master-page-header';
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
import { ChevronLeft, ChevronRight, Edit3, Plus, Search, ShieldCheck, Tags, Trash2, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type UserType = {
    id: number;
    uid: string;
    name: string;
    description: string | null;
    status: boolean;
    users_count: number;
    created_at: string;
};

type UserTypeForm = { uid: string; name: string; description: string; status: string };
type PaginatedUserTypes = {
    data: UserType[];
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
const breadcrumbs: BreadcrumbItem[] = [{ title: 'User Types', href: '/admin/user-types' }];
const emptyForm: UserTypeForm = { uid: '', name: '', description: '', status: '1' };

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value)).replaceAll('/', '-');
}

export default function UserTypes({
    userTypes,
    filters,
    pageSizeOptions,
    stats,
    canManage,
}: {
    userTypes: PaginatedUserTypes;
    filters: Filters;
    pageSizeOptions: number[];
    stats: { total: number; active: number; assignedUsers: number };
    canManage: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<UserType | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState('');
    const form = useForm<UserTypeForm>(emptyForm);

    const loadTable = (nextSearch: string, perPage = filters.per_page, sort = filters.sort, direction = filters.direction) => {
        router.get(
            '/admin/user-types',
            { search: nextSearch, per_page: perPage, sort, direction },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };
    const sortTable = (column: string) =>
        loadTable(search, filters.per_page, column, filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc');

    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm);
        form.clearErrors();
        setOpen(true);
    };
    const openEdit = (type: UserType) => {
        setEditing(type);
        form.setData({ uid: type.uid, name: type.name, description: type.description ?? '', status: type.status ? '1' : '0' });
        form.clearErrors();
        setOpen(true);
    };
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };
        if (editing) form.put(`/admin/user-types/${editing.id}`, options);
        else form.post('/admin/user-types', options);
    };
    const remove = (type: UserType) => {
        if (type.users_count > 0) return;
        if (window.confirm(`Delete user type “${type.name}”?`)) router.delete(`/admin/user-types/${type.id}`, { preserveScroll: true });
    };
    const toggleStatus = (type: UserType) => {
        router.patch(`/admin/user-types/${type.id}/status`, { active: !type.status }, { preserveScroll: true });
    };
    const allSelected = userTypes.data.length > 0 && userTypes.data.every((type) => selectedIds.includes(type.id));
    const toggleAll = (checked: boolean) => setSelectedIds(checked ? userTypes.data.map((type) => type.id) : []);
    const runBulkAction = () => {
        if (!bulkAction || selectedIds.length === 0) return;
        if (bulkAction === 'delete' && !window.confirm(`Delete ${selectedIds.length} selected user type(s)?`)) return;
        router.patch(
            '/admin/user-types/bulk',
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
            <Head title="User Types" />
            <div className="mx-auto w-full max-w-[1680px] space-y-4 p-3 md:p-5 lg:p-6">
                <MasterPageHeader
                    title="User Type Master"
                    description={`${stats.total} user types · ${stats.active} active · ${stats.assignedUsers} assigned records`}
                    icon={<ShieldCheck className="size-5" />}
                    action={
                        canManage && (
                            <Button
                                type="button"
                                onClick={openCreate}
                                className="h-9 bg-orange-500 px-4 font-semibold text-white hover:bg-orange-600"
                            >
                                <Plus className="size-4" /> Add user type
                            </Button>
                        )
                    }
                />

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Directory</h2>
                            <p className="mt-0.5 text-xs text-slate-500">Search, sort, update status, or manage multiple records.</p>
                        </div>
                        <form
                            className="relative w-full md:max-w-sm"
                            onSubmit={(event) => {
                                event.preventDefault();
                                loadTable(search);
                            }}
                        >
                            <Search className="absolute top-3 left-3.5 size-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search types"
                                className="h-10 rounded-lg border-slate-300 bg-slate-50 pr-20 pl-10 focus-visible:bg-white"
                            />
                            <button
                                type="submit"
                                className="text-brand-teal hover:bg-brand-aqua/15 absolute top-1.5 right-2 rounded-md px-3 py-1.5 text-xs font-bold"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                    {canManage && selectedIds.length > 0 && (
                        <div className="bg-brand-aqua/10 flex flex-col gap-3 border-b border-cyan-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <span className="text-brand-teal text-xs font-bold">{selectedIds.length} selected</span>
                                <Select value={bulkAction} onValueChange={setBulkAction}>
                                    <SelectTrigger className="h-9 w-full border-slate-300 bg-white sm:w-44">
                                        <SelectValue placeholder="Bulk action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="activate">Mark active</SelectItem>
                                        <SelectItem value="deactivate">Mark inactive</SelectItem>
                                        <SelectItem value="delete">Delete selected</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!bulkAction || selectedIds.length === 0}
                                    onClick={runBulkAction}
                                    className="bg-white"
                                >
                                    Apply
                                </Button>
                            </div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="text-slate-600">
                                <X className="size-4" /> Clear selection
                            </Button>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50/90 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="w-12 px-4 py-3">
                                        <Checkbox
                                            checked={allSelected ? true : selectedIds.length > 0 ? 'indeterminate' : false}
                                            onCheckedChange={(checked) => toggleAll(checked === true)}
                                            aria-label="Select all user types on this page"
                                        />
                                    </th>
                                    <DataTableSortHeader
                                        label="S.No."
                                        column="sno"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="w-24 px-3 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Code"
                                        column="uid"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Type"
                                        column="name"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Description"
                                        column="description"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
                                    <DataTableSortHeader
                                        label="Count"
                                        column="users_count"
                                        activeColumn={filters.sort}
                                        direction={filters.direction}
                                        onSort={sortTable}
                                        className="px-5 py-3"
                                    />
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
                                {userTypes.data.map((type, index) => (
                                    <tr key={type.id} className="group transition-colors hover:bg-cyan-50/30">
                                        <td className="px-4 py-4">
                                            <Checkbox
                                                checked={selectedIds.includes(type.id)}
                                                onCheckedChange={(checked) =>
                                                    setSelectedIds((current) =>
                                                        checked === true ? [...current, type.id] : current.filter((id) => id !== type.id),
                                                    )
                                                }
                                                aria-label={`Select ${type.name}`}
                                            />
                                        </td>
                                        <td className="px-3 py-4 text-xs font-medium text-slate-500">
                                            {(userTypes.current_page - 1) * userTypes.per_page + index + 1}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600">{type.uid}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-brand-teal/10 text-brand-teal grid size-8 shrink-0 place-items-center rounded-lg">
                                                    <Tags className="size-3.5" />
                                                </span>
                                                <span className="font-bold text-slate-800">{type.name}</span>
                                            </div>
                                        </td>
                                        <td className="max-w-sm px-5 py-4 leading-5 text-slate-500">
                                            {type.description || 'No description provided'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex min-w-8 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                                {type.users_count}
                                            </span>
                                        </td>
                                        <td className="min-w-36 px-5 py-4">
                                            <StatusToggle
                                                active={type.status}
                                                disabled={!canManage}
                                                onChange={() => toggleStatus(type)}
                                                label={type.name}
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500">{formatDate(type.created_at)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                {canManage && (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(type)} title="Edit user type">
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={type.users_count > 0}
                                                            onClick={() => remove(type)}
                                                            title={type.users_count > 0 ? 'Assigned types cannot be deleted' : 'Delete user type'}
                                                            className="text-red-500 hover:text-red-600"
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
                    {userTypes.data.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No user types found.</div>}
                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
                                entries · Showing {userTypes.from ?? 0}–{userTypes.to ?? 0} of {userTypes.total}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!userTypes.prev_page_url}
                                onClick={() =>
                                    userTypes.prev_page_url && router.get(userTypes.prev_page_url, {}, { preserveState: true, preserveScroll: true })
                                }
                            >
                                <ChevronLeft className="size-4" /> Previous
                            </Button>
                            <span className="px-2 font-semibold text-slate-700">
                                Page {userTypes.current_page} of {userTypes.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!userTypes.next_page_url}
                                onClick={() =>
                                    userTypes.next_page_url && router.get(userTypes.next_page_url, {}, { preserveState: true, preserveScroll: true })
                                }
                            >
                                Next <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </section>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[560px] overflow-hidden rounded-2xl border border-white/20 bg-white p-0 shadow-2xl sm:p-0 [&>button]:top-5 [&>button]:right-5 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:text-white/70 [&>button]:hover:bg-white/10 [&>button]:hover:text-white">
                    <form onSubmit={submit} className="w-full">
                        <MasterDialogHeader title={editing ? 'Edit user type' : 'Create user type'} />
                        <fieldset className="form-fieldset">
                            <legend>User type information</legend>
                            <div className="space-y-5 py-4 sm:space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-700">Type code</Label>
                                    <Input
                                        value={form.data.uid}
                                        onChange={(event) => form.setData('uid', event.target.value.toUpperCase())}
                                        placeholder="e.g. USR8"
                                        maxLength={10}
                                        className="h-11 border-slate-300 bg-slate-50/60 px-3.5 font-mono uppercase focus-visible:bg-white"
                                    />
                                    <p className="text-[10px] text-slate-400">Leave blank to generate the next available code.</p>
                                    <InputError message={form.errors.uid} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700">
                                            Type name <span className="text-brand-berry">*</span>
                                        </Label>
                                        <span className="text-[10px] text-slate-400">Maximum 100 characters</span>
                                    </div>
                                    <Input
                                        value={form.data.name}
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        placeholder="e.g. Plant Manager"
                                        maxLength={100}
                                        autoFocus
                                        className="h-11 border-slate-300 bg-slate-50/60 px-3.5 focus-visible:bg-white"
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700">Description</Label>
                                        <span className="text-[10px] text-slate-400">{form.data.description.length}/255</span>
                                    </div>
                                    <Textarea
                                        value={form.data.description}
                                        onChange={(event) => form.setData('description', event.target.value)}
                                        placeholder="Describe the purpose and access scope of this user type…"
                                        rows={4}
                                        maxLength={255}
                                        className="min-h-28 border-slate-300 bg-slate-50/60 px-3.5 py-3 leading-5 focus-visible:bg-white"
                                    />
                                    <InputError message={form.errors.description} />
                                </div>
                            </div>
                        </fieldset>
                        <DialogFooter className="gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-7">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="h-10 w-full min-w-24 border-slate-300 bg-white font-semibold text-slate-700 sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={form.processing || !form.data.name.trim()}
                                className="bg-brand-teal hover:bg-brand-plum h-10 w-full min-w-32 font-semibold text-white shadow-sm sm:w-auto"
                            >
                                {form.processing ? 'Saving…' : 'Save type'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
