type LineChartProps = {
    sales: number[];
    collections: number[];
};

const chartPoints = (series: number[], min: number, max: number) => series.map((value, index) => {
    const x = 42 + (index / (series.length - 1)) * 636;
    const y = 202 - ((value - min) / (max - min)) * 164;
    return { x, y, value };
});

const pointsAttribute = (points: Array<{ x: number; y: number }>) => points.map((point) => `${point.x},${point.y}`).join(' ');

export function LineTrendChart({ sales, collections }: LineChartProps) {
    const allValues = [...sales, ...collections];
    const min = Math.floor((Math.min(...allValues) - 5) / 10) * 10;
    const max = Math.ceil((Math.max(...allValues) + 5) / 10) * 10;
    const salesPoints = chartPoints(sales, min, max);
    const collectionPoints = chartPoints(collections, min, max);
    const salesArea = `42,202 ${pointsAttribute(salesPoints)} 678,202`;
    const yTicks = Array.from({ length: 5 }, (_, index) => max - ((max - min) / 4) * index);
    const dateLabels = ['01 Oct', '08 Oct', '15 Oct', '22 Oct', '30 Oct'];

    return (
        <div className="p-4 sm:p-5">
            <div className="h-64 w-full sm:h-72">
                <svg viewBox="0 0 720 240" preserveAspectRatio="none" className="h-full w-full overflow-visible" role="img" aria-label="Daily sales and collections trend chart">
                    <defs>
                        <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#219ebc" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#219ebc" stopOpacity="0.01" />
                        </linearGradient>
                        <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#219ebc" floodOpacity="0.18" />
                        </filter>
                    </defs>
                    {yTicks.map((tick, index) => {
                        const y = 38 + index * 41;
                        return <g key={tick}><line x1="42" x2="678" y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray={index === 4 ? '0' : '4 6'} /><text x="32" y={y + 3} textAnchor="end" className="fill-muted-foreground text-[8px]">{Math.round(tick)}</text></g>;
                    })}
                    <polygon points={salesArea} fill="url(#salesArea)" />
                    <polyline points={pointsAttribute(salesPoints)} fill="none" stroke="#219ebc" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#lineGlow)" />
                    <polyline points={pointsAttribute(collectionPoints)} fill="none" stroke="#fb8500" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    {[salesPoints.at(-1), collectionPoints.at(-1)].map((point, index) => point && <g key={index}><circle cx={point.x} cy={point.y} r="5" fill={index === 0 ? '#219ebc' : '#fb8500'} opacity="0.18" /><circle cx={point.x} cy={point.y} r="2.5" fill={index === 0 ? '#219ebc' : '#fb8500'} stroke="white" strokeWidth="1.5" /></g>)}
                    {dateLabels.map((label, index) => <text key={label} x={42 + index * 159} y="224" textAnchor={index === 0 ? 'start' : index === 4 ? 'end' : 'middle'} className="fill-muted-foreground text-[8px]">{label}</text>)}
                </svg>
            </div>
            <div className="text-muted-foreground mt-1 flex justify-center gap-6 text-[10px] font-semibold">
                <span className="flex items-center gap-2"><i className="bg-brand-teal size-2.5 rounded-full shadow-[0_0_0_3px_rgba(33,158,188,0.12)]" />Sales</span>
                <span className="flex items-center gap-2"><i className="bg-brand-berry size-2.5 rounded-full shadow-[0_0_0_3px_rgba(251,133,0,0.12)]" />Collections</span>
            </div>
        </div>
    );
}

const planRows = [
    { name: 'Apollo Pipes', actual: 92, plan: 97 },
    { name: 'Kisan Mouldings', actual: 28, plan: 32 },
    { name: 'Mauria', actual: 11, plan: 12 },
];

export function PlanComparisonChart() {
    return (
        <div className="p-4 sm:p-5">
            <div className="space-y-7 py-3">
                {planRows.map((row) => (
                    <div key={row.name} className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center sm:gap-4">
                        <div><p className="text-[11px] font-bold">{row.name}</p><p className="text-muted-foreground mt-0.5 text-[9px]">{row.actual}% achieved</p></div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3"><span className="text-muted-foreground w-9 text-[8px] font-bold uppercase">Actual</span><div className="bg-muted relative h-3 flex-1 overflow-hidden rounded-full"><div className="from-brand-teal to-brand-aqua h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-500" style={{ width: `${row.actual}%` }} /></div><span className="w-8 text-right text-[9px] font-bold">{row.actual}%</span></div>
                            <div className="flex items-center gap-3"><span className="text-muted-foreground w-9 text-[8px] font-bold uppercase">Plan</span><div className="bg-muted relative h-2.5 flex-1 overflow-hidden rounded-full"><div className="from-brand-gold to-brand-berry h-full rounded-full bg-gradient-to-r transition-all duration-500" style={{ width: `${row.plan}%` }} /></div><span className="w-8 text-right text-[9px] font-bold">{row.plan}%</span></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-border text-muted-foreground mt-5 flex justify-center gap-6 border-t pt-4 text-[10px] font-semibold">
                <span className="flex items-center gap-2"><i className="bg-brand-teal size-2.5 rounded-full" />Actual</span>
                <span className="flex items-center gap-2"><i className="bg-brand-gold size-2.5 rounded-full" />Plan</span>
            </div>
        </div>
    );
}
