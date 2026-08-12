import { useState, useEffect, useMemo } from 'react';
import {
    DollarSign, ChevronRight, BarChart2, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, Loader2, RefreshCw, Calendar,
    Layers, Search, ChevronDown, ChevronUp, Sparkles, User,
    FileSpreadsheet, Printer, Percent, ArrowUpDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

function fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface CategoryTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    source: 'AUTO' | 'MANUAL';
    referenceId?: string;
}

interface CategoryGroup {
    id: string;
    name: string;
    total: number;
    percentageOfTotal: number;
    transactions: CategoryTransaction[];
}

interface ProfitLossData {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    profitMarginPercent: number;
    monthlyTrend: { month: string; income: number; expense: number }[];
    incomeCategories: CategoryGroup[];
    expenseCategories: CategoryGroup[];
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

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
            <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex items-center gap-2 text-xs font-semibold">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
                    <span className="text-slate-600 capitalize">{p.name}:</span>
                    <span className="font-mono font-bold text-slate-900">{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    );
}

export default function ProfitLoss() {
    const [report, setReport] = useState<ProfitLossData | null>(null);
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState<'ALL' | 'SESSION' | 'TERM' | 'MONTH' | 'CUSTOM'>('ALL');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedTermId, setSelectedTermId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // In-page search and accordion expansion state
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

    // Available terms strictly dependent on chosen session
    const availableTerms = useMemo(() => {
        if (!selectedSessionId) return terms;
        return terms.filter(t => t.sessionId === selectedSessionId || t.session?.id === selectedSessionId);
    }, [terms, selectedSessionId]);

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    // Initial load: fetch sessions, terms, and initial report
    useEffect(() => {
        const init = async () => {
            try {
                const [sessRes, termRes] = await Promise.allSettled([
                    axios.get('/api/v1/sessions', { withCredentials: true }),
                    axios.get('/api/v1/terms', { withCredentials: true })
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

                await fetchReport();
            } catch (err) {
                console.error(err);
                toast.error('Failed to load initial data');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchReport = async () => {
        try {
            setRefreshing(true);
            const params: Record<string, string> = {};

            if (filterType === 'SESSION' && selectedSessionId) {
                params.sessionId = selectedSessionId;
            } else if (filterType === 'TERM') {
                if (selectedSessionId) params.sessionId = selectedSessionId;
                if (selectedTermId) params.termId = selectedTermId;
            } else if (filterType === 'MONTH' && selectedMonth) {
                params.month = selectedMonth;
            } else if (filterType === 'CUSTOM') {
                if (fromDate) params.from = fromDate;
                if (toDate) params.to = toDate;
            }

            const res = await axios.get('/api/v1/finance-v2/ledger/profit-loss', {
                params,
                withCredentials: true
            });

            const data = res.data || {};
            const rawIncomes = data.incomeCategories || data.incomes || [];
            const rawExpenses = data.expenseCategories || data.expenses || [];

            const normalizedData: ProfitLossData = {
                totalIncome: Number(data.totalIncome) || 0,
                totalExpense: Number(data.totalExpense) || 0,
                netProfit: Number(data.netProfit) || 0,
                profitMarginPercent: Number(data.profitMarginPercentage ?? data.profitMarginPercent ?? 0),
                monthlyTrend: Array.isArray(data.monthlyTrend) ? data.monthlyTrend : [],
                incomeCategories: Array.isArray(rawIncomes) ? rawIncomes.map((c: any) => ({
                    id: c.id || c.categoryId || 'uncategorized',
                    name: c.name || c.categoryName || 'Uncategorized',
                    total: Number(c.total ?? c.amount ?? 0),
                    percentageOfTotal: Number(c.percentageOfTotal ?? c.percentage ?? 0),
                    transactions: Array.isArray(c.transactions) ? c.transactions.map((t: any) => ({
                        ...t,
                        date: t.date ? new Date(t.date).toISOString().split('T')[0] : ''
                    })) : []
                })) : [],
                expenseCategories: Array.isArray(rawExpenses) ? rawExpenses.map((c: any) => ({
                    id: c.id || c.categoryId || 'uncategorized',
                    name: c.name || c.categoryName || 'Uncategorized',
                    total: Number(c.total ?? c.amount ?? 0),
                    percentageOfTotal: Number(c.percentageOfTotal ?? c.percentage ?? 0),
                    transactions: Array.isArray(c.transactions) ? c.transactions.map((t: any) => ({
                        ...t,
                        date: t.date ? new Date(t.date).toISOString().split('T')[0] : ''
                    })) : []
                })) : []
            };

            setReport(normalizedData);
        } catch (err) {
            console.error('Failed to fetch P&L report:', err);
            toast.error('Failed to load profit and loss data');
        } finally {
            setRefreshing(false);
        }
    };

    // Refetch when filters change
    useEffect(() => {
        if (!loading) {
            fetchReport();
        }
    }, [filterType, selectedSessionId, selectedTermId, selectedMonth, fromDate, toDate]);

    const toggleCategoryExpand = (catId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    const expandAll = () => {
        if (!report) return;
        const all: Record<string, boolean> = {};
        (report.incomeCategories || []).forEach(c => { all[c.id] = true; });
        (report.expenseCategories || []).forEach(c => { all[c.id] = true; });
        setExpandedCategories(all);
    };

    const collapseAll = () => {
        setExpandedCategories({});
    };

    // Filter categories & transactions matching search query
    const filteredIncomeCategories = useMemo(() => {
        if (!report) return [];
        const rawList = report.incomeCategories || [];
        if (!searchQuery.trim()) return rawList;
        const q = searchQuery.toLowerCase().trim();

        return rawList.map(cat => {
            const catMatches = (cat.name || '').toLowerCase().includes(q);
            const matchingTxs = (cat.transactions || []).filter(tx =>
                (tx.description && tx.description.toLowerCase().includes(q)) ||
                (tx.referenceId && tx.referenceId.toLowerCase().includes(q)) ||
                (tx.source && tx.source.toLowerCase().includes(q)) ||
                String(tx.amount).includes(q)
            );

            if (catMatches || matchingTxs.length > 0) {
                return {
                    ...cat,
                    transactions: catMatches ? (cat.transactions || []) : matchingTxs
                };
            }
            return null;
        }).filter(Boolean) as CategoryGroup[];
    }, [report, searchQuery]);

    const filteredExpenseCategories = useMemo(() => {
        if (!report) return [];
        const rawList = report.expenseCategories || [];
        if (!searchQuery.trim()) return rawList;
        const q = searchQuery.toLowerCase().trim();

        return rawList.map(cat => {
            const catMatches = (cat.name || '').toLowerCase().includes(q);
            const matchingTxs = (cat.transactions || []).filter(tx =>
                (tx.description && tx.description.toLowerCase().includes(q)) ||
                (tx.referenceId && tx.referenceId.toLowerCase().includes(q)) ||
                (tx.source && tx.source.toLowerCase().includes(q)) ||
                String(tx.amount).includes(q)
            );

            if (catMatches || matchingTxs.length > 0) {
                return {
                    ...cat,
                    transactions: catMatches ? (cat.transactions || []) : matchingTxs
                };
            }
            return null;
        }).filter(Boolean) as CategoryGroup[];
    }, [report, searchQuery]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-500">Generating Profit & Loss statement...</p>
            </div>
        );
    }

    const totalIncome = report?.totalIncome || 0;
    const totalExpense = report?.totalExpense || 0;
    const netProfit = report?.netProfit || 0;
    const profitMargin = report?.profitMarginPercent || 0;
    const isProfitable = netProfit >= 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-3 pb-24 pt-6 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto max-w-6xl space-y-5 sm:space-y-6">
                {/* Breadcrumbs */}
                <div className={cn('flex flex-wrap items-center gap-1.5 transition-all duration-500', pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Income & Expenses</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Profit & Loss</span>
                </div>

                {/* Header Banner */}
                <div className={cn('overflow-hidden rounded-2xl border border-blue-200/80 bg-white/90 shadow-xl shadow-blue-900/5 backdrop-blur-xl transition-all duration-500', pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')}>
                    <div className="p-4 sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="relative flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 text-white">
                                    <BarChart2 className="h-5 w-5 sm:h-7 sm:w-7" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profit & Loss Statement</h1>
                                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                                        Executive cashflow summary, revenue vs expenditure metrics, and category audit.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-stretch sm:self-center">
                                <Button
                                    variant="outline"
                                    onClick={() => window.print()}
                                    className="h-9 sm:h-10 flex-1 sm:flex-initial gap-1.5 rounded-xl border-slate-200 bg-white px-3 sm:px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Print</span>
                                </Button>
                                <Button
                                    onClick={fetchReport}
                                    disabled={refreshing}
                                    className="h-9 sm:h-10 flex-1 sm:flex-initial gap-1.5 rounded-xl bg-blue-600 px-3 sm:px-4 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-all"
                                >
                                    <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                                    <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Top KPI Cards */}
                        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {/* Gross Revenue */}
                            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <span>Gross Income</span>
                                    </div>
                                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                                        {report?.incomeCategories?.length || 0} categories
                                    </span>
                                </div>
                                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-slate-900 truncate" title={fmt(totalIncome)}>{fmt(totalIncome)}</p>
                                <p className="mt-0.5 text-xs text-slate-500">Total verified incoming cashflow</p>
                            </div>

                            {/* Total Expenses */}
                            <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-500/10 via-rose-50/50 to-white p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-700">
                                        <TrendingDown className="h-3.5 w-3.5" />
                                        <span>Total Expenses</span>
                                    </div>
                                    <span className="rounded-md bg-rose-100 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800">
                                        {report?.expenseCategories?.length || 0} categories
                                    </span>
                                </div>
                                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black text-rose-600 truncate" title={`-${fmt(totalExpense)}`}>-{fmt(totalExpense)}</p>
                                <p className="mt-0.5 text-xs text-slate-500">Total operational expenditures</p>
                            </div>

                            {/* Net Profit / Balance */}
                            <div className={cn(
                                'rounded-2xl border p-4 sm:p-5 shadow-sm transition-all',
                                isProfitable
                                    ? 'border-blue-100 bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white'
                                    : 'border-red-100 bg-gradient-to-br from-red-500/10 via-red-50/50 to-white'
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-900">
                                        {isProfitable ? <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />}
                                        <span>Net Surplus / Deficit</span>
                                    </div>
                                    <span className={cn(
                                        'rounded-md px-2 py-0.5 font-mono text-[10px] font-bold',
                                        isProfitable ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                    )}>
                                        {profitMargin.toFixed(1)}% margin
                                    </span>
                                </div>
                                <p className={cn('mt-1.5 sm:mt-2 text-xl sm:text-2xl font-black truncate', isProfitable ? 'text-blue-950' : 'text-red-600')} title={isProfitable ? fmt(netProfit) : `-${fmt(Math.abs(netProfit))}`}>
                                    {isProfitable ? fmt(netProfit) : `-${fmt(Math.abs(netProfit))}`}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {isProfitable ? 'Surplus retained after operational deductions' : 'Expenses exceed income in this timeframe'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Period & Filter Control Strip */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Period Mode Selector */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                onClick={() => setFilterType('ALL')}
                                className={cn(
                                    'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                                    filterType === 'ALL'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                All Time
                            </button>
                            <button
                                onClick={() => setFilterType('SESSION')}
                                className={cn(
                                    'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                                    filterType === 'SESSION'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                By Session
                            </button>
                            <button
                                onClick={() => setFilterType('TERM')}
                                className={cn(
                                    'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                                    filterType === 'TERM'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                By Term
                            </button>
                            <button
                                onClick={() => setFilterType('MONTH')}
                                className={cn(
                                    'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                                    filterType === 'MONTH'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                By Month
                            </button>
                            <button
                                onClick={() => setFilterType('CUSTOM')}
                                className={cn(
                                    'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                                    filterType === 'CUSTOM'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                Custom Dates
                            </button>
                        </div>

                        {/* Search Input for Transactions & Categories */}
                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search category, item, student, staff..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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

                    {/* Active Filter Input Controls */}
                    <AnimatePresence>
                        {filterType === 'SESSION' && (
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
                                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">All / Current Session</option>
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        {filterType === 'TERM' && (
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
                                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
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
                                        className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
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

                        {filterType === 'MONTH' && (
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
                                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </motion.div>
                        )}

                        {filterType === 'CUSTOM' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-semibold text-slate-600 w-12 sm:w-auto">From:</Label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={e => setFromDate(e.target.value)}
                                        className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-semibold text-slate-600 w-12 sm:w-auto">To:</Label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={e => setToDate(e.target.value)}
                                        className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 6-Month Cash Flow Trend Chart */}
                {report?.monthlyTrend && report.monthlyTrend.length > 0 && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm min-w-0">
                        <div className="mb-3 sm:mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Cashflow Trend & Distribution</h3>
                                <p className="text-xs text-slate-500">Monthly gross revenue vs expenditures</p>
                            </div>
                        </div>
                        <div className="h-[220px] sm:h-[280px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                                <BarChart data={report.monthlyTrend} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'DM Mono', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fontFamily: 'DM Mono', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono', paddingTop: 6 }} />
                                    <Bar dataKey="income" name="Gross Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Expenditure" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Categorized Transactions Drilldown Header */}
                <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-base sm:text-xl">Category Breakdown</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                                {(filteredIncomeCategories?.length || 0) + (filteredExpenseCategories?.length || 0)}
                            </span>
                        </div>

                        {/* Expand / Collapse Actions */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={expandAll}
                                className="h-8 px-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Expand All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={collapseAll}
                                className="h-8 px-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Collapse All
                            </Button>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex rounded-xl bg-slate-100 p-1 w-full sm:w-auto self-start">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn('flex-1 sm:flex-initial rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all', activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                        >
                            All ({((filteredIncomeCategories?.length || 0) + (filteredExpenseCategories?.length || 0))})
                        </button>
                        <button
                            onClick={() => setActiveTab('income')}
                            className={cn('flex-1 sm:flex-initial rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all', activeTab === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                        >
                            Income ({(filteredIncomeCategories?.length || 0)})
                        </button>
                        <button
                            onClick={() => setActiveTab('expense')}
                            className={cn('flex-1 sm:flex-initial rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all', activeTab === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                        >
                            Expenses ({(filteredExpenseCategories?.length || 0)})
                        </button>
                    </div>
                </div>

                {/* Categorized Income Accordions */}
                {(activeTab === 'all' || activeTab === 'income') && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 break-words">
                                Income Breakdown • {fmt(totalIncome)}
                            </span>
                        </div>

                        {filteredIncomeCategories.map(cat => {
                            const isExpanded = !!expandedCategories[cat.id];
                            const catTxs = cat.transactions || [];
                            return (
                                <div
                                    key={cat.id}
                                    className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white shadow-sm transition-all"
                                >
                                    {/* Accordion Header - Fully Responsive */}
                                    <div
                                        onClick={() => toggleCategoryExpand(cat.id)}
                                        className="cursor-pointer bg-emerald-50/20 p-3.5 sm:px-5 sm:py-4 hover:bg-emerald-50/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-sm">
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-slate-900 text-sm sm:text-base break-words">{cat.name}</span>
                                                        <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-emerald-800">
                                                            {catTxs.length} txns
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                                                        {(cat.percentageOfTotal || 0).toFixed(1)}% of gross revenue
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Amount & Expand Arrow */}
                                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                                <span className="font-mono text-sm sm:text-base font-black text-emerald-600 text-right">
                                                    +{fmt(cat.total)}
                                                </span>
                                                <div className="rounded-lg p-1 text-slate-400 hover:bg-emerald-100/60">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Transaction List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-emerald-100/60 bg-slate-50/40"
                                            >
                                                {catTxs.length > 0 ? (
                                                    <div className="divide-y divide-slate-100">
                                                        {catTxs.map(tx => (
                                                            <div
                                                                key={tx.id}
                                                                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-3 sm:px-6 sm:py-3.5 hover:bg-emerald-50/30 transition-colors"
                                                            >
                                                                <div className="space-y-0.5 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">{tx.description}</span>
                                                                        {tx.source === 'AUTO' ? (
                                                                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100/80 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-800">
                                                                                <Sparkles className="h-2.5 w-2.5" /> AUTO
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.2 font-mono text-[9px] font-bold text-blue-700">
                                                                                <User className="h-2.5 w-2.5" /> MANUAL
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                                                                        <span>{tx.date}</span>
                                                                        {tx.referenceId && <span className="truncate max-w-[150px]">• Ref: {tx.referenceId}</span>}
                                                                    </div>
                                                                </div>
                                                                <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 self-end sm:self-auto shrink-0">
                                                                    +{fmt(tx.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center text-xs font-mono text-slate-400">
                                                        No transactions recorded in this category.
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        {(filteredIncomeCategories?.length || 0) === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400 font-mono text-xs">
                                No income categories matching the active filter.
                            </div>
                        )}
                    </div>
                )}

                {/* Categorized Expenses Accordions */}
                {(activeTab === 'all' || activeTab === 'expense') && (
                    <div className="space-y-3 pt-3">
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-800 break-words">
                                Expense Breakdown • -{fmt(totalExpense)}
                            </span>
                        </div>

                        {filteredExpenseCategories.map(cat => {
                            const isExpanded = !!expandedCategories[cat.id];
                            const catTxs = cat.transactions || [];
                            return (
                                <div
                                    key={cat.id}
                                    className="overflow-hidden rounded-2xl border border-rose-100/80 bg-white shadow-sm transition-all"
                                >
                                    {/* Accordion Header - Fully Responsive */}
                                    <div
                                        onClick={() => toggleCategoryExpand(cat.id)}
                                        className="cursor-pointer bg-rose-50/20 p-3.5 sm:px-5 sm:py-4 hover:bg-rose-50/40 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shadow-sm">
                                                    <TrendingDown className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-slate-900 text-sm sm:text-base break-words">{cat.name}</span>
                                                        <span className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-rose-800">
                                                            {catTxs.length} txns
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                                                        {(cat.percentageOfTotal || 0).toFixed(1)}% of total expenditures
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Amount & Expand Arrow */}
                                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                                <span className="font-mono text-sm sm:text-base font-black text-rose-600 text-right">
                                                    -{fmt(cat.total)}
                                                </span>
                                                <div className="rounded-lg p-1 text-slate-400 hover:bg-rose-100/60">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Transaction List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-rose-100/60 bg-slate-50/40"
                                            >
                                                {catTxs.length > 0 ? (
                                                    <div className="divide-y divide-slate-100">
                                                        {catTxs.map(tx => (
                                                            <div
                                                                key={tx.id}
                                                                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between p-3 sm:px-6 sm:py-3.5 hover:bg-rose-50/30 transition-colors"
                                                            >
                                                                <div className="space-y-0.5 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">{tx.description}</span>
                                                                        {tx.source === 'AUTO' ? (
                                                                            <span className="inline-flex items-center gap-1 rounded bg-rose-100/80 px-1.5 py-0.2 font-mono text-[9px] font-bold text-rose-800">
                                                                                <Sparkles className="h-2.5 w-2.5" /> AUTO
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.2 font-mono text-[9px] font-bold text-blue-700">
                                                                                <User className="h-2.5 w-2.5" /> MANUAL
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                                                                        <span>{tx.date}</span>
                                                                        {tx.referenceId && <span className="truncate max-w-[150px]">• Ref: {tx.referenceId}</span>}
                                                                    </div>
                                                                </div>
                                                                <span className="font-mono text-xs sm:text-sm font-black text-rose-600 self-end sm:self-auto shrink-0">
                                                                    -{fmt(tx.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center text-xs font-mono text-slate-400">
                                                        No expense records in this category.
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        {(filteredExpenseCategories?.length || 0) === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400 font-mono text-xs">
                                No expense categories matching the active filter.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
