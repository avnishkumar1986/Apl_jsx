import { Network } from 'lucide-react';
import { type ReactNode } from 'react';

export default function ProjectPageHeader({
    eyebrow,
    title,
    icon,
    meta,
    actions,
    embedded = false,
}: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
    embedded?: boolean;
}) {
    return (
        <section
            className={`relative overflow-hidden px-4 py-2.5 text-white sm:px-4 ${embedded ? 'bg-transparent' : 'rounded-xl border-t-[3px] border-orange-500 bg-gradient-to-r from-[#07374b] via-[#075b70] to-[#0b8da3] shadow-md shadow-slate-900/10'}`}
        >
            <Network className="pointer-events-none absolute -right-8 -bottom-12 size-44 text-white/5" aria-hidden="true" />
            <div
                className={`relative flex gap-3 ${embedded ? 'h-full flex-col justify-center sm:flex-row sm:items-center sm:justify-between' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    {icon && (
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-300 ring-1 ring-white/15">
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.18em] text-orange-300 uppercase">{eyebrow}</p>
                        <h1 className="mt-0.5 text-lg leading-tight font-bold break-words text-white sm:text-xl">{title}</h1>
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
