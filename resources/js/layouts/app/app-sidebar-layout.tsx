import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <main className="flex min-h-0 max-w-full min-w-0 flex-1 flex-col overflow-x-hidden">{children}</main>
                <footer className="border-t border-slate-200 bg-white px-3 py-3 text-center text-[10px] text-slate-400 sm:px-6 sm:text-[11px]">
                    Copyright © {new Date().getFullYear()} <span className="text-brand-plum font-semibold">Apollo Pipes Private Limited</span>. All
                    rights reserved.
                </footer>
            </AppContent>
        </AppShell>
    );
}
