import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';
import { toast } from 'sonner';
import { ChevronRight, Users, DollarSign, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Clock, X, Plus, Trash2, Check, Copy, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassSummary { id:string; name:string; level:string; studentCount:number; billedCount:number; expected:number; paid:number; outstanding:number; }
interface StudentRow { id:string; name:string; admissionNo:string; classLevel:string; billingStatus:'UNBILLED'|'UNPAID'|'PARTIAL'|'PAID'; invoiceCount:number; totalExpected:number; totalPaid:number; totalOutstanding:number; hasScholarship:boolean; invoices:{id:string;invoiceNumber:string;status:string;totalAmount:number;amountPaid:number;balanceDue:number}[]; }
interface Fee { id:string; name:string; type:string; amount:number; quantity:number|null; isCompulsory:boolean; termScope:string; alreadyBilled?:boolean; }
interface Scholarship { id:string; type:string; value:number; }
interface BillingProfile { student:{id:string;name:string;admissionNo:string;classLevel:string}; fees:Fee[]; scholarships:Scholarship[]; existingInvoices:{id:string;invoiceNumber:string;status:string;totalAmount:number;balanceDue:number;items:{label:string;amount:number}[]}[]; }

const fmt = (n:number) => '₦' + (n||0).toLocaleString('en-NG');
const STATUS:Record<string,{label:string;bg:string;text:string;icon:React.ReactNode}> = {
  UNBILLED: { label:'Unbilled',  bg:'bg-slate-100', text:'text-slate-500', icon:<Clock className="h-3 w-3"/> },
  UNPAID:   { label:'Unpaid',    bg:'bg-red-50',    text:'text-red-600',   icon:<AlertCircle className="h-3 w-3"/> },
  PARTIAL:  { label:'Partial',   bg:'bg-amber-50',  text:'text-amber-700', icon:<Clock className="h-3 w-3"/> },
  PAID:     { label:'Paid',      bg:'bg-emerald-50',text:'text-emerald-700',icon:<CheckCircle2 className="h-3 w-3"/> },
};
const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

// Surfaces per-student generation failures instead of silently reporting "0 created, 0 skipped"
// as a success when every student actually errored out.
function reportGenerationResults(results: {created:any[];skipped:any[];errors?:{studentId:string;reason:string}[]}) {
  const errorCount = results.errors?.length || 0;
  if (errorCount > 0) {
    console.error('Invoice generation errors:', results.errors);
    const firstReason = results.errors![0].reason;
    if (results.created.length === 0) {
      toast.error(`Generation failed for all ${errorCount} student(s): ${firstReason}`);
    } else {
      toast.warning(`${results.created.length} invoices created, ${results.skipped.length} skipped, ${errorCount} failed — ${firstReason}`);
    }
  } else {
    toast.success(`${results.created.length} invoices created, ${results.skipped.length} skipped`);
  }
}

export default function SingleBilling() {
  const { terms: metaTerms, sessions: metaSessions, loading: loadingMeta } = useFinanceMeta();
  // View state: 'classes' | 'students' | 'profile'
  const [view, setView] = useState<'classes'|'students'|'profile'>('classes');
  const [term, setTerm] = useState('');
  useEffect(() => { if (metaTerms.length > 0 && !term) setTerm(metaTerms[0]); }, [metaTerms, term]);
  const [year, setYear] = useState('');
  useEffect(() => { if (metaSessions.length > 0 && !year) { const curr = metaSessions.find(s => s.isCurrent); setYear(curr ? curr.name : metaSessions[0].name); } }, [metaSessions, year]);

  // Classes view
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassSummary|null>(null);

  // Students view
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredStudents = students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Profile view
  const [profile, setProfile] = useState<BillingProfile|null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow|null>(null);
  const [feeToggles, setFeeToggles] = useState<Record<string,boolean>>({});
  const [customFees, setCustomFees] = useState<{name:string;amount:string}[]>([]);
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  // Inventory items sold on this invoice (e.g. uniforms, books) — decrements stock once paid
  const [inventoryOptions, setInventoryOptions] = useState<{id:string;name:string;sellingPrice:number;quantityOnHand:number}[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<{inventoryItemId:string;name:string;unitPrice:number;quantity:number}[]>([]);
  const [pickedInventoryId, setPickedInventoryId] = useState('');

  useEffect(() => {
    axios.get('/api/v1/inventory?isSellable=true', {withCredentials:true})
      .then(r => setInventoryOptions(r.data.items || []))
      .catch(() => {});
  }, []);

  const addInventoryItem = () => {
    const item = inventoryOptions.find(i => i.id === pickedInventoryId);
    if (!item) return;
    setInvoiceItems(p => {
      const existing = p.find(i => i.inventoryItemId === item.id);
      if (existing) return p.map(i => i.inventoryItemId === item.id ? {...i, quantity: i.quantity+1} : i);
      return [...p, {inventoryItemId: item.id, name: item.name, unitPrice: item.sellingPrice, quantity: 1}];
    });
    setPickedInventoryId('');
  };

  const loadClasses = () => {
    setLoadingClasses(true);
    axios.get(`/api/v1/finance-v2/billing/classes?term=${term}&academicYear=${year}`, {withCredentials:true})
      .then(r => setClasses(r.data.summary||[]))
      .catch(e => toast.error(`Classes: ${e.response?.data?.msg || e.response?.status || e.message}`))
      .finally(() => setLoadingClasses(false));
  };

  // Load classes
  useEffect(() => {
    loadClasses();
  }, [term, year]);

  const openClass = async (c:ClassSummary) => {
    setSelectedClass(c); setSelected(new Set()); setView('students'); setLoadingStudents(true);
    try {
      const r = await axios.get(`/api/v1/finance-v2/billing/classes/${c.id}/students?term=${term}&academicYear=${year}`, {withCredentials:true});
      setStudents(r.data.students||[]);
    } catch(e:any) {
      const msg = e.response?.data?.msg || e.response?.data?.error || `HTTP ${e.response?.status}` || e.message;
      toast.error(`Students error: ${msg}`);
      console.error('Students error full:', e.response?.data);
    }
    finally { setLoadingStudents(false); }
  };

  const openProfile = async (s:StudentRow) => {
    setSelectedStudent(s); setView('profile'); setLoadingProfile(true); setCustomFees([]); setInvoiceItems([]); setPickedInventoryId('');
    try {
      const r = await axios.get(`/api/v1/finance-v2/billing/student/${s.id}/profile?term=${term}&academicYear=${year}`, {withCredentials:true});
      const p:BillingProfile = r.data;
      setProfile(p);
      const toggles:Record<string,boolean> = {};
      p.fees.forEach(f => { toggles[f.id] = !f.alreadyBilled; });
      setFeeToggles(toggles);
    } catch { toast.error('Failed to load billing profile'); }
    finally { setLoadingProfile(false); }
  };

  const computeTotal = () => {
    if (!profile) return 0;
    let feesSub = profile.fees.filter(f => feeToggles[f.id]).reduce((s,f) => s + f.amount*(f.quantity||1), 0);
    customFees.forEach(cf => { if(cf.amount) feesSub += Number(cf.amount); });
    let disc = 0;
    profile.scholarships.forEach(sc => {
      if (sc.type==='PERCENTAGE') disc += feesSub*(sc.value/100);
      else if (sc.type==='SCHOLARSHIP') disc = Math.max(disc, feesSub-sc.value);
    });
    const itemsSub = invoiceItems.reduce((s,i) => s + i.unitPrice*i.quantity, 0);
    return Math.max(0, feesSub-disc) + itemsSub;
  };

  const handleGenerateInvoice = async () => {
    if (!profile || !selectedStudent) return;
    setGenerating(true);
    const feeIds = profile.fees.filter(f => feeToggles[f.id]).map(f => f.id);
    const expectedTotal = computeTotal();
    try {
      const validCustomFees = customFees
        .filter(cf => cf.name.trim() && Number(cf.amount) > 0)
        .map(cf => ({ name: cf.name.trim(), amount: Number(cf.amount) }));
      await axios.post('/api/v1/finance-v2/invoices', {
        studentId: selectedStudent.id,
        feeDefinitionIds: feeIds,
        term, academicYear: year,
        expectedTotal,
        items: invoiceItems.map(i => ({inventoryItemId: i.inventoryItemId, quantity: i.quantity})),
        customFees: validCustomFees,
      }, {withCredentials:true});
      toast.success(`Invoice generated — ₦${expectedTotal.toLocaleString('en-NG')}`);
      openProfile(selectedStudent); // refresh profile view
    } catch(e:any) { toast.error(e.response?.data?.msg||'Failed to generate invoice'); }
    finally { setGenerating(false); }
  };

  const handleBulkGenerate = async () => {
    if (!selectedClass || selected.size===0) return;
    setBulkGenerating(true);
    try {
      const r = await axios.post('/api/v1/finance-v2/billing/bulk-generate', {
        studentIds: Array.from(selected), term, academicYear: year
      }, {withCredentials:true});
      const {results} = r.data;
      reportGenerationResults(results);
      setSelected(new Set()); openClass(selectedClass);
    } catch(e:any) { toast.error(e.response?.data?.msg||'Bulk generation failed'); }
    finally { setBulkGenerating(false); }
  };

  const handleGenerateAll = async () => {
    if (!confirm(`Are you sure you want to generate invoices for ALL students in the school for ${term} - ${year}?`)) return;
    setGeneratingAll(true);
    try {
      const r = await axios.post('/api/v1/finance-v2/billing/generate-all', {
        term, academicYear: year
      }, {withCredentials:true});
      const {results} = r.data;
      reportGenerationResults(results);
      if (view === 'classes') loadClasses();
      if (view === 'students' && selectedClass) openClass(selectedClass);
    } catch(e:any) { toast.error(e.response?.data?.msg||'Generate All failed'); }
    finally { setGeneratingAll(false); }
  };

  const toggleAll = () => {
    if (selected.size===students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s=>s.id)));
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');.sb-root,.sb-root *{font-family:'Plus Jakarta Sans',sans-serif!important}.sb-root .mono{font-family:'DM Mono',monospace!important}`}</style>
      <div className="sb-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none fixed inset-0 opacity-[0.18]" style={{backgroundImage:'radial-gradient(circle,#94a3b8 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
        <div className="relative z-10 mx-auto max-w-6xl">

          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5 flex-wrap">
            <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
            <ChevronRight className="h-3 w-3 text-slate-400"/>
            <button onClick={()=>setView('classes')} className={cn("mono text-[10px] font-bold uppercase tracking-widest", view==='classes'?'text-blue-600':'text-slate-400 hover:text-blue-500')}>Single Billing</button>
            {selectedClass && <><ChevronRight className="h-3 w-3 text-slate-400"/><button onClick={()=>setView('students')} className={cn("mono text-[10px] font-bold uppercase tracking-widest", view==='students'?'text-blue-600':'text-slate-400 hover:text-blue-500')}>{selectedClass.name}</button></>}
            {selectedStudent && view==='profile' && <><ChevronRight className="h-3 w-3 text-slate-400"/><span className="mono text-[10px] font-bold uppercase tracking-widest text-blue-600">{selectedStudent.name}</span></>}
          </div>

          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row items-start gap-4 justify-between">
            <div className="flex items-center gap-4">
              {view!=='classes' && <button onClick={()=>view==='profile'?setView('students'):setView('classes')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm"><ArrowLeft className="h-4 w-4"/></button>}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-500 shadow-lg shadow-blue-200"><DollarSign className="h-6 w-6 text-white"/></div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{view==='classes'?'Single Billing':view==='students'?selectedClass?.name:selectedStudent?.name}</h1>
                <p className="mono text-[10px] text-slate-400 uppercase tracking-widest">{view==='classes'?'Select a class to begin billing':view==='students'?`${students.length} students`:'Student Billing Profile'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {view !== 'profile' && (
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                      type="text" 
                      placeholder={view === 'classes' ? "Search class..." : "Search student..."} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400" 
                  />
                </div>
              )}
              <button 
                onClick={handleGenerateAll} 
                disabled={generatingAll || !term || !year} 
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-md shadow-emerald-200 w-full sm:w-auto"
              >
                {generatingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5"/>} 
                Generate All
              </button>
              <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2"></div>
              <select value={term} onChange={e=>setTerm(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400">
                {metaTerms.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={year} onChange={e=>setYear(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400">
                {metaSessions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* ── CLASS SUMMARY VIEW ── */}
          {view==='classes' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl backdrop-blur-xl">
              <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-bold text-slate-800">All Classes</h2></div>
              {loadingClasses ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-blue-500"/></div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                    <thead className="bg-slate-50/60 border-b border-slate-50">
                      <tr>
                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Class</th>
                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center">Students</th>
                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Expected</th>
                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Collected</th>
                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Outstanding</th>
                        <th className="px-6 py-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <AnimatePresence mode="popLayout">
                      {filteredClasses.map((c,i)=>(
                          <motion.tr key={c.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}} onClick={()=>openClass(c)}
                            className="group cursor-pointer transition-colors hover:bg-blue-50/40">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-4 w-4"/></div>
                                <div><p className="font-bold text-slate-900 group-hover:text-blue-700">{c.name}</p><p className="mono text-[10px] text-slate-400">{c.billedCount}/{c.studentCount} billed</p></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 mono text-center font-semibold text-slate-700">{c.studentCount}</td>
                            <td className="px-6 py-4 mono text-right text-sm font-bold text-slate-800">{fmt(c.expected)}</td>
                            <td className="px-6 py-4 mono text-right text-sm font-bold text-emerald-700">{fmt(c.paid)}</td>
                            <td className="px-6 py-4 text-right">
                              <p className={cn("mono text-sm font-bold", c.outstanding>0?'text-red-600':'text-emerald-600')}>{fmt(c.outstanding)}</p>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-300 group-hover:text-blue-500">
                                <ChevronRight className="h-4 w-4 inline-block"/>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  {!loadingClasses && filteredClasses.length === 0 && <div className="py-16 text-center text-slate-400"><Users className="mx-auto mb-3 h-10 w-10 opacity-30"/><p className="font-semibold">No classes found</p></div>}
                </div>
              )}
            </div>
          )}

          {/* ── STUDENTS VIEW ── */}
          {view==='students' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-6 py-4 gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className={cn("flex h-5 w-5 items-center justify-center rounded border-2 transition-colors", selected.size===students.length&&students.length>0?'border-blue-600 bg-blue-600':'border-slate-300 hover:border-blue-400')}>
                    {selected.size===students.length&&students.length>0&&<Check className="h-3 w-3 text-white"/>}
                  </button>
                  <span className="text-sm font-semibold text-slate-600">{selected.size>0?`${selected.size} selected`:'Select all'}</span>
                </div>
                {selected.size>0 && (
                  <button onClick={handleBulkGenerate} disabled={bulkGenerating} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60">
                    {bulkGenerating?<Loader2 className="h-3 w-3 animate-spin"/>:<Copy className="h-3 w-3"/>} Bulk Generate ({selected.size})
                  </button>
                )}
              </div>
              {loadingStudents ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-blue-500"/></div> : (
                <div className="divide-y divide-slate-50">
                  {filteredStudents.map((s,i)=>{
                    const sc = STATUS[s.billingStatus];
                    return (
                      <motion.div key={s.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 group">
                        <button onClick={()=>setSelected(p=>{const n=new Set(p);n.has(s.id)?n.delete(s.id):n.add(s.id);return n;})}
                          className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",selected.has(s.id)?'border-blue-600 bg-blue-600':'border-slate-300 hover:border-blue-400')}>
                          {selected.has(s.id)&&<Check className="h-3 w-3 text-white"/>}
                        </button>
                        <button onClick={()=>openProfile(s)} className="flex flex-1 items-center gap-4 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                            {s.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 group-hover:text-blue-700 truncate">{s.name}</p>
                              {s.hasScholarship&&<span className="mono shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-600">Scholarship</span>}
                            </div>
                            <p className="mono text-[10px] text-slate-400">{s.admissionNo} · {s.classLevel}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 mono text-[9px] font-bold uppercase",sc.bg,sc.text)}>{sc.icon}{sc.label}</div>
                            {s.totalExpected>0&&<p className="mono mt-0.5 text-[10px] text-slate-400">{fmt(s.totalPaid)} / {fmt(s.totalExpected)}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 shrink-0"/>
                        </button>
                      </motion.div>
                    );
                  })}
                  {filteredStudents.length===0&&<div className="py-16 text-center text-slate-400"><Users className="mx-auto mb-3 h-10 w-10 opacity-30"/><p className="font-semibold">No students found</p></div>}
                </div>
              )}
            </div>
          )}

          {/* ── BILLING PROFILE VIEW ── */}
          {view==='profile' && (
            loadingProfile ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div> :
            profile && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Existing invoices */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-lg backdrop-blur-xl">
                    <div className="border-b border-slate-100 px-5 py-3.5"><p className="font-bold text-slate-800">Existing Invoices</p></div>
                    {profile.existingInvoices.length===0 ? (
                      <div className="px-5 py-6 text-center"><p className="text-sm text-slate-400">No invoices for this term yet</p></div>
                    ) : profile.existingInvoices.map(inv=>(
                      <div key={inv.id} className="border-b border-slate-50 px-5 py-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="mono text-xs font-bold text-blue-700">{inv.invoiceNumber}</p>
                          <span className={cn("mono rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", inv.status==='PAID'?'bg-emerald-50 text-emerald-700':inv.status==='PARTIAL'?'bg-amber-50 text-amber-700':'bg-red-50 text-red-600')}>{inv.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="mono text-xs text-slate-500">Balance: {fmt(inv.balanceDue)}</p>
                          <p className="mono text-xs font-bold text-slate-800">{fmt(inv.totalAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Scholarships */}
                  {profile.scholarships.length>0&&(
                    <div className="overflow-hidden rounded-2xl border border-purple-100 bg-purple-50/60 px-5 py-4">
                      <p className="font-bold text-purple-800 mb-2">Applied Discounts</p>
                      {profile.scholarships.map(sc=>(
                        <div key={sc.id} className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-purple-700">{sc.type==='PERCENTAGE'?'Percentage Discount':sc.type==='SCHOLARSHIP'?'Scholarship':'Fixed Amount'}</p>
                          <p className="mono font-black text-purple-800">{sc.type==='PERCENTAGE'?`${sc.value}% off`:fmt(sc.value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Fee builder */}
                <div className="lg:col-span-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-lg backdrop-blur-xl">
                    <div className="border-b border-slate-100 px-6 py-4"><p className="font-bold text-slate-800">Build Invoice</p><p className="mono text-[10px] text-slate-400">Toggle optional fees · Add custom items</p></div>
                    <div className="divide-y divide-slate-50">
                      {profile.fees.map(f=>(
                        <div key={f.id} className={cn("flex items-center gap-4 px-6 py-3.5 transition-colors", (!feeToggles[f.id]||f.alreadyBilled)&&'opacity-40')}>
                          <button
                            onClick={()=>!f.isCompulsory&&!f.alreadyBilled&&setFeeToggles(p=>({...p,[f.id]:!p[f.id]}))}
                            disabled={f.alreadyBilled}
                            title={f.alreadyBilled?'Already invoiced this term — cannot be re-billed':undefined}
                            className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                              f.alreadyBilled?'cursor-not-allowed border-slate-300 bg-slate-100':
                              f.isCompulsory?'cursor-not-allowed border-blue-600 bg-blue-600':
                              feeToggles[f.id]?'border-blue-600 bg-blue-600':'border-slate-300')}>
                            {!f.alreadyBilled&&(f.isCompulsory||feeToggles[f.id])&&<Check className="h-3 w-3 text-white"/>}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800">{f.name}</p>
                              {f.alreadyBilled?(
                                <span className="mono rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-600">Already Billed</span>
                              ):f.isCompulsory&&(
                                <span className="mono rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-600">Compulsory</span>
                              )}
                            </div>
                            <p className="mono text-[10px] text-slate-400">{f.termScope} · {f.type==='ITEM'?`Qty ${f.quantity||1}`:'Service'}</p>
                          </div>
                          <p className="mono font-black text-slate-800">{fmt(f.amount*(f.quantity||1))}</p>
                        </div>
                      ))}

                      {/* Custom fees */}
                      {customFees.map((cf,i)=>(
                        <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                          <input value={cf.name} onChange={e=>setCustomFees(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Fee name" className="min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"/>
                          <input type="number" value={cf.amount} onChange={e=>setCustomFees(p=>p.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} placeholder="Amount" className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"/>
                          <button onClick={()=>setCustomFees(p=>p.filter((_,j)=>j!==i))} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
                        </div>
                      ))}

                      {/* Inventory items (uniforms, books, etc — decrements stock once invoice is paid) */}
                      {invoiceItems.map((it,i)=>(
                        <div key={it.inventoryItemId} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 bg-amber-50/40">
                          <div className="min-w-[140px] flex-1">
                            <p className="font-semibold text-slate-800">{it.name}</p>
                            <p className="mono text-[10px] text-slate-400">{fmt(it.unitPrice)} each · Inventory Item</p>
                          </div>
                          <input type="number" min={1} value={it.quantity} onChange={e=>setInvoiceItems(p=>p.map((x,j)=>j===i?{...x,quantity:Math.max(1,Number(e.target.value)||1)}:x))} className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center outline-none focus:border-amber-400"/>
                          <p className="mono font-black text-slate-800 w-24 text-right">{fmt(it.unitPrice*it.quantity)}</p>
                          <button onClick={()=>setInvoiceItems(p=>p.filter((_,j)=>j!==i))} className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
                        </div>
                      ))}
                    </div>

                    {inventoryOptions.length > 0 && (
                      <div className="border-t border-slate-100 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/50">
                        <select value={pickedInventoryId} onChange={e=>setPickedInventoryId(e.target.value)} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-400">
                          <option value="">Select item from inventory to sell…</option>
                          {inventoryOptions.map(opt=>(
                            <option key={opt.id} value={opt.id}>{opt.name} — {fmt(opt.sellingPrice)} ({opt.quantityOnHand} in stock)</option>
                          ))}
                        </select>
                        <button onClick={addInventoryItem} disabled={!pickedInventoryId} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap">
                          <Plus className="h-3.5 w-3.5"/>Add Item
                        </button>
                      </div>
                    )}

                    <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button onClick={()=>setCustomFees(p=>[...p,{name:'',amount:''}])} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 w-full sm:w-auto justify-center">
                        <Plus className="h-4 w-4"/>Add Custom Fee
                      </button>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="mono text-[10px] text-slate-400 uppercase">Total</p>
                          <p className="mono text-xl font-black text-slate-900">{fmt(computeTotal())}</p>
                        </div>
                        <button onClick={handleGenerateInvoice} disabled={generating} className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800 disabled:opacity-60">
                          {generating&&<Loader2 className="h-4 w-4 animate-spin"/>}
                          {generating?'Generating…':'Generate Invoice'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
