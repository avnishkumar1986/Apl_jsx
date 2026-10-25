import { Network } from 'lucide-react';
import { type ReactNode } from 'react';

export default function ProjectPageHeader({
    eyebrow,
    title,
    subtitle,
    icon,
    meta,
    actions,
    embedded = false,
    compact = false,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    embedded?: boolean;
    compact?: boolean;
}) {
    return (
        <section
            className={`relative text-white ${embedded ? 'overflow-visible bg-transparent' : `overflow-hidden rounded-2xl border border-t-[3px] border-white/10 border-t-orange-500 bg-gradient-to-r from-[#07374b] via-[#075b70] to-[#0b8da3] shadow-lg shadow-slate-900/15 ${compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'}`}`}
        >
            <Network className="pointer-events-none absolute -right-8 -bottom-12 size-44 text-white/5" aria-hidden="true" />
            <div
                className={`relative flex gap-3 ${embedded ? 'h-full flex-col justify-center sm:flex-row sm:items-center sm:justify-between' : 'flex-col xl:flex-row xl:items-center xl:justify-between'}`}
            >
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    {icon && (
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-orange-300 shadow-inner ring-1 ring-white/15 sm:size-10">
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0">
                        {eyebrow && <p className="text-[10px] font-bold tracking-[0.18em] text-orange-300 uppercase">{eyebrow}</p>}
                        <h1 className="mt-0.5 text-base leading-tight font-bold break-words text-white sm:text-xl">{title}</h1>
                        {subtitle && <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/65">{subtitle}</p>}
                        {meta && (
                            <span className="mt-1.5 inline-flex rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] font-medium text-white/75">
                                {meta}
                            </span>
                        )}
                    </div>
                </div>
                {actions && (
                    <div
                        className={`relative z-10 flex min-w-0 flex-wrap items-center gap-2 ${embedded ? 'w-full sm:w-auto sm:shrink-0 sm:justify-end' : `w-full rounded-xl border border-white/15 bg-white/10 shadow-inner shadow-black/5 backdrop-blur-md xl:w-auto xl:max-w-[72%] xl:justify-end ${compact ? 'p-1.5' : 'p-2 sm:p-2.5'}`}`}
                    >
                        {actions}
                    </div>
                )}
            </div>
        </section>
    );
}
