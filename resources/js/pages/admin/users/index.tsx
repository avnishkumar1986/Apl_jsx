import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Role = { id: number; name: string };
type User = { id: number; name: string; email: string; status: boolean; roles: Role[] };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'User access', href: '/admin/users' }];

function UserRoles({ user, roles }: { user: User; roles: Role[] }) {
    const { data, setData, put, processing, errors } = useForm({ roles: user.roles.map((role) => role.name) });
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        put(`/admin/users/${user.id}/roles`, { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <fieldset className="form-fieldset !m-0">
                <legend>User roles</legend>
                <div className="space-y-4 pt-3">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {roles.map((role) => (
                            <label key={role.id} className="flex min-w-0 items-center gap-3 rounded-lg border p-3 text-sm">
                                <Checkbox
                                    checked={data.roles.includes(role.name)}
                                    onCheckedChange={(checked) =>
                                        setData('roles', checked ? [...data.roles, role.name] : data.roles.filter((name) => name !== role.name))
                                    }
                                />
                                <span className="truncate">{role.name}</span>
                            </label>
                        ))}
                    </div>
                    <InputError message={errors.roles} />
                    <Button className="w-full sm:w-auto" disabled={processing}>
                        Save roles
                    </Button>
                </div>
            </fieldset>
        </form>
    );
}

export default function UsersIndex({ users, roles }: { users: User[]; roles: Role[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User access" />
            <div className="space-y-6 p-4 sm:p-5 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">User access</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Assign normalized roles to users. Permissions are inherited through those roles.
                    </p>
                </div>
                <div className="space-y-4">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[0.45fr_1fr]">
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">{user.name}</div>
                                    <div className="text-muted-foreground truncate text-sm">{user.email}</div>
                                    <span
                                        className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${user.status ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-500/10 text-slate-600'}`}
                                    >
                                        {user.status ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <UserRoles user={user} roles={roles} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
