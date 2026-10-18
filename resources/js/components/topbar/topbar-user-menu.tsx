import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

export function TopbarUserMenu() {
    const { auth } = usePage<SharedData>().props;
    const initials = useInitials();
    const primaryRole = auth.roles[0] ?? 'Team member';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="ml-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50 data-[state=open]:bg-slate-50"
                    aria-label="Open user menu"
                >
                    <span className="relative shrink-0">
                        <Avatar className="size-8 ring-2 ring-slate-100">
                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                            <AvatarFallback className="bg-brand-teal text-xs font-semibold text-white">{initials(auth.user.name)}</AvatarFallback>
                        </Avatar>
                        <span
                            className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500"
                            aria-label="Active"
                            title="Active"
                        />
                    </span>
                    <span className="hidden min-w-0 lg:block">
                        <span className="block max-w-32 truncate text-xs font-semibold text-slate-700">{auth.user.name}</span>
                        <span className="block max-w-32 truncate text-[10px] text-slate-400">{primaryRole}</span>
                    </span>
                    <ChevronDown className="hidden size-3.5 text-slate-400 transition-transform group-data-[state=open]:rotate-180 lg:block" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl border-slate-200 p-1.5 shadow-xl shadow-slate-900/10">
                <UserMenuContent user={auth.user} showHeader={false} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
