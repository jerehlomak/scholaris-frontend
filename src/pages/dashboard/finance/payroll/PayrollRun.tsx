import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import { Loader2, ChevronRight, Play, CheckCircle2, Download, ChevronDown, AlertTriangle, History, X, Building, CreditCard, DollarSign } from 'lucide-react';
import { cn } from '../../../../lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmt(n: number) { return '₦' + (n||0).toLocaleString('en-NG',{minimumFractionDigits:2}); }
function fmtShort(n: number) {
  if (!n) return '₦0.00';
  if (Math.abs(n) >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return '₦' + (n / 1_000).toFixed(1) + 'k';
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
}
function avBg(n: string) { const c=['bg-violet-500','bg-[#1E4DA6]','bg-teal-500','bg-rose-500','bg-amber-500','bg-indigo-500']; return c[n.charCodeAt(0)%c.length]; }

interface RunItem { id:string; staffId:string; staffName:string; department:string; employeeId:string; bankName:string; accountNumber:string; accountName:string; gross:number; net:number; status:string; earningsBreakdown:any[]; deductionsBreakdown:any[]; }
interface Run { id:string; month:number; year:number; totalGross:number; totalDeductions:number; totalNet:number; status:string; createdAt:string; items:RunItem[]; }

export default function PayrollRun() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year, setYear] = useState(now.getFullYear());
  const [currentRun, setCurrentRun] = useState<Run|null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'gateway'|'excel'|'manual'>('excel');
  const [vis, setVis] = useState(false);
  const errMsg = (e: any) => e?.response?.data?.message || e?.response?.data?.msg || e?.message || 'An error occurred';

  useEffect(()=>{ const t=setTimeout(()=>setVis(true),60); return ()=>clearTimeout(t); },[]);

  useEffect(()=>{
    axios.get('/api/v1/payroll/run',{withCredentials:true})
      .then(r=>setRuns(r.data.runs||[]))
      .catch(()=>toast.error('Failed to load run history'))
      .finally(()=>setLoadingRuns(false));
  },[]);

  const doGenerate = async()=>{
    setGenerating(true);
    try {
      const r = await axios.post('/api/v1/payroll/run',{month,year},{withCredentials:true});
      setCurrentRun(r.data.run);
      setRuns(p=>[r.data.run,...p.filter(x=>x.id!==r.data.run.id)]);
      toast.success(`Payroll draft for ${MONTHS[month-1]} ${year} generated`);
    } catch(e:any){ toast.error(errMsg(e)); }
    finally { setGenerating(false); }
  };

  const loadRun = async(id:string)=>{
    try {
      const r = await axios.get(`/api/v1/payroll/run/${id}`,{withCredentials:true});
      setCurrentRun(r.data.run);
    } catch { toast.error('Failed to load run'); }
  };

  const doConfirm = async()=>{
    if(!currentRun) return;
    setConfirming(true);
    try {
      await axios.post(`/api/v1/payroll/run/${currentRun.id}/confirm`,{},{withCredentials:true});
      setCurrentRun(p=>p?{...p,status:'confirmed'}:p);
      setRuns(p=>p.map(r=>r.id===currentRun.id?{...r,status:'confirmed'}:r));
      setShowConfirm(false);
      toast.success('Payroll confirmed! Expense record auto-created in Income & Expenses.');
    } catch(e:any){ toast.error(e.response?.data?.message||'Failed to confirm payroll'); }
    finally { setConfirming(false); }
  };

  const doExport = ()=>{
    if(!currentRun) return;
    window.open(`/api/v1/payroll/run/${currentRun.id}/export`,'_blank');
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');.pr-root .mono{font-family:'DM Mono',monospace!important}`}</style>
      <div className="pr-root min-h-screen bg-[#FBF9F5] px-3 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        <div className="relative z-10 mx-auto max-w-6xl">

          {/* Breadcrumb */}
          <div className={cn('mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 transition-all duration-500 text-[9px] sm:text-[10px]',vis?'opacity-100':'opacity-0 -translate-y-2')}>
            <span className="mono font-bold uppercase tracking-widest text-slate-500">Finance</span>
            <ChevronRight className="h-3 w-3 text-slate-400"/>
            <span className="mono font-bold uppercase tracking-widest text-slate-500">Payroll</span>
            <ChevronRight className="h-3 w-3 text-slate-400"/>
            <span className="mono font-bold uppercase tracking-widest text-[#1E4DA6]">Payroll Run</span>
          </div>

          <div className={cn('mb-4 sm:mb-8 transition-all duration-500',vis?'opacity-100':'opacity-0 translate-y-3')}>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Payroll Run</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Generate monthly salary payments. Confirming auto-records an expense in Income &amp; Expenses.</p>
          </div>

          {/* Generate controls */}
          <div className={cn('mb-5 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 transition-all duration-500',vis?'opacity-100':'opacity-0 translate-y-3')}>
            <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#1E4DA6]/10 text-[#1E4DA6]">
                <Play className="h-4 w-4 sm:h-4.5 sm:w-4.5"/>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">Generate Payroll</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Month</label>
                    <select
                      value={month}
                      onChange={e=>setMonth(+e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-[#1E4DA6]/60 focus:outline-none focus:ring-2 focus:ring-[#1E4DA6]/10"
                    >
                      {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Year</label>
                    <select
                      value={year}
                      onChange={e=>setYear(+e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-[#1E4DA6]/60 focus:outline-none focus:ring-2 focus:ring-[#1E4DA6]/10"
                    >
                      {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <Button
                  onClick={doGenerate}
                  disabled={generating}
                  className="h-10 sm:h-10 w-full sm:w-auto gap-2 rounded-xl bg-[#1E4DA6] px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#173F8C] active:scale-95 cursor-pointer"
                >
                  {generating?<Loader2 className="h-4 w-4 animate-spin"/>:<Play className="h-4 w-4"/>}
                  Generate {MONTHS[month-1]} {year}
                </Button>
              </div>
            </div>
          </div>

          {/* Active Run View */}
          <AnimatePresence>
          {currentRun && (
            <motion.div key="run-view" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:0.3,ease:[0.16,1,0.3,1]}}>

              {/* Summary banner - Responsive 1-col on mobile, 3-col on sm */}
              <div className="mb-4 sm:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  {label:'Total Gross Pay',value:fmt(currentRun.totalGross),color:'text-emerald-700',bg:'bg-emerald-50/70',border:'border-emerald-200'},
                  {label:'Total Deductions',value:`-${fmt(currentRun.totalDeductions)}`,color:'text-rose-700',bg:'bg-rose-50/70',border:'border-rose-200'},
                  {label:'Total Net Disbursed',value:fmt(currentRun.totalNet),color:'text-[#173F8C]',bg:'bg-[#1E4DA6]/8',border:'border-[#1E4DA6]/20'},
                ].map(c=>(
                  <div key={c.label} className={cn('rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-sm',c.bg,c.border)}>
                    <p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</p>
                    <p className={cn('mono text-lg sm:text-xl font-black mt-0.5 sm:mt-1',c.color)}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Staff Breakdown Container */}
              <div className="mb-4 sm:mb-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-6 sm:py-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">{MONTHS[currentRun.month-1]} {currentRun.year} — Staff Breakdown</h3>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">{currentRun.items?.length||0} staff members in payroll run</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide',currentRun.status==='confirmed'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')}>
                    {currentRun.status}
                  </span>
                </div>

                {/* Mobile Card View for Staff Breakdown */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {(currentRun.items||[]).map((item)=>(
                    <div key={item.staffId} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white',avBg(item.staffName||'?'))}>
                            {(item.staffName||'?').substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.staffName}</p>
                            <p className="text-[10px] text-slate-400">{item.department || 'General'} • <span className="mono">{item.employeeId}</span></p>
                          </div>
                        </div>
                        <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0',item.status==='paid'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500')}>
                          {item.status}
                        </span>
                      </div>

                      {/* 3-Column Mini Stats */}
                      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50 p-2 text-center">
                        <div>
                          <span className="text-[8px] font-bold uppercase text-slate-400">Gross</span>
                          <p className="mono text-[11px] font-bold text-emerald-700 truncate">{fmtShort(item.gross)}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold uppercase text-slate-400">Deduct</span>
                          <p className="mono text-[11px] font-bold text-rose-600 truncate">-{fmtShort(item.gross - item.net)}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold uppercase text-slate-400">Net Pay</span>
                          <p className="mono text-[11px] font-black text-[#173F8C] truncate">{fmtShort(item.net)}</p>
                        </div>
                      </div>

                      {/* Expand Button for details */}
                      <button
                        onClick={()=>setExpandedRow(expandedRow===item.staffId?null:item.staffId)}
                        className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 pt-0.5 cursor-pointer"
                      >
                        <span>{expandedRow===item.staffId ? 'Hide Salary Details' : 'View Breakdown & Bank Details'}</span>
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform',expandedRow===item.staffId&&'rotate-180')}/>
                      </button>

                      {/* Expanded Breakdown on Mobile */}
                      {expandedRow===item.staffId && (
                        <div className="rounded-xl bg-slate-50/90 border border-slate-200/60 p-3 space-y-3 mt-2">
                          <div>
                            <p className="mono text-[9px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">Earnings</p>
                            {(item.earningsBreakdown||[]).map((e:any)=>(
                              <div key={e.name} className="flex justify-between py-0.5 text-[11px] border-b border-emerald-100/60">
                                <span className="text-slate-600">{e.name}</span>
                                <span className="mono font-bold text-emerald-700">{fmt(e.amount)}</span>
                              </div>
                            ))}
                            {!item.earningsBreakdown?.length && <p className="text-[10px] text-slate-400">No custom earnings</p>}
                          </div>
                          <div>
                            <p className="mono text-[9px] font-bold uppercase tracking-widest text-rose-700 mb-1.5">Deductions</p>
                            {(item.deductionsBreakdown||[]).map((d:any)=>(
                              <div key={d.name} className="flex justify-between py-0.5 text-[11px] border-b border-rose-100/60">
                                <span className="text-slate-600">{d.name}</span>
                                <span className="mono font-bold text-rose-600">-{fmt(d.amount)}</span>
                              </div>
                            ))}
                            {!item.deductionsBreakdown?.length && <p className="text-[10px] text-slate-400">No deductions</p>}
                          </div>
                          <div className="border-t border-slate-200 pt-2 flex flex-col gap-0.5 text-[11px]">
                            <span className="font-semibold text-slate-700">Bank: {item.bankName||'Not provided'}</span>
                            <span className="mono text-slate-500">Account: {item.accountNumber||'—'} ({item.accountName||'—'})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/40">
                      <tr>
                        {['Staff','Dept','Gross','Deductions','Net Pay','Status',''].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(currentRun.items||[]).map((item,i)=>(
                        <>
                          <motion.tr key={item.staffId} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                            className="group hover:bg-slate-50/60 cursor-pointer" onClick={()=>setExpandedRow(expandedRow===item.staffId?null:item.staffId)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white',avBg(item.staffName||'?'))}>{(item.staffName||'?').substring(0,2).toUpperCase()}</div>
                                <div><p className="font-semibold text-slate-800">{item.staffName}</p><p className="mono text-[10px] text-slate-400">{item.employeeId}</p></div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{item.department||'—'}</td>
                            <td className="px-4 py-3"><span className="mono font-bold text-emerald-700">{fmt(item.gross)}</span></td>
                            <td className="px-4 py-3"><span className="mono font-bold text-rose-600">-{fmt(item.gross-item.net)}</span></td>
                            <td className="px-4 py-3"><span className="mono font-black text-[#173F8C]">{fmt(item.net)}</span></td>
                            <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',item.status==='paid'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-500')}>{item.status}</span></td>
                            <td className="px-4 py-3"><ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform',expandedRow===item.staffId&&'rotate-180')}/></td>
                          </motion.tr>
                          {expandedRow===item.staffId && (
                            <tr key={`${item.staffId}-exp`}>
                              <td colSpan={7} className="bg-slate-50/80 px-6 py-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <p className="mono mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Earnings Breakdown</p>
                                    {(item.earningsBreakdown||[]).map((e:any)=>(
                                      <div key={e.name} className="flex justify-between py-1 text-xs border-b border-emerald-100"><span className="text-slate-600">{e.name}</span><span className="mono font-bold text-emerald-700">{fmt(e.amount)}</span></div>
                                    ))}
                                    {!item.earningsBreakdown?.length && <p className="text-xs text-slate-400">No earnings configured</p>}
                                  </div>
                                  <div>
                                    <p className="mono mb-2 text-[10px] font-bold uppercase tracking-widest text-rose-600">Deductions Breakdown</p>
                                    {(item.deductionsBreakdown||[]).map((d:any)=>(
                                      <div key={d.name} className="flex justify-between py-1 text-xs border-b border-rose-100"><span className="text-slate-600">{d.name}</span><span className="mono font-bold text-rose-600">-{fmt(d.amount)}</span></div>
                                    ))}
                                    {!item.deductionsBreakdown?.length && <p className="text-xs text-slate-400">No deductions configured</p>}
                                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-xs font-bold"><span className="text-slate-700">Bank: {item.bankName||'N/A'}</span><span className="mono text-slate-600">{item.accountNumber||'—'}</span></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment method tabs */}
              {currentRun.status!=='confirmed' && (
                <div className="mb-4 sm:mb-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4"><h3 className="text-xs sm:text-sm font-bold text-slate-800">Disbursement &amp; Payment Options</h3></div>
                  <div className="p-4 sm:p-6">
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                      {(['excel','gateway','manual'] as const).map(tab=>(
                        <button key={tab} onClick={()=>setActiveTab(tab)} className={cn('rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-all cursor-pointer text-center',activeTab===tab?'bg-[#1E4DA6] text-white shadow-md':'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                          {tab==='excel'?'📊 Excel / Bank Export':tab==='gateway'?'💳 Payment Gateway':'💵 Manual / Cash'}
                        </button>
                      ))}
                    </div>
                    {activeTab==='excel' && (
                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <p className="mb-3 text-xs sm:text-sm text-slate-600">Download a formatted Excel file with staff bank details and net pay amounts. Upload directly to your bank's bulk payment portal.</p>
                        <Button onClick={doExport} className="w-full sm:w-auto gap-2 rounded-xl bg-indigo-600 text-xs sm:text-sm text-white hover:bg-indigo-700 active:scale-95 cursor-pointer"><Download className="h-4 w-4"/>Download Bank Export (.xlsx)</Button>
                      </div>
                    )}
                    {activeTab==='gateway' && (
                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <p className="text-xs sm:text-sm text-slate-500">Gateway salary disbursement is available after confirming the payroll run. Contact your payment provider to set up bulk staff disbursement.</p>
                      </div>
                    )}
                    {activeTab==='manual' && (
                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <p className="mb-2 text-xs sm:text-sm text-slate-600">For cash or manual payments, confirm the payroll run after distributing salaries. This will mark all staff as paid.</p>
                        <p className="text-[11px] sm:text-xs text-amber-600 font-semibold">⚠ Confirm only after physically distributing payments.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confirm button */}
              {currentRun.status!=='confirmed' && (
                <div className="flex justify-end">
                  <Button onClick={()=>setShowConfirm(true)} className="w-full sm:w-auto gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 cursor-pointer">
                    <CheckCircle2 className="h-5 w-5"/>Confirm &amp; Mark as Paid
                  </Button>
                </div>
              )}

              {currentRun.status==='confirmed' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600"/>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-emerald-800">Payroll Confirmed</p>
                      <p className="text-[11px] sm:text-xs text-emerald-600">Expense record auto-created in Income &amp; Expenses → Expenses</p>
                    </div>
                  </div>
                  <Button onClick={doExport} variant="outline" className="w-full sm:w-auto gap-2 rounded-xl border-emerald-300 text-xs sm:text-sm text-emerald-700 hover:bg-emerald-100 active:scale-95 cursor-pointer">
                    <Download className="h-4 w-4"/>Export Excel
                  </Button>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>

          {/* Run History Section */}
          {runs.length>0 && (
            <div className={cn('mt-6 sm:mt-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 transition-all duration-500',vis?'opacity-100':'opacity-0')}>
              <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <History className="h-4 w-4 sm:h-4.5 sm:w-4.5"/>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Run History</h3>
              </div>

              {/* Mobile Card View for Run History */}
              <div className="block md:hidden divide-y divide-slate-100">
                {runs.map(run=>(
                  <div key={run.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E4DA6]/5 text-[#173F8C]">
                          <span className="mono text-xs font-bold">{MONTHS[run.month-1].substring(0,3)}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{MONTHS[run.month-1]} {run.year}</p>
                          <p className="mono text-[10px] text-slate-400">Created: {new Date(run.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase',run.status==='confirmed'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')}>
                        {run.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                      <div>
                        <span className="text-[8px] font-bold uppercase text-slate-400 block">Net Payroll</span>
                        <span className="mono text-sm font-black text-slate-800">{fmt(run.totalNet)}</span>
                      </div>
                      <button
                        onClick={()=>loadRun(run.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View for Run History */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Period</th>
                      <th className="px-6 py-3 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Net Payroll</th>
                      <th className="px-6 py-3 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center">Status</th>
                      <th className="px-6 py-3 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {runs.map(run=>(
                      <tr key={run.id} className="hover:bg-slate-50/60 transition-colors bg-white">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4DA6]/5 text-[#173F8C]"><span className="mono text-xs font-bold">{MONTHS[run.month-1].substring(0,3)}</span></div>
                            <p className="font-semibold text-slate-800">{MONTHS[run.month-1]} {run.year}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="mono font-black text-slate-700">{fmt(run.totalNet)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',run.status==='confirmed'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')}>{run.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={()=>loadRun(run.id)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirm modal */}
          <AnimatePresence>
          {showConfirm && currentRun && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
              <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.92,opacity:0}} transition={{duration:0.2}} className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100"><AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600"/></div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Confirm Payroll Run</h3>
                  </div>
                  <button onClick={()=>setShowConfirm(false)} className="rounded-lg p-1.5 hover:bg-slate-100 cursor-pointer"><X className="h-4 w-4 text-slate-500"/></button>
                </div>
                <div className="mb-4 sm:mb-5 rounded-xl bg-slate-50 p-3.5 sm:p-4 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm"><span className="text-slate-500">Period</span><span className="font-semibold">{MONTHS[currentRun.month-1]} {currentRun.year}</span></div>
                  <div className="flex justify-between text-xs sm:text-sm"><span className="text-slate-500">Total Gross</span><span className="mono font-bold text-emerald-700">{fmt(currentRun.totalGross)}</span></div>
                  <div className="flex justify-between text-xs sm:text-sm"><span className="text-slate-500">Total Deductions</span><span className="mono font-bold text-rose-600">-{fmt(currentRun.totalDeductions)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-xs sm:text-sm"><span className="font-bold text-slate-700">Total Net Pay</span><span className="mono text-base sm:text-lg font-black text-[#173F8C]">{fmt(currentRun.totalNet)}</span></div>
                </div>
                <div className="mb-4 sm:mb-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5"/>
                  <p className="text-[11px] sm:text-xs text-amber-700">This will mark all staff as paid and <strong>automatically create an expense entry</strong> in Income &amp; Expenses for {fmt(currentRun.totalNet)}. This action cannot be undone.</p>
                </div>
                <div className="flex gap-2.5 sm:gap-3">
                  <Button variant="outline" onClick={()=>setShowConfirm(false)} className="flex-1 rounded-xl text-xs sm:text-sm cursor-pointer">Cancel</Button>
                  <Button onClick={doConfirm} disabled={confirming} className="flex-1 gap-1.5 sm:gap-2 rounded-xl bg-emerald-600 text-xs sm:text-sm text-white hover:bg-emerald-700 active:scale-95 cursor-pointer">
                    {confirming?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>}Confirm &amp; Pay
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}
