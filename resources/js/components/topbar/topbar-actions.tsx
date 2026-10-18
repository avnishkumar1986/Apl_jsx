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
import { Bell, Languages, Moon, Search, Sun } from 'lucide-react';

export function TopbarActions() {
    const { appearance, updateAppearance } = useAppearance();
    return (
        <div className="flex items-center gap-0.5">
            <TopbarIconButton label="Search" icon={Search} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="hover:bg-brand-aqua/15 hover:text-brand-teal flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-slate-600"
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
                    <span>
                        <TopbarIconButton label="Notifications" icon={Bell} />
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-3 py-5 text-center text-xs text-slate-400">You have no new notifications.</div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
