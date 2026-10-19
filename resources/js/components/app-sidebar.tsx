import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Boxes,
    Building2,
    CalendarDays,
    ChevronRight,
    ContactRound,
    FileSpreadsheet,
    LayoutGrid,
    MessageCircle,
    Package,
    PackageCheck,
    PackageSearch,
    PlugZap,
    Scale,
    ShieldCheck,
    ShoppingCart,
    SlidersHorizontal,
    Tags,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const page = usePage<SharedData>();
    const { setOpen } = useSidebar();
    const { auth, activeModules } = page.props;
    const currentPath = page.url.split('?')[0];
    const isSuperAdmin = auth.roles.includes('Super Admin');
    const canViewDashboard = isSuperAdmin || auth.permissions.includes('dashboard.view');
    const procurementActive = activeModules.includes('procurement');
    const salesActive = activeModules.includes('sales') && (isSuperAdmin || auth.permissions.includes('sales.overview.view'));
    const corporateChatActive = activeModules.includes('corporate-chat');
    const canViewUsers = isSuperAdmin || auth.permissions.includes('users.view');
    const canViewRoles = isSuperAdmin || auth.permissions.includes('roles.view');
    const canViewMaterialApi = isSuperAdmin || auth.permissions.includes('procurement.api.material.view');
    const canViewProductionApi = isSuperAdmin || auth.permissions.includes('procurement.api.production.view');
    const canViewQualityApi = isSuperAdmin || auth.permissions.includes('procurement.api.quality.view');
    const canViewStockApi = isSuperAdmin || auth.permissions.includes('procurement.api.stock.view');
    const canViewVendorApi = isSuperAdmin || auth.permissions.includes('procurement.api.vendor.view');
    const canViewEmployeeApi = canViewUsers;
    const canViewMaterials = isSuperAdmin || auth.permissions.includes('procurement.inventory.materials.view');
    const canViewMaterialStock = isSuperAdmin || auth.permissions.includes('procurement.inventory.material_stock.view');
    const canViewMaterialInventory = isSuperAdmin || auth.permissions.includes('procurement.overview.view');
    const procurementApiTools = [
        ...(canViewMaterialApi ? [{ title: 'Material API', href: '/admin/api-integrations?search=material', icon: PlugZap }] : []),
        ...(canViewProductionApi ? [{ title: 'Production API', href: '/admin/api-integrations?search=production', icon: PlugZap }] : []),
        ...(canViewQualityApi ? [{ title: 'Quality API', href: '/admin/api-integrations?search=quality', icon: PlugZap }] : []),
        ...(canViewStockApi ? [{ title: 'Stock API', href: '/admin/api-integrations?search=stock', icon: PlugZap }] : []),
        ...(canViewVendorApi ? [{ title: 'Vendor API', href: '/admin/api-integrations?search=vendor', icon: PlugZap }] : []),
        ...(canViewEmployeeApi ? [{ title: 'Employee API', href: '/admin/api-integrations?search=employee', icon: PlugZap }] : []),
        ...(isSuperAdmin ? [{ title: 'Security Audit API', href: '/admin/api-integrations?search=security', icon: ShieldCheck }] : []),
    ];
    const procurementInventoryTools = [
        ...(canViewMaterials ? [{ title: 'Materials', href: '/admin/materials', icon: Package }] : []),
        ...(canViewMaterialStock ? [{ title: 'Material Stock', href: '/admin/material-stocks', icon: PackageCheck }] : []),
    ];
    const canViewMaster =
        canViewUsers || canViewRoles || canViewMaterialInventory || procurementApiTools.length > 0 || procurementInventoryTools.length > 0;
    const masterGroups = [
        {
            label: 'Organization',
            items: canViewUsers
                ? [
                      { title: 'Companies', href: '/admin/companies', icon: Building2 },
                      { title: 'Departments', href: '/admin/departments', icon: Building2 },
                      { title: 'Designation levels', href: '/admin/designation-levels', icon: BadgeCheck },
                      { title: 'Designations', href: '/admin/designations', icon: BadgeCheck },
                  ]
                : [],
        },
        {
            label: 'Procurement',
            items: [
                ...(procurementApiTools.length > 0 ? [{ title: 'API Integrations', href: '/admin/api-integrations', icon: PlugZap }] : []),
                ...procurementInventoryTools,
                ...(canViewMaterialInventory
                    ? [{ title: 'Material Inventory', href: '/admin/procurement/material-inventory', icon: PackageSearch }]
                    : []),
            ],
        },
        {
            label: 'Security',
            items: [
                ...(canViewUsers ? [{ title: 'Modules', href: '/admin/modules', icon: Boxes }] : []),
                ...(canViewUsers ? [{ title: 'User types', href: '/admin/user-types', icon: Tags }] : []),
                ...(canViewUsers ? [{ title: 'Users', href: '/admin/user-master', icon: ContactRound }] : []),
                ...(canViewRoles ? [{ title: 'Roles & permissions', href: '/admin/roles', icon: ShieldCheck }] : []),
            ],
        },
    ].filter((group) => group.items.length > 0);
    const activeMasterGroup =
        masterGroups.find((group) =>
            group.items.some((item) => (item.href.includes('?') ? page.url === item.href : currentPath.startsWith(item.href))),
        )?.label ?? null;
    const [openMasterGroup, setOpenMasterGroup] = useState<string | null>(activeMasterGroup ?? masterGroups[0]?.label ?? null);
    const compactItems = [
        ...(canViewDashboard ? [{ title: 'Dashboard', href: '/dashboard', icon: LayoutGrid, active: currentPath.startsWith('/dashboard') }] : []),
        ...(salesActive ? [{ title: 'Sales', href: '/admin/sales', icon: TrendingUp, active: currentPath.startsWith('/admin/sales') }] : []),
        ...(procurementActive
            ? [
                  {
                      title: 'Procurement',
                      icon: ShoppingCart,
                      active:
                          currentPath.startsWith('/admin/procurement') ||
                          currentPath.startsWith('/admin/api-integrations') ||
                          currentPath.startsWith('/admin/materials') ||
                          currentPath.startsWith('/admin/material-stocks'),
                  },
              ]
            : []),
        ...(corporateChatActive ? [{ title: 'Corporate chat', href: '/chat', icon: MessageCircle, active: currentPath.startsWith('/chat') }] : []),
        ...(canViewMaster ? [{ title: 'Master Control', icon: SlidersHorizontal, active: activeMasterGroup !== null }] : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-white/10">
            <SidebarHeader className="h-20 justify-center border-b border-white/10 px-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="focus-visible:ring-brand-gold/70 h-16 overflow-hidden bg-transparent group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-1 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-1 active:bg-transparent data-[active=true]:bg-transparent data-[slot=sidebar-menu-button]:!p-1 data-[state=open]:bg-transparent"
                        >
                            <Link href={canViewDashboard ? '/dashboard' : '/settings/profile'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="sidebar-corporate-scroll hidden px-2 py-3 group-data-[collapsible=icon]:flex">
                <SidebarGroup className="px-0 py-1">
                    <SidebarMenu className="items-center gap-2">
                        {compactItems.map((item) => {
                            const ItemIcon = item.icon;

                            return (
                                <SidebarMenuItem key={item.title} className="flex justify-center">
                                    {'href' in item && item.href ? (
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.active}
                                            tooltip={item.title}
                                            className="h-10 w-10 justify-center rounded-lg border border-transparent p-0 text-indigo-200/75 transition-all group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! hover:border-indigo-300/15 hover:bg-indigo-300/10 hover:text-white data-[active=true]:border-indigo-300/20 data-[active=true]:bg-indigo-300/15 data-[active=true]:text-indigo-100 data-[active=true]:shadow-[0_0_16px_rgba(165,180,252,0.16)]"
                                        >
                                            <Link href={item.href} prefetch aria-label={item.title}>
                                                <ItemIcon className="!size-[18px]" />
                                                <span className="sr-only">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    ) : (
                                        <SidebarMenuButton
                                            type="button"
                                            isActive={item.active}
                                            tooltip={`${item.title} menu`}
                                            aria-label={`Open ${item.title} menu`}
                                            onClick={() => setOpen(true)}
                                            className="h-10 w-10 justify-center rounded-lg border border-transparent p-0 text-indigo-200/75 transition-all group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! hover:border-indigo-300/15 hover:bg-indigo-300/10 hover:text-white data-[active=true]:border-indigo-300/20 data-[active=true]:bg-indigo-300/15 data-[active=true]:text-indigo-100 data-[active=true]:shadow-[0_0_16px_rgba(165,180,252,0.16)]"
                                        >
                                            <ItemIcon className="!size-[18px]" />
                                            <span className="sr-only">{item.title}</span>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarContent className="sidebar-corporate-scroll px-2 py-3 group-data-[collapsible=icon]:hidden">
                <SidebarGroup className="px-0 py-2">
                    <SidebarGroupLabel className="text-brand-aqua h-7 px-3 text-[9px] font-semibold tracking-[0.15em] uppercase group-data-[collapsible=icon]:opacity-0">
                        Main
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {canViewDashboard && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith('/dashboard')}
                                    tooltip="Dashboard"
                                    className="data-[active=true]:border-brand-gold data-[active=true]:bg-brand-berry h-10 border-l-2 border-transparent px-3 text-[13px] font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white data-[active=true]:text-white data-[active=true]:shadow-sm"
                                >
                                    <Link href="/dashboard" prefetch>
                                        <LayoutGrid className="!size-[17px] shrink-0" />
                                        <span className="truncate">Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        {salesActive && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith('/admin/sales')}
                                    tooltip="Sales"
                                    className="data-[active=true]:border-brand-gold data-[active=true]:bg-brand-berry h-10 border-l-2 border-transparent px-3 text-[13px] font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white data-[active=true]:text-white data-[active=true]:shadow-sm"
                                >
                                    <Link href="/admin/sales" prefetch>
                                        <TrendingUp className="!size-[17px] shrink-0" />
                                        <span className="truncate">Sales</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                        {procurementActive && (
                            <Collapsible
                                asChild
                                defaultOpen={
                                    page.url.startsWith('/admin/procurement') ||
                                    page.url.startsWith('/admin/api-integrations') ||
                                    page.url.startsWith('/admin/materials') ||
                                    page.url.startsWith('/admin/material-stocks')
                                }
                                className="group/procurement"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            isActive={
                                                page.url.startsWith('/admin/procurement') ||
                                                page.url.startsWith('/admin/api-integrations') ||
                                                page.url.startsWith('/admin/materials') ||
                                                page.url.startsWith('/admin/material-stocks')
                                            }
                                            tooltip="Procurement"
                                            className="data-[active=true]:border-brand-gold data-[active=true]:bg-brand-berry h-10 border-l-2 border-transparent px-3 text-[13px] font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white data-[active=true]:text-white data-[active=true]:shadow-sm"
                                        >
                                            <ShoppingCart className="!size-[17px] shrink-0" />
                                            <span className="truncate">Procurement</span>
                                            <ChevronRight className="text-brand-aqua ml-auto !size-3.5 transition-transform group-data-[collapsible=icon]:hidden group-data-[state=open]/procurement:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="ml-4 gap-1 border-white/15 py-1.5 pl-3 group-data-[collapsible=icon]:hidden">
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={currentPath === '/admin/procurement/dashboard'}
                                                    className="data-[active=true]:bg-brand-aqua/15 data-[active=true]:text-brand-aqua h-8 rounded-md px-2.5 text-[12px] font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                                                >
                                                    <Link href="/admin/procurement/dashboard" prefetch>
                                                        <LayoutGrid className="!size-3.5" />
                                                        <span>Dashboard</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <Collapsible
                                                asChild
                                                defaultOpen={
                                                    currentPath === '/admin/procurement' ||
                                                    currentPath.includes('/admin/procurement/daily-consumption') ||
                                                    currentPath.includes('/admin/procurement/balance-overview') ||
                                                    currentPath.includes('/admin/procurement/balance-sheet')
                                                }
                                                className="group/planning"
                                            >
                                                <SidebarMenuSubItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuSubButton className="h-8 rounded-md px-2.5 text-[12px] font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white">
                                                            <CalendarDays className="!size-3.5" />
                                                            <span>Planning</span>
                                                            <ChevronRight className="ml-auto !size-3 transition-transform group-data-[state=open]/planning:rotate-90" />
                                                        </SidebarMenuSubButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="ml-3 space-y-1 border-l border-white/10 py-1 pl-2">
                                                            {[
                                                                {
                                                                    title: 'Consumption',
                                                                    href: '/admin/procurement/daily-consumption',
                                                                    icon: CalendarDays,
                                                                    active:
                                                                        currentPath === '/admin/procurement' ||
                                                                        currentPath === '/admin/procurement/daily-consumption',
                                                                },
                                                                {
                                                                    title: 'Balance Sheet View',
                                                                    href: '/admin/procurement/balance-overview',
                                                                    icon: TrendingUp,
                                                                    active: currentPath.startsWith('/admin/procurement/balance-overview'),
                                                                },
                                                                {
                                                                    title: 'Balance Sheet',
                                                                    href: '/admin/procurement/balance-sheet',
                                                                    icon: Scale,
                                                                    active: currentPath.startsWith('/admin/procurement/balance-sheet'),
                                                                },
                                                                {
                                                                    title: 'All Materials Balance',
                                                                    href: '/admin/procurement/all-balance-sheet',
                                                                    icon: FileSpreadsheet,
                                                                    active: currentPath.startsWith('/admin/procurement/all-balance-sheet'),
                                                                },
                                                            ].map((item) => (
                                                                <SidebarMenuSubButton
                                                                    key={item.title}
                                                                    asChild
                                                                    isActive={item.active}
                                                                    className="data-[active=true]:bg-brand-aqua/15 data-[active=true]:text-brand-aqua h-8 rounded-md px-2.5 text-[12px] font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                                                                >
                                                                    <Link href={item.href} prefetch>
                                                                        <item.icon className="!size-3.5" />
                                                                        <span>{item.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            ))}
                                                        </div>
                                                    </CollapsibleContent>
                                                </SidebarMenuSubItem>
                                            </Collapsible>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )}
                        {corporateChatActive && (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith('/chat')}
                                    tooltip="Corporate chat"
                                    className="data-[active=true]:border-brand-gold data-[active=true]:bg-sidebar-accent h-10 border-l-2 border-transparent px-3 text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:text-white"
                                >
                                    <Link href="/chat" prefetch>
                                        <MessageCircle className="!size-[17px] shrink-0" />
                                        <span className="truncate">Corporate chat</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                {canViewMaster && (
                    <SidebarGroup className="px-0 py-2">
                        <SidebarMenu className="gap-1">
                            <Collapsible asChild className="group/master-control">
                                <SidebarMenuItem className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip="Master Control"
                                            className="h-11 rounded-lg px-2.5 text-[13px] font-semibold text-white/90 transition-all hover:bg-white/[0.07] hover:text-white data-[state=open]:bg-white/[0.045]"
                                        >
                                            <span className="border-brand-aqua/20 bg-brand-aqua/10 flex size-7 shrink-0 items-center justify-center rounded-lg border">
                                                <SlidersHorizontal className="text-brand-aqua !size-3.5" />
                                            </span>
                                            <span className="tracking-[0.01em]">Master Control</span>
                                            <span className="ml-auto flex size-6 items-center justify-center rounded-md bg-white/5">
                                                <ChevronRight className="!size-3.5 transition-transform duration-200 group-data-[state=open]/master-control:rotate-90" />
                                            </span>
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                                        <div className="relative mt-1 mb-1 ml-[22px] space-y-1.5 border-l border-white/15 py-1 pl-[18px]">
                                            {masterGroups.map((group) => {
                                                const groupActive = group.items.some((item) =>
                                                    item.href.includes('?') ? page.url === item.href : currentPath.startsWith(item.href),
                                                );
                                                return (
                                                    <Collapsible
                                                        key={group.label}
                                                        open={openMasterGroup === group.label}
                                                        onOpenChange={(open) => setOpenMasterGroup(open ? group.label : null)}
                                                        className="group/master-category"
                                                    >
                                                        <CollapsibleTrigger
                                                            className={`relative flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[10px] font-bold tracking-[0.09em] uppercase transition-all duration-200 hover:bg-white/[0.06] hover:text-white ${groupActive ? 'bg-brand-aqua/[0.08] text-brand-aqua' : 'text-white/70'}`}
                                                        >
                                                            <span
                                                                className={`absolute -left-[22px] size-2 rounded-full border-2 border-[#07374b] shadow-[0_0_0_2px_rgba(255,255,255,0.05)] transition-all ${groupActive ? 'bg-brand-aqua shadow-[0_0_8px_rgba(34,211,238,0.55)]' : 'bg-slate-500'}`}
                                                            />
                                                            <span>{group.label}</span>
                                                            <ChevronRight className="ml-auto !size-3 text-white/40 transition-transform duration-200 group-data-[state=open]/master-category:rotate-90" />
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <div className="mt-1 space-y-0.5 pb-1 pl-1">
                                                                {group.items.map((item) => {
                                                                    const ItemIcon = item.icon;
                                                                    const itemActive = item.href.includes('?')
                                                                        ? page.url === item.href
                                                                        : currentPath.startsWith(item.href);
                                                                    return (
                                                                        <SidebarMenuSubButton
                                                                            key={item.href}
                                                                            asChild
                                                                            isActive={itemActive}
                                                                            className="data-[active=true]:bg-brand-aqua/15 data-[active=true]:text-brand-aqua h-8 rounded-lg px-2.5 text-[11px] font-medium text-white/55 transition-all hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white"
                                                                        >
                                                                            <Link href={item.href} prefetch>
                                                                                <ItemIcon className="!size-3.5" />
                                                                                <span>{item.title}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    );
                                                                })}
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                );
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <div className="mx-3 mt-4 border-t border-white/10 pt-4 group-data-[collapsible=icon]:hidden">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            System online
                        </div>
                        <p className="text-brand-aqua mt-1.5 text-[10px] leading-4">Enterprise services are operating normally.</p>
                    </div>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
