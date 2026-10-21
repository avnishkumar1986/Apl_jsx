import ProcurementPageHeader from '@/components/procurement-page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Boxes,
    Calculator,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Eye,
    EyeOff,
    FileDown,
    FileSpreadsheet,
    FileText,
    Maximize2,
    Minimize2,
    Pencil,
    Search,
    X,
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

type Company = { id: number; company_code: string; company_name: string };
type Plant = Company & { record_type: number };
type Material = { matnr: string; maktx: string; mtart: string | null; matkl: string | null; meins: string | null };
type Metric =
    | 'opening_stock'
    | 'cover_days'
    | 'to_buy'
    | 'supplier_receipts'
    | 'buying_imports'
    | 'total_buying'
    | 'total_availability'
    | 'average_consumption'
    | 'days'
    | 'consumption'
    | 'gross_shortage'
    | 'closing_stock'
    | 'remaining_shortage';
type PlantColumn = Plant &
    Record<Metric, number | null> & {
        column_key: string;
        month: string;
        consumption_id: number | null;
        remarks: Partial<Record<Metric, string>>;
        purchase_orders: { po_number: string; vendor_name: string; quantity_mt: number; eta: string; source: string; status: string }[];
    };
type Filters = { company_code: string; plant_code: string | null; material: string; month: string; months: number };
type PdfHookData = {
    column: { index: number };
    row: { index: number };
    section: 'head' | 'body' | 'foot';
    cell: {
        styles: {
            fillColor?: number[];
            fontSize?: number;
            fontStyle?: string;
            cellPadding?: number;
            halign?: string;
            valign?: string;
            textColor?: number[];
            lineColor?: number[];
            lineWidth?: number;
        };
    };
};

const rows: { key: Metric; label: string; unit: string; highlight?: boolean; labelHighlight?: boolean }[] = [
    { key: 'opening_stock', label: 'O/s', unit: 'mtn' },
    { key: 'cover_days', label: 'Cover for No. of Days', unit: 'days' },
    { key: 'to_buy', label: 'To Buy', unit: 'mtn' },
    { key: 'buying_imports', label: 'Buying / Imports', unit: 'mtn' },
    { key: 'total_buying', label: 'Total Buying', unit: 'mtn' },
    { key: 'total_availability', label: 'Total Availability', unit: 'mtn' },
    { key: 'average_consumption', label: 'Expected Average Consp/day', unit: 'mtn/day' },
    { key: 'days', label: 'Days', unit: 'days', highlight: true },
    { key: 'consumption', label: 'Total Expected Consp (MT)', unit: 'mtn' },
    { key: 'gross_shortage', label: 'Gross Shortage Before POs (MT)', unit: 'mtn' },
    { key: 'closing_stock', label: 'Closing Stock', unit: 'mtn', labelHighlight: true },
    { key: 'remaining_shortage', label: 'Remaining Shortage (MT)', unit: 'mtn' },
];
const metricFormulas: Record<Metric, { formula: string; note: string }> = {
    opening_stock: { formula: 'Previous month Closing Stock', note: 'For the first month, opening stock comes from the current SAP material stock.' },
    cover_days: { formula: 'Opening Stock ÷ Expected Average Consumption per Day', note: 'Shown only when daily consumption is greater than zero.' },
    to_buy: { formula: 'Planned Buying + Active Local/Portal PO Quantity', note: 'Cancelled local POs are excluded.' },
    supplier_receipts: { formula: 'Active SAP PO Quantity', note: 'Used internally for purchase receipt planning.' },
    buying_imports: { formula: 'Sum of Active SAP PO Quantities', note: 'Local/portal POs are not included here.' },
    total_buying: { formula: 'To Buy + Buying / Imports', note: 'Local and SAP POs are each counted exactly once.' },
    total_availability: { formula: 'Opening Stock + Total Buying', note: 'Total stock expected to be available during the period.' },
    average_consumption: { formula: 'Planned Daily Consumption', note: 'Taken from the active consumption plan for the plant and material.' },
    days: {
        formula: 'Number of Planning Days in the Period',
        note: 'Uses the configured day count for the starting month and calendar days afterward.',
    },
    consumption: { formula: 'Expected Average Consumption per Day × Days', note: 'Total expected material consumption for the period.' },
    gross_shortage: {
        formula: 'MAX(0, Expected Consumption − Opening Stock − Planned Buying)',
        note: 'Shortage before applying local and SAP purchase orders.',
    },
    closing_stock: { formula: 'Total Availability − Total Expected Consumption', note: 'This value becomes the next month’s opening stock.' },
    remaining_shortage: {
        formula: 'MAX(0, Gross Shortage − Local PO Total − SAP PO Total)',
        note: 'Each active PO is deducted once; cancelled POs are excluded.',
    },
};
const purchaseTotalBySource = (plant: PlantColumn, source: 'sap' | 'local') =>
    purchaseOrdersBySource(plant, source).reduce((total, purchase) => total + Number(purchase.quantity_mt), 0);
const purchaseOrdersBySource = (plant: PlantColumn, source: 'sap' | 'local') =>
    plant.purchase_orders.filter(
        (purchase) => purchase.status !== 'cancelled' && (source === 'local' ? purchase.source === 'local' : purchase.source !== 'local'),
    );

export default function BalanceOverview({
    companies,
    plants,
    materials,
    columns,
    selectedMaterial,
    filters,
    canManage,
}: {
    companies: Company[];
    plants: Plant[];
    materials: Material[];
    columns: PlantColumn[];
    selectedMaterial: Material | null;
    filters: Filters;
    canManage: boolean;
}) {
    const companyCode = filters.company_code || '';
    const [material, setMaterial] = useState(filters.material);
    const [materialSearch, setMaterialSearch] = useState('');
    const [showRemarks, setShowRemarks] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const expandedReceipts = useMemo(() => new Set<string>(), []);
    const [viewingOrders, setViewingOrders] = useState<{ plant: PlantColumn; source: 'sap' | 'local' } | null>(null);
    const [foldedPlants, setFoldedPlants] = useState<Set<number>>(() => new Set());
    const [editing, setEditing] = useState<{ plant: PlantColumn; metric: Metric } | null>(null);
    const [formulaMetric, setFormulaMetric] = useState<Metric | null>(null);
    const [remark, setRemark] = useState('');
    const [mobilePlantIndex, setMobilePlantIndex] = useState(0);
    const mobilePlantSlider = useRef<HTMLDivElement>(null);
    const desktopGrid = useRef<HTMLDivElement>(null);
    const materialTabs = useMemo(() => {
        const selected = materials.find((item) => item.matnr === filters.material);
        const query = materialSearch.trim().toLowerCase();
        const matching = query ? materials.filter((item) => `${item.matnr} ${item.maktx}`.toLowerCase().includes(query)) : materials;

        if (!query && selected) {
            return [selected, ...matching.filter((item) => item.matnr !== selected.matnr)];
        }

        return matching;
    }, [materials, filters.material, materialSearch]);
    const plantOptions = useMemo(
        () => [...new Map(columns.map((column) => [column.id, { id: column.id, name: column.name.split(' · ')[0] }])).values()],
        [columns],
    );
    const visibleColumns = useMemo(() => columns.filter((column) => !foldedPlants.has(column.id)), [columns, foldedPlants]);
    const showMobilePlant = (index: number) => {
        const nextIndex = Math.max(0, Math.min(index, visibleColumns.length - 1));
        mobilePlantSlider.current?.scrollTo({ left: nextIndex * mobilePlantSlider.current.clientWidth, behavior: 'smooth' });
        setMobilePlantIndex(nextIndex);
    };
    const syncMobilePlant = () => {
        const slider = mobilePlantSlider.current;
        if (!slider?.clientWidth) return;
        setMobilePlantIndex(Math.max(0, Math.min(Math.round(slider.scrollLeft / slider.clientWidth), visibleColumns.length - 1)));
    };
    useEffect(() => {
        setFoldedPlants(new Set());
        if (desktopGrid.current) {
            desktopGrid.current.scrollTop = 0;
            desktopGrid.current.scrollLeft = 0;
        }
    }, [filters.material]);
    useEffect(() => {
        setMobilePlantIndex((current) => Math.max(0, Math.min(current, visibleColumns.length - 1)));
    }, [visibleColumns.length]);
    const togglePlantFold = (plantId: number) =>
        setFoldedPlants((current) => {
            const next = new Set(current);
            next.has(plantId) ? next.delete(plantId) : next.add(plantId);
            return next;
        });
    const toggleExpanded = () => setExpanded((current) => !current);
    useEffect(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (navigation?.type === 'reload' && window.location.search) {
            router.get('/admin/procurement/balance-overview', {}, { preserveState: false, replace: true });
        }
    }, []);
    const columnTints = [
        { header: 'bg-cyan-100/70', body: 'bg-cyan-50/45' },
        { header: 'bg-blue-100/70', body: 'bg-blue-50/45' },
        { header: 'bg-amber-100/70', body: 'bg-amber-50/45' },
        { header: 'bg-emerald-100/70', body: 'bg-emerald-50/45' },
    ];
    const monthLabel = useMemo(() => {
        const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
        const firstMonth = columns[0]?.month || filters.month;
        const lastMonth = columns.at(-1)?.month || firstMonth;
        const firstLabel = formatter.format(new Date(`${firstMonth}-01T00:00:00`));
        const lastLabel = formatter.format(new Date(`${lastMonth}-01T00:00:00`));

        return firstMonth === lastMonth ? firstLabel : `${firstLabel} – ${lastLabel}`;
    }, [columns, filters.month]);

    const openRemark = (plant: PlantColumn, metric: Metric) => {
        setEditing({ plant, metric });
        setRemark(plant.remarks[metric] || '');
    };
    const saveRemark = () => {
        if (!editing) return;
        router.put(
            '/admin/procurement/balance-sheet/remarks',
            { material: filters.material, plant_id: editing.plant.id, month: editing.plant.month, metric: editing.metric, remark },
            { preserveScroll: true, onSuccess: () => setEditing(null) },
        );
    };
    const toggleReceipts = (columnKey: string, source: 'sap' | 'local' = 'sap') => {
        const plant = columns.find((item) => item.column_key === columnKey);
        setViewingOrders(plant ? { plant, source } : null);
    };
    const formatExportValue = (plant: PlantColumn, row: (typeof rows)[number]) => {
        const total = formatValue(plant[row.key], row.unit);
        if (row.key !== 'buying_imports' || !plant.purchase_orders?.length) return total;

        const purchaseLines = purchaseOrdersBySource(plant, 'sap').map((purchase) =>
            [
                purchase.vendor_name.toUpperCase(),
                `${purchase.source.toUpperCase()} PO ${purchase.po_number}  •  ${Number(purchase.quantity_mt).toFixed(3)} MT`,
                `ETA ${formatDateForDisplay(purchase.eta)}  •  ${purchase.status.replaceAll('_', ' ').toUpperCase()}`,
            ].join('\n'),
        );

        return [total, ...purchaseLines].join('\n\n');
    };
    const exportExcel = async () => {
        const ExcelJS = await import('exceljs');
        const columnCount = 1 + columns.length * (showRemarks ? 2 : 1);
        const company = companies.find((item) => item.company_code === filters.company_code);
        const sheetRows: (string | number)[][] = [
            [`PROCUREMENT BALANCE SHEET · ${selectedMaterial?.maktx || filters.material}`],
            [`Company: ${company ? `${company.company_code} - ${company.company_name}` : filters.company_code}`],
            [`Material: ${filters.material}`, `Planning horizon: ${monthLabel}`],
            [],
            ['Metric', ...columns.flatMap((plant) => (showRemarks ? [plant.name, ''] : [plant.name]))],
            ['Material / Unit', ...columns.flatMap(() => (showRemarks ? ['Value', 'Remarks'] : ['Value']))],
            ...rows.map((row) => [
                row.label,
                ...columns.flatMap((plant) =>
                    showRemarks ? [formatExportValue(plant, row), plant.remarks[row.key] || ''] : [formatExportValue(plant, row)],
                ),
            ]),
        ];
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Balance Sheet', {
            views: [{ state: 'frozen', xSplit: 1, ySplit: 6 }],
            pageSetup: {
                paperSize: 9,
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                verticalCentered: false,
                margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
            },
        });
        worksheet.addRows(sheetRows);
        worksheet.mergeCells(1, 1, 1, columnCount);
        if (showRemarks) columns.forEach((_, index) => worksheet.mergeCells(5, 2 + index * 2, 5, 3 + index * 2));
        worksheet.columns = Array.from({ length: columnCount }, (_, index) => {
            if (index === 0) return { width: 38 };
            const balanceColumn = columns.flatMap(() => (showRemarks ? [{ width: 14 }, { width: 34 }] : [{ width: 18 }]))[index - 1];
            return balanceColumn || { width: index === 1 ? 38 : 22 };
        });
        worksheet.getRow(1).height = 26;
        worksheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF023249' } };
        worksheet.getRow(5).font = { bold: true, color: { argb: 'FF023249' } };
        worksheet.getRow(6).font = { bold: true, color: { argb: 'FF023249' } };
        worksheet.getRow(5).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(6).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        worksheet.getRow(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        worksheet.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        worksheet.getCell('A5').font = { bold: true, size: 15, color: { argb: 'FF023249' } };
        worksheet.getCell('A6').font = { bold: true, size: 15, color: { argb: 'FF023249' } };
        const exportHeaderTints = ['FFCFFAFE', 'FFDBEAFE', 'FFFEF3C7', 'FFD1FAE5'];
        columns.forEach((_, plantIndex) => {
            const valueColumn = 2 + plantIndex * (showRemarks ? 2 : 1);
            const tint = exportHeaderTints[plantIndex % exportHeaderTints.length];
            worksheet.getCell(5, valueColumn).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint } };
            worksheet.getCell(6, valueColumn).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint } };
            if (showRemarks) {
                worksheet.getCell(5, valueColumn + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint } };
                worksheet.getCell(6, valueColumn + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tint } };
            }
        });
        rows.forEach((row, index) => {
            const excelRow = worksheet.getRow(7 + index);
            const exportTints = ['FFEFFBFF', 'FFEFF6FF', 'FFFFFBEB', 'FFECFDF5'];
            excelRow.getCell(1).font = { bold: true, color: { argb: row.labelHighlight ? 'FFFFFFFF' : 'FF023249' } };
            if (row.labelHighlight) {
                excelRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8500' } };
            }
            columns.forEach((plant, plantIndex) => {
                const valueColumn = 2 + plantIndex * (showRemarks ? 2 : 1);
                if (row.highlight) {
                    excelRow.getCell(valueColumn).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE7F3' } };
                } else {
                    excelRow.getCell(valueColumn).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: exportTints[plantIndex % exportTints.length] },
                    };
                }
                if (Number(plant[row.key]) < 0) {
                    excelRow.getCell(valueColumn).font = { bold: true, color: { argb: 'FFDC2626' } };
                }
                if (row.key === 'buying_imports') {
                    excelRow.getCell(valueColumn).font = { size: 9, color: { argb: 'FF023249' } };
                    excelRow.getCell(valueColumn).alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
                }
                if (showRemarks) {
                    excelRow.getCell(valueColumn + 1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: exportTints[plantIndex % exportTints.length] },
                    };
                    excelRow.getCell(valueColumn + 1).font = { color: { argb: 'FFFF8500' } };
                }
            });
            if (row.key === 'buying_imports') {
                excelRow.height = Math.max(32, 18 + Math.max(...columns.map((plant) => plant.purchase_orders?.length || 0)) * 26);
            }
        });
        for (let rowNumber = 5; rowNumber <= 6 + rows.length; rowNumber += 1) {
            worksheet.getRow(rowNumber).eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                };
                cell.alignment = { ...cell.alignment, vertical: 'middle', wrapText: true };
            });
        }
        worksheet.pageSetup.printArea = `A1:${worksheet.getColumn(columnCount).letter}${sheetRows.length}`;
        worksheet.pageSetup.printTitlesRow = '1:6';
        worksheet.headerFooter.oddFooter = '&LProcurement Balance Sheet&CPage &P of &N&R&D';
        worksheet.headerFooter.evenFooter = '&LProcurement Balance Sheet&CPage &P of &N&R&D';
        const buffer = await workbook.xlsx.writeBuffer();
        const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `procurement-balance-${filters.material}-${filters.month}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportPdf = async (includeRemarks = showRemarks) => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const company = companies.find((item) => item.company_code === filters.company_code);
        const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        document.setFontSize(16);
        document.setTextColor(2, 50, 73);
        document.text('PROCUREMENT BALANCE SHEET', 14, 15);
        document.setFontSize(9);
        document.setTextColor(71, 85, 105);
        document.text(`Company: ${company ? `${company.company_code} - ${company.company_name}` : filters.company_code}`, 14, 21);
        document.text(`Material: ${filters.material} · ${selectedMaterial?.maktx || ''}`, 14, 26);
        document.text(`Planning horizon: ${monthLabel}`, 14, 31);

        autoTable(document, {
            startY: 36,
            theme: 'grid',
            head: [
                [
                    { content: 'Metric', rowSpan: 2 },
                    ...columns.map((plant) => ({ content: plant.name.toUpperCase(), colSpan: includeRemarks ? 2 : 1 })),
                ],
                columns.flatMap(() => (includeRemarks ? ['Value', 'Remarks'] : ['Value'])),
            ],
            body: rows.map((row) => [
                row.label,
                ...columns.flatMap((plant) =>
                    includeRemarks ? [formatExportValue(plant, row), plant.remarks[row.key] || ''] : [formatExportValue(plant, row)],
                ),
            ]),
            styles: { fontSize: 6, cellPadding: 1.5, overflow: 'linebreak', valign: 'middle' },
            headStyles: { fillColor: [248, 250, 252], textColor: [2, 50, 73], fontStyle: 'bold' },
            columnStyles: Object.fromEntries([
                [0, { cellWidth: 38, fontStyle: 'bold' }],
                ...columns.flatMap((_, index) =>
                    includeRemarks
                        ? [
                              [1 + index * 2, { cellWidth: 20 }],
                              [2 + index * 2, { cellWidth: 34 }],
                          ]
                        : [[1 + index, { cellWidth: 24 }]],
                ),
            ]),
            didParseCell: (data: PdfHookData) => {
                const columnIndex = data.column.index as number;
                if (data.section === 'head') {
                    const pdfHeaderTints = [
                        [207, 250, 254],
                        [219, 234, 254],
                        [254, 243, 199],
                        [209, 250, 229],
                    ];
                    if (columnIndex === 0) {
                        data.cell.styles.fillColor = [255, 251, 235];
                    } else {
                        const headerPlantIndex = Math.floor((columnIndex - 1) / (includeRemarks ? 2 : 1));
                        data.cell.styles.fillColor = pdfHeaderTints[headerPlantIndex % pdfHeaderTints.length];
                    }
                    if (columnIndex === 0) {
                        data.cell.styles.fontSize = 8;
                        data.cell.styles.fontStyle = 'bold';
                    }
                    return;
                }
                if (data.section !== 'body') return;
                const row = rows[data.row.index];
                const isValueColumn = columnIndex > 0 && (!includeRemarks || (columnIndex - 1) % 2 === 0);
                const isRemarksColumn = includeRemarks && columnIndex > 0 && (columnIndex - 1) % 2 === 1;
                const pdfTints = [
                    [239, 251, 255],
                    [239, 246, 255],
                    [255, 251, 235],
                    [236, 253, 245],
                ];
                if (columnIndex > 0) {
                    const tintIndex = Math.floor((columnIndex - 1) / (includeRemarks ? 2 : 1));
                    data.cell.styles.fillColor = pdfTints[tintIndex % pdfTints.length];
                }
                if (row?.highlight && isValueColumn) data.cell.styles.fillColor = [252, 231, 243];
                if (row?.key === 'buying_imports' && isValueColumn) {
                    data.cell.styles.fontSize = 5.5;
                    data.cell.styles.cellPadding = 2;
                    data.cell.styles.halign = 'left';
                    data.cell.styles.valign = 'top';
                    data.cell.styles.textColor = [2, 50, 73];
                    data.cell.styles.lineColor = [203, 213, 225];
                    data.cell.styles.lineWidth = 0.25;
                }
                if (row && isValueColumn) {
                    const plantIndex = Math.floor((columnIndex - 1) / (includeRemarks ? 2 : 1));
                    if (Number(columns[plantIndex]?.[row.key]) < 0) {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
                if (row?.labelHighlight && columnIndex === 0) {
                    data.cell.styles.fillColor = [255, 133, 0];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (isRemarksColumn) data.cell.styles.textColor = [255, 133, 0];
            },
            horizontalPageBreak: true,
            horizontalPageBreakRepeat: 0,
            margin: { left: 14, right: 14 },
        });

        const totalPages = document.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
            document.setPage(pageNumber);
            document.setDrawColor(203, 213, 225);
            document.line(14, 201, 283, 201);
            document.setFontSize(7);
            document.setTextColor(100, 116, 139);
            document.text('Procurement Balance Sheet', 14, 205);
            document.text(`Page ${pageNumber} of ${totalPages}`, 283, 205, { align: 'right' });
        }
        document.save(`procurement-balance-${filters.material}-${filters.month}.pdf`);
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Procurement', href: '/admin/procurement' },
                { title: 'Balance Sheet View', href: '/admin/procurement/balance-overview' },
            ]}
        >
            <Head title="Procurement Balance Sheet View" />
            <div className="procurement-compact mx-auto flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col gap-3 p-[clamp(10px,1.5vw,20px)]">
                <div className="relative z-30 shrink-0 overflow-hidden rounded-2xl border-t-4 border-orange-500 bg-gradient-to-r from-[#07374b] via-[#075b70] to-[#0b8da3] p-3 shadow-lg shadow-slate-900/10">
                    <ProcurementPageHeader
                        title="Procurement Balance Sheet"
                        subtitle="Plant-wise demand, availability, purchasing, and closing stock planning"
                        icon={FileText}
                        embedded
                    />
                </div>

                <section
                    className={`min-w-0 overflow-hidden border bg-white shadow-sm ${
                        expanded ? 'fixed inset-0 z-50 flex h-dvh rounded-none' : 'relative z-10 flex min-h-0 flex-1 flex-col rounded-xl md:flex-row'
                    }`}
                >
                    <aside
                        className={`flex shrink-0 flex-col bg-gradient-to-b from-slate-50 to-cyan-50/50 ${
                            expanded
                                ? 'w-56 border-r sm:w-64'
                                : 'max-h-[22rem] w-full border-b md:w-72 md:border-r md:border-b-0 lg:h-[calc(100dvh-14rem)] lg:max-h-[calc(100dvh-14rem)]'
                        }`}
                    >
                        <div className="border-b px-4 py-4">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.14em] text-cyan-800 uppercase">Material balance sheets</p>
                                <p className="mt-0.5 text-[10px] text-slate-500">Select a material</p>
                            </div>
                            <div className="relative mt-2.5">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={materialSearch}
                                    onChange={(event) => setMaterialSearch(event.target.value)}
                                    placeholder="Search code or name..."
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-[11px] text-slate-800 transition outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />
                            </div>
                        </div>
                        <nav
                            aria-label="Material balance sheets"
                            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 [scrollbar-width:thin]"
                        >
                            {materialTabs.map((item) => {
                                const active = item.matnr === filters.material;

                                return (
                                    <button
                                        key={item.matnr}
                                        type="button"
                                        title={`${item.matnr} · ${item.maktx}`}
                                        onClick={() => {
                                            setMaterial(item.matnr);
                                            setFoldedPlants(new Set());
                                            router.get(
                                                '/admin/procurement/balance-overview',
                                                {
                                                    company_code: companyCode || undefined,
                                                    material: item.matnr,
                                                    month: filters.month,
                                                    months: filters.months,
                                                },
                                                { preserveState: true, preserveScroll: true, replace: true },
                                            );
                                        }}
                                        className={`group flex min-h-12 w-full shrink-0 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all [contain-intrinsic-size:48px] [content-visibility:auto] ${
                                            active
                                                ? 'border-cyan-700 bg-gradient-to-r from-cyan-700 to-cyan-600 text-white shadow-md shadow-cyan-900/15'
                                                : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-px hover:border-cyan-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <span
                                            className={`grid size-7 shrink-0 place-items-center rounded-md ${active ? 'bg-white/15' : 'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100'}`}
                                        >
                                            <Boxes className="size-3.5" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-[11px] font-bold">{item.maktx}</span>
                                            <span className={`block truncate text-[9px] font-medium ${active ? 'text-white/70' : 'text-slate-400'}`}>
                                                {item.matnr}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                            {materialTabs.length === 0 && (
                                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-[11px] text-slate-400">
                                    No matching material found
                                </div>
                            )}
                        </nav>
                    </aside>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50/40">
                        <div className="relative z-30 flex flex-col items-start border-b bg-slate-50 px-4 py-3 sm:px-5">
                            <details className="group w-full">
                                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
                                    <Eye className="size-4" />
                                    Plant columns
                                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold text-cyan-700">
                                        {plantOptions.filter((plant) => !foldedPlants.has(plant.id)).length}/{plantOptions.length}
                                    </span>
                                    <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="mt-2 w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
                                    <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2">
                                        <div>
                                            <p className="text-[10px] font-black tracking-wide text-slate-700 uppercase">Visible plants</p>
                                            <p className="text-[9px] text-slate-400">Select columns to display</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFoldedPlants(new Set())}
                                            className="text-[9px] font-bold text-cyan-700 hover:underline"
                                        >
                                            Show all
                                        </button>
                                    </div>
                                    <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto p-2 [scrollbar-width:thin] sm:grid-cols-2">
                                        {plantOptions.map((plant) => {
                                            const visible = !foldedPlants.has(plant.id);

                                            return (
                                                <button
                                                    key={plant.id}
                                                    type="button"
                                                    onClick={() => togglePlantFold(plant.id)}
                                                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold transition ${
                                                        visible ? 'bg-cyan-50 text-cyan-800' : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {visible ? <Eye className="size-3.5 shrink-0" /> : <EyeOff className="size-3.5 shrink-0" />}
                                                    <span className="min-w-0 flex-1 truncate" title={plant.name}>
                                                        {plant.name}
                                                    </span>
                                                    <span className={`size-2 rounded-full ${visible ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </details>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-3">
                            <div className="flex gap-2">
                                <Button size="icon" variant="outline" title="Export Excel" onClick={exportExcel}>
                                    <FileSpreadsheet className="size-4" />
                                </Button>
                                <Button size="icon" variant="outline" title="Export PDF" onClick={() => exportPdf(showRemarks)}>
                                    <FileDown className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    title={showRemarks ? 'Hide remarks' : 'Show remarks'}
                                    onClick={() => setShowRemarks((visible) => !visible)}
                                    className="gap-2"
                                >
                                    {showRemarks ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    <span className="hidden sm:inline">{showRemarks ? 'Hide remarks' : 'Show remarks'}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    title={expanded ? 'Collapse balance sheet' : 'Expand balance sheet'}
                                    onClick={toggleExpanded}
                                    className="gap-2"
                                >
                                    {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                                    <span className="hidden sm:inline">{expanded ? 'Collapse' : 'Expand'}</span>
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <b className="text-xs">{monthLabel}</b>
                            </div>
                        </div>
                        {columns.length === 0 ? (
                            <div className="p-12 text-center text-sm text-slate-500">No active plants were found for the selected company.</div>
                        ) : (
                            <>
                                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-50/70 lg:hidden">
                                    {visibleColumns.length ? (
                                        <>
                                            <div
                                                ref={mobilePlantSlider}
                                                onScroll={syncMobilePlant}
                                                className="flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                                aria-label="Plant balance sheets"
                                            >
                                                {visibleColumns.map((plant, plantIndex) => (
                                                    <article key={plant.column_key} className="w-full min-w-full snap-center p-3 sm:p-4">
                                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                                            <header
                                                                className={`${columnTints[plantIndex % columnTints.length].header} border-b px-4 py-3.5`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <p className="text-[9px] font-black tracking-[.16em] text-cyan-800 uppercase">
                                                                            Procurement balance sheet
                                                                        </p>
                                                                        <h3
                                                                            className="mt-1 truncate text-sm font-black text-slate-900"
                                                                            title={plant.name}
                                                                        >
                                                                            {plant.name}
                                                                        </h3>
                                                                        <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                                                            {selectedMaterial?.maktx || filters.material} ·{' '}
                                                                            {selectedMaterial?.meins || 'UNIT'}
                                                                        </p>
                                                                    </div>
                                                                    <span className="shrink-0 rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                                                                        {plantIndex + 1}/{visibleColumns.length}
                                                                    </span>
                                                                </div>
                                                            </header>
                                                            <div className="divide-y divide-slate-100">
                                                                {rows.map((row) => (
                                                                    <div
                                                                        key={`${plant.column_key}-mobile-${row.key}`}
                                                                        role={canManage ? 'button' : undefined}
                                                                        tabIndex={canManage ? 0 : undefined}
                                                                        title={canManage ? 'Tap to add or edit remark' : undefined}
                                                                        onClick={() => canManage && openRemark(plant, row.key)}
                                                                        onKeyDown={(event) => {
                                                                            if (canManage && (event.key === 'Enter' || event.key === ' ')) {
                                                                                event.preventDefault();
                                                                                openRemark(plant, row.key);
                                                                            }
                                                                        }}
                                                                        className={`group grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 transition-colors ${canManage ? 'cursor-pointer hover:bg-cyan-50/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-500' : ''} ${row.highlight ? 'bg-fuchsia-50' : row.labelHighlight ? 'bg-orange-50' : ''}`}
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-3">
                                                                            <span
                                                                                className={`min-w-0 text-[11px] leading-4 font-semibold ${row.labelHighlight ? 'text-orange-700' : 'text-slate-600'}`}
                                                                            >
                                                                                {row.label}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    setFormulaMetric(row.key);
                                                                                }}
                                                                                className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-[10px] font-black text-cyan-700 transition hover:bg-cyan-100 focus-visible:outline-2 focus-visible:outline-cyan-500"
                                                                                title="View calculation formula"
                                                                                aria-label={`View formula for ${row.label}`}
                                                                            >
                                                                                ƒx
                                                                            </button>
                                                                            {canManage && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        openRemark(plant, row.key);
                                                                                    }}
                                                                                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-2 focus-visible:outline-cyan-500"
                                                                                    title="Add note"
                                                                                    aria-label={`Add note for ${row.label}`}
                                                                                >
                                                                                    <Pencil className="size-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={`text-right text-xs font-black tabular-nums ${Number(plant[row.key]) < 0 ? 'text-red-600' : 'text-slate-900'}`}
                                                                        >
                                                                            {row.key === 'to_buy' && plant.consumption_id ? (
                                                                                <div className="flex flex-col items-end gap-1.5">
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <span>{formatValue(plant.to_buy, row.unit)}</span>
                                                                                        {purchaseOrdersBySource(plant, 'local').length > 0 && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(event) => {
                                                                                                    event.stopPropagation();
                                                                                                    toggleReceipts(plant.column_key, 'local');
                                                                                                }}
                                                                                                className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-white px-2 py-1 text-[9px] font-bold text-orange-700"
                                                                                            >
                                                                                                More ({purchaseOrdersBySource(plant, 'local').length}){' '}
                                                                                                <ChevronDown className="size-3" />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                    {purchaseOrdersBySource(plant, 'local').length > 0 && (
                                                                                        <span className="text-[8px] font-bold text-orange-700">
                                                                                            LOCAL PORTAL POs
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ) : plant.consumption_id ? (
                                                                                <Link
                                                                                    onClick={(event) => event.stopPropagation()}
                                                                                    className="hover:text-brand-berry hover:underline"
                                                                                    href={`/admin/procurement/consumptions/${plant.consumption_id}/supply-plan`}
                                                                                >
                                                                                    {formatValue(plant[row.key], row.unit)}
                                                                                </Link>
                                                                            ) : (
                                                                                formatValue(plant[row.key], row.unit)
                                                                            )}
                                                                            {row.key === 'buying_imports' && plant.purchase_orders?.length > 0 && (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(event) => {
                                                                                            event.stopPropagation();
                                                                                            toggleReceipts(plant.column_key, 'sap');
                                                                                        }}
                                                                                        className="mt-1 ml-auto flex items-center gap-1 text-[9px] font-bold text-cyan-700"
                                                                                    >
                                                                                        View SAP orders ({purchaseOrdersBySource(plant, 'sap').length}
                                                                                        )
                                                                                        {expandedReceipts.has(plant.column_key) ? (
                                                                                            <ChevronUp className="size-3" />
                                                                                        ) : (
                                                                                            <ChevronDown className="size-3" />
                                                                                        )}
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        {row.key === 'buying_imports' &&
                                                                            expandedReceipts.has(plant.column_key) &&
                                                                            purchaseOrdersBySource(plant, 'sap').length > 0 && (
                                                                                <div className="col-span-2 space-y-2 pt-1">
                                                                                    {purchaseOrdersBySource(plant, 'sap').map(
                                                                                        (purchase, purchaseIndex) => (
                                                                                            <div
                                                                                                key={`${purchase.po_number}-mobile-${purchaseIndex}`}
                                                                                                className="rounded-lg border bg-slate-50 p-2.5 text-[9px]"
                                                                                            >
                                                                                                <div className="flex justify-between gap-3 font-bold text-slate-800">
                                                                                                    <span className="min-w-0 truncate">
                                                                                                        {purchase.vendor_name}
                                                                                                    </span>
                                                                                                    <span className="shrink-0">
                                                                                                        {Number(purchase.quantity_mt).toFixed(3)} MT
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="mt-1 flex justify-between gap-3 text-slate-500">
                                                                                                    <span>
                                                                                                        {purchase.source.toUpperCase()} ·{' '}
                                                                                                        {purchase.po_number}
                                                                                                    </span>
                                                                                                    <span className="shrink-0">
                                                                                                        ETA {formatDateForDisplay(purchase.eta)}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between border-t bg-white px-3 py-3 sm:px-4">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => showMobilePlant(mobilePlantIndex - 1)}
                                                    disabled={mobilePlantIndex === 0}
                                                    className="gap-1.5"
                                                >
                                                    <ChevronLeft className="size-4" /> Previous
                                                </Button>
                                                <div
                                                    className="flex max-w-32 items-center justify-center gap-1.5"
                                                    aria-label={`Plant ${mobilePlantIndex + 1} of ${visibleColumns.length}`}
                                                >
                                                    {visibleColumns.map((plant, index) => (
                                                        <button
                                                            key={`${plant.column_key}-dot`}
                                                            type="button"
                                                            onClick={() => showMobilePlant(index)}
                                                            aria-label={`Show ${plant.name}`}
                                                            className={`h-1.5 rounded-full transition-all ${index === mobilePlantIndex ? 'w-5 bg-cyan-600' : 'w-1.5 bg-slate-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => showMobilePlant(mobilePlantIndex + 1)}
                                                    disabled={mobilePlantIndex === visibleColumns.length - 1}
                                                    className="gap-1.5"
                                                >
                                                    Next <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-10 text-center text-sm text-slate-500">Select at least one plant column to continue.</div>
                                    )}
                                </div>
                                <div
                                    ref={desktopGrid}
                                    className="m-3 mt-0 hidden min-h-0 w-auto max-w-full flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm [scrollbar-color:#0891b2_#e2e8f0] [scrollbar-width:auto] lg:block"
                                >
                                    <table className="w-max min-w-full border-collapse text-xs">
                                        <thead className="sticky top-0 z-30 shadow-sm">
                                            <tr className="bg-amber-50/60">
                                                <th className="sticky left-0 z-20 w-44 max-w-44 min-w-44 border bg-amber-50 px-3 py-3 text-left text-sm font-black break-words whitespace-normal sm:w-56 sm:max-w-56 sm:min-w-56 lg:w-72 lg:max-w-72 lg:min-w-72">
                                                    PROCUREMENT BALANCE SHEET · {selectedMaterial?.maktx || filters.material}
                                                </th>
                                                {visibleColumns.map((plant, plantIndex) => (
                                                    <th
                                                        key={plant.column_key}
                                                        colSpan={showRemarks ? 2 : 1}
                                                        className={`relative ${showRemarks ? 'min-w-[304px]' : 'min-w-32 sm:min-w-40'} ${columnTints[plantIndex % columnTints.length].header} border px-10 py-3 text-center whitespace-nowrap uppercase`}
                                                    >
                                                        <span className="block truncate font-bold" title={plant.name}>
                                                            {plant.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePlantFold(plant.id)}
                                                            title={`Fold ${plant.name}`}
                                                            aria-label={`Fold ${plant.name}`}
                                                            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-white/70 hover:text-cyan-700"
                                                        >
                                                            <EyeOff className="size-3.5" />
                                                        </button>
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <th className="sticky left-0 z-20 w-44 max-w-44 min-w-44 border bg-amber-50 px-3 py-3 text-left text-sm font-black break-words whitespace-normal sm:w-56 sm:max-w-56 sm:min-w-56 lg:w-72 lg:max-w-72 lg:min-w-72">
                                                    {selectedMaterial?.mtart || 'MATERIAL'} · {selectedMaterial?.meins || 'UNIT'}
                                                </th>
                                                {visibleColumns.map((plant, plantIndex) => (
                                                    <Fragment key={plant.column_key}>
                                                        <th
                                                            className={`${columnTints[plantIndex % columnTints.length].body} w-32 max-w-32 min-w-32 border px-3 py-3 text-right whitespace-nowrap sm:w-48 sm:max-w-48 sm:min-w-48`}
                                                        >
                                                            VALUE
                                                        </th>
                                                        {showRemarks && (
                                                            <th
                                                                className={`${columnTints[plantIndex % columnTints.length].body} w-64 max-w-64 min-w-64 border px-3 py-3 text-left whitespace-nowrap`}
                                                            >
                                                                REMARKS
                                                            </th>
                                                        )}
                                                    </Fragment>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => (
                                                <tr key={row.key}>
                                                    <th
                                                        className={`sticky left-0 z-10 w-44 max-w-44 min-w-44 border px-3 py-3 text-left font-semibold break-words whitespace-normal sm:w-56 sm:max-w-56 sm:min-w-56 lg:w-72 lg:max-w-72 lg:min-w-72 ${row.labelHighlight ? 'bg-brand-berry text-white' : 'bg-white'}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormulaMetric(row.key)}
                                                            className="flex w-full items-center justify-between gap-2 text-left hover:text-cyan-700"
                                                            title="View calculation formula"
                                                        >
                                                            <span>{row.label}</span>
                                                            <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[8px] font-black text-cyan-700">
                                                                ƒx
                                                            </span>
                                                        </button>
                                                    </th>
                                                    {visibleColumns.map((plant, plantIndex) => (
                                                        <Fragment key={`${plant.column_key}-${row.key}`}>
                                                            <td
                                                                className={`w-32 max-w-32 min-w-32 border px-3 py-3 tabular-nums sm:w-48 sm:max-w-48 sm:min-w-48 ${row.key === 'buying_imports' ? '!py-1.5 text-left align-top' : 'text-right whitespace-nowrap'} ${row.highlight ? 'bg-fuchsia-100' : columnTints[plantIndex % columnTints.length].body} ${Number(plant[row.key]) < 0 ? 'text-lg font-black text-red-600' : ''}`}
                                                            >
                                                                {row.key === 'buying_imports' && plant.purchase_orders?.length ? (
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <span className="font-black text-slate-900">
                                                                                {formatValue(plant.buying_imports, row.unit)}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleReceipts(plant.column_key, 'sap')}
                                                                                className="text-brand-teal inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md border border-cyan-200 bg-white px-2 text-[9px] font-bold tracking-wide uppercase transition-colors hover:bg-cyan-50"
                                                                                aria-expanded={expandedReceipts.has(plant.column_key)}
                                                                            >
                                                                                {expandedReceipts.has(plant.column_key) ? (
                                                                                    <>
                                                                                        Less <ChevronUp className="size-3" />
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        More ({purchaseOrdersBySource(plant, 'sap').length}){' '}
                                                                                        <ChevronDown className="size-3" />
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                        {expandedReceipts.has(plant.column_key) && (
                                                                            <div className="space-y-2">
                                                                                {purchaseOrdersBySource(plant, 'sap').map(
                                                                                    (purchase, purchaseIndex) => (
                                                                                        <div
                                                                                            key={`${purchase.po_number}-${purchaseIndex}`}
                                                                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] leading-4 shadow-sm transition-all hover:border-cyan-200 hover:shadow-md"
                                                                                        >
                                                                                            <div
                                                                                                className="font-bold break-words whitespace-normal text-slate-900"
                                                                                                title={purchase.vendor_name}
                                                                                            >
                                                                                                {purchase.vendor_name}
                                                                                            </div>
                                                                                            <div className="mt-0.5 flex items-center justify-between gap-1.5">
                                                                                                <span
                                                                                                    className="min-w-0 truncate text-slate-400"
                                                                                                    title={`${purchase.source.toUpperCase()} PO ${purchase.po_number}`}
                                                                                                >
                                                                                                    {purchase.source.toUpperCase()} ·{' '}
                                                                                                    {purchase.po_number}
                                                                                                </span>
                                                                                                <span className="shrink-0 font-black text-slate-900">
                                                                                                    {Number(purchase.quantity_mt).toFixed(3)} MT
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="mt-1 flex items-center justify-between gap-1">
                                                                                                <span className="text-[9px] text-slate-500">
                                                                                                    ETA {formatDateForDisplay(purchase.eta)}
                                                                                                </span>
                                                                                                <span
                                                                                                    className={`max-w-[68px] truncate rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${purchase.status === 'cancelled' ? 'bg-red-50 text-red-600' : purchase.status === 'received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                                                                                                    title={purchase.status.replaceAll('_', ' ')}
                                                                                                >
                                                                                                    {purchase.status.replaceAll('_', ' ')}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : row.key === 'to_buy' && plant.consumption_id ? (
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <span className="font-black text-slate-900">
                                                                                {formatValue(plant.to_buy, row.unit)}
                                                                            </span>
                                                                            {purchaseOrdersBySource(plant, 'local').length > 0 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleReceipts(plant.column_key, 'local')}
                                                                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-orange-200 bg-white px-2 text-[9px] font-bold text-orange-700 uppercase"
                                                                                >
                                                                                    More ({purchaseOrdersBySource(plant, 'local').length}){' '}
                                                                                    <ChevronDown className="size-3" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : plant.consumption_id ? (
                                                                    <Link
                                                                        className="hover:text-brand-berry font-medium hover:underline"
                                                                        href={`/admin/procurement/consumptions/${plant.consumption_id}/supply-plan`}
                                                                    >
                                                                        {formatValue(plant[row.key], row.unit)}
                                                                    </Link>
                                                                ) : (
                                                                    formatValue(plant[row.key], row.unit)
                                                                )}
                                                            </td>
                                                            {showRemarks && (
                                                                <td
                                                                    className={`${columnTints[plantIndex % columnTints.length].body} w-64 max-w-64 min-w-64 border px-3 py-2 align-top`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        disabled={!canManage}
                                                                        onClick={() => openRemark(plant, row.key)}
                                                                        className="text-brand-berry flex min-w-0 items-start gap-1 text-left font-medium disabled:cursor-default"
                                                                    >
                                                                        <Pencil className="size-3 shrink-0" />
                                                                        <span className="max-w-52 break-words whitespace-normal">
                                                                            {plant.remarks[row.key] || 'Add'}
                                                                        </span>
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </Fragment>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
            {editing && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" onMouseDown={() => setEditing(null)}>
                    <div className="w-full max-w-lg rounded-xl border bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                        <h2 className="font-bold">Add remark</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {editing.plant.name} · {rows.find((row) => row.key === editing.metric)?.label}
                        </p>
                        <textarea
                            autoFocus
                            value={remark}
                            onChange={(event) => setRemark(event.target.value)}
                            maxLength={1000}
                            className="mt-4 min-h-32 w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Enter planning remark"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditing(null)}>
                                Cancel
                            </Button>
                            <Button className="bg-brand-teal" onClick={saveRemark}>
                                Save remark
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {viewingOrders && (
                <PurchaseOrdersModal plant={viewingOrders.plant} source={viewingOrders.source} onClose={() => setViewingOrders(null)} />
            )}
            {formulaMetric && <FormulaModal metric={formulaMetric} onClose={() => setFormulaMetric(null)} />}
        </AppLayout>
    );
}

function FormulaModal({ metric, onClose }: { metric: Metric; onClose: () => void }) {
    const row = rows.find((item) => item.key === metric);
    const details = metricFormulas[metric];
    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);
    return (
        <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
            onMouseDown={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="formula-title"
        >
            <div
                className="w-full max-w-xl overflow-hidden rounded-t-3xl border bg-white shadow-2xl sm:rounded-3xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-5 py-5 text-white sm:px-6">
                    <div className="absolute -top-10 -right-8 size-32 rounded-full bg-cyan-400/10" />
                    <div className="relative flex items-start gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/15">
                            <Calculator className="size-5 text-cyan-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black tracking-[.18em] text-cyan-300 uppercase">Calculation details</p>
                            <h2 id="formula-title" className="mt-1 text-xl leading-tight font-black">
                                {row?.label}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 hover:bg-white/20"
                            aria-label="Close formula"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </header>
                <div className="space-y-4 p-5 sm:p-6">
                    <section>
                        <p className="mb-2 text-[10px] font-black tracking-[.14em] text-slate-500 uppercase">Formula</p>
                        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 text-center text-sm leading-7 font-black text-slate-900 shadow-sm sm:text-base">
                            {details.formula}
                        </div>
                    </section>
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black tracking-[.14em] text-slate-500 uppercase">How it works</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{details.note}</p>
                    </section>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Active records only</span>
                        <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">Cancelled POs excluded</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">No duplicate counting</span>
                    </div>
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 sm:ml-auto sm:block sm:w-auto" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
}

function PurchaseOrdersModal({ plant, source, onClose }: { plant: PlantColumn; source: 'sap' | 'local'; onClose: () => void }) {
    const orders = purchaseOrdersBySource(plant, source);
    const total = orders.reduce((sum, order) => sum + Number(order.quantity_mt), 0);
    const isLocal = source === 'local';
    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
            onMouseDown={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border bg-slate-50 shadow-2xl sm:rounded-3xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header
                    className={`relative overflow-hidden px-5 py-5 text-white sm:px-6 ${isLocal ? 'bg-gradient-to-r from-orange-700 via-orange-600 to-amber-500' : 'bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700'}`}
                >
                    <div className="absolute -top-14 -right-10 size-40 rounded-full bg-white/10" />
                    <div className="relative flex items-start gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/15">
                            <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black tracking-[.18em] text-white/75 uppercase">
                                {isLocal ? 'Portal procurement' : 'SAP procurement'}
                            </p>
                            <h2 className="mt-1 text-xl font-black">{isLocal ? 'Local Purchase Orders' : 'SAP Purchase Orders'}</h2>
                            <p className="mt-1 truncate text-xs text-white/80">{plant.name}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20"
                            aria-label="Close"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </header>
                <div className="grid grid-cols-2 gap-3 border-b bg-white p-4 sm:grid-cols-3 sm:px-6">
                    <div className="rounded-xl border bg-slate-50 p-3">
                        <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Total quantity</p>
                        <p className="mt-1 text-lg font-black text-slate-900 tabular-nums">
                            {total.toFixed(3)} <span className="text-xs text-slate-500">MT</span>
                        </p>
                    </div>
                    <div className="rounded-xl border bg-slate-50 p-3">
                        <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Purchase orders</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{orders.length}</p>
                    </div>
                    <div className="col-span-2 rounded-xl border bg-slate-50 p-3 sm:col-span-1">
                        <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Source</p>
                        <p className={`mt-1 text-sm font-black ${isLocal ? 'text-orange-700' : 'text-blue-700'}`}>
                            {isLocal ? 'Portal / Local' : 'SAP'}
                        </p>
                    </div>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                    {orders.length ? (
                        orders.map((order, index) => (
                            <article
                                key={`${source}-${order.po_number}-${index}`}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-start gap-3 p-4">
                                    <div
                                        className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-black ${isLocal ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <h3 className="leading-5 font-black text-slate-900">{order.vendor_name}</h3>
                                            <p className="shrink-0 text-lg font-black text-slate-950 tabular-nums">
                                                {Number(order.quantity_mt).toFixed(3)} <span className="text-xs text-slate-500">MT</span>
                                            </p>
                                        </div>
                                        <div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-3">
                                            <div>
                                                <p className="font-bold text-slate-400 uppercase">PO reference</p>
                                                <p className="mt-0.5 font-semibold text-slate-700">{order.po_number}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-400 uppercase">Expected delivery</p>
                                                <p className="mt-0.5 font-semibold text-slate-700">{formatDateForDisplay(order.eta)}</p>
                                            </div>
                                            <div className="sm:text-right">
                                                <p className="font-bold text-slate-400 uppercase">Status</p>
                                                <span
                                                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${order.status === 'received' ? 'bg-emerald-50 text-emerald-700' : order.status === 'cancelled' ? 'bg-red-50 text-red-700' : order.status === 'in_transit' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}
                                                >
                                                    {order.status.replaceAll('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
                            <FileText className="mx-auto size-8 text-slate-300" />
                            <p className="mt-3 text-sm font-bold text-slate-500">No active purchase orders</p>
                        </div>
                    )}
                </div>
                <footer className="border-t bg-white p-4 sm:px-6">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 sm:ml-auto sm:block sm:w-auto" onClick={onClose}>
                        Done
                    </Button>
                </footer>
            </div>
        </div>
    );
}

function formatValue(value: number | null, unit: string) {
    if (value === null) return '—';

    const formatted = Number(value).toLocaleString(undefined, {
        minimumFractionDigits: unit === 'days' ? 0 : 3,
        maximumFractionDigits: 3,
    });

    return unit === 'mtn' ? formatted : `${formatted} (${unit})`;
}
function formatDateForDisplay(value: string) {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
}
