import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import { Loader2, ChevronRight, Printer, Search, FileText } from 'lucide-react';
import { cn } from '../../../../lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmt(n: number) { return '₦' + (n||0).toLocaleString('en-NG',{minimumFractionDigits:2}); }

interface Staff { id:string; name:string; department:string; employeeId:string; }
interface Payslip {
  period:{ month:number; year:number; label:string };
  staff:{ id:string; name:string; email:string; department:string; employeeId:string; bankName:string; accountNumber:string; accountName:string };
  school:{ name:string; phone:string; address:string; logoUrl:string };
  earningsBreakdown:{name:string;amount:number}[];
  deductionsBreakdown:{name:string;amount:number}[];
  gross:number; totalDeductions:number; net:number; status:string;
  outstandingLoan:number; totalPensionAccumulated:number;
}

export default function PayslipGenerator() {
  const now = new Date();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [query, setQuery] = useState('');
  const [selId, setSelId] = useState('');
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year, setYear] = useState(now.getFullYear());
  const [payslip, setPayslip] = useState<Payslip|null>(null);
  const [loadSt, setLoadSt] = useState(true);
  const [loadPay, setLoadPay] = useState(false);
  const [vis, setVis] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ const t=setTimeout(()=>setVis(true),60); return ()=>clearTimeout(t); },[]);

  useEffect(()=>{
    axios.get('/api/v1/payroll/staff',{withCredentials:true})
      .then(r=>setStaff(r.data.staff||[]))
      .catch(()=>toast.error('Failed to load staff'))
      .finally(()=>setLoadSt(false));
  },[]);

  const filtered = staff.filter(s=>s.name.toLowerCase().includes(query.toLowerCase())||s.employeeId.toLowerCase().includes(query.toLowerCase()));

  const doGenerate = async()=>{
    if(!selId){ toast.error('Select a staff member'); return; }
    setLoadPay(true); setPayslip(null);
    try {
      const r = await axios.get(`/api/v1/payroll/payslip/${selId}/${month}/${year}`,{withCredentials:true});
      setPayslip(r.data.payslip);
    } catch(e:any){ toast.error(e.response?.data?.message||'Failed to load payslip'); }
    finally { setLoadPay(false); }
  };

  const doPrint = ()=>{
    const content = printRef.current?.innerHTML;
    if(!content) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const pri = iframe.contentWindow;
    if (!pri) return;
    pri.document.open();
    pri.document.write(`<!DOCTYPE html><html><head><title>Payslip</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:32px;color:#1e293b}
      .ps-wrap{max-width:680px;margin:0 auto;border:1px solid #e2e8f0;padding:32px;border-radius:12px}
      .ps-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1e40af}
      .ps-logo{font-size:20px;font-weight:800;color:#1e40af}.ps-period{font-size:12px;color:#64748b;margin-top:4px}
      .ps-staff{background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px}
      .ps-section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:10px}
      table{width:100%;border-collapse:collapse}.trow{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
      .trow:last-child{border-bottom:none}.trow .amt{font-weight:700;font-family:monospace}
      .earn-amt{color:#16a34a}.ded-amt{color:#dc2626}.net-box{background:#1e40af;color:white;border-radius:8px;padding:16px;margin-top:20px;display:flex;justify-content:space-between;align-items:center}
      .net-label{font-size:12px;opacity:.8;text-transform:uppercase;letter-spacing:.05em}.net-val{font-size:22px;font-weight:900;font-family:monospace}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px}
      .info-item label{color:#94a3b8;font-size:10px;text-transform:uppercase;display:block}.info-item span{font-weight:600}
      .extra-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:12px}
      .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700}
      .badge-draft{background:#fef3c7;color:#d97706}.badge-paid{background:#d1fae5;color:#065f46}
    </style></head><body>${content}</body></html>`);
    pri.document.close();
    pri.focus();
    pri.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');.pg-root,.pg-root *{font-family:'Plus Jakarta Sans',sans-serif!important}.pg-root .mono{font-family:'DM Mono',monospace!important}`}</style>
      <div className="pg-root min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 px-3 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        <div className="pointer-events-none fixed inset-0 opacity-[0.2]" style={{backgroundImage:'radial-gradient(circle,#94a3b8 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
        <div className="relative z-10 mx-auto max-w-5xl">

          {/* Breadcrumb */}
          <div className={cn('mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 transition-all duration-500 text-[9px] sm:text-[10px]',vis?'opacity-100':'opacity-0 -translate-y-2')}>
            <span className="mono font-bold uppercase tracking-widest text-slate-500">Finance</span>
            <ChevronRight className="h-3 w-3 text-slate-400"/>
            <span className="mono font-bold uppercase tracking-widest text-slate-500">Payroll</span>
            <ChevronRight className="h-3 w-3 text-slate-400"/>
            <span className="mono font-bold uppercase tracking-widest text-indigo-600">Payslip Generator</span>
          </div>

          <div className={cn('mb-4 sm:mb-8 transition-all duration-500',vis?'opacity-100':'opacity-0 translate-y-3')}>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Payslip Generator</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Generate and print payslips for any staff member.</p>
          </div>

          {/* Controls */}
          <div className={cn('mb-5 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 backdrop-blur-xl transition-all duration-500',vis?'opacity-100':'opacity-0 translate-y-3')}>
            <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <FileText className="h-4 w-4 sm:h-4.5 sm:w-4.5"/>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">Generate Payslip</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Search */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Search Staff</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-slate-400"/>
                  <input
                    value={query}
                    onChange={e=>{setQuery(e.target.value);setSelId('');}}
                    placeholder="Name or employee ID…"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Staff results */}
              {query && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {loadSt ? <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-indigo-500"/></div>
                  : filtered.length===0 ? <p className="p-4 text-center text-xs sm:text-sm text-slate-400">No staff found</p>
                  : filtered.slice(0,6).map(s=>(
                    <button key={s.id} onClick={()=>{setSelId(s.id);setQuery(s.name);}} className={cn('flex w-full items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 text-left hover:bg-indigo-50/60 border-b border-slate-50 last:border-b-0 cursor-pointer',selId===s.id&&'bg-indigo-50')}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">{s.name.substring(0,2).toUpperCase()}</div>
                      <div><p className="font-semibold text-xs sm:text-sm text-slate-800">{s.name}</p><p className="mono text-[10px] text-slate-400">{s.department} · {s.employeeId}</p></div>
                    </button>
                  ))}
                </div>
              )}

              {/* Month/Year + Generate */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Month</label>
                    <select
                      value={month}
                      onChange={e=>setMonth(+e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                    >
                      {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Year</label>
                    <select
                      value={year}
                      onChange={e=>setYear(+e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                    >
                      {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <Button
                  onClick={doGenerate}
                  disabled={loadPay||!selId}
                  className="h-10 w-full sm:w-auto gap-2 rounded-xl bg-indigo-600 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 cursor-pointer"
                >
                  {loadPay?<Loader2 className="h-4 w-4 animate-spin"/>:<FileText className="h-4 w-4"/>} Generate Payslip
                </Button>
              </div>
            </div>
          </div>

          {/* Payslip Preview */}
          <AnimatePresence>
          {payslip && (
            <motion.div key="ps" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:0.3,ease:[0.16,1,0.3,1]}}>
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-700">Payslip Preview</h3>
                <Button onClick={doPrint} className="gap-1.5 sm:gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-white hover:bg-slate-900 shadow-md cursor-pointer active:scale-95">
                  <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>Print Payslip
                </Button>
              </div>

              {/* Print-ready document */}
              <div ref={printRef} className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xl">
                <div className="ps-wrap p-4 sm:p-8">
                  {/* Header */}
                  <div className="ps-header mb-5 sm:mb-6 flex items-start justify-between border-b-2 border-indigo-700 pb-4 sm:pb-5">
                    <div>
                      {payslip.school.logoUrl && <img src={payslip.school.logoUrl} alt="logo" className="mb-2 h-8 sm:h-10 object-contain"/>}
                      <p className="ps-logo text-base sm:text-xl font-black text-indigo-700">{payslip.school.name}</p>
                      {payslip.school.address && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{payslip.school.address}</p>}
                      {payslip.school.phone && <p className="text-[11px] sm:text-xs text-slate-400">{payslip.school.phone}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-lg font-black text-slate-800">PAYSLIP</p>
                      <p className="mono text-[11px] sm:text-xs text-slate-500">{payslip.period.label}</p>
                      <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase', payslip.status==='paid'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700')}>{payslip.status==='paid'?'Paid':'Draft'}</span>
                    </div>
                  </div>

                  {/* Staff info */}
                  <div className="ps-staff mb-5 sm:mb-6 rounded-xl bg-slate-50 p-3.5 sm:p-5">
                    <p className="mono mb-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee Details</p>
                    <div className="info-grid grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 sm:gap-y-3 text-xs sm:text-sm">
                      {[
                        ['Name', payslip.staff.name],
                        ['Employee ID', payslip.staff.employeeId],
                        ['Section', payslip.staff.department||'—'],
                        ['Email', payslip.staff.email||'—'],
                        ['Bank', payslip.staff.bankName||'—'],
                        ['Account No.', payslip.staff.accountNumber||'—'],
                        ['Account Name', payslip.staff.accountName||'—'],
                        ['Pay Period', payslip.period.label],
                      ].map(([l,v])=>(
                        <div key={l}><label className="mono text-[9px] font-bold uppercase tracking-widest text-slate-400">{l}</label><span className="mt-0.5 block font-semibold text-slate-800">{v}</span></div>
                      ))}
                    </div>
                  </div>

                  {/* Earnings & Deductions */}
                  <div className="mb-5 sm:mb-6 grid gap-4 sm:gap-5 sm:grid-cols-2">
                    {/* Earnings */}
                    <div className="rounded-xl border border-emerald-100 p-3.5 sm:p-4">
                      <p className="mono mb-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600">Earnings</p>
                      {payslip.earningsBreakdown.map(e=>(
                        <div key={e.name} className="trow flex justify-between border-b border-slate-50 py-1 sm:py-1.5 text-xs sm:text-sm">
                          <span className="text-slate-600">{e.name}</span>
                          <span className="mono font-bold text-emerald-700">{fmt(e.amount)}</span>
                        </div>
                      ))}
                      {!payslip.earningsBreakdown.length && <p className="text-xs text-slate-400">No earnings configured</p>}
                      <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2 text-xs sm:text-sm font-bold">
                        <span className="text-slate-700">Gross Salary</span>
                        <span className="mono text-emerald-700">{fmt(payslip.gross)}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="rounded-xl border border-rose-100 p-3.5 sm:p-4">
                      <p className="mono mb-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-rose-600">Deductions</p>
                      {payslip.deductionsBreakdown.map(d=>(
                        <div key={d.name} className="trow flex justify-between border-b border-slate-50 py-1 sm:py-1.5 text-xs sm:text-sm">
                          <span className="text-slate-600">{d.name}</span>
                          <span className="mono font-bold text-rose-600">-{fmt(d.amount)}</span>
                        </div>
                      ))}
                      {!payslip.deductionsBreakdown.length && <p className="text-xs text-slate-400">No deductions configured</p>}
                      <div className="mt-2 flex justify-between border-t border-rose-200 pt-2 text-xs sm:text-sm font-bold">
                        <span className="text-slate-700">Total Deductions</span>
                        <span className="mono text-rose-600">-{fmt(payslip.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay hero */}
                  <div className="net-box mb-4 sm:mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-4 sm:p-5 text-white shadow-lg">
                    <div>
                      <p className="mono text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-75">Net Pay</p>
                      <p className="mt-0.5 text-[10px] sm:text-xs opacity-60">{payslip.period.label}</p>
                    </div>
                    <p className="mono text-xl sm:text-3xl font-black">{fmt(payslip.net)}</p>
                  </div>

                  {/* Extra info */}
                  {(payslip.outstandingLoan>0||payslip.totalPensionAccumulated>0) && (
                    <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                      <p className="mono mb-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Additional Information</p>
                      {payslip.outstandingLoan>0 && (
                        <div className="flex justify-between py-1 text-xs sm:text-sm border-b border-slate-100">
                          <span className="text-slate-600">Outstanding Loan Balance</span>
                          <span className="mono font-bold text-amber-600">{fmt(payslip.outstandingLoan)}</span>
                        </div>
                      )}
                      {payslip.totalPensionAccumulated>0 && (
                        <div className="flex justify-between py-1 text-xs sm:text-sm">
                          <span className="text-slate-600">Total Pension Accumulated</span>
                          <span className="mono font-bold text-teal-600">{fmt(payslip.totalPensionAccumulated)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-slate-100 pt-3 sm:pt-4 text-center sm:text-left">
                    <p className="text-[10px] text-slate-400">Generated by Skooly · {new Date().toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}</p>
                    <p className="text-[10px] font-semibold text-slate-500">This is a computer-generated payslip</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Empty state */}
          {!payslip && !loadPay && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 sm:py-20 text-center px-4">
              <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-50"><FileText className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400"/></div>
              <p className="font-semibold text-slate-500 text-xs sm:text-sm">Search for a staff member and select a period</p>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-400">to generate a print-ready payslip</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
