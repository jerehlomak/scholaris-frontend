import { useState, useEffect, useMemo } from 'react';
import {
    Plus, TrendingUp, X, Loader2, ChevronRight,
    Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
    Trash2, Eye, RefreshCw, Layers, Sparkles, User,
    Calendar, CheckCircle2, Copy, Tag, ExternalLink, Printer
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { mobileSafePrint } from '../../../lib/printUtils';

type TransSource = 'AUTO' | 'MANUAL';

interface LedgerRecord {
    id: string;
    description: string;
    categoryId: string;
    category?: { id: string; name: string; type: string; };
    amount: number;
    recordType: 'INCOME';
    source: TransSource;
    referenceId?: string;
    date: string;
    createdAt?: string;
    createdBy?: string;
}

interface Category {
    id: string;
    name: string;
    type: 'INCOME';
}

interface NewForm {
    description: string;
    categoryId: string;
    amount: string;
    date: string;
}

const BLANK_FORM: NewForm = {
    description: '',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
};

function fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400';

function Modal({ children, onClose, maxWidth = 'max-w-md' }: { children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
    return (
        <motion.div
            key="modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className={cn('w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl', maxWidth)}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

export default function Income() {
    const [transactions, setTransactions] = useState<LedgerRecord[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<LedgerRecord | null>(null);
    const [form, setForm] = useState<NewForm>(BLANK_FORM);
    const [pageVisible, setPageVisible] = useState(false);

    // Inline category creation
    const [showNewCatInput, setShowNewCatInput] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [creatingCat, setCreatingCat] = useState(false);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedSource, setSelectedSource] = useState<'ALL' | 'AUTO' | 'MANUAL'>('ALL');
    const [periodPreset, setPeriodPreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Sorting
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description' | 'category'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    const fetchIncomeData = async () => {
        try {
            const [ledRes, catRes] = await Promise.all([
                axios.get('/api/v1/finance-v2/ledger?type=INCOME', { withCredentials: true }),
                axios.get('/api/v1/finance-v2/categories?type=INCOME', { withCredentials: true })
            ]);

            const recs = (ledRes.data.records || []).map((t: any) => ({
                ...t,
                date: new Date(t.date).toISOString().split('T')[0]
            }));
            setTransactions(recs);
            setCategories(catRes.data.categories || []);
        } catch (err) {
            console.error('Failed to load income data:', err);
            toast.error('Failed to load income records');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchIncomeData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchIncomeData();
    };

    const handleQuickCreateCategory = async () => {
        if (!newCatName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        setCreatingCat(true);
        try {
            const res = await axios.post('/api/v1/finance-v2/categories', {
                name: newCatName.trim(),
                type: 'INCOME'
            }, { withCredentials: true });

            const createdCat = res.data.category;
            setCategories(prev => [...prev, createdCat].sort((a, b) => a.name.localeCompare(b.name)));
            setForm(f => ({ ...f, categoryId: createdCat.id }));
            setNewCatName('');
            setShowNewCatInput(false);
            toast.success(`Category "${createdCat.name}" created successfully`);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to create category');
        } finally {
            setCreatingCat(false);
        }
    };

    // Filter and Sort Logic
    const filteredRecords = useMemo(() => {
        let list = [...transactions];

        // Search Query
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

        // Category Filter
        if (selectedCategory !== 'ALL') {
            list = list.filter(r => r.categoryId === selectedCategory);
        }

        // Source Filter
        if (selectedSource !== 'ALL') {
            list = list.filter(r => r.source === selectedSource);
        }

        // Date / Period Filter
        const now = new Date();
        if (periodPreset === 'TODAY') {
            const todayStr = now.toISOString().split('T')[0];
            list = list.filter(r => r.date === todayStr);
        } else if (periodPreset === 'THIS_WEEK') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().split('T')[0];
            list = list.filter(r => r.date >= weekAgoStr);
        } else if (periodPreset === 'THIS_MONTH') {
            const monthPrefix = now.toISOString().slice(0, 7);
            list = list.filter(r => r.date.startsWith(monthPrefix));
        } else if (periodPreset === 'CUSTOM') {
            if (fromDate) list = list.filter(r => r.date >= fromDate);
            if (toDate) list = list.filter(r => r.date <= toDate);
        }

        // Sorting
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
            // Sort by date default
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });

        return list;
    }, [transactions, searchQuery, selectedCategory, selectedSource, periodPreset, fromDate, toDate, sortBy, sortOrder]);

    // KPI Metrics calculation
    const metrics = useMemo(() => {
        const totalAmount = filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
        const autoRecords = filteredRecords.filter(r => r.source === 'AUTO');
        const manualRecords = filteredRecords.filter(r => r.source === 'MANUAL');
        const autoAmount = autoRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
        const manualAmount = manualRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

        return {
            totalAmount,
            totalCount: filteredRecords.length,
            autoAmount,
            autoCount: autoRecords.length,
            manualAmount,
            manualCount: manualRecords.length
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

    const handleAdd = async () => {
        try {
            const rawAmount = Number(form.amount.replace(/,/g, ''));
            if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
                toast.error('Please enter a valid amount');
                return;
            }

            setSubmitting(true);
            const payload = {
                description: form.description.trim(),
                categoryId: form.categoryId,
                type: 'INCOME',
                amount: rawAmount,
                date: form.date
            };

            const res = await axios.post('/api/v1/finance-v2/ledger', payload, { withCredentials: true });
            const newTx = res.data.record;
            newTx.date = new Date(newTx.date).toISOString().split('T')[0];

            setTransactions(p => [newTx, ...p]);
            setShowForm(false);
            setForm(BLANK_FORM);
            toast.success('Income recorded successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to add income record');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this manual income record? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/v1/finance-v2/ledger/INCOME/${id}`, { withCredentials: true });
            setTransactions(p => p.filter(t => t.id !== id));
            if (selectedRecord?.id === id) setSelectedRecord(null);
            toast.success('Record deleted successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to delete record');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
                <p className="text-sm font-medium text-slate-500">Loading income records...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto max-w-6xl space-y-6">
                {/* Breadcrumbs */}
                <div className={cn('flex items-center gap-1.5 transition-all duration-500', pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Income & Expenses</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600">Income</span>
                </div>

                <div id="income-print-area">

                {/* Header Banner */}
                <div className={cn('overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/90 shadow-xl shadow-emerald-900/5 backdrop-blur-xl transition-all duration-500', pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')}>
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-200 text-white">
                                    <TrendingUp className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Income Records</h1>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                        Track, filter, and audit verified tuition, fee payments, and manual income.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                                <Link
                                    to="/dashboard/finance/income-expenses/ledger-settings"
                                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Categories</span>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin text-emerald-600')} />
                                    <span>Refresh</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => mobileSafePrint('income-print-area')}
                                    className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span>Print</span>
                                </Button>
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="h-10 gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Record Income</span>
                                </Button>
                            </div>
                        </div>

                        {/* KPI Metric Cards */}
                        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">Total Inflow</span>
                                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">{metrics.totalCount} records</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-slate-900">{fmt(metrics.totalAmount)}</p>
                                <p className="mt-1 text-xs text-slate-500">Gross revenue volume in current selection</p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Automated (Fees)</span>
                                    </div>
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">{metrics.autoCount} entries</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-emerald-600">{fmt(metrics.autoAmount)}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {metrics.totalAmount > 0 ? `${((metrics.autoAmount / metrics.totalAmount) * 100).toFixed(1)}% of total inflow` : '0% of total'}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                        <User className="h-3.5 w-3.5 text-blue-600" />
                                        <span>Manual Receipts</span>
                                    </div>
                                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700">{metrics.manualCount} entries</span>
                                </div>
                                <p className="mt-2 text-2xl font-black text-slate-800">{fmt(metrics.manualAmount)}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {metrics.totalAmount > 0 ? `${((metrics.manualAmount / metrics.totalAmount) * 100).toFixed(1)}% of total inflow` : '0% of total'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Control Bar */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by student, class, invoice number, item, reference..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                            >
                                <option value="ALL">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <select
                                value={selectedSource}
                                onChange={e => setSelectedSource(e.target.value as any)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                            >
                                <option value="ALL">All Sources</option>
                                <option value="AUTO">Automated (Invoices)</option>
                                <option value="MANUAL">Manual Entry</option>
                            </select>

                            <select
                                value={periodPreset}
                                onChange={e => setPeriodPreset(e.target.value as any)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                            >
                                <option value="ALL">All Time</option>
                                <option value="TODAY">Today</option>
                                <option value="THIS_WEEK">This Week</option>
                                <option value="THIS_MONTH">This Month</option>
                                <option value="CUSTOM">Custom Date Range</option>
                            </select>
                        </div>
                    </div>

                    {/* Custom Date Range Picker */}
                    {periodPreset === 'CUSTOM' && (
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-slate-500">From:</Label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={e => setFromDate(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-slate-500">To:</Label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={e => setToDate(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-emerald-500"
                                />
                            </div>
                            {(fromDate || toDate) && (
                                <button
                                    onClick={() => { setFromDate(''); setToDate(''); }}
                                    className="text-xs font-semibold text-rose-600 hover:underline"
                                >
                                    Reset Dates
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Transactions Table / List */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50/75">
                                <tr>
                                    <th
                                        onClick={() => toggleSort('date')}
                                        className="cursor-pointer px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Date</span>
                                            {sortBy === 'date' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => toggleSort('description')}
                                        className="cursor-pointer px-4 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Transaction Name & Breakdown</span>
                                            {sortBy === 'description' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => toggleSort('category')}
                                        className="cursor-pointer px-4 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Category</span>
                                            {sortBy === 'category' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
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
                                            {sortBy === 'amount' ? (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence>
                                    {filteredRecords.map((t) => (
                                        <motion.tr
                                            key={t.id}
                                            layout
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-emerald-50/30 transition-colors"
                                        >
                                            <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                {t.date}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                                        {t.description}
                                                    </span>
                                                    {t.referenceId && (
                                                        <span className="font-mono text-[10px] text-slate-400">
                                                            Ref: {t.referenceId}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60">
                                                    {t.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {t.source === 'AUTO' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                                                        <Sparkles className="h-3 w-3" />
                                                        <span>AUTO</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 border border-blue-200/60">
                                                        <User className="h-3 w-3" />
                                                        <span>MANUAL</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-sm font-black text-emerald-600 whitespace-nowrap">
                                                +{fmt(t.amount)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setSelectedRecord(t)}
                                                        title="View Details"
                                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {t.source === 'MANUAL' && (
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            title="Delete Record"
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="divide-y divide-slate-100 md:hidden">
                        {filteredRecords.map(t => (
                            <div key={t.id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-bold text-slate-900 leading-snug">{t.description}</p>
                                    <p className="font-mono text-sm font-black text-emerald-600 shrink-0">+{fmt(t.amount)}</p>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">{t.category?.name || 'Uncategorized'}</span>
                                        <span className="font-mono text-[11px] text-slate-400">{t.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setSelectedRecord(t)}
                                            className="p-1 text-slate-400 hover:text-slate-700"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {t.source === 'MANUAL' && (
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-1 text-slate-400 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredRecords.length === 0 && (
                        <div className="py-16 text-center">
                            <Layers className="mx-auto h-10 w-10 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-700">No income records matching your search</p>
                            <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or search keywords</p>
                        </div>
                    )}
                </div>

                </div>
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedRecord && (
                    <Modal onClose={() => setSelectedRecord(null)} maxWidth="max-w-lg">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-slate-900">Income Record Details</span>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4 p-6 text-sm">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-center">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">Income Inflow</span>
                                <p className="mt-1 font-mono text-3xl font-black text-emerald-600">+{fmt(selectedRecord.amount)}</p>
                            </div>

                            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <div>
                                    <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</Label>
                                    <p className="mt-0.5 font-semibold text-slate-900">{selectedRecord.description}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-200/60 sm:grid-cols-2">
                                    <div>
                                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</Label>
                                        <p className="mt-0.5 font-medium text-slate-800">{selectedRecord.category?.name || 'Uncategorized'}</p>
                                    </div>
                                    <div>
                                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction Date</Label>
                                        <p className="mt-0.5 font-mono text-slate-800">{selectedRecord.date}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-200/60 sm:grid-cols-2">
                                    <div>
                                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Source</Label>
                                        <div className="mt-0.5">
                                            <span className={cn(
                                                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold',
                                                selectedRecord.source === 'AUTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                            )}>
                                                {selectedRecord.source}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedRecord.referenceId && (
                                        <div>
                                            <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference / ID</Label>
                                            <div className="mt-0.5 flex items-center gap-1.5">
                                                <span className="font-mono text-xs text-slate-700 truncate max-w-[140px]">{selectedRecord.referenceId}</span>
                                                <button
                                                    onClick={() => copyToClipboard(selectedRecord.referenceId!)}
                                                    className="text-slate-400 hover:text-slate-600"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <Button variant="outline" onClick={() => setSelectedRecord(null)} className="rounded-xl px-5 text-xs font-semibold">
                                Close
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Record Income Modal */}
            <AnimatePresence>
                {showForm && (
                    <Modal onClose={() => !submitting && !creatingCat && setShowForm(false)}>
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-slate-900">Record Manual Income</span>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                disabled={submitting || creatingCat}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4 p-6">
                            <div>
                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Income Description *
                                </Label>
                                <input
                                    disabled={submitting}
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="e.g. PTA Voluntary Contribution / Govt Grant"
                                    className={fieldCls}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Category *
                                        </Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewCatInput(v => !v)}
                                            className="text-[10px] font-bold text-emerald-600 hover:underline"
                                        >
                                            {showNewCatInput ? 'Close' : '+ New Category'}
                                        </button>
                                    </div>

                                    {showNewCatInput ? (
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                value={newCatName}
                                                onChange={e => setNewCatName(e.target.value)}
                                                placeholder="Category name"
                                                className="w-full rounded-xl border border-emerald-300 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-100"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={creatingCat || !newCatName.trim()}
                                                onClick={handleQuickCreateCategory}
                                                className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                                            >
                                                {creatingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <select
                                            disabled={submitting}
                                            value={form.categoryId}
                                            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                            className={fieldCls}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Date *
                                    </Label>
                                    <input
                                        disabled={submitting}
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className={fieldCls}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Amount (₦) *
                                </Label>
                                <input
                                    disabled={submitting}
                                    type="number"
                                    min={0}
                                    value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="e.g. 50000"
                                    className={fieldCls}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(false)}
                                disabled={submitting}
                                className="flex-1 rounded-xl text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAdd}
                                disabled={submitting || !form.description.trim() || !form.amount || !form.categoryId}
                                className="flex-1 gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 disabled:opacity-60 transition-all"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving Income Record...</span>
                                    </>
                                ) : (
                                    <span>Save Income Record</span>
                                )}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}
