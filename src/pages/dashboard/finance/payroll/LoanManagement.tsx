import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
    Loader2, ChevronRight, Plus, Edit2, Check, X as CloseIcon,
    CreditCard, AlertCircle, CheckCircle2, Users, Banknote, TrendingDown,
    History, ChevronDown, Receipt
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface Staff { id: string; name: string; department: string; employeeId: string; }
interface Repayment {
    id: string;
    amount: number;
    date: string;
    source: string;
    notes?: string;
    payrollRun?: { month: number; year: number; runDate: string };
}
interface StaffLoan {
    id: string;
    loanAmount: number;
    dateCollected: string;
    repaymentPerMonth: number;
    outstandingBalance: number;
    status: 'active' | 'cleared';
    notes?: string;
    repayments?: Repayment[];
}

function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
const AC = ['bg-amber-500','bg-blue-500','bg-teal-500','bg-rose-500','bg-violet-500','bg-indigo-500'];
function avBg(n: string) { return AC[n.charCodeAt(0) % AC.length]; }

export default function LoanManagement() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [sel, setSel] = useState('');
    const [loans, setLoans] = useState<StaffLoan[]>([]);
    const [totLoaned, setTotLoaned] = useState(0);
    const [totOut, setTotOut] = useState(0);
    const [loadSt, setLoadSt] = useState(true);
    const [loadLn, setLoadLn] = useState(false);
    const [saving, setSaving] = useState(false);
    const [vis, setVis] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

    // New Loan Form
    const [fAmt, setFAmt] = useState('');
    const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
    const [fRep, setFRep] = useState('');
    const [fNotes, setFNotes] = useState('');

    // Inline Edit
    const [editId, setEditId] = useState<string|null>(null);
    const [eRep, setERep] = useState('');
    const [eOut, setEOut] = useState('');

    // Repayment Modal
    const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
    const [repayAmount, setRepayAmount] = useState('');
    const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
    const [repaySource, setRepaySource] = useState('DIRECT_TRANSFER');
    const [repayNotes, setRepayNotes] = useState('');

    useEffect(() => { const t = setTimeout(() => setVis(true), 60); return () => clearTimeout(t); }, []);

    useEffect(() => {
        axios.get('/api/v1/payroll/staff', { withCredentials: true })
            .then(r => setStaff(r.data.staff || []))
            .catch(() => toast.error('Failed to load staff'))
            .finally(() => setLoadSt(false));
    }, []);

    const fetchLoans = (staffId: string) => {
        setLoadLn(true);
        axios.get(`/api/v1/payroll/loans/${staffId}`, { withCredentials: true })
            .then(r => {
                setLoans(r.data.loans || []);
                setTotLoaned(r.data.totalLoaned || 0);
                setTotOut(r.data.totalOutstanding || 0);
            })
            .catch(() => toast.error('Failed to load loans'))
            .finally(() => setLoadLn(false));
    };

    useEffect(() => {
        if (!sel) { setLoans([]); return; }
        fetchLoans(sel);
    }, [sel]);

    const selStaff = staff.find(s => s.id === sel);

    const doRecord = async () => {
        if (!fAmt || !sel) return;
        setSaving(true);
        try {
            await axios.post('/api/v1/payroll/loans', {
                staffId: sel, loanAmount: parseFloat(fAmt), dateCollected: fDate,
                repaymentPerMonth: fRep ? parseFloat(fRep) : 0, notes: fNotes || undefined,
            }, { withCredentials: true });
            fetchLoans(sel);
            setFAmt(''); setFDate(new Date().toISOString().split('T')[0]); setFRep(''); setFNotes(''); setShowForm(false);
            toast.success('Loan recorded successfully');
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error recording loan'); }
        finally { setSaving(false); }
    };

    const doUpdate = async (id: string) => {
        setSaving(true);
        try {
            await axios.put(`/api/v1/payroll/loans/${id}`, {
                repaymentPerMonth: eRep ? parseFloat(eRep) : undefined,
                outstandingBalance: eOut ? parseFloat(eOut) : undefined,
            }, { withCredentials: true });
            fetchLoans(sel);
            setEditId(null); toast.success('Loan updated');
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error updating loan'); }
        finally { setSaving(false); }
    };

    const doCleared = async (id: string) => {
        if (!confirm('Are you sure you want to mark this loan as cleared? Outstanding balance will be set to 0.')) return;
        setSaving(true);
        try {
            await axios.put(`/api/v1/payroll/loans/${id}`, { status: 'cleared', outstandingBalance: 0 }, { withCredentials: true });
            fetchLoans(sel);
            toast.success('Marked as cleared');
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
        finally { setSaving(false); }
    };

    const doRecordRepayment = async () => {
        if (!repayLoanId || !repayAmount || parseFloat(repayAmount) <= 0) {
            toast.error('Please enter a valid repayment amount');
            return;
        }
        setSaving(true);
        try {
            await axios.post('/api/v1/payroll/loans/repayment', {
                loanId: repayLoanId,
                amount: parseFloat(repayAmount),
                date: repayDate,
                source: repaySource,
                notes: repayNotes,
            }, { withCredentials: true });
            toast.success('Repayment recorded on staff ledger');
            setRepayLoanId(null);
            setRepayAmount('');
            setRepayNotes('');
            fetchLoans(sel);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to record repayment');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');.lm-root,.lm-root *{font-family:'Plus Jakarta Sans',sans-serif!important}.lm-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="lm-root min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-orange-50/20 px-3 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 transition-all duration-500 text-[9px] sm:text-[10px]', vis ? 'opacity-100' : 'opacity-0 -translate-y-2')}>
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Payroll</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-amber-600">Loan Management</span>
                    </div>

                    <div className={cn('mb-4 sm:mb-8 transition-all duration-500', vis ? 'opacity-100' : 'opacity-0 translate-y-3')}>
                        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Staff Loan Management &amp; Ledger</h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">Record staff loans, track automatic payroll deductions, and record manual repayments.</p>
                    </div>

                    {/* Staff selector */}
                    <div className={cn('mb-5 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-xl transition-all duration-500', vis ? 'opacity-100' : 'opacity-0 translate-y-3')}>
                        <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                            </div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-800">Select Staff Member</h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {loadSt ? <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> : (
                                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {staff.map(s => (
                                        <button key={s.id} onClick={() => setSel(s.id === sel ? '' : s.id)}
                                            className={cn('flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 text-left transition-all cursor-pointer',
                                                sel === s.id ? 'border-amber-300 bg-amber-50 shadow-md' : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40')}>
                                            <div className={cn('flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white', avBg(s.name))}>{s.name.substring(0,2).toUpperCase()}</div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn('truncate font-semibold text-xs sm:text-sm', sel === s.id ? 'text-amber-700' : 'text-slate-800')}>{s.name}</p>
                                                <p className="mono text-[10px] text-slate-400 truncate">{s.department || s.employeeId}</p>
                                            </div>
                                            {sel === s.id && <Check className="h-4 w-4 shrink-0 text-amber-600" />}
                                        </button>
                                    ))}
                                    {!staff.length && <p className="col-span-3 py-8 text-center text-xs sm:text-sm text-slate-400">No active staff found.</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {sel && (
                            <motion.div key="lp" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}>

                                {/* Summary */}
                                <div className="mb-4 sm:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    {[
                                        { label:'Total Loaned', value:fmt(totLoaned), icon:<CreditCard className="h-4 w-4"/>, bg:'bg-slate-50', border:'border-slate-200', text:'text-slate-700' },
                                        { label:'Outstanding Balance', value:fmt(totOut), icon:<AlertCircle className="h-4 w-4"/>, bg:'bg-amber-50', border:'border-amber-200', text:'text-amber-700' },
                                        { label:'Active Loans', value:String(loans.filter(l=>l.status==='active').length), icon:<TrendingDown className="h-4 w-4"/>, bg:'bg-rose-50', border:'border-rose-200', text:'text-rose-700' },
                                    ].map(c => (
                                        <div key={c.label} className={cn('flex items-center gap-3 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-sm', c.bg, c.border)}>
                                            <div className={cn('flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl', c.bg, c.text)}>{c.icon}</div>
                                            <div><p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</p><p className={cn('mono text-base sm:text-lg font-black', c.text)}>{c.value}</p></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Record form */}
                                <div className="mb-4 sm:mb-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
                                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                                        <div><h3 className="text-xs sm:text-sm font-bold text-slate-800">Record New Loan</h3><p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">For {selStaff?.name}</p></div>
                                        <Button onClick={() => setShowForm(f => !f)} variant="outline" className="h-8 sm:h-9 gap-1.5 rounded-xl text-xs font-semibold cursor-pointer">
                                            {showForm ? <><CloseIcon className="h-3.5 w-3.5"/>Cancel</> : <><Plus className="h-3.5 w-3.5"/>New Loan</>}
                                        </Button>
                                    </div>
                                    <AnimatePresence>
                                        {showForm && (
                                            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
                                                <div className="p-4 sm:p-6">
                                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                        <div><Label className="mb-1.5 text-xs font-semibold text-slate-600">Loan Amount (₦)</Label><Input type="number" min="0" value={fAmt} onChange={e=>setFAmt(e.target.value)} placeholder="0.00" className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:border-amber-400 focus-visible:ring-amber-100"/></div>
                                                        <div><Label className="mb-1.5 text-xs font-semibold text-slate-600">Date Collected</Label><Input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:border-amber-400 focus-visible:ring-amber-100"/></div>
                                                        <div><Label className="mb-1.5 text-xs font-semibold text-slate-600">Monthly Deduction (₦)</Label><Input type="number" min="0" value={fRep} onChange={e=>setFRep(e.target.value)} placeholder="e.g. 15000" className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:border-amber-400 focus-visible:ring-amber-100"/></div>
                                                        <div><Label className="mb-1.5 text-xs font-semibold text-slate-600">Notes / Purpose</Label><Input value={fNotes} onChange={e=>setFNotes(e.target.value)} placeholder="e.g. Salary Advance" className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:border-amber-400 focus-visible:ring-amber-100"/></div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <Button onClick={doRecord} disabled={saving||!fAmt} className="w-full sm:w-auto h-10 gap-2 rounded-xl bg-amber-600 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-amber-200 hover:bg-amber-700 active:scale-95 cursor-pointer">
                                                            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Banknote className="h-4 w-4"/>} Record Loan
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Loan history & Repayment Ledger */}
                                <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
                                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-800">Staff Loan &amp; Repayment Ledger</h3>
                                        <p className="text-[11px] sm:text-xs text-slate-500">Click on any loan to expand its full repayment audit trail.</p>
                                    </div>
                                    {loadLn ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-amber-500"/></div>
                                    : loans.length === 0 ? (
                                        <div className="flex flex-col items-center py-12 sm:py-16 text-center px-4">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><CreditCard className="h-5 w-5 text-slate-400"/></div>
                                            <p className="font-semibold text-slate-500 text-xs sm:text-sm">No loans recorded yet</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile Card View for Loans */}
                                            <div className="block md:hidden divide-y divide-slate-100">
                                                {loans.map((loan) => {
                                                    const repaidSoFar = Math.max(0, loan.loanAmount - loan.outstandingBalance);
                                                    const isExpanded = expandedLoanId === loan.id;
                                                    const repaymentsList = loan.repayments || [];

                                                    return (
                                                        <div key={loan.id} className="p-3.5 space-y-2.5">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white', loan.status==='cleared' ? 'bg-emerald-500' : 'bg-amber-500')}>
                                                                        {loan.status==='cleared' ? <CheckCircle2 className="h-4 w-4"/> : <CreditCard className="h-4 w-4"/>}
                                                                    </div>
                                                                    <div>
                                                                        <p className="mono font-black text-slate-900 text-sm">{fmt(loan.loanAmount)}</p>
                                                                        <p className="text-[10px] text-slate-400">{fmtDate(loan.dateCollected)}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', loan.status==='cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{loan.status}</span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                                                                <div>
                                                                    <span className="text-[8px] font-bold uppercase text-slate-400 block">Deduction / Mo</span>
                                                                    <span className="mono font-semibold text-slate-700">{fmt(loan.repaymentPerMonth)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[8px] font-bold uppercase text-slate-400 block">Outstanding</span>
                                                                    <span className={cn('mono font-black', loan.status==='cleared' ? 'text-emerald-600' : 'text-rose-600')}>{fmt(loan.outstandingBalance)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Action buttons */}
                                                            {loan.status === 'active' && (
                                                                <div className="flex items-center gap-1.5 pt-1">
                                                                    <Button size="sm" variant="outline" onClick={() => { setRepayLoanId(loan.id); setRepayAmount(String(Math.min(loan.repaymentPerMonth || loan.outstandingBalance, loan.outstandingBalance))); }} className="flex-1 h-8 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 gap-1 cursor-pointer">
                                                                        <Receipt className="w-3.5 h-3.5" /> Repay
                                                                    </Button>
                                                                    <Button size="sm" variant="outline" onClick={()=>{setEditId(loan.id);setERep(String(loan.repaymentPerMonth));setEOut(String(loan.outstandingBalance));}} className="flex-1 h-8 text-xs font-semibold text-slate-600 gap-1 cursor-pointer">
                                                                        <Edit2 className="h-3.5 w-3.5"/> Edit
                                                                    </Button>
                                                                    <Button size="sm" onClick={()=>doCleared(loan.id)} className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer">
                                                                        <CheckCircle2 className="h-3.5 w-3.5"/> Clear
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {/* Inline editing modal/bar on mobile */}
                                                            {editId === loan.id && (
                                                                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div><p className="text-[9px] text-slate-500 mb-0.5">Repay/mo</p><Input type="number" value={eRep} onChange={e=>setERep(e.target.value)} className="h-8 text-xs bg-white"/></div>
                                                                        <div><p className="text-[9px] text-slate-500 mb-0.5">Outstanding</p><Input type="number" value={eOut} onChange={e=>setEOut(e.target.value)} className="h-8 text-xs bg-white"/></div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button size="sm" onClick={()=>doUpdate(loan.id)} className="flex-1 h-8 bg-amber-600 text-white text-xs">Save</Button>
                                                                        <Button size="sm" variant="outline" onClick={()=>setEditId(null)} className="h-8 text-xs">Cancel</Button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Expand Button */}
                                                            <button
                                                                onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                                                                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 pt-1 cursor-pointer"
                                                            >
                                                                <span>{isExpanded ? 'Hide Ledger' : `View Ledger (${repaymentsList.length} payments)`}</span>
                                                                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                                                            </button>

                                                            {/* Repayment ledger details */}
                                                            {isExpanded && (
                                                                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2">
                                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                                        <History className="w-3.5 h-3.5 text-amber-600" />
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Audit Ledger</h4>
                                                                    </div>
                                                                    {repaymentsList.length === 0 ? (
                                                                        <p className="text-[10px] text-slate-400 italic">No repayments recorded yet.</p>
                                                                    ) : (
                                                                        <div className="divide-y divide-slate-100">
                                                                            {repaymentsList.map(rep => (
                                                                                <div key={rep.id} className="flex items-center justify-between py-1.5 text-[11px]">
                                                                                    <div>
                                                                                        <p className="font-semibold text-slate-700">{fmtDate(rep.date)}</p>
                                                                                        <span className="text-[9px] text-slate-400">{rep.source === 'PAYROLL' ? 'Payroll Deduction' : 'Direct Repayment'}</span>
                                                                                    </div>
                                                                                    <span className="mono font-bold text-emerald-600">+{fmt(rep.amount)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Desktop Table View */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                                                    <thead className="bg-slate-50/60 border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Loan Info</th>
                                                            <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Repayment Plan</th>
                                                            <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Repaid / Total</th>
                                                            <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Outstanding</th>
                                                            <th className="px-6 py-2.5 text-center mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {loans.map((loan) => {
                                                            const repaidSoFar = Math.max(0, loan.loanAmount - loan.outstandingBalance);
                                                            const isExpanded = expandedLoanId === loan.id;
                                                            const repaymentsList = loan.repayments || [];

                                                            return (
                                                                <>
                                                                    <tr key={loan.id} className={cn('transition-colors cursor-pointer', loan.status==='cleared' ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'bg-white hover:bg-slate-50/70')} onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}>
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white', loan.status==='cleared' ? 'bg-emerald-500' : 'bg-amber-500')}>
                                                                                    {loan.status==='cleared' ? <CheckCircle2 className="h-5 w-5"/> : <CreditCard className="h-5 w-5"/>}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="mono font-bold text-slate-900 text-base">{fmt(loan.loanAmount)}</p>
                                                                                        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                                        <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', loan.status==='cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{loan.status}</span>
                                                                                        <span className="text-[11px] text-slate-400">{fmtDate(loan.dateCollected)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <p className="mono text-xs font-semibold text-slate-800">Deduction: {fmt(loan.repaymentPerMonth)} / mo</p>
                                                                            {loan.notes && <p className="text-xs text-slate-500 italic mt-0.5">{loan.notes}</p>}
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="mono text-xs font-bold text-emerald-600">{fmt(repaidSoFar)}</span>
                                                                                <span className="text-xs text-slate-400">/ {fmt(loan.loanAmount)}</span>
                                                                            </div>
                                                                            <span className="mono text-[10px] text-slate-400 font-medium">
                                                                                {repaymentsList.length} payment{repaymentsList.length !== 1 ? 's' : ''} recorded
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <p className={cn('mono text-lg font-black', loan.status==='cleared' ? 'text-emerald-600' : 'text-rose-600')}>{fmt(loan.outstandingBalance)}</p>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                                            {loan.status === 'active' && (
                                                                                editId === loan.id ? (
                                                                                    <div className="flex items-center justify-end gap-2">
                                                                                        <div className="text-left"><p className="text-[9px] text-slate-400 mb-0.5">Repay/mo</p><Input type="number" value={eRep} onChange={e=>setERep(e.target.value)} className="h-8 w-24 text-xs"/></div>
                                                                                        <div className="text-left"><p className="text-[9px] text-slate-400 mb-0.5">Outstanding</p><Input type="number" value={eOut} onChange={e=>setEOut(e.target.value)} className="h-8 w-28 text-xs"/></div>
                                                                                        <div className="flex gap-1 mt-4">
                                                                                            <button onClick={()=>doUpdate(loan.id)} className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer"><Check className="h-4 w-4"/></button>
                                                                                            <button onClick={()=>setEditId(null)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"><CloseIcon className="h-4 w-4"/></button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                                        <Button size="sm" variant="outline" onClick={() => { setRepayLoanId(loan.id); setRepayAmount(String(Math.min(loan.repaymentPerMonth || loan.outstandingBalance, loan.outstandingBalance))); }} className="h-8 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 gap-1 cursor-pointer">
                                                                                            <Receipt className="w-3.5 h-3.5" /> Repay
                                                                                        </Button>
                                                                                        <Button size="sm" variant="outline" onClick={()=>{setEditId(loan.id);setERep(String(loan.repaymentPerMonth));setEOut(String(loan.outstandingBalance));}} className="h-8 text-xs font-semibold text-slate-600 gap-1 cursor-pointer">
                                                                                            <Edit2 className="h-3.5 w-3.5"/> Edit
                                                                                        </Button>
                                                                                        <Button size="sm" onClick={()=>doCleared(loan.id)} className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer">
                                                                                            <CheckCircle2 className="h-3.5 w-3.5"/> Clear
                                                                                        </Button>
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </td>
                                                                    </tr>

                                                                    {/* Repayment ledger drop-down */}
                                                                    {isExpanded && (
                                                                        <tr className="bg-slate-50/80">
                                                                            <td colSpan={5} className="p-4">
                                                                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                                                    <div className="flex items-center gap-2 mb-3">
                                                                                        <History className="w-4 h-4 text-amber-600" />
                                                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Repayment Audit Ledger</h4>
                                                                                    </div>
                                                                                    {repaymentsList.length === 0 ? (
                                                                                        <p className="text-xs text-slate-400 italic py-2">No repayment records logged for this loan yet. Repayments will log here automatically during confirmed payroll runs or via direct repayments.</p>
                                                                                    ) : (
                                                                                        <div className="divide-y divide-slate-100">
                                                                                            {repaymentsList.map(rep => (
                                                                                                <div key={rep.id} className="flex items-center justify-between py-2 text-xs">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold uppercase', rep.source === 'PAYROLL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>
                                                                                                            {rep.source === 'PAYROLL' ? 'Payroll Deduction' : 'Direct Repayment'}
                                                                                                        </span>
                                                                                                        <span className="font-semibold text-slate-700">{fmtDate(rep.date)}</span>
                                                                                                        {rep.notes && <span className="text-slate-400 italic">({rep.notes})</span>}
                                                                                                    </div>
                                                                                                    <span className="mono font-bold text-emerald-600 text-sm">+{fmt(rep.amount)}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Direct Repayment Dialog */}
                    <AnimatePresence>
                        {repayLoanId && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4">
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                            <h3 className="text-xs sm:text-base font-bold text-slate-800">Record Direct Repayment</h3>
                                        </div>
                                        <button onClick={() => setRepayLoanId(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Repayment Amount (₦)</Label>
                                            <Input type="number" min="0" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} placeholder="0.00" className="h-10 text-xs sm:text-sm rounded-xl" />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Payment Date</Label>
                                            <Input type="date" value={repayDate} onChange={e => setRepayDate(e.target.value)} className="h-10 text-xs sm:text-sm rounded-xl" />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Payment Method / Source</Label>
                                            <select value={repaySource} onChange={e => setRepaySource(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                                                <option value="DIRECT_TRANSFER">Bank Transfer</option>
                                                <option value="CASH">Cash Deposit</option>
                                                <option value="CHEQUE">Cheque</option>
                                                <option value="SALARY_OFF_CYCLE">Off-cycle Settlement</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes / Reference</Label>
                                            <Input value={repayNotes} onChange={e => setRepayNotes(e.target.value)} placeholder="e.g. Reference No / teller details" className="h-10 text-xs sm:text-sm rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100">
                                        <Button variant="ghost" onClick={() => setRepayLoanId(null)} disabled={saving} className="text-xs sm:text-sm cursor-pointer">Cancel</Button>
                                        <Button onClick={doRecordRepayment} disabled={saving || !repayAmount} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs sm:text-sm rounded-xl cursor-pointer">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Post Repayment
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {!sel && !loadSt && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 sm:py-20 text-center px-4">
                            <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-50"><CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400"/></div>
                            <p className="font-semibold text-slate-500 text-xs sm:text-sm">Select a staff member to view loan history and repayment ledger</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
