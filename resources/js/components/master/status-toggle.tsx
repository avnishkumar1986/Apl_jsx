export function StatusToggle({
    active,
    disabled = false,
    onChange,
    label,
}: {
    active: boolean;
    disabled?: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={active}
            disabled={disabled}
            onClick={onChange}
            className="focus-visible:ring-brand-aqua inline-flex min-w-28 items-center gap-2.5 rounded-md py-1 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-70"
            aria-label={`${active ? 'Deactivate' : 'Activate'} ${label}`}
        >
            <span
                className={`relative h-5 w-10 shrink-0 rounded-full border transition-colors duration-200 ${active ? 'border-brand-teal bg-brand-teal' : 'border-slate-300 bg-slate-300'}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </span>
            <span className={`min-w-12 text-left text-xs font-bold ${active ? 'text-brand-teal' : 'text-slate-500'}`}>
                {active ? 'Active' : 'Inactive'}
            </span>
        </button>
    );
}
