import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export function DataTableSortHeader({
    label,
    column,
    activeColumn,
    direction,
    onSort,
    className = '',
}: {
    label: string;
    column: string;
    activeColumn: string;
    direction: 'asc' | 'desc';
    onSort: (column: string) => void;
    className?: string;
}) {
    const active = activeColumn === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
        <th className={className}>
            <button
                type="button"
                onClick={() => onSort(column)}
                className={`group inline-flex items-center gap-1.5 font-semibold tracking-wide hover:text-slate-900 ${active ? 'text-slate-800' : ''}`}
                aria-label={`Sort by ${label}`}
                aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
                <span>{label}</span>
                <Icon className={`size-3.5 ${active ? 'text-slate-700' : 'text-slate-300 group-hover:text-slate-500'}`} />
            </button>
        </th>
    );
}
