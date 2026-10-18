import ProjectPageHeader from '@/components/project-page-header';
import { type ReactNode } from 'react';

export function MasterPageHeader({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
    return <ProjectPageHeader eyebrow="Master data" title={title} subtitle={description} icon={icon} actions={action} />;
}
