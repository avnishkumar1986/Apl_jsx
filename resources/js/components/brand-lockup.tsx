interface BrandLockupProps {
    tone?: 'light' | 'dark';
    compact?: boolean;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

export function BrandLockup({ tone = 'light', compact = false, orientation = 'vertical', className = '' }: BrandLockupProps) {
    const primaryText = tone === 'dark' ? 'text-white' : 'text-[#18354d]';
    const secondaryText = tone === 'dark' ? 'text-[#8fb5ca]' : 'text-slate-400';
    return (
        <div
            className={`flex min-w-0 items-center justify-center ${orientation === 'horizontal' ? `flex-row text-left ${compact ? 'gap-2' : 'gap-2.5'}` : `flex-col text-center ${compact ? 'gap-0.5' : 'gap-1'}`} ${className}`}
        >
            <img
                src="/apl-emblem-transparent.png"
                alt="APL"
                className={
                    orientation === 'horizontal'
                        ? compact
                            ? 'size-10 shrink-0 object-contain'
                            : 'size-12 shrink-0 object-contain'
                        : compact
                          ? 'size-10 shrink-0 object-contain'
                          : 'size-20 shrink-0 object-contain'
                }
            />
            {orientation === 'horizontal' && <span className="bg-brand-teal h-9 w-px" />}
            <span
                className={`min-w-0 ${orientation === 'horizontal' ? 'after:bg-brand-gold relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-8' : ''}`}
            >
                <span
                    className={`block ${orientation === 'horizontal' ? (compact ? 'text-[13px]' : 'text-[15px]') : compact ? 'text-[10px]' : 'text-[18px]'} leading-none font-extrabold tracking-[0.06em] whitespace-nowrap ${primaryText}`}
                >
                    APL CONNECT
                </span>
                <span
                    className={`mt-1.5 block ${orientation === 'horizontal' ? (compact ? 'text-[8px]' : 'text-[9px]') : compact ? 'text-[6px]' : 'text-[10px]'} font-bold tracking-[0.12em] whitespace-nowrap uppercase ${secondaryText}`}
                >
                    Enterprise Portal
                </span>
            </span>
        </div>
    );
}
