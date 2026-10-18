import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

export default function ProcurementPageHeader({
    title,
    subtitle,
    icon: Icon,
    meta,
    actions,
}: {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    meta?: string;
    actions?: ReactNode;
}) {
    return (
        <section className="bg-brand-teal overflow-hidden rounded-2xl border border-cyan-600/20 text-white shadow-sm">
            <div className="flex flex-col gap-3 px-3 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
                        <Icon className="size-5 text-white" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-lg leading-tight font-bold break-words text-white sm:text-xl">{title}</h1>
                        {subtitle && <p className="mt-0.5 text-xs break-words text-white/75">{subtitle}</p>}
                    </div>
                </div>
                {(meta || actions) && (
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        {meta && <span className="text-xs text-white/75">{meta}</span>}
                        {actions}
                    </div>
                )}
            </div>
        </section>
    );
}
