import { TopbarIconButton } from '@/components/topbar/topbar-icon-button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, Languages, Moon, Search, Sun } from 'lucide-react';
import { useEffect } from 'react';

export function TopbarActions() {
    const { appearance, updateAppearance } = useAppearance();
    const { notifications } = usePage<SharedData>().props;

    useEffect(() => {
        const timer = window.setInterval(() => router.reload({ only: ['notifications'], preserveScroll: true }), 30000);
        return () => window.clearInterval(timer);
    }, []);
    return (
        <div className="flex min-w-0 items-center gap-0.5">
            <span className="hidden min-[360px]:inline-flex">
                <TopbarIconButton label="Search" icon={Search} />
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="hover:bg-brand-aqua/15 hover:text-brand-teal flex h-9 items-center gap-1.5 rounded-md px-1.5 text-xs font-semibold text-slate-600 sm:px-2"
                        aria-label="Language"
                    >
                        <span className="bg-brand-teal grid size-5 place-items-center rounded-full text-[8px] font-bold text-white">EN</span>
                        <span className="hidden xl:inline">EN</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel>Language</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Languages /> English
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <TopbarIconButton
                label={appearance === 'dark' ? 'Use light theme' : 'Use dark theme'}
                icon={appearance === 'dark' ? Sun : Moon}
                onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <span className="relative">
                        <TopbarIconButton label="Notifications" icon={Bell} />
                        {notifications.unreadCount > 0 && (
                            <span className="absolute top-0 right-0 grid min-w-4 translate-x-0.5 -translate-y-0.5 place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                                {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                            </span>
                        )}
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                    <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                        <span>Notifications</span>
                        {notifications.unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => router.post('/notifications/read-all')}
                                className="flex items-center gap-1 text-[10px] font-semibold text-cyan-700 hover:text-cyan-900"
                            >
                                <CheckCheck className="size-3.5" /> Mark all read
                            </button>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.items.length === 0 ? (
                        <div className="px-3 py-8 text-center text-xs text-slate-400">You have no new notifications.</div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto py-1">
                            {notifications.items.map((item) => (
                                <DropdownMenuItem
                                    key={item.id}
                                    onSelect={() => router.post(`/notifications/${item.id}/read`)}
                                    className={`block cursor-pointer px-4 py-3 ${item.read ? '' : 'bg-cyan-50/70'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? 'bg-slate-200' : 'bg-orange-500'}`} />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800">{item.title}</p>
                                            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{item.message}</p>
                                            <p className="mt-1.5 text-[10px] font-semibold text-cyan-700">
                                                {item.ticketNumber} · {item.createdAt}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
