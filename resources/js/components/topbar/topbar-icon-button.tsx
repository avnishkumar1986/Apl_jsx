import { Button } from '@/components/ui/button';
import { type LucideIcon } from 'lucide-react';

interface TopbarIconButtonProps extends React.ComponentProps<typeof Button> {
    label: string;
    icon: LucideIcon;
    badge?: string | number;
}

export function TopbarIconButton({ label, icon: Icon, badge, className = '', ...props }: TopbarIconButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            className={`hover:bg-brand-aqua/15 hover:text-brand-teal relative size-9 rounded-md text-slate-500 ${className}`}
            {...props}
        >
            <Icon className="!size-[18px]" />
            {badge !== undefined && (
                <span className="bg-brand-berry absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[9px] leading-4 font-bold text-white">
                    {badge}
                </span>
            )}
        </Button>
    );
}
