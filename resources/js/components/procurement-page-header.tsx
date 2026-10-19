import ProjectPageHeader from '@/components/project-page-header';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

export default function ProcurementPageHeader({
    title,
    subtitle,
    icon: Icon,
    meta,
    actions,
    embedded = false,
}: {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    meta?: string;
    actions?: ReactNode;
    embedded?: boolean;
}) {
    return (
        <ProjectPageHeader
            eyebrow="Procurement"
            title={title}
            subtitle={subtitle}
            icon={<Icon className="size-5" />}
            meta={meta}
            actions={actions}
            embedded={embedded}
        />
    );
}
