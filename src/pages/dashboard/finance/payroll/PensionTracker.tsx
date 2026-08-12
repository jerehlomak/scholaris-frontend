import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
    Loader2, ChevronRight, Users, Check, ShieldCheck, TrendingUp,
    Calendar, Plus, Settings2, PiggyBank, X as CloseIcon
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface Staff { id: string; name: string; department: string; employeeId: string; }
interface PensionEntry {
    id: string; amount: number; date: string; payrollRunId?: string;
    payrollRun?: { month: number; year: number; runDate: string };
}
interface SchoolPensionSummary {
    totalAccumulated: number;
    uniqueContributors: number;
    thisYearTotal: number;
    staffConfiguredCount: number;
    totalStaff: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
const AC = ['bg-teal-500','bg-blue-500','bg-violet-500','bg-rose-500','bg-amber-500','bg-indigo-500'];
function avBg(n: string) { return AC[n.charCodeAt(0) % AC.length]; }

export default function PensionTracker() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [sel, setSel] = useState('');
    const [entries, setEntries] = useState<PensionEntry[]>([]);
    const [totalAccumulated, setTotalAccumulated] = useState(0);
    const [summary, setSummary] = useState<SchoolPensionSummary | null>(null);
    const [loadSt, setLoadSt] = useState(true);
    const [loadEn, setLoadEn] = useState(false);
    const [saving, setSaving] = useState(false);
    const [vis, setVis] = useState(false);

    // Ongoing Monthly Pension Modal
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [monthlyPensionAmount, setMonthlyPensionAmount] = useState('');

    // Ad-hoc Contribution Modal
    const [showAdhocModal, setShowAdhocModal] = useState(false);
    const [adhocAmount, setAdhocAmount] = useState('');
    const [adhocDate, setAdhocDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { const t = setTimeout(() => setVis(true), 60); return () => clearTimeout(t); }, []);

    const fetchSummary = () => {
        axios.get('/api/v1/payroll/pension/summary', { withCredentials: true })
            .then(r => setSummary(r.data.summary || null))
            .catch(() => {});
    };

    const fetchStaff = () => {
        axios.get('/api/v1/payroll/staff', { withCredentials: true })
            .then(r => setStaff(r.data.staff || []))
            .catch(() => toast.error('Failed to load staff'))
            .finally(() => setLoadSt(false));
    };

    useEffect(() => {
        fetchStaff();
        fetchSummary();
    }, []);

    const fetchStaffPension = (staffId: string) => {
        setLoadEn(true);
        axios.get(`/api/v1/payroll/pension/${staffId}`, { withCredentials: true })
            .then(r => {
                setEntries(r.data.entries || []);
                setTotalAccumulated(r.data.totalAccumulated || 0);
            })
            .catch(() => toast.error('Failed to load pension data'))
            .finally(() => setLoadEn(false));
    };

    useEffect(() => {
        if (!sel) { setEntries([]); setTotalAccumulated(0); return; }
        fetchStaffPension(sel);
    }, [sel]);

    const selStaff = staff.find(s => s.id === sel);

    const handleSaveMonthlyConfig = async () => {
        if (!sel || monthlyPensionAmount === '') return;
        setSaving(true);
        try {
            await axios.post('/api/v1/payroll/pension/setting', {
                staffId: sel,
                amount: parseFloat(monthlyPensionAmount) || 0
            }, { withCredentials: true });
            toast.success('Monthly pension deduction configured');
            setShowConfigModal(false);
            fetchStaff();
            fetchSummary();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update pension setting');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAdhoc = async () => {
        if (!sel || !adhocAmount || parseFloat(adhocAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        setSaving(true);
        try {
            await axios.post('/api/v1/payroll/pension/adhoc', {
                staffId: sel,
                amount: parseFloat(adhocAmount),
                date: adhocDate
            }, { withCredentials: true });
            toast.success('Pension contribution logged');
            setShowAdhocModal(false);
            setAdhocAmount('');
            fetchStaffPension(sel);
            fetchSummary();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to record contribution');
        } finally {
            setSaving(false);
        }
    };

    // Group entries by year for the timeline display
    const byYear = entries.reduce<Record<number, PensionEntry[]>>((acc, e) => {
        const y = new Date(e.date).getFullYear();
        if (!acc[y]) acc[y] = [];
        acc[y].push(e);
        return acc;
    }, {});
    const sortedYears = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');.pt-root,.pt-root *{font-family:'Plus Jakarta Sans',sans-serif!important}.pt-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="pt-root min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/20 px-3 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-5xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 transition-all duration-500 text-[9px] sm:text-[10px]', vis ? 'opacity-100' : 'opacity-0 -translate-y-2')}>
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Payroll</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-teal-600">Pension Tracker</span>
                    </div>

                    <div className={cn('mb-4 sm:mb-8 transition-all duration-500', vis ? 'opacity-100' : 'opacity-0 translate-y-3')}>
                        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Pension Tracker &amp; Setup</h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">View accumulated pension contributions, configure monthly deductions, and manage ad-hoc entries.</p>
                    </div>

                    {/* School-wide summary KPIs */}
                    {summary && (
                        <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-teal-200 bg-white/90 backdrop-blur shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <PiggyBank className="w-4 h-4 text-teal-600" />
                                    <p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">School Total Pension</p>
                                </div>
                                <p className="mono text-base sm:text-lg font-black text-teal-700">{fmt(summary.totalAccumulated)}</p>
                            </div>
                            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200 bg-white/90 backdrop-blur shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Contributors</p>
                                </div>
                                <p className="mono text-base sm:text-lg font-black text-emerald-700">{summary.uniqueContributors} Staff</p>
                            </div>
                            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-200 bg-white/90 backdrop-blur shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">This Year Total</p>
                                </div>
                                <p className="mono text-base sm:text-lg font-black text-blue-700">{fmt(summary.thisYearTotal)}</p>
                            </div>
                        </div>
                    )}

                    {/* Staff selector */}
                    <div className={cn('mb-5 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-xl transition-all duration-500', vis ? 'opacity-100' : 'opacity-0 translate-y-3')}>
                        <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                            </div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-800">Select Staff Member</h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {loadSt ? <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-4"><Loader2 className="h-4 w-4 animate-spin"/> Loading…</div> : (
                                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {staff.map(s => (
                                        <button key={s.id} onClick={() => setSel(s.id === sel ? '' : s.id)}
                                            className={cn('flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 text-left transition-all cursor-pointer',
                                                sel===s.id ? 'border-teal-300 bg-teal-50 shadow-md' : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40')}>
                                            <div className={cn('flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white', avBg(s.name))}>{s.name.substring(0,2).toUpperCase()}</div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn('truncate font-semibold text-xs sm:text-sm', sel===s.id ? 'text-teal-700' : 'text-slate-800')}>{s.name}</p>
                                                <p className="mono text-[10px] text-slate-400 truncate">{s.department || s.employeeId}</p>
                                            </div>
                                            {sel===s.id && <Check className="h-4 w-4 shrink-0 text-teal-600"/>}
                                        </button>
                                    ))}
                                    {!staff.length && <p className="col-span-3 py-8 text-center text-xs sm:text-sm text-slate-400">No active staff found.</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {sel && (
                            <motion.div key="pp" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}>

                                {/* Hero total & Action buttons */}
                                <div className="mb-4 sm:mb-5 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-4 sm:p-6 text-white shadow-xl shadow-teal-900/20">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-100">Total Pension Accumulated</p>
                                            <p className="mono mt-1 sm:mt-2 text-2xl sm:text-4xl font-black">{fmt(totalAccumulated)}</p>
                                            <p className="mt-1 text-xs sm:text-sm text-teal-100">
                                                {selStaff?.name} · {entries.length} contribution{entries.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button size="sm" onClick={() => setShowConfigModal(true)} className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 text-white font-semibold border-white/30 gap-1.5 h-9 text-xs rounded-xl cursor-pointer">
                                                <Settings2 className="w-3.5 h-3.5" /> Monthly Setup
                                            </Button>
                                            <Button size="sm" onClick={() => setShowAdhocModal(true)} className="flex-1 sm:flex-initial bg-white text-teal-800 hover:bg-teal-50 font-bold shadow-md gap-1.5 h-9 text-xs rounded-xl cursor-pointer">
                                                <Plus className="w-3.5 h-3.5" /> Add One-Off
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Progress bar representing accumulation (visual only) */}
                                    {entries.length > 0 && (
                                        <div className="mt-4">
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                                                <motion.div className="h-full rounded-full bg-white/70"
                                                    initial={{ width:0 }} animate={{ width:'100%' }} transition={{ duration:1.2, ease:[0.16,1,0.3,1], delay:0.3 }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stats row */}
                                <div className="mb-4 sm:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    {[
                                        { label:'Total Contributions', value:String(entries.length), icon:<TrendingUp className="h-4 w-4"/>, bg:'bg-teal-50', border:'border-teal-200', text:'text-teal-700' },
                                        { label:'Latest Contribution', value:entries[0] ? fmt(entries[0].amount) : '₦0.00', icon:<ShieldCheck className="h-4 w-4"/>, bg:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-700' },
                                        { label:'Years Contributing', value:String(sortedYears.length), icon:<Calendar className="h-4 w-4"/>, bg:'bg-slate-50', border:'border-slate-200', text:'text-slate-700' },
                                    ].map(c => (
                                        <div key={c.label} className={cn('flex items-center gap-3 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-sm', c.bg, c.border)}>
                                            <div className={cn('flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl', c.bg, c.text)}>{c.icon}</div>
                                            <div><p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</p><p className={cn('mono text-base sm:text-lg font-black', c.text)}>{c.value}</p></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Contribution timeline */}
                                <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
                                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-800">Contribution History</h3>
                                    </div>
                                    {loadEn ? (
                                        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-500"/></div>
                                    ) : entries.length === 0 ? (
                                        <div className="flex flex-col items-center py-12 sm:py-16 text-center px-4">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><ShieldCheck className="h-5 w-5 text-slate-400"/></div>
                                            <p className="font-semibold text-slate-500 text-xs sm:text-sm">No pension contributions yet</p>
                                            <p className="mt-1 text-[11px] sm:text-xs text-slate-400 max-w-sm">Contributions are recorded automatically when a payroll run is confirmed or via the buttons above.</p>
                                        </div>
                                    ) : (
                                        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                                            {sortedYears.map(year => {
                                                const yearEntries = byYear[year];
                                                const yearTotal = yearEntries.reduce((s, e) => s + e.amount, 0);
                                                return (
                                                    <div key={year}>
                                                        {/* Year header */}
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="mono text-xs font-bold text-slate-400 uppercase tracking-widest">{year}</span>
                                                                <div className="h-px flex-1 min-w-[40px] bg-slate-100" />
                                                            </div>
                                                            <span className="mono text-xs font-bold text-teal-600">{fmt(yearTotal)}</span>
                                                        </div>

                                                        {/* Mobile Card View */}
                                                        <div className="block sm:hidden divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                            {yearEntries.map((entry) => {
                                                                const d = new Date(entry.date);
                                                                const monthLabel = MONTHS[d.getMonth()];
                                                                const runLabel = entry.payrollRun
                                                                    ? `${MONTHS[(entry.payrollRun.month - 1) % 12]} ${entry.payrollRun.year}`
                                                                    : 'Manual / Ad-hoc';
                                                                return (
                                                                    <div key={entry.id} className="p-3 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 shrink-0">
                                                                                <span className="mono text-[10px] font-bold">{monthLabel}</span>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-semibold text-slate-800">{runLabel}</p>
                                                                                <p className="text-[10px] text-slate-400">{fmtDate(entry.date)}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p className="mono font-black text-teal-700 text-sm">{fmt(entry.amount)}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Desktop Table View */}
                                                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                                                            <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 w-24 text-center">Month</th>
                                                                        <th className="px-4 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Description</th>
                                                                        <th className="px-4 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Payroll Run</th>
                                                                        <th className="px-4 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right w-40">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {yearEntries.map((entry, i) => {
                                                                        const d = new Date(entry.date);
                                                                        const monthLabel = MONTHS[d.getMonth()];
                                                                        const runLabel = entry.payrollRun
                                                                            ? `${MONTHS[(entry.payrollRun.month - 1) % 12]} ${entry.payrollRun.year}`
                                                                            : 'Manual / Ad-hoc';
                                                                        return (
                                                                            <motion.tr key={entry.id} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }} className="bg-white hover:bg-slate-50 transition-colors">
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                                                                        <span className="mono text-[10px] font-bold">{monthLabel}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3">
                                                                                    <p className="font-semibold text-slate-800 text-sm">Pension Contribution</p>
                                                                                    <p className="text-xs text-slate-400">{fmtDate(entry.date)}</p>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-slate-600 text-sm">{runLabel}</td>
                                                                                <td className="px-4 py-3 text-right">
                                                                                    <p className="mono font-black text-teal-700 text-base">{fmt(entry.amount)}</p>
                                                                                </td>
                                                                            </motion.tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Configure Ongoing Monthly Pension Modal */}
                    <AnimatePresence>
                        {showConfigModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4">
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                                            <h3 className="text-xs sm:text-base font-bold text-slate-800">Monthly Pension Deduction</h3>
                                        </div>
                                        <button onClick={() => setShowConfigModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Set the ongoing monthly pension deduction for <span className="font-bold text-slate-800">{selStaff?.name}</span>. This will automatically deduct from salary during each payroll run and credit this pension ledger.
                                        </p>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Monthly Pension Amount (₦)</Label>
                                            <Input type="number" min="0" value={monthlyPensionAmount} onChange={e => setMonthlyPensionAmount(e.target.value)} placeholder="e.g. 10000 (0 to remove)" className="h-10 text-xs sm:text-sm rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100">
                                        <Button variant="ghost" onClick={() => setShowConfigModal(false)} disabled={saving} className="text-xs sm:text-sm cursor-pointer">Cancel</Button>
                                        <Button onClick={handleSaveMonthlyConfig} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs sm:text-sm rounded-xl cursor-pointer">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Save Setting
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Add Ad-hoc Contribution Modal */}
                    <AnimatePresence>
                        {showAdhocModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4">
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                            <h3 className="text-xs sm:text-base font-bold text-slate-800">Add One-Off Contribution</h3>
                                        </div>
                                        <button onClick={() => setShowAdhocModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Contribution Amount (₦)</Label>
                                            <Input type="number" min="0" value={adhocAmount} onChange={e => setAdhocAmount(e.target.value)} placeholder="0.00" className="h-10 text-xs sm:text-sm rounded-xl" />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Contribution Date</Label>
                                            <Input type="date" value={adhocDate} onChange={e => setAdhocDate(e.target.value)} className="h-10 text-xs sm:text-sm rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100">
                                        <Button variant="ghost" onClick={() => setShowAdhocModal(false)} disabled={saving} className="text-xs sm:text-sm cursor-pointer">Cancel</Button>
                                        <Button onClick={handleSaveAdhoc} disabled={saving || !adhocAmount} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs sm:text-sm rounded-xl cursor-pointer">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Log Contribution
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {!sel && !loadSt && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 sm:py-20 text-center px-4">
                            <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-teal-50"><ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400"/></div>
                            <p className="font-semibold text-slate-500 text-xs sm:text-sm">Select a staff member to view pension history and configure contributions</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
