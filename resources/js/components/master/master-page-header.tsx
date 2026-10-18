import { type ReactNode } from 'react';

export function MasterPageHeader({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    {icon && <span className="bg-brand-teal/10 text-brand-teal grid size-10 shrink-0 place-items-center rounded-lg">{icon}</span>}
                    <div className="min-w-0">
                        <p className="text-brand-teal text-[10px] font-bold tracking-[0.16em] uppercase">Master data</p>
                        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                        <p className="text-xs text-slate-500">{description}</p>
                    </div>
                </div>
                {action && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{action}</div>}
            </div>
        </section>
    );
}
