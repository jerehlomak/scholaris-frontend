import { useState, useEffect, useMemo } from 'react';
import {
    Download, ChevronRight, FileText, FileSpreadsheet,
    Printer, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
    Loader2, RefreshCw, Calendar, Sparkles, User, Layers,
    CheckCircle2, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

function fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface LedgerRecord {
    id: string;
    description: string;
    categoryId: string;
    category?: { id: string; name: string; type: string; };
    amount: number;
    recordType: 'INCOME' | 'EXPENSE';
    source: 'AUTO' | 'MANUAL';
    referenceId?: string;
    date: string;
    createdAt?: string;
}

interface Category {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
}

interface AcademicSession {
    id: string;
    name: string;
    isCurrent?: boolean;
}

interface AcademicTerm {
    id: string;
    name: string;
    sessionId?: string;
    isCurrent?: boolean;
    isActive?: boolean;
    session?: {
        id: string;
        name: string;
        isCurrent?: boolean;
    };
}

export default function LedgerReports() {
    const [records, setRecords] = useState<LedgerRecord[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    // Filters
    const [recordType, setRecordType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [filterPeriodType, setFilterPeriodType] = useState<'ALL' | 'SESSION' | 'TERM' | 'MONTH' | 'CUSTOM'>('ALL');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedTermId, setSelectedTermId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedSource, setSelectedSource] = useState<'ALL' | 'AUTO' | 'MANUAL'>('ALL');

    // Search and Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description' | 'category'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Available terms strictly dependent on chosen session
    const availableTerms = useMemo(() => {
        if (!selectedSessionId) return terms;
        return terms.filter(t => t.sessionId === selectedSessionId || t.session?.id === selectedSessionId);
    }, [terms, selectedSessionId]);

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    // Load initial metadata (Sessions, Terms, Categories)
    useEffect(() => {
        const init = async () => {
            try {
                const [sessRes, termRes, catRes] = await Promise.allSettled([
                    axios.get('/api/v1/sessions', { withCredentials: true }),
                    axios.get('/api/v1/terms', { withCredentials: true }),
                    axios.get('/api/v1/finance-v2/categories', { withCredentials: true })
                ]);

                if (sessRes.status === 'fulfilled' && sessRes.value.data?.sessions) {
                    const fetchedSessions = sessRes.value.data.sessions;
                    setSessions(fetchedSessions);
                    const currentSession = fetchedSessions.find((s: any) => s.isCurrent);
                    if (currentSession && !selectedSessionId) {
                        setSelectedSessionId(currentSession.id);
                    }
                }
                if (termRes.status === 'fulfilled' && termRes.value.data?.terms) {
                    setTerms(termRes.value.data.terms);
                }
                if (catRes.status === 'fulfilled' && catRes.value.data?.categories) {
                    setCategories(catRes.value.data.categories);
                }

                await fetchLedgerRecords();
            } catch (err) {
                console.error(err);
                toast.error('Failed to load initial metadata');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchLedgerRecords = async () => {
        try {
            setFetching(true);
            const params: Record<string, string> = {};

            if (recordType !== 'ALL') params.type = recordType;
            if (selectedCategory !== 'ALL') params.categoryId = selectedCategory;
            if (selectedSource !== 'ALL') params.source = selectedSource;

            if (filterPeriodType === 'SESSION' && selectedSessionId) {
                params.sessionId = selectedSessionId;
            } else if (filterPeriodType === 'TERM') {
                if (selectedSessionId) params.sessionId = selectedSessionId;
                if (selectedTermId) params.termId = selectedTermId;
            } else if (filterPeriodType === 'MONTH' && selectedMonth) {
                params.month = selectedMonth;
            } else if (filterPeriodType === 'CUSTOM') {
                if (fromDate) params.from = fromDate;
                if (toDate) params.to = toDate;
            }

            const res = await axios.get('/api/v1/finance-v2/ledger', {
                params,
                withCredentials: true
            });

            const raw = (res.data.records || []).map((r: any) => ({
                ...r,
                date: new Date(r.date).toISOString().split('T')[0]
            }));
            setRecords(raw);
        } catch (err) {
            console.error('Failed to fetch ledger report records:', err);
            toast.error('Failed to load ledger records');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            fetchLedgerRecords();
        }
    }, [recordType, filterPeriodType, selectedSessionId, selectedTermId, selectedMonth, fromDate, toDate, selectedCategory, selectedSource]);

    // Client-side search and sorting
    const filteredRecords = useMemo(() => {
        let list = [...records];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(r =>
                (r.description && r.description.toLowerCase().includes(q)) ||
                (r.category?.name && r.category.name.toLowerCase().includes(q)) ||
                (r.referenceId && r.referenceId.toLowerCase().includes(q)) ||
                (r.source && r.source.toLowerCase().includes(q)) ||
                String(r.amount).includes(q)
            );
        }

        list.sort((a, b) => {
            if (sortBy === 'amount') {
                return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
            }
            if (sortBy === 'description') {
                return sortOrder === 'asc'
                    ? (a.description || '').localeCompare(b.description || '')
                    : (b.description || '').localeCompare(a.description || '');
            }
            if (sortBy === 'category') {
                const nameA = a.category?.name || '';
                const nameB = b.category?.name || '';
                return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            }
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });

        return list;
    }, [records, searchQuery, sortBy, sortOrder]);

    // Summary Metrics
    const summary = useMemo(() => {
        let incomeTotal = 0;
        let expenseTotal = 0;

        filteredRecords.forEach(r => {
            if (r.recordType === 'INCOME') {
                incomeTotal += r.amount;
            } else {
                expenseTotal += r.amount;
            }
        });

        return {
            incomeTotal,
            expenseTotal,
            netBalance: incomeTotal - expenseTotal,
            count: filteredRecords.length
        };
    }, [filteredRecords]);

    const toggleSort = (field: 'date' | 'amount' | 'description' | 'category') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Export to Excel (.xlsx)
    const handleExportExcel = () => {
        try {
            if (filteredRecords.length === 0) {
                toast.error('No records to export');
                return;
            }

            const rows = filteredRecords.map((r, i) => ({
                'S/N': i + 1,
                'Date': r.date,
                'Type': r.recordType,
                'Category': r.category?.name || 'Uncategorized',
                'Description': r.description,
                'Source': r.source,
                'Reference': r.referenceId || 'N/A',
                'Amount (NGN)': r.recordType === 'EXPENSE' ? -r.amount : r.amount
            }));

            // Summary row
            rows.push({
                'S/N': '',
                'Date': 'TOTAL SUMMARY',
                'Type': `Inflow: ${fmt(summary.incomeTotal)}`,
                'Category': `Outflow: -${fmt(summary.expenseTotal)}`,
                'Description': `Net Balance: ${fmt(summary.netBalance)}`,
                'Source': `Total Records: ${summary.count}`,
                'Reference': '',
                'Amount (NGN)': summary.netBalance
            } as any);

            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger_Report');

            // Auto-fit column widths
            const colWidths = [
                { wch: 6 },  // S/N
                { wch: 12 }, // Date
                { wch: 10 }, // Type
                { wch: 22 }, // Category
                { wch: 38 }, // Description
                { wch: 10 }, // Source
                { wch: 18 }, // Reference
                { wch: 16 }  // Amount
            ];
            worksheet['!cols'] = colWidths;

            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(workbook, `Skooly_Financial_Ledger_${dateStr}.xlsx`);
            toast.success('Excel ledger report exported successfully');
        } catch (err) {
            console.error('Failed to export Excel:', err);
            toast.error('Failed to generate Excel file');
        }
    };

    // Export to PDF (.pdf)
    const handleExportPDF = () => {
        try {
            if (filteredRecords.length === 0) {
                toast.error('No records to export');
                return;
            }

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const dateStr = new Date().toLocaleDateString('en-NG', { dateStyle: 'medium' });

            // Brand Header
            doc.setFillColor(30, 41, 59); // Slate 800
            doc.rect(0, 0, 210, 24, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('SKOOLY FINANCIAL AUDIT LEDGER', 14, 15);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated: ${dateStr}`, 155, 15);

            // Report Meta & Summaries
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('FINANCIAL SUMMARY REPORT', 14, 34);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total Transactions: ${summary.count}`, 14, 40);
            doc.text(`Gross Inflow: ${fmt(summary.incomeTotal)}`, 14, 45);
            doc.text(`Total Outflow: -${fmt(summary.expenseTotal)}`, 85, 45);
            doc.text(`Net Balance: ${fmt(summary.netBalance)}`, 150, 45);

            doc.setDrawColor(226, 232, 240);
            doc.line(14, 49, 196, 49);

            // Table Header
            let y = 56;
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y - 4, 182, 8, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text('DATE', 16, y);
            doc.text('TYPE', 38, y);
            doc.text('CATEGORY', 58, y);
            doc.text('DESCRIPTION', 96, y);
            doc.text('AMOUNT', 172, y);

            y += 6;
            doc.setFont('helvetica', 'normal');

            // Table Rows
            filteredRecords.forEach((r, idx) => {
                if (y > 275) {
                    doc.addPage();
                    y = 20;
                    // Mini header on next page
                    doc.setFillColor(248, 250, 252);
                    doc.rect(14, y - 4, 182, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(71, 85, 105);
                    doc.text('DATE', 16, y);
                    doc.text('TYPE', 38, y);
                    doc.text('CATEGORY', 58, y);
                    doc.text('DESCRIPTION', 96, y);
                    doc.text('AMOUNT', 172, y);
                    y += 6;
                    doc.setFont('helvetica', 'normal');
                }

                // Alternate row background
                if (idx % 2 === 1) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(14, y - 3.5, 182, 6, 'F');
                }

                doc.setTextColor(51, 65, 85);
                doc.setFontSize(7.5);
                doc.text(r.date, 16, y);
                doc.text(r.recordType, 38, y);
                doc.text((r.category?.name || 'Uncategorized').substring(0, 18), 58, y);
                doc.text(r.description.substring(0, 42), 96, y);

                if (r.recordType === 'INCOME') {
                    doc.setTextColor(16, 185, 129); // Emerald
                    doc.text(`+${fmt(r.amount)}`, 172, y);
                } else {
                    doc.setTextColor(225, 29, 72); // Rose
                    doc.text(`-${fmt(r.amount)}`, 172, y);
                }

                y += 6;
            });

            // Footer Page Numbers
            const totalPages = doc.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`Page ${p} of ${totalPages}`, 180, 290);
            }

            doc.save(`Skooly_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF report generated and downloaded');
        } catch (err) {
            console.error('Failed to export PDF:', err);
            toast.error('Failed to generate PDF document');
        }
    };

    // Server-side CSV Export
    const handleExportCSV = () => {
        let url = '/api/v1/finance-v2/ledger/export/csv?';
        if (recordType !== 'ALL') url += `type=${recordType}&`;
        if (selectedCategory !== 'ALL') url += `categoryId=${selectedCategory}&`;
        if (selectedSource !== 'ALL') url += `source=${selectedSource}&`;
        if (filterPeriodType === 'SESSION' && selectedSessionId) url += `sessionId=${selectedSessionId}&`;
        if (filterPeriodType === 'TERM') {
            if (selectedSessionId) url += `sessionId=${selectedSessionId}&`;
            if (selectedTermId) url += `termId=${selectedTermId}&`;
        }
        if (filterPeriodType === 'MONTH' && selectedMonth) url += `month=${selectedMonth}&`;
        if (filterPeriodType === 'CUSTOM') {
            if (fromDate) url += `from=${fromDate}&`;
            if (toDate) url += `to=${toDate}&`;
        }
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <Loader2 className="h-9 w-9 animate-spin text-[#1E4DA6]" />
                <p className="text-sm font-medium text-slate-500">Loading ledger reports engine...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBF9F5] px-3 pb-24 pt-6 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto max-w-6xl space-y-5 sm:space-y-6">
                {/* Breadcrumbs */}
                <div className={cn('flex flex-wrap items-center gap-1.5 transition-all duration-500', pageVisible ? 'opacity-100' : '-translate-y-2 opacity-0')}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Income & Expenses</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-600">Ledger Reports</span>
                </div>

                {/* Header Banner */}
                <div className={cn('overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/90 shadow-xl shadow-indigo-900/5 transition-all duration-500', pageVisible ? 'opacity-100' : 'translate-y-3 opacity-0')}>
                    <div className="p-4 sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="relative flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-[#1E4DA6] shadow-lg shadow-indigo-200 text-white">
                                    <FileText className="h-5 w-5 sm:h-7 sm:w-7" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Ledger Audit Reports</h1>
                                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">
                                        Multi-format financial statement exports for school boards, auditors, and accounting records.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:self-center">
                                <Button
                                    variant="outline"
                                    onClick={fetchLedgerRecords}
                                    disabled={fetching}
                                    className="h-9 sm:h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-2.5 sm:px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <RefreshCw className={cn('h-3.5 w-3.5', fetching && 'animate-spin text-indigo-600')} />
                                    <span>Refresh</span>
                                </Button>
                                <Button
                                    onClick={handleExportExcel}
                                    className="h-9 sm:h-10 gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-4 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span>Excel</span>
                                </Button>
                                <Button
                                    onClick={handleExportPDF}
                                    className="h-9 sm:h-10 gap-1.5 rounded-xl bg-rose-600 px-2.5 sm:px-4 text-xs font-bold text-white shadow-md shadow-rose-200 hover:bg-rose-700 transition-all"
                                >
                                    <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span>PDF</span>
                                </Button>
                                <Button
                                    onClick={handleExportCSV}
                                    className="h-9 sm:h-10 gap-1.5 rounded-xl bg-indigo-600 px-2.5 sm:px-4 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                >
                                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span>CSV</span>
                                </Button>
                            </div>
                        </div>                        {/* Summary Metrics */}
                        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Records</span>
                                <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900">{summary.count}</p>
                                <p className="mt-1 text-xs text-slate-400">Matching active filters</p>
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span>Total Inflow</span>
                                </div>
                                <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 truncate" title={fmt(summary.incomeTotal)}>
                                    {fmt(summary.incomeTotal)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Gross revenue volume</p>
                            </div>

                            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-700">
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    <span>Total Outflow</span>
                                </div>
                                <p className="mt-2 text-xl sm:text-2xl font-black text-rose-600 truncate" title={`-${fmt(summary.expenseTotal)}`}>
                                    -{fmt(summary.expenseTotal)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Expenditures & disbursements</p>
                            </div>

                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>Net Balance</span>
                                </div>
                                <p className="mt-2 text-xl sm:text-2xl font-black text-indigo-950 truncate" title={fmt(summary.netBalance)}>
                                    {fmt(summary.netBalance)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Period net margin</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Controls Strip */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Period Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
                            <select
                                value={recordType}
                                onChange={e => setRecordType(e.target.value as any)}
                                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                            >
                                <option value="ALL">All Record Types</option>
                                <option value="INCOME">Income Only</option>
                                <option value="EXPENSE">Expenses Only</option>
                            </select>

                            <select
                                value={filterPeriodType}
                                onChange={e => setFilterPeriodType(e.target.value as any)}
                                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                            >
                                <option value="ALL">All Time</option>
                                <option value="SESSION">By Session</option>
                                <option value="TERM">By Term</option>
                                <option value="MONTH">By Month</option>
                                <option value="CUSTOM">Custom Date Range</option>
                            </select>

                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                            >
                                <option value="ALL">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                ))}
                            </select>

                            <select
                                value={selectedSource}
                                onChange={e => setSelectedSource(e.target.value as any)}
                                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                            >
                                <option value="ALL">All Sources</option>
                                <option value="AUTO">Automated (System)</option>
                                <option value="MANUAL">Manual Entries</option>
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search ledger entries..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filter Dynamic Inputs */}
                    <AnimatePresence>
                        {filterPeriodType === 'SESSION' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                            >
                                <Label className="text-xs font-semibold text-slate-600">Select Academic Session:</Label>
                                <select
                                    value={selectedSessionId}
                                    onChange={e => setSelectedSessionId(e.target.value)}
                                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                                >
                                    <option value="">All / Current Session</option>
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        {filterPeriodType === 'TERM' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                    <Label className="text-xs font-semibold text-slate-600">Academic Session:</Label>
                                    <select
                                        value={selectedSessionId}
                                        onChange={e => {
                                            const newSessionId = e.target.value;
                                            setSelectedSessionId(newSessionId);
                                            // Reset selectedTermId if not in new session
                                            if (newSessionId && selectedTermId) {
                                                const isValid = terms.some(t => t.id === selectedTermId && (t.sessionId === newSessionId || t.session?.id === newSessionId));
                                                if (!isValid) setSelectedTermId('');
                                            }
                                        }}
                                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Sessions</option>
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                    <Label className="text-xs font-semibold text-slate-600">Academic Term:</Label>
                                    <select
                                        value={selectedTermId}
                                        onChange={e => setSelectedTermId(e.target.value)}
                                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                                    >
                                        <option value="">All Terms {selectedSessionId ? 'in Session' : ''}</option>
                                        {availableTerms.map(t => {
                                            const sName = !selectedSessionId ? (t.session?.name || sessions.find(s => s.id === t.sessionId)?.name) : null;
                                            return (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} {t.isCurrent || t.isActive ? '(Current)' : ''} {sName ? `— ${sName}` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        {filterPeriodType === 'MONTH' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                            >
                                <Label className="text-xs font-semibold text-slate-600">Select Month:</Label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                                />
                            </motion.div>
                        )}

                        {filterPeriodType === 'CUSTOM' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row flex-wrap sm:items-center gap-3"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                    <Label className="text-xs font-semibold text-slate-600">From Date:</Label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={e => setFromDate(e.target.value)}
                                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                    <Label className="text-xs font-semibold text-slate-600">To Date:</Label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={e => setToDate(e.target.value)}
                                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Ledger Preview Table & Mobile Grid List */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900">Ledger Statement Live Preview</span>
                            <span className="inline-flex items-center rounded-full bg-slate-200/70 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                {filteredRecords.length}
                            </span>
                        </div>

                        {/* Mobile Sort Dropdown */}
                        <div className="flex md:hidden items-center justify-between gap-2 pt-1 border-t border-slate-200/50 sm:border-0 sm:pt-0">
                            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Sort By:</span>
                            <div className="flex items-center gap-1.5">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none"
                                >
                                    <option value="date">Date</option>
                                    <option value="amount">Amount</option>
                                    <option value="description">Description</option>
                                    <option value="category">Category</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100"
                                    title="Toggle sort direction"
                                >
                                    {sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 1. Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50/50">
                                <tr>
                                    <th
                                        onClick={() => toggleSort('date')}
                                        className="cursor-pointer px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Date</span>
                                            {sortBy === 'date' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-600" /> : <ArrowDown className="h-3 w-3 text-indigo-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Type
                                    </th>
                                    <th
                                        onClick={() => toggleSort('description')}
                                        className="cursor-pointer px-4 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Description & Breakdown</span>
                                            {sortBy === 'description' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-600" /> : <ArrowDown className="h-3 w-3 text-indigo-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => toggleSort('category')}
                                        className="cursor-pointer px-4 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Category</span>
                                            {sortBy === 'category' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-600" /> : <ArrowDown className="h-3 w-3 text-indigo-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Source
                                    </th>
                                    <th
                                        onClick={() => toggleSort('amount')}
                                        className="cursor-pointer px-5 py-3.5 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span>Amount</span>
                                            {sortBy === 'amount' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-600" /> : <ArrowDown className="h-3 w-3 text-indigo-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence>
                                    {filteredRecords.map(r => (
                                        <motion.tr
                                            key={r.id}
                                            layout
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-slate-50/60 transition-colors"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {r.date}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {r.recordType === 'INCOME' ? (
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                                                        INCOME
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-700 border border-rose-200/60">
                                                        EXPENSE
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-900">{r.description}</span>
                                                    {r.referenceId && (
                                                        <span className="font-mono text-[10px] text-slate-400">Ref: {r.referenceId}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60">
                                                    {r.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {r.source === 'AUTO' ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600">
                                                        <Sparkles className="h-2.5 w-2.5" /> AUTO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded bg-[#1E4DA6]/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#173F8C]">
                                                        <User className="h-2.5 w-2.5" /> MANUAL
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono text-sm font-black whitespace-nowrap">
                                                {r.recordType === 'INCOME' ? (
                                                    <span className="text-emerald-600">+{fmt(r.amount)}</span>
                                                ) : (
                                                    <span className="text-rose-600">-{fmt(r.amount)}</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* 2. Mobile Grid / Card Stream Format */}
                    <div className="block md:hidden divide-y divide-slate-100">
                        <AnimatePresence>
                            {filteredRecords.map(r => (
                                <motion.div
                                    key={r.id}
                                    layout
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5"
                                >
                                    {/* Top Row: Type badge, Source, and Date */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            {r.recordType === 'INCOME' ? (
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                                                    INCOME
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-700 border border-rose-200/60">
                                                    EXPENSE
                                                </span>
                                            )}
                                            {r.source === 'AUTO' ? (
                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600">
                                                    <Sparkles className="h-2.5 w-2.5" /> AUTO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded bg-[#1E4DA6]/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#173F8C]">
                                                    <User className="h-2.5 w-2.5" /> MANUAL
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-mono text-xs text-slate-500 font-medium">{r.date}</span>
                                    </div>

                                    {/* Middle Row: Description & Amount */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm text-slate-900 leading-snug break-words">{r.description}</p>
                                            {r.referenceId && (
                                                <p className="mt-0.5 font-mono text-[10px] text-slate-400 truncate">Ref: {r.referenceId}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={cn(
                                                "font-mono text-sm sm:text-base font-black tracking-tight",
                                                r.recordType === 'INCOME' ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {r.recordType === 'INCOME' ? `+${fmt(r.amount)}` : `-${fmt(r.amount)}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Row: Category Pill */}
                                    <div className="flex items-center justify-between pt-0.5">
                                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200/60">
                                            {r.category?.name || 'Uncategorized'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredRecords.length === 0 && (
                        <div className="py-16 text-center">
                            <Layers className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-700">No ledger records found for current filters</p>
                            <p className="mt-1 text-xs text-slate-400">Try broadening your search or date criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
