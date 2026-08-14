/**
 * Salary.tsx — Staff payroll management
 * Redesigned: Tailwind CSS + shadcn/ui, animated, fully mobile responsive
 * All API calls, state logic, and business logic unchanged.
 */
import { useState, useEffect } from 'react';
import {
    Search, Download, CheckCircle2, Clock, DollarSign, Users,
    TrendingUp, Loader2, ChevronRight, Banknote
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StaffPayroll {
    id: string; teacherId: string; name: string; role: string;
    avatar: string; avatarColor: string; department: string;
    basic: number; allowance: number; deduction: number;
    status: 'paid' | 'pending'; payPeriod: string;
    bankName?: string; accountNumber?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-[#1E4DA6]', 'bg-[#1E4DA6]', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG'); }

function Avatar({ name }: { name: string }) {
    return (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm', avatarBg(name))}>
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg, iconText, delay }: {
    icon: React.ReactNode; label: string; value: string | number;
    iconBg: string; iconText: string; delay: number;
}) {
    const [vis, setVis] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
    return (
        <div className={cn(
            'flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-500',
            'hover:shadow-md hover:-translate-y-0.5',
            vis ? 'opacity-100' : 'translate-y-3 opacity-0'
        )}>
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg, iconText)}>{icon}</div>
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="font-mono text-lg font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div key="modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div key="modal"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Payroll() {
    const [search, setSearch] = useState('');
    const [payroll, setPayroll] = useState<StaffPayroll[]>([]);
    const [payPeriod] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmingPay, setConfirmingPay] = useState<StaffPayroll | null>(null);
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => { const t = setTimeout(() => setPageVisible(true), 60); return () => clearTimeout(t); }, []);

    // ── Fetch (unchanged) ─────────────────────────────────────────────────────
    useEffect(() => {
        axios.get('/api/v1/finance/salaries', { withCredentials: true })
            .then(res => setPayroll(res.data.payroll))
            .catch(err => console.error('Error fetching payroll', err))
            .finally(() => setLoading(false));
    }, []);

    const displayed = payroll.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
    );

    const totalPayable = payroll.reduce((s, e) => s + e.basic + e.allowance - e.deduction, 0);
    const totalPaid = payroll.filter(e => e.status === 'paid').reduce((s, e) => s + e.basic + e.allowance - e.deduction, 0);
    const pending = payroll.filter(e => e.status === 'pending').length;
    const paidPct = payroll.length > 0 ? Math.round((payroll.filter(e => e.status === 'paid').length / payroll.length) * 100) : 0;

    // ── Handlers (unchanged) ──────────────────────────────────────────────────
    const executePayment = async (staff: StaffPayroll) => {
        setProcessingId(staff.id);
        setConfirmingPay(null);
        try {
            await axios.post('/api/v1/finance/salaries', { slipId: staff.id, gateway: 'Flutterwave' }, { withCredentials: true });
            setPayroll(p => p.map(e => e.id === staff.id ? { ...e, status: 'paid' } : e));
        } catch (err) { console.error('Error paying salary slip', err); }
        finally { setProcessingId(null); }
    };

    const payAll = async () => {
        for (const slip of payroll.filter(p => p.status === 'pending')) await executePayment(slip);
    };

    if (loading) return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">Loading payroll…</span>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .sal-root .font-mono   { font-family: 'DM Mono', monospace !important; }
                @keyframes sal-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes sal-pulse { 0%{transform:scale(0.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }
                .sal-float { animation: sal-float 3.5s ease-in-out infinite; }
                .sal-pulse { animation: sal-pulse 2.4s ease-out infinite; }
            `}</style>

            <div className="sal-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-6 flex items-center gap-1.5 transition-all duration-500', pageVisible ? 'opacity-100' : '-translate-y-2 opacity-0')}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Salary & Payroll</span>
                    </div>

                    {/* Main panel */}
                    <div className={cn(
                        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-500',
                        pageVisible ? 'opacity-100' : 'translate-y-3 opacity-0'
                    )}>
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6">
                            <div className="inline-flex items-center gap-2 border-b-2 border-[#1E4DA6] pb-3 pt-3.5">
                                <Banknote className="h-3.5 w-3.5 text-[#1E4DA6]" />
                                <span className="text-xs font-bold tracking-tight text-[#1E4DA6]">Payroll Manager</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* Hero + actions */}
                            <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="sal-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="sal-pulse absolute inset-0 rounded-2xl bg-[#1E4DA6]/8" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] shadow-lg shadow-[#1E4DA6]/20">
                                        <Banknote className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Salary & Payroll</h2>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-500">Manage staff salaries for <span className="font-bold text-[#173F8C]">{payPeriod}</span>.</p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:self-start">
                                    {pending > 0 && (
                                        <Button onClick={payAll}
                                            className="h-9 gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all hover:scale-[1.02] hover:bg-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Pay All Pending
                                        </Button>
                                    )}
                                    <Button variant="outline"
                                        className="h-9 gap-1.5 rounded-xl text-xs font-semibold text-slate-600">
                                        <Download className="h-3.5 w-3.5" /> Export Payslips
                                    </Button>
                                </div>
                            </div>

                            {/* KPI cards */}
                            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {[
                                    { icon: <Users className="h-5 w-5" />, label: 'Total Staff', value: payroll.length, iconBg: 'bg-[#1E4DA6]/5', iconText: 'text-[#1E4DA6]', delay: 80 },
                                    { icon: <DollarSign className="h-5 w-5" />, label: 'Total Payable', value: fmt(totalPayable), iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', delay: 140 },
                                    { icon: <CheckCircle2 className="h-5 w-5" />, label: 'Total Paid', value: fmt(totalPaid), iconBg: 'bg-[#1E4DA6]/5', iconText: 'text-[#1E4DA6]', delay: 200 },
                                    { icon: <Clock className="h-5 w-5" />, label: 'Pending', value: `${pending} staff`, iconBg: pending > 0 ? 'bg-amber-50' : 'bg-slate-100', iconText: pending > 0 ? 'text-amber-600' : 'text-slate-400', delay: 260 },
                                ].map(s => <StatCard key={s.label} {...s} />)}
                            </div>

                            {/* Progress bar */}
                            <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-[#1E4DA6]" />
                                        <span className="font-bold text-slate-800 text-sm">Payroll Progress</span>
                                    </div>
                                    <span className="font-mono text-sm font-black text-[#1E4DA6]">{paidPct}%</span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${paidPct}%` }}
                                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#1E4DA6] to-emerald-500"
                                    />
                                </div>
                                <p className="mt-2 font-mono text-[11px] text-slate-400">
                                    <span className="font-bold text-[#173F8C]">{payroll.filter(e => e.status === 'paid').length}/{payroll.length}</span> staff paid for {payPeriod}.{' '}
                                    {pending > 0 ? `${pending} payment(s) still pending.` : '✓ All payments up to date.'}
                                </p>
                            </div>

                            {/* Search */}
                            <div className="mb-5 max-w-sm">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search staff by name or role…"
                                        className="h-10 border-slate-200 bg-white pl-9 text-sm shadow-sm focus-visible:border-[#1E4DA6]/60 focus-visible:ring-2 focus-visible:ring-[#1E4DA6]/10" />
                                </div>
                            </div>

                            <Separator className="mb-5 bg-slate-100" />

                            {/* ── DESKTOP TABLE ──────────────────────── */}
                            <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm md:block">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-slate-100 bg-slate-50/80">
                                        <tr>
                                            {[
                                                { h: 'Staff Member', align: 'text-left' },
                                                { h: 'Section', align: 'text-left' },
                                                { h: 'Basic', align: 'text-right' },
                                                { h: 'Allowance', align: 'text-right' },
                                                { h: 'Deduction', align: 'text-right' },
                                                { h: 'Net Pay', align: 'text-right' },
                                                { h: 'Status', align: 'text-center' },
                                                { h: 'Action', align: 'text-center' },
                                            ].map(({ h, align }) => (
                                                <th key={h} className={cn('px-4 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400', align)}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence mode="popLayout">
                                            {displayed.map((e, i) => {
                                                const netPay = e.basic + e.allowance - e.deduction;
                                                return (
                                                    <motion.tr key={e.id} layout
                                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.25, delay: i * 30 / 1000 }}
                                                        className="group border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                                                    >
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar name={e.name} />
                                                                <div>
                                                                    <p className="font-bold text-slate-900 group-hover:text-[#173F8C] transition-colors">{e.name}</p>
                                                                    <p className="font-mono text-[11px] text-slate-400">
                                                                        {e.role}{e.accountNumber && e.accountNumber !== 'Pending Details' ? ` · ${e.bankName} ${e.accountNumber}` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-sm text-slate-500">{e.department}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-700">{fmt(e.basic)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-emerald-600">+{fmt(e.allowance)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-red-500">-{fmt(e.deduction)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-sm font-black text-[#173F8C]">{fmt(netPay)}</td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {e.status === 'paid'
                                                                ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" />Paid</span>
                                                                : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-600"><Clock className="h-3 w-3" />Pending</span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {e.status === 'pending' ? (
                                                                <button onClick={() => setConfirmingPay(e)} disabled={processingId === e.id}
                                                                    className="inline-flex min-w-[72px] items-center justify-center gap-1.5 rounded-xl bg-[#173F8C] px-3 py-1.5 font-mono text-[10px] font-bold text-white shadow-sm transition-all hover:bg-[#122F69] disabled:opacity-60">
                                                                    {processingId === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pay Now'}
                                                                </button>
                                                            ) : (
                                                                <button className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-mono text-[10px] font-semibold text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50">
                                                                    <Download className="h-3 w-3" /> Payslip
                                                                </button>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                    {/* Totals footer */}
                                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
                                        <tr>
                                            <td colSpan={5} className="px-5 py-3.5 font-bold text-slate-700">Total Net Payroll</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-base font-black text-[#173F8C]">{fmt(totalPayable)}</td>
                                            <td colSpan={2} />
                                        </tr>
                                    </tfoot>
                                </table>
                                {displayed.length === 0 && (
                                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><Banknote className="h-5 w-5 text-slate-400" /></div>
                                        <p className="font-semibold text-slate-500">No staff match your search</p>
                                    </div>
                                )}
                            </div>

                            {/* ── MOBILE CARDS ───────────────────────── */}
                            <div className="space-y-3 md:hidden">
                                <AnimatePresence mode="popLayout">
                                    {displayed.map((e, i) => {
                                        const netPay = e.basic + e.allowance - e.deduction;
                                        return (
                                            <motion.div key={e.id} layout
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.3, delay: i * 40 / 1000 }}
                                            >
                                                <Card className={cn(
                                                    'overflow-hidden border transition-all hover:shadow-md hover:-translate-y-0.5',
                                                    e.status === 'paid' ? 'border-emerald-100' : 'border-amber-100'
                                                )}>
                                                    <div className={cn('h-1 w-full', e.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400')} />
                                                    <CardContent className="p-4">
                                                        {/* Header */}
                                                        <div className="mb-3 flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar name={e.name} />
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{e.name}</p>
                                                                    <p className="font-mono text-[11px] text-slate-400">{e.role} · {e.department}</p>
                                                                </div>
                                                            </div>
                                                            {e.status === 'paid'
                                                                ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" />Paid</span>
                                                                : <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-600"><Clock className="h-3 w-3" />Pending</span>
                                                            }
                                                        </div>

                                                        {/* Breakdown */}
                                                        <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                                            {[
                                                                { label: 'Basic', value: fmt(e.basic), cls: 'text-slate-700' },
                                                                { label: 'Allowance', value: `+${fmt(e.allowance)}`, cls: 'text-emerald-600' },
                                                                { label: 'Deduction', value: `-${fmt(e.deduction)}`, cls: 'text-red-500' },
                                                            ].map(({ label, value, cls }) => (
                                                                <div key={label} className="text-center">
                                                                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                                                    <p className={cn('font-mono text-xs font-bold', cls)}>{value}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Net pay + action */}
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Net Pay</p>
                                                                <p className="font-mono text-xl font-black text-[#173F8C]">{fmt(netPay)}</p>
                                                            </div>
                                                            {e.status === 'pending' ? (
                                                                <button onClick={() => setConfirmingPay(e)} disabled={processingId === e.id}
                                                                    className="flex items-center gap-2 rounded-xl bg-[#173F8C] px-4 py-2.5 font-mono text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 transition-all hover:bg-[#122F69] disabled:opacity-60">
                                                                    {processingId === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                                    {processingId === e.id ? 'Processing…' : 'Pay Now'}
                                                                </button>
                                                            ) : (
                                                                <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-xs font-semibold text-slate-500 transition-all hover:border-slate-300">
                                                                    <Download className="h-3.5 w-3.5" /> Payslip
                                                                </button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Mobile total */}
                                {displayed.length > 0 && (
                                    <div className="flex items-center justify-between rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 px-5 py-4">
                                        <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500">Total Net Payroll</span>
                                        <span className="font-mono text-lg font-black text-[#173F8C]">{fmt(totalPayable)}</span>
                                    </div>
                                )}

                                {displayed.length === 0 && (
                                    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><Banknote className="h-5 w-5 text-slate-400" /></div>
                                        <p className="font-semibold text-slate-500">No staff match your search</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Confirm Payment Modal ──────────────── */}
            <AnimatePresence>
                {confirmingPay && (
                    <Modal onClose={() => setConfirmingPay(null)}>
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                            <div>
                                <p className="font-bold text-slate-900">Confirm Salary Payment</p>
                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">Review bank details before authorizing payout.</p>
                            </div>
                            <button onClick={() => setConfirmingPay(null)}
                                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 p-6">
                            {/* Staff pill */}
                            <div className="flex items-center gap-4 rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-4">
                                <Avatar name={confirmingPay.name} />
                                <div>
                                    <p className="font-bold text-slate-900">{confirmingPay.name}</p>
                                    <p className="font-mono text-[11px] text-slate-400">{confirmingPay.role} · {confirmingPay.department}</p>
                                </div>
                            </div>

                            {/* Bank details */}
                            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                {[
                                    { label: 'Bank Name', value: confirmingPay.bankName || 'Not Set' },
                                    { label: 'Account Number', value: confirmingPay.accountNumber || 'Not Set' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-500">{label}</span>
                                        <span className={cn('font-mono text-sm font-bold', value === 'Not Set' ? 'text-red-400' : 'text-slate-900')}>{value}</span>
                                    </div>
                                ))}
                                <Separator className="bg-slate-200" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-500">Net Pay Authorized</span>
                                    <span className="font-mono text-xl font-black text-[#173F8C]">
                                        {fmt(confirmingPay.basic + confirmingPay.allowance - confirmingPay.deduction)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <Button variant="outline" onClick={() => setConfirmingPay(null)} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                            <Button
                                onClick={() => executePayment(confirmingPay)}
                                disabled={!confirmingPay.accountNumber || confirmingPay.accountNumber === 'Pending Details'}
                                className="flex-1 gap-2 rounded-xl bg-[#173F8C] text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69] disabled:opacity-50"
                            >
                                Authorize Payment
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
}
