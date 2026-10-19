import { Breadcrumbs } from '@/components/breadcrumbs';
import { TopbarActions } from '@/components/topbar/topbar-actions';
import { TopbarUserMenu } from '@/components/topbar/topbar-user-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';

export function Topbar({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <header className="after:bg-brand-gold relative flex h-14 min-w-0 shrink-0 items-center border-b border-slate-200 bg-white px-2 shadow-sm shadow-slate-900/5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-16 sm:h-16 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="border-brand-aqua/25 bg-brand-aqua/8 text-brand-teal hover:border-brand-aqua/45 hover:bg-brand-aqua/15 hover:text-brand-teal size-9 rounded-xl border shadow-sm shadow-slate-900/5 transition-all hover:shadow-md active:scale-95" />
                <div className="hidden min-w-0 md:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="ml-auto flex min-w-0 items-center">
                <TopbarActions />
                <div className="mx-1 h-7 w-px shrink-0 bg-slate-200 sm:mx-2" />
                <TopbarUserMenu />
            </div>
        </header>
    );
}
