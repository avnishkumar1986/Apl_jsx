import { Topbar } from '@/components/topbar/topbar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return <Topbar breadcrumbs={breadcrumbs} />;
}
