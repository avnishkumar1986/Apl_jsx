import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { useEffect } from 'react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    useEffect(() => {
        const markSessionClosing = () => {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

            if (!csrfToken) {
                return;
            }

            const payload = new FormData();
            payload.append('_token', csrfToken);
            navigator.sendBeacon(route('dashboard.session-closing'), payload);
        };

        window.addEventListener('pagehide', markSessionClosing);

        return () => window.removeEventListener('pagehide', markSessionClosing);
    }, []);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    );
}
