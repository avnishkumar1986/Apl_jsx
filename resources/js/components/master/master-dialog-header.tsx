import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Database } from 'lucide-react';

export function MasterDialogHeader({ title, description, compact = false }: { title: string; description?: string; compact?: boolean }) {
    return (
        <DialogHeader
            className={`border-brand-gold bg-brand-plum relative w-full shrink-0 overflow-hidden border-b-4 px-5 text-left sm:px-7 ${compact ? 'py-2.5 sm:py-3' : 'py-4 sm:py-5'}`}
        >
            <div className="flex items-start gap-3 sm:gap-4">
                <span
                    className={`text-brand-aqua grid shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 ${compact ? 'size-9' : 'size-10 sm:size-11'}`}
                >
                    <Database className="size-5" />
                </span>
                <div className="min-w-0 space-y-1.5">
                    <p className="text-brand-aqua text-[10px] font-bold tracking-[0.18em] uppercase">APL Connect · Master data</p>
                    <DialogTitle className="text-lg leading-tight font-bold text-white sm:text-xl">{title}</DialogTitle>
                    {description && <DialogDescription className="max-w-md text-sm leading-5 text-white/70">{description}</DialogDescription>}
                </div>
            </div>
        </DialogHeader>
    );
}
