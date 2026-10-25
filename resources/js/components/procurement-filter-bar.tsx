import { Button } from '@/components/ui/button';
import { CalendarDays, Check, ChevronDown, Filter, RotateCcw, Search } from 'lucide-react';
import { type FormEvent, type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label: string };
const MATERIAL_TYPE_BY_COMPANY: Record<string, string> = {
    '1000': 'ZRAW',
    '5000': 'YRAW',
};

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
                className="border-input flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3.5 text-left text-sm font-medium text-slate-800 shadow-sm transition outline-none focus:border-cyan-500 focus:ring-[3px] focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none"
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

function MonthYearPicker({
    value,
    min,
    max,
    availableMonths,
    onChange,
}: {
    value: string;
    min?: string;
    max?: string;
    availableMonths?: string[];
    onChange: (value: string) => void;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const selectedYear = Number(value.slice(0, 4)) || new Date().getFullYear();
    const allMonthsSelected = value.endsWith('-all');
    const selectedMonth = Number(value.slice(5, 7)) || new Date().getMonth() + 1;
    const [year, setYear] = useState(selectedYear);
    const minYear = Number(min?.slice(0, 4)) || new Date().getFullYear();
    const maxYear = Number(max?.slice(0, 4)) || minYear + 20;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const availableSet = useMemo(() => new Set(availableMonths || []), [availableMonths]);
    const availableInYear = availableMonths?.filter((item) => item.startsWith(`${year}-`)).length ?? 0;
    const label = allMonthsSelected
        ? `All months ${selectedYear}`
        : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(selectedYear, selectedMonth - 1, 1));

    useEffect(() => setYear(selectedYear), [selectedYear]);
    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const chooseMonth = (month: number) => {
        const next = `${year}-${String(month).padStart(2, '0')}`;
        if ((!min || next >= min) && (!max || next <= max)) {
            onChange(next);
            setOpen(false);
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="border-input flex h-10 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition outline-none hover:border-cyan-300 focus:border-cyan-500 focus:ring-[3px] focus:ring-cyan-500/20"
            >
                <span className="truncate">{label}</span>
                <CalendarDays className="size-4 shrink-0 text-cyan-700" />
            </button>
            {open && (
                <div className="absolute right-0 z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl shadow-slate-900/15">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black tracking-wide text-cyan-700 uppercase">Planning period</p>
                            <p className="text-xs font-semibold text-slate-500">Choose month and year</p>
                        </div>
                        <select
                            value={year}
                            onChange={(event) => setYear(Number(event.target.value))}
                            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm font-bold outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        >
                            {years.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onChange(`${year}-all`);
                            setOpen(false);
                        }}
                        disabled={availableMonths !== undefined && availableInYear === 0}
                        className={`mb-2.5 h-9 w-full rounded-lg border text-xs font-bold transition ${allMonthsSelected && year === selectedYear ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm' : 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        All available months of {year} {availableMonths !== undefined && `(${availableInYear})`}
                    </button>
                    <div className="grid grid-cols-3 gap-1.5">
                        {months.map((month, index) => {
                            const monthNumber = index + 1;
                            const option = `${year}-${String(monthNumber).padStart(2, '0')}`;
                            const selected = !allMonthsSelected && year === selectedYear && monthNumber === selectedMonth;
                            const disabled = Boolean(
                                (min && option < min)
                                || (max && option > max)
                                || (availableMonths !== undefined && !availableSet.has(option))
                            );
                            return (
                                <button
                                    key={month}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => chooseMonth(monthNumber)}
                                    className={`h-9 rounded-lg text-xs font-bold transition ${selected ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800'} disabled:cursor-not-allowed disabled:opacity-30`}
                                >
                                    {month}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                            if (availableMonths !== undefined && !availableSet.has(current)) return;
                            onChange(current);
                            setYear(today.getFullYear());
                            setOpen(false);
                        }}
                        className="mt-3 h-9 w-full rounded-lg border border-cyan-200 bg-cyan-50 text-xs font-bold text-cyan-800 transition hover:bg-cyan-100"
                    >
                        Current month
                    </button>
                </div>
            )}
        </div>
    );
}

function Field({ label, children, dark = false, className = '' }: { label: string; children: ReactNode; dark?: boolean; className?: string }) {
    return (
        <div className={`min-w-0 space-y-1 ${className}`}>
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
    period,
    onPeriodChange,
    minPeriod,
    maxPeriod,
    availableMonths,
    embedded = false,
    showReset = false,
}: {
    companyCode: string;
    plantCode: string;
    materialCode: string;
    companies: Array<{ company_code: string; company_name: string }>;
    plants: Array<{ company_code: string; company_name: string; parent_company_id?: string | null }>;
    materials: Array<{ matnr: string; maktx: string | null; mtart?: string | null }>;
    onCompanyChange: (value: string) => void;
    onPlantChange: (value: string) => void;
    onMaterialChange: (value: string) => void;
    onApply: (event: FormEvent) => void;
    onReset: () => void;
    period?: string;
    onPeriodChange?: (value: string) => void;
    minPeriod?: string;
    maxPeriod?: string;
    availableMonths?: string[];
    embedded?: boolean;
    showReset?: boolean;
}) {
    const availablePlants = companyCode === 'all' ? [] : plants.filter((plant) => plant.parent_company_id === companyCode);
    const selectedMaterialType = MATERIAL_TYPE_BY_COMPANY[companyCode];
    const availableMaterials = useMemo(
        () => (selectedMaterialType ? materials.filter((material) => material.mtart?.trim().toUpperCase() === selectedMaterialType) : []),
        [materials, selectedMaterialType],
    );

    useEffect(() => {
        if (materialCode !== 'all' && !availableMaterials.some((material) => material.matnr === materialCode)) {
            onMaterialChange('all');
        }
    }, [availableMaterials, materialCode, onMaterialChange]);

    return (
        <section
            className={
                embedded
                    ? 'rounded-xl border border-white/15 bg-white/10 p-3 shadow-inner shadow-black/5 backdrop-blur-sm'
                    : 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm'
            }
        >
            <form
                onSubmit={onApply}
                className={`grid gap-3 md:grid-cols-2 ${period && showReset ? 'xl:grid-cols-12' : showReset ? 'xl:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_minmax(260px,1.45fr)_auto_auto]' : 'xl:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_minmax(260px,1.45fr)_auto]'} xl:items-end`}
            >
                <Field label="Company" dark={embedded} className={period && showReset ? 'xl:col-span-2' : ''}>
                    <SearchSelect
                        value={companyCode}
                        options={companies.map((item) => ({ value: item.company_code, label: item.company_name }))}
                        allLabel="All companies"
                        searchLabel="Search company code or name..."
                        onChange={(value) => {
                            onCompanyChange(value);
                            onPlantChange('all');
                            onMaterialChange('all');
                        }}
                    />
                </Field>
                <Field label="Plant" dark={embedded} className={period && showReset ? 'xl:col-span-2' : ''}>
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
                <Field label="Material" dark={embedded} className={period && showReset ? 'xl:col-span-4' : ''}>
                    <SearchSelect
                        value={materialCode}
                        options={availableMaterials.map((item) => ({
                            value: item.matnr,
                            label: `${item.maktx || 'No description'} · ${item.mtart?.trim().toUpperCase()}`,
                        }))}
                        allLabel={selectedMaterialType ? `All ${selectedMaterialType} materials` : 'All materials'}
                        disabled={companyCode === 'all' || !selectedMaterialType}
                        disabledLabel={companyCode === 'all' ? 'Select company first' : 'No material rule for this company'}
                        searchLabel="Search material code or description..."
                        onChange={onMaterialChange}
                    />
                </Field>
                {period && onPeriodChange && (
                    <Field label="Month & Year" dark={embedded} className="xl:col-span-2">
                        <MonthYearPicker
                            value={period}
                            min={minPeriod}
                            max={maxPeriod}
                            availableMonths={availableMonths}
                            onChange={onPeriodChange}
                        />
                    </Field>
                )}
                <Button type="submit" className={`h-10 w-full gap-1.5 rounded-lg bg-cyan-500 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-400 hover:shadow-md ${period && showReset ? 'xl:col-span-1' : ''}`}>
                    <Filter className="size-4" /> Apply
                </Button>
                {showReset && (
                    <Button type="button" variant="outline" className={`h-10 w-full gap-1.5 rounded-lg border-white/30 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md ${period ? 'xl:col-span-1' : ''}`} onClick={onReset}>
                        <RotateCcw className="size-4" /> Reset
                    </Button>
                )}
            </form>
        </section>
    );
}
