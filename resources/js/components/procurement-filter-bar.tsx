import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Filter, RotateCcw, Search } from 'lucide-react';
import { type FormEvent, type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label: string };

function SearchSelect({
    value,
    options,
    allLabel,
    disabledLabel,
    disabled,
    searchLabel,
    onChange,
}: {
    value: string;
    options: Option[];
    allLabel: string;
    disabledLabel?: string;
    disabled?: boolean;
    searchLabel: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const deferredSearch = useDeferredValue(search);
    const selected = options.find((option) => option.value === value);
    const filtered = useMemo(() => {
        const query = deferredSearch.trim().toLowerCase();
        return options.filter((option) => `${option.value} ${option.label}`.toLowerCase().includes(query));
    }, [deferredSearch, options]);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const select = (nextValue: string) => {
        onChange(nextValue);
        setSearch('');
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                className="border-input focus:border-ring focus:ring-ring/50 flex h-9 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm shadow-xs outline-none focus:ring-[3px] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
                <span className="truncate">{disabled ? disabledLabel : selected ? `${selected.value} - ${selected.label}` : allLabel}</span>
                <ChevronDown className="size-4 shrink-0 text-slate-500" />
            </button>
            {open && !disabled && (
                <div className="absolute z-50 mt-1 w-full min-w-0 overflow-hidden rounded-lg border bg-white shadow-xl sm:min-w-72">
                    <div className="flex items-center gap-2 border-b px-3">
                        <Search className="size-4 text-slate-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={searchLabel}
                            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        <button
                            type="button"
                            onClick={() => select('all')}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                        >
                            {allLabel}
                            {value === 'all' && <Check className="text-brand-teal size-4" />}
                        </button>
                        {filtered.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => select(option.value)}
                                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-cyan-50"
                            >
                                <span className="min-w-0 truncate">
                                    <b className="font-mono">{option.value}</b> - {option.label}
                                </span>
                                {value === option.value && <Check className="text-brand-teal size-4 shrink-0" />}
                            </button>
                        ))}
                        {!filtered.length && <p className="px-3 py-6 text-center text-xs text-slate-500">No result found</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, children, dark = false }: { label: string; children: ReactNode; dark?: boolean }) {
    return (
        <div className="min-w-0 space-y-1">
            <span className={`block text-xs font-semibold ${dark ? 'text-white/90' : 'text-slate-700'}`}>{label}</span>
            {children}
        </div>
    );
}

export default function ProcurementFilterBar({
    companyCode,
    plantCode,
    materialCode,
    companies,
    plants,
    materials,
    onCompanyChange,
    onPlantChange,
    onMaterialChange,
    onApply,
    onReset,
    embedded = false,
    showReset = false,
}: {
    companyCode: string;
    plantCode: string;
    materialCode: string;
    companies: Array<{ company_code: string; company_name: string }>;
    plants: Array<{ company_code: string; company_name: string; parent_company_id?: string | null }>;
    materials: Array<{ matnr: string; maktx: string | null }>;
    onCompanyChange: (value: string) => void;
    onPlantChange: (value: string) => void;
    onMaterialChange: (value: string) => void;
    onApply: (event: FormEvent) => void;
    onReset: () => void;
    embedded?: boolean;
    showReset?: boolean;
}) {
    const availablePlants =
        companyCode === 'all' ? [] : plants.filter((plant) => !plant.parent_company_id || plant.parent_company_id === companyCode);
    return (
        <section
            className={
                embedded
                    ? 'rounded-lg border border-white/15 bg-white/8 p-2.5 shadow-inner shadow-black/5 backdrop-blur-sm'
                    : 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm'
            }
        >
            <form
                onSubmit={onApply}
                className={`grid gap-3 md:grid-cols-2 ${showReset ? 'xl:grid-cols-[1fr_1fr_1.5fr_auto_auto]' : 'xl:grid-cols-[1fr_1fr_1.5fr_auto]'} xl:items-end`}
            >
                <Field label="Company" dark={embedded}>
                    <SearchSelect
                        value={companyCode}
                        options={companies.map((item) => ({ value: item.company_code, label: item.company_name }))}
                        allLabel="All companies"
                        searchLabel="Search company code or name..."
                        onChange={onCompanyChange}
                    />
                </Field>
                <Field label="Plant" dark={embedded}>
                    <SearchSelect
                        value={plantCode}
                        options={availablePlants.map((item) => ({ value: item.company_code, label: item.company_name }))}
                        allLabel="All plants"
                        disabled={companyCode === 'all'}
                        disabledLabel="Select company first"
                        searchLabel="Search plant code or name..."
                        onChange={onPlantChange}
                    />
                </Field>
                <Field label="Material" dark={embedded}>
                    <SearchSelect
                        value={materialCode}
                        options={materials.map((item) => ({ value: item.matnr, label: item.maktx || 'No description' }))}
                        allLabel="All materials"
                        searchLabel="Search material code or description..."
                        onChange={onMaterialChange}
                    />
                </Field>
                <Button type="submit" className="bg-brand-teal hover:bg-brand-teal/90 gap-2">
                    <Filter className="size-4" /> Apply
                </Button>
                {showReset && (
                    <Button type="button" variant="outline" className="gap-2" onClick={onReset}>
                        <RotateCcw className="size-4" /> Reset
                    </Button>
                )}
            </form>
        </section>
    );
}
