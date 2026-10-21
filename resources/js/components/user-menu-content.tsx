import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type SharedData, type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardCheck, Headphones, Inbox, LogOut, Settings, UserRound, WalletCards } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
    showHeader?: boolean;
}

export function UserMenuContent({ user, showHeader = true }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { auth } = usePage<SharedData>().props;
    const canManageSupport =
        auth.roles.includes('Super Admin') || auth.permissions.includes('support.manage') || auth.permissions.includes('support.view-all');

    return (
        <>
            {showHeader && (
                <>
                    <DropdownMenuLabel className="p-2 font-normal">
                        <div className="rounded-xl bg-slate-50 px-2 py-2 text-left text-sm">
                            <UserInfo user={user} showEmail={true} />
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                </>
            )}
            <DropdownMenuItem asChild>
                <Link
                    className="mx-1 flex min-h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg px-3 font-medium text-slate-700"
                    href="/settings/profile"
                    onClick={cleanup}
                >
                    <UserRound className="size-4.5 text-slate-500" />
                    Profile
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link
                    className="mx-1 flex min-h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg px-3 font-medium text-slate-700"
                    href="/chat"
                    onClick={cleanup}
                >
                    <Inbox className="size-4.5 text-slate-500" />
                    Inbox
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="mx-1 min-h-11 gap-3 rounded-lg px-3 font-medium">
                <ClipboardCheck className="size-4.5 text-slate-400" />
                Task Manager
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link
                    className="mx-1 flex min-h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg px-3 font-medium text-slate-700"
                    href="/settings/password"
                    onClick={cleanup}
                >
                    <Settings className="size-4.5 text-slate-500" />
                    Settings
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="mx-1 min-h-11 gap-3 rounded-lg px-3 font-medium">
                <WalletCards className="size-4.5 text-slate-400" />
                Balance
                <span className="ml-auto text-xs text-slate-400">—</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link
                    className="mx-1 flex min-h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg px-3 font-medium text-slate-700"
                    href="/support"
                    onClick={cleanup}
                >
                    <Headphones className="size-4.5 text-slate-500" />
                    {canManageSupport ? 'Support Desk' : 'Create Ticket'}
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem asChild>
                <Link
                    className="mx-1 flex min-h-11 w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg px-3 font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                    method="post"
                    href={route('logout')}
                    as="button"
                    onClick={cleanup}
                >
                    <LogOut className="size-4.5" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
