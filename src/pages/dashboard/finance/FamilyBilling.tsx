import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';
import { toast } from 'sonner';
import { ChevronRight, Users, UsersRound, DollarSign, Loader2, ArrowLeft, Send, Clock, CheckCircle2, AlertCircle, FileText, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FamilySummary {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    studentCount: number;
    invoiceCount: number;
    expected: number;
    paid: number;
    outstanding: number;
}

interface FamilyProfile {
    parent: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    };
    children: {
        id: string;
        name: string;
        admissionNo: string;
        className: string;
        invoices: {
            id: string;
            invoiceNumber: string;
            status: string;
            totalAmount: number;
            amountPaid: number;
            balanceDue: number;
            items: { label: string; amount: number; quantity: number; }[];
        }[];
    }[];
}

const fmt = (n: number) => '₦' + (n || 0).toLocaleString('en-NG');

export default function FamilyBilling() {
  const { terms: metaTerms, sessions: metaSessions, loading: loadingMeta } = useFinanceMeta();
    // View state: 'families' | 'profile'
    const [view, setView] = useState<'families' | 'profile'>('families');
    const [term, setTerm] = useState('');
  useEffect(() => { if (metaTerms.length > 0 && !term) setTerm(metaTerms[0]); }, [metaTerms, term]);
    const [year, setYear] = useState('');
  useEffect(() => { if (metaSessions.length > 0 && !year) { const curr = metaSessions.find(s => s.isCurrent); setYear(curr ? curr.name : metaSessions[0].name); } }, [metaSessions, year]);

    // Families list view
    const [families, setFamilies] = useState<FamilySummary[]>([]);
    const [loadingFamilies, setLoadingFamilies] = useState(true);

    // Profile view
    const [profile, setProfile] = useState<FamilyProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFamilies = families.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (f.email && f.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.phone && f.phone.includes(searchQuery))
    );

    useEffect(() => {
        setLoadingFamilies(true);
        axios.get(`/api/v1/finance-v2/billing/families?term=${term}&academicYear=${year}`, { withCredentials: true })
            .then(r => setFamilies(r.data.summary || []))
            .catch(e => toast.error(`Failed to load families: ${e.response?.data?.msg || e.message}`))
            .finally(() => setLoadingFamilies(false));
    }, [term, year]);

    const openProfile = async (f: FamilySummary) => {
        setView('profile');
        setLoadingProfile(true);
        try {
            const r = await axios.get(`/api/v1/finance-v2/billing/families/${f.id}?term=${term}&academicYear=${year}`, { withCredentials: true });
            setProfile(r.data);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to load family profile');
            setView('families');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSendStatement = async () => {
        if (!profile) return;
        setSending(true);
        try {
            const r = await axios.post(`/api/v1/finance-v2/billing/families/${profile.parent.id}/send`, { term, academicYear: year }, { withCredentials: true });
            toast.success(r.data.msg || 'Family statement sent successfully');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to send family statement');
        } finally {
            setSending(false);
        }
    };

    const handleGenerateInvoice = async () => {
        if (!profile) return;
        setGenerating(true);
        try {
            const r = await axios.post(`/api/v1/finance-v2/billing/families/${profile.parent.id}/invoice`, { term, academicYear: year }, { withCredentials: true });
            const { results } = r.data;
            const errorCount = results.errors?.length || 0;
            if (errorCount > 0) {
                console.error('Invoice generation errors:', results.errors);
                const firstReason = results.errors[0].reason;
                if (results.created.length === 0) {
                    toast.error(`Generation failed for all ${errorCount} child(ren): ${firstReason}`);
                } else {
                    toast.warning(`${results.created.length} invoices created, ${results.skipped.length} skipped, ${errorCount} failed — ${firstReason}`);
                }
            } else {
                toast.success(`${results.created.length} invoices created, ${results.skipped.length} skipped`);
            }
            openProfile(profile.parent as any); // Reload profile
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to generate family invoices');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');.fb-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fb-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className="mb-5 flex items-center gap-1.5 flex-wrap">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <button onClick={() => setView('families')} className={cn("mono text-[10px] font-bold uppercase tracking-widest", view === 'families' ? 'text-[#1E4DA6]' : 'text-slate-400 hover:text-[#1E4DA6]')}>Family Billing</button>
                        {profile && view === 'profile' && <><ChevronRight className="h-3 w-3 text-slate-400" /><span className="mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">{profile.parent.name}</span></>}
                    </div>

                    {/* Header */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {view !== 'families' && <button onClick={() => setView('families')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"><ArrowLeft className="h-4 w-4" /></button>}
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-[#1E4DA6] shadow-lg shadow-indigo-200"><UsersRound className="h-6 w-6 text-white" /></div>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900">{view === 'families' ? 'Family Billing' : profile?.parent.name}</h1>
                                <p className="mono text-[10px] text-slate-400 uppercase tracking-widest">{view === 'families' ? 'Consolidated parent statements' : profile?.parent.email || profile?.parent.phone || 'Parent Profile'}</p>
                            </div>
                        </div>
                        {/* Term + Year filter */}
                        <div className="flex flex-wrap items-center gap-2">
                            {view === 'families' && (
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search parent name, email or phone..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400" 
                                    />
                                </div>
                            )}
                            <select value={term} onChange={e => setTerm(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#1E4DA6]/60">
                                {metaTerms.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#1E4DA6]/60">
                                {metaSessions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── FAMILIES LIST VIEW ── */}
                    {view === 'families' && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl">
                            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                                <h2 className="font-bold text-slate-800">Parents & Families</h2>
                                <span className="mono text-[10px] text-slate-400">{families.length} families</span>
                            </div>
                            {loadingFamilies ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div> : (
                                <div className="overflow-x-auto">
                                    <div className="min-w-[700px]">
                                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <span>Parent</span><span className="text-center">Children</span><span className="text-right">Expected</span><span className="text-right">Paid</span><span className="text-right">Outstanding</span><span></span>
                                        </div>
                                        <AnimatePresence mode="popLayout">
                                            {filteredFamilies.map((f, i) => (
                                                <motion.button key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => openProfile(f)}
                                                    className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] items-center border-b border-slate-50 px-6 py-4 text-left transition-colors hover:bg-indigo-50/40 group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><UsersRound className="h-4 w-4" /></div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 group-hover:text-indigo-700 truncate">{f.name}</p>
                                                            <p className="mono text-[10px] text-slate-400 truncate">{f.email || f.phone || 'No contact info'}</p>
                                                        </div>
                                                    </div>
                                                    <p className="mono text-center font-semibold text-slate-700">{f.studentCount}</p>
                                                    <p className="mono text-right text-sm font-bold text-slate-800">{fmt(f.expected)}</p>
                                                    <p className="mono text-right text-sm font-bold text-emerald-700">{fmt(f.paid)}</p>
                                                    <p className={cn("mono text-right text-sm font-bold", f.outstanding > 0 ? 'text-red-600' : 'text-emerald-600')}>{fmt(f.outstanding)}</p>
                                                    <div className="flex justify-end"><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" /></div>
                                                </motion.button>
                                            ))}
                                        </AnimatePresence>
                                        {filteredFamilies.length === 0 && <div className="py-16 text-center text-slate-400"><UsersRound className="mx-auto mb-3 h-10 w-10 opacity-30" /><p className="font-semibold">No families found</p></div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── FAMILY PROFILE VIEW ── */}
                    {view === 'profile' && (
                        loadingProfile ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div> :
                            profile && (
                                <div className="space-y-6">
                                    {/* Action bar */}
                                    <div className="flex flex-col sm:flex-row gap-4 items-start justify-between rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-indigo-600"><DollarSign className="h-5 w-5" /></div>
                                            <div className='flex items-start flex-col'>
                                                <p className="text-sm font-bold text-slate-800">Total Family Balance</p>
                                                <p className="mono text-xl font-black text-red-600">
                                                    {fmt(profile.children.reduce((s, c) => s + c.invoices.reduce((ss, i) => ss + i.balanceDue, 0), 0))}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            <Button onClick={handleGenerateInvoice} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 rounded-xl font-bold shadow-md shadow-emerald-200">
                                                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                                {generating ? 'Generating...' : 'Generate Invoices'}
                                            </Button>
                                            <Button onClick={handleSendStatement} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-bold shadow-md shadow-indigo-200">
                                                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                                {sending ? 'Sending...' : 'Send Combined Statement'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Children Breakdown */}
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        {profile.children.map(child => {
                                            const hasInvoices = child.invoices.length > 0;
                                            return (
                                                <div key={child.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-lg flex flex-col">
                                                    <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex justify-between items-center shrink-0">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{child.name}</h3>
                                                            <p className="mono text-[10px] text-slate-500">{child.admissionNo} · {child.className}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="mono text-[10px] text-slate-400 uppercase tracking-widest">Child Balance</p>
                                                            <p className="mono font-bold text-slate-800">{fmt(child.invoices.reduce((s, i) => s + i.balanceDue, 0))}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 p-6">
                                                        {!hasInvoices ? (
                                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                                                                <Clock className="h-8 w-8 opacity-30 mb-2" />
                                                                <p className="text-sm font-medium">No invoices for this term</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {child.invoices.map(inv => (
                                                                    <div key={inv.id} className="rounded-xl border border-slate-100 p-4">
                                                                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                                                                            <div>
                                                                                <p className="mono text-xs font-bold text-[#173F8C]">{inv.invoiceNumber}</p>
                                                                                <span className={cn("inline-flex items-center gap-1 mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                                                                    inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                                                                                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-700' :
                                                                                            ['OPEN', 'SENT'].includes(inv.status) ? 'bg-[#1E4DA6]/5 text-[#173F8C]' :
                                                                                                'bg-red-50 text-red-600'
                                                                                )}>
                                                                                    {inv.status.replace(/_/g, ' ')}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="mono text-sm font-black text-slate-800">{fmt(inv.totalAmount)}</p>
                                                                                {inv.balanceDue > 0 && <p className="mono text-[10px] font-bold text-red-600 mt-0.5">Bal: {fmt(inv.balanceDue)}</p>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            {inv.items.map((item, i) => (
                                                                                <div key={i} className="flex justify-between text-xs">
                                                                                    <span className="text-slate-600">{item.label} <span className="opacity-50">×{item.quantity || 1}</span></span>
                                                                                    <span className="mono font-semibold text-slate-800">{fmt(item.amount)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {profile.children.length === 0 && (
                                            <div className="col-span-full py-12 text-center text-slate-500">
                                                No enrolled children found for this parent.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                    )}
                </div>
            </div>
        </>
    );
}
