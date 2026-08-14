import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, Activity, FileText, Wallet, Loader2,
    ChevronDown, ChevronUp, Users,
    CheckCircle2, Clock, AlertTriangle,
    CreditCard, Banknote, Smartphone, ArrowRight, PieChart as PieChartIcon, BarChart2, MessageCircle, Bell, X
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SettingsShell } from '../settings/shared/SettingsShell';

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG'); }

const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string; hex: string; icon: any }> = {
    PAYSTACK:          { label: 'Paystack',      color: 'text-[#7C3559]',  bg: 'bg-[#7C3559]/10', hex: '#7C3559', icon: Smartphone },
    CASH:              { label: 'Cash',          color: 'text-emerald-600', bg: 'bg-emerald-50',  hex: '#059669', icon: Banknote },
    POS:               { label: 'POS',           color: 'text-teal-600',   bg: 'bg-teal-50',      hex: '#0d9488', icon: CreditCard },
    BANK_TRANSFER:     { label: 'Bank Transfer', color: 'text-[#1E4DA6]',  bg: 'bg-[#1E4DA6]/10', hex: '#1E4DA6', icon: Banknote },
    WALLET:            { label: 'Wallet',        color: 'text-[#B8860B]',  bg: 'bg-[#B8860B]/10', hex: '#B8860B', icon: Wallet },
    MANUAL_ADJUSTMENT: { label: 'Manual Adj.',   color: 'text-slate-600',  bg: 'bg-slate-50',     hex: '#64748b', icon: DollarSign },
};

const STATUS_COLORS: Record<string, string> = {
    PAID:    'bg-emerald-50 text-emerald-700',
    PARTIAL: 'bg-amber-50 text-amber-700',
    OPEN:    'bg-slate-100 text-slate-600',
    DRAFT:   'bg-slate-100 text-slate-500',
    UNPAID:  'bg-red-50 text-red-600',
};

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

function CollectionBar({ rate }: { rate: number }) {
    const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Collection Rate</span>
                <span className="mono font-bold" style={{ color }}>{rate}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(rate, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function FinanceDashboard() {
    const [loading, setLoading]           = useState(true);
    const [stats, setStats]               = useState<any>({});
    const [recentTx, setRecentTx]         = useState<any[]>([]);
    const [methodBreakdown, setMethodBreakdown] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [filters, setFilters]           = useState({ term: '', academicYear: '', paymentMethod: '' });
    const [sessions, setSessions]         = useState<any[]>([]);
    const [terms, setTerms]               = useState<any[]>([]);

    // class drill-down
    const [classes, setClasses]           = useState<any[]>([]);
    const [classLoading, setClassLoading] = useState(true);
    const [expandedClass, setExpandedClass]   = useState<string | null>(null);
    const [classStudents, setClassStudents]   = useState<Record<string, any[]>>({});
    const [studentsLoading, setStudentsLoading] = useState<Record<string, boolean>>({});
    
    // new activity tracking
    const [newTransactionsCount, setNewTransactionsCount] = useState(0);
    const [alertDismissed, setAlertDismissed] = useState(false);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const lastViewed = localStorage.getItem('lastFinanceView');
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
            if (lastViewed) params.append('lastViewed', lastViewed);
            
            const { data } = await axios.get(`/api/v1/finance-v2/dashboard?${params}`, { withCredentials: true });
            setStats(data.stats || {});
            if (data.stats?.newTransactionsCount > 0) {
                setNewTransactionsCount(data.stats.newTransactionsCount);
            }
            setRecentTx(data.recentTransactions || []);
            setMethodBreakdown(data.methodBreakdown || []);
            try {
                const actRes = await axios.get('/api/v1/finance-v2/dashboard/activity', { withCredentials: true });
                setRecentActivity(actRes.data.activities || []);
            } catch (e) {
                console.error("Failed to fetch activity", e);
            }
        } catch (err) {
            console.error('Failed to fetch finance dashboard', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchClasses = useCallback(async () => {
        setClassLoading(true);
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
            const { data } = await axios.get(`/api/v1/finance-v2/billing/classes?${params}`, { withCredentials: true });
            setClasses(data.summary || []);
        } catch { }
        finally { setClassLoading(false); }
    }, [filters]);

    const fetchMetadata = useCallback(async () => {
        try {
            const [sessRes, termRes] = await Promise.all([
                axios.get('/api/v1/sessions', { withCredentials: true }),
                axios.get('/api/v1/terms', { withCredentials: true })
            ]);
            setSessions(sessRes.data.sessions || []);
            setTerms(termRes.data.terms || []);
        } catch { }
    }, []);

    useEffect(() => { fetchDashboard(); fetchClasses(); }, [fetchDashboard, fetchClasses]);
    useEffect(() => { fetchMetadata(); }, [fetchMetadata]);

    // Update last viewed on unmount
    useEffect(() => {
        return () => {
            localStorage.setItem('lastFinanceView', new Date().toISOString());
        };
    }, []);

    const handleExpandClass = async (classId: string) => {
        if (expandedClass === classId) { setExpandedClass(null); return; }
        setExpandedClass(classId);
        if (classStudents[classId]) return;
        setStudentsLoading(s => ({ ...s, [classId]: true }));
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
            const { data } = await axios.get(`/api/v1/finance-v2/billing/classes/${classId}/students?${params}`, { withCredentials: true });
            setClassStudents(s => ({ ...s, [classId]: data.students || [] }));
        } catch { }
        finally { setStudentsLoading(s => ({ ...s, [classId]: false })); }
    };

    // ── KPI stat card data ────────────────────────────────────────────────────
    const statCards = [
        { label: 'Expected School Fees',    value: fmt(stats.expectedFees),       icon: <FileText  className="h-4 w-4" />, c: 'blue'   },
        { label: 'Collected Fees',          value: fmt(stats.collectedFees),       icon: <DollarSign className="h-4 w-4" />, c: 'emerald' },
        { label: 'Outstanding Balance',       value: fmt(stats.outstandingBalance),  icon: <AlertTriangle  className="h-4 w-4" />, c: 'amber'  },
        { label: 'Wallet Holds',      value: fmt(stats.totalWalletBalance),  icon: <Wallet    className="h-4 w-4" />, c: 'purple' },
        { label: 'Total Income',       value: fmt(stats.totalIncome),  icon: <Activity  className="h-4 w-4" />, c: 'blue'  },
        { label: 'Total Expenses',      value: fmt(stats.totalExpense),  icon: <Banknote    className="h-4 w-4" />, c: 'amber' },
        { label: 'Total Payroll',      value: fmt(stats.totalPayroll),  icon: <Users    className="h-4 w-4" />, c: 'slate' },
        { label: 'Receipts Issued',      value: String(stats.receiptCount || 0),  icon: <CheckCircle2    className="h-4 w-4" />, c: 'emerald' },
    ];

    const COLOR_MAP: Record<string, string> = {
        blue:    'bg-[#1E4DA6]/10 text-[#1E4DA6]',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber:   'bg-amber-50  text-amber-600',
        purple:  'bg-[#7C3559]/10 text-[#7C3559]',
        slate:   'bg-slate-100 text-slate-500',
    };

    return (
        <SettingsShell breadcrumbParent="Finance" breadcrumbCurrent="Dashboard" tabLabel="Dashboard" tabIcon={<Activity className="h-3.5 w-3.5" />}>
            <div className="mono-scope">
                <style>{`.mono-scope .mono{font-family:'DM Mono',monospace}`}</style>

                <div className="relative z-10">

                    {/* New Activity Alert Banner */}
                    <AnimatePresence>
                        {!loading && newTransactionsCount > 0 && !alertDismissed && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E4DA6] to-[#173F8C] shadow-lg shadow-[#0E2450]/20"
                            >
                                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md sm:h-10 sm:w-10">
                                            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white sm:text-base">New Activity Detected</h3>
                                            <p className="text-xs text-white/80 sm:text-sm">
                                                There {newTransactionsCount === 1 ? 'is' : 'are'} {newTransactionsCount} new {newTransactionsCount === 1 ? 'transaction' : 'transactions'} since you last checked.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <Link
                                            to="/dashboard/finance/payments"
                                            className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#173F8C] shadow-sm transition-colors hover:bg-[#1E4DA6]/5 sm:text-sm"
                                        >
                                            View List
                                        </Link>
                                        <button
                                            onClick={() => setAlertDismissed(true)}
                                            className="rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4 pb-6 border-b border-slate-200">
                        <div>
                            <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#1C2333]">Finance Overview</h1>
                            <p className="mt-1.5 text-sm text-slate-500">School-wide collection stats, class breakdown, and recent activity.</p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={filters.term}
                                onChange={e => setFilters(f => ({ ...f, term: e.target.value }))}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            >
                                <option value="">All Terms</option>
                                {Array.from(new Set(terms.map(t => t.name))).map(name => (
                                    <option key={name as string} value={name as string}>{name as string}</option>
                                ))}
                            </select>
                            <select
                                value={filters.academicYear}
                                onChange={e => setFilters(f => ({ ...f, academicYear: e.target.value }))}
                                className="h-9 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            >
                                <option value="">All Sessions</option>
                                {sessions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <select
                                value={filters.paymentMethod}
                                onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            >
                                <option value="">All Methods</option>
                                {Object.keys(METHOD_CONFIG).map(k => <option key={k} value={k}>{METHOD_CONFIG[k].label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* KPI Stat Cards */}
                    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {loading
                            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)
                            : statCards.map((s, i) => (
                                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${COLOR_MAP[s.c]}`}>{s.icon}</div>
                                    <p className="mono wrap-break-word text-base font-black leading-tight text-slate-900 sm:text-xl lg:text-2xl" title={s.value}>{s.value}</p>
                                    <p className="mono mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                                </motion.div>
                            ))
                        }
                    </div>

                    {/* Collection Rate Card */}
                    {!loading && stats.collectionRate !== undefined && (
                        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                <h2 className="font-bold text-slate-800">Collection Rate</h2>
                                <div className="flex gap-5 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Paid: <span className="mono font-bold text-slate-800">{stats.paidCount}</span></span>
                                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" />Partial: <span className="mono font-bold text-slate-800">{stats.partialCount}</span></span>
                                    <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-red-500" />Unpaid: <span className="mono font-bold text-slate-800">{stats.overdueCount}</span></span>
                                </div>
                            </div>
                            <div className="px-6 py-5">
                                <CollectionBar rate={stats.collectionRate} />
                            </div>
                        </div>
                    )}

                    {/* Charts Section */}
                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Outstanding by Class Bar Chart */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="font-bold text-slate-800 flex items-center gap-2"><BarChart2 className="h-5 w-5 text-[#1E4DA6]" /> Outstanding Balances by Class</h2>
                            </div>
                            <div className="h-64">
                                {classes.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={classes.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <XAxis type="number" tickFormatter={(v) => `₦${(v/1000)}k`} />
                                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                                            <Tooltip formatter={(value: any) => [fmt(Number(value)), 'Outstanding']} cursor={{fill: '#f1f5f9'}} />
                                            <Bar dataKey="outstanding" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400">No data available</div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Distribution */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="font-bold text-slate-800 flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-emerald-500" /> Payment Methods</h2>
                            </div>
                            <div className="h-64 flex items-center justify-center">
                                {methodBreakdown.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={methodBreakdown.map(m => ({ name: METHOD_CONFIG[m.method]?.label || m.method, value: m.total }))}
                                                cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                                                paddingAngle={5} dataKey="value"
                                            >
                                                {methodBreakdown.map((m, index) => (
                                                    <Cell key={`cell-${index}`} fill={METHOD_CONFIG[m.method]?.hex || '#94a3b8'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => [fmt(Number(value)), 'Collected']} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400">No payment data</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main two-column layout */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                        {/* Class Breakdown — 2/3 width */}
                        <div className="lg:col-span-2">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                    <h2 className="font-bold text-slate-800">Class-Level Breakdown</h2>
                                    <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{classes.length} classes</span>
                                </div>

                                {classLoading ? (
                                    <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                                ) : classes.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><FileText className="h-6 w-6 text-slate-400" /></div>
                                        <p className="font-semibold text-slate-500">No class billing data yet</p>
                                        <p className="text-xs text-slate-400">Generate invoices to see class summaries here.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                            <thead className="border-b border-slate-200">
                                                <tr>
                                                    {['Class', 'Students', 'Expected', 'Paid', 'Outstanding', ''].map(h => (
                                                        <th key={h} className={`px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 ${['Expected','Paid','Outstanding'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {classes.map(cls => {
                                                    const rate = cls.expected > 0 ? Math.round((cls.paid / cls.expected) * 100) : 0;
                                                    const isExpanded = expandedClass === cls.id;
                                                    const students  = classStudents[cls.id] || [];
                                                    const isLoadingStudents = studentsLoading[cls.id];

                                                    return (
                                                        <React.Fragment key={cls.id}>
                                                            <tr
                                                                onClick={() => handleExpandClass(cls.id)}
                                                                className="group cursor-pointer transition-colors hover:bg-slate-50/60"
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-slate-900 truncate">{cls.name}</p>
                                                                    <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="mono flex items-center gap-1 text-xs text-slate-500">
                                                                        <Users className="h-3 w-3" />{cls.studentCount}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right mono text-xs text-slate-700">{fmt(cls.expected)}</td>
                                                                <td className="px-6 py-4 text-right mono text-xs font-semibold text-emerald-700">{fmt(cls.paid)}</td>
                                                                <td className={`px-6 py-4 text-right mono text-xs font-bold ${cls.outstanding > 0 ? 'text-red-600' : 'text-slate-400'}`}>{fmt(cls.outstanding)}</td>
                                                                <td className="px-6 py-4 text-right text-slate-400">
                                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                </td>
                                                            </tr>
                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <tr>
                                                                        <td colSpan={6} className="p-0 border-t border-slate-50 bg-slate-50/40">
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                {isLoadingStudents ? (
                                                                                    <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                                                                                ) : students.length === 0 ? (
                                                                                    <p className="px-8 py-4 text-xs italic text-slate-400">No billed students found for these filters.</p>
                                                                                ) : (
                                                                                    <div className="overflow-x-auto">
                                                                                        <table className="w-full text-xs text-left border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                                                                            <thead className="border-b border-slate-200">
                                                                                                <tr>
                                                                                                    {['Student', 'Status', 'Expected', 'Paid', 'Balance'].map(h => (
                                                                                                        <th key={h} className={`px-8 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 ${['Expected','Paid','Balance'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                                                                                                    ))}
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody className="divide-y divide-slate-100/60">
                                                                                                {students.map((s: any) => (
                                                                                                    <tr key={s.id} className="hover:bg-slate-100/30">
                                                                                                        <td className="px-8 py-3">
                                                                                                            <p className="font-bold text-slate-800 truncate">{s.name}</p>
                                                                                                            <p className="mono text-[10px] text-slate-400">{s.admissionNo}</p>
                                                                                                        </td>
                                                                                                        <td className="px-8 py-3">
                                                                                                            <span className={`mono inline-flex w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_COLORS[s.billingStatus] || 'bg-slate-100 text-slate-500'}`}>
                                                                                                                {s.billingStatus}
                                                                                                            </span>
                                                                                                        </td>
                                                                                                        <td className="px-8 py-3 text-right mono text-slate-700">{fmt(s.totalExpected)}</td>
                                                                                                        <td className="px-8 py-3 text-right mono text-emerald-700">{fmt(s.totalPaid)}</td>
                                                                                                        <td className={`px-8 py-3 text-right mono font-bold ${s.totalOutstanding > 0 ? 'text-red-600' : 'text-slate-400'}`}>{fmt(s.totalOutstanding)}</td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                )}
                                                                            </motion.div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </AnimatePresence>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right column: method breakdown + recent transactions — 1/3 */}
                        <div className="space-y-5">

                            {/* By Payment Method */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="font-bold text-slate-800">By Payment Method</h2>
                                </div>
                                {loading ? (
                                    <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                                ) : methodBreakdown.length === 0 ? (
                                    <p className="px-5 py-8 text-center text-xs italic text-slate-400">No collections yet.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                            <thead className="border-b border-slate-200">
                                                <tr>
                                                    <th className="px-5 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Method</th>
                                                    <th className="px-5 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {[...methodBreakdown].sort((a, b) => b.total - a.total).map((m: any) => {
                                                    const cfg = METHOD_CONFIG[m.method] || { label: m.method, color: 'text-slate-600', bg: 'bg-slate-50', icon: DollarSign };
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <tr key={m.method} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}>
                                                                        <Icon className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-bold text-slate-700">{cfg.label}</p>
                                                                        <p className="mono text-[10px] text-slate-400">{m.count} tx</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-right">
                                                                <p className={`mono text-sm font-black ${cfg.color}`}>{fmt(m.total)}</p>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Recent Collections */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="font-bold text-slate-800">Recent Collections</h2>
                                </div>
                                {loading ? (
                                    <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                                ) : recentTx.length === 0 ? (
                                    <p className="px-5 py-8 text-center text-xs italic text-slate-400">No transactions yet.</p>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                                <thead className="border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-5 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Transaction</th>
                                                        <th className="px-5 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {recentTx.map((tx: any) => {
                                                        const cfg = METHOD_CONFIG[tx.method] || { label: tx.method, color: 'text-slate-600', bg: 'bg-slate-50', icon: DollarSign };
                                                        const Icon = cfg.icon;
                                                        return (
                                                            <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}>
                                                                            <Icon className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-xs font-bold text-slate-800">{tx.studentName}</p>
                                                                            <p className="mono text-[10px] text-slate-400">{tx.reference}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3 text-right">
                                                                    <p className="mono text-sm font-black text-emerald-700">{fmt(tx.amount)}</p>
                                                                    <p className="mono text-[10px] text-slate-400">
                                                                        {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : '—'}
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex justify-end border-t border-slate-50 px-5 py-3">
                                            <a href="/dashboard/finance/payment-records" className="flex items-center gap-1 text-xs font-bold text-[#1E4DA6] hover:underline">
                                                View all <ArrowRight className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Activity Feed */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="font-bold text-slate-800">Activity Feed</h2>
                                </div>
                                <div className="p-5">
                                    {loading ? (
                                        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                                    ) : recentActivity.length === 0 ? (
                                        <p className="text-center text-xs italic text-slate-400">No recent activity.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {recentActivity.map((act) => {
                                                const isPayment = act.type === 'PAYMENT';
                                                const isMessage = act.type === 'MESSAGE_SENT';
                                                const Icon = isPayment ? DollarSign : isMessage ? MessageCircle : Bell;
                                                const color = isPayment ? 'text-emerald-600 bg-emerald-50' : isMessage ? 'text-[#1E4DA6] bg-[#1E4DA6]/5' : 'text-amber-600 bg-amber-50';
                                                return (
                                                    <div key={act.id} className="flex gap-3 items-start">
                                                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5", color)}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{act.title}</p>
                                                            <p className="text-xs text-slate-500">{act.description}</p>
                                                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{new Date(act.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
}
