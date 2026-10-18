import { cn } from '@/lib/utils';

export function ChatAvatar({
    label,
    color = 'bg-brand-teal',
    online = false,
    className,
}: {
    label: string;
    color?: string;
    online?: boolean;
    className?: string;
}) {
    return (
        <span className={cn('relative grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-slate-800', color, className)}>
            {label}
            {online && <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-emerald-500" />}
        </span>
    );
}
