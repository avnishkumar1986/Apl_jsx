import { type LucideIcon } from 'lucide-react';

const tones = {
    teal: { icon: 'bg-brand-teal/10 text-brand-teal', accent: 'bg-brand-teal', badge: 'bg-brand-teal/10 text-brand-teal' },
    berry: { icon: 'bg-brand-berry/10 text-brand-berry', accent: 'bg-brand-berry', badge: 'bg-brand-berry/10 text-brand-berry' },
    plum: { icon: 'bg-brand-plum/10 text-brand-plum', accent: 'bg-brand-plum', badge: 'bg-brand-plum/10 text-brand-plum' },
    gold: { icon: 'bg-brand-gold/15 text-amber-700', accent: 'bg-brand-gold', badge: 'bg-brand-gold/15 text-amber-700' },
    aqua: { icon: 'bg-brand-aqua/15 text-brand-teal', accent: 'bg-brand-aqua', badge: 'bg-brand-aqua/15 text-brand-teal' },
};

export function MasterStatCard({
    icon: Icon,
    value,
    label,
    tone = 'teal',
    period = 'Current',
    trend,
    compact = false,
}: {
    icon: LucideIcon;
    value: number;
    label: string;
    tone?: keyof typeof tones;
    period?: string;
    trend?: string;
    compact?: boolean;
}) {
    const colors = tones[tone];

    if (compact) {
        return (
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xs">
                <span className={`absolute inset-y-0 left-0 w-0.5 ${colors.accent}`} />
                <div className="flex items-center gap-2.5">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${colors.icon}`}>
                        <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-700">{label}</p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">{period}</p>
                    </div>
                    <p className="shrink-0 text-xl leading-none font-bold tracking-tight text-slate-900">{value.toLocaleString()}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <span className={`absolute inset-y-0 left-0 w-1 ${colors.accent}`} />
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${colors.icon}`}>
                        <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-600">{label}</p>
                        <span className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}>{period}</span>
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-2xl leading-none font-bold tracking-tight text-slate-900">{value.toLocaleString()}</p>
                    {trend && <span className="text-brand-teal mt-1.5 block text-xs font-bold">{trend}</span>}
                </div>
            </div>
        </div>
    );
}
