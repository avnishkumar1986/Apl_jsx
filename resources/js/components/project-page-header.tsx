import { Network } from 'lucide-react';
import { type ReactNode } from 'react';

export default function ProjectPageHeader({
    eyebrow,
    title,
    subtitle,
    icon,
    meta,
    actions,
}: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <section className="relative overflow-hidden rounded-2xl border-t-4 border-orange-500 bg-gradient-to-r from-[#07374b] via-[#075b70] to-[#0b8da3] px-4 py-5 text-white shadow-lg shadow-slate-900/10 sm:px-5">
            <Network className="pointer-events-none absolute -right-8 -bottom-12 size-44 text-white/5" aria-hidden="true" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    {icon && (
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-orange-300 ring-1 ring-white/15">
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.18em] text-orange-300 uppercase">{eyebrow}</p>
                        <h1 className="mt-1 text-xl leading-tight font-bold break-words text-white sm:text-2xl">{title}</h1>
                        {subtitle && <p className="mt-1 text-xs leading-5 text-white/75">{subtitle}</p>}
                    </div>
                </div>
                {(meta || actions) && (
                    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {meta && <span className="text-xs font-medium text-white/80">{meta}</span>}
                        {actions}
                    </div>
                )}
            </div>
        </section>
    );
}
