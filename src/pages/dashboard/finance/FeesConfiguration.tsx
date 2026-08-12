import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, ChevronRight, Search, Loader2, Package, Wrench, ShieldCheck, Shield, DollarSign } from 'lucide-react';
import { cn } from '../../../lib/utils';

type FeeType = 'FEE' | 'ITEM';
type TermScope = 'ANNUAL' | 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
type ScopeChoice = 'WHOLE_SCHOOL' | 'CLASS';

interface Fee {
  id: string; name: string; type: FeeType; category: string;
  amount: number; quantity?: number; scope: ScopeChoice;
  classIds: string[]; termScope: TermScope; isCompulsory: boolean; isActive: boolean;
  bankAccountId?: string | null;
}
interface ClassArm { id: string; name: string; level: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; }

const CATEGORIES = ['TUITION','EXAM','DEVELOPMENT','TRANSPORT','BOOKS','UNIFORM','HOSTEL','LUNCH','ACTIVITY','CUSTOM'];
const fmt = (n: number) => '₦' + (n || 0).toLocaleString('en-NG');

const emptyForm = { name:'', amount:'', type:'FEE' as FeeType, category:'TUITION', quantity:'', scope:'WHOLE_SCHOOL' as ScopeChoice, classIds: [] as string[], termScope:'ANNUAL' as TermScope, isCompulsory:true, bankAccountId: '' };

export default function FeesConfiguration() {
  const { terms: metaTerms, sessions: metaSessions } = useFinanceMeta();
  const TERMS: { value: TermScope; label: string }[] = [
    { value: 'ANNUAL' as TermScope, label: 'All Terms' },
    ...metaTerms.map(t => ({ value: t as TermScope, label: t })),
  ];
  const [fees, setFees] = useState<Fee[]>([]);
  const [classes, setClasses] = useState<ClassArm[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    Promise.all([
      axios.get('/api/v1/finance-v2/fees', { withCredentials: true }),
      axios.get('/api/v1/classes/all', { withCredentials: true }),
      axios.get('/api/v1/finance-v2/bank-accounts', { withCredentials: true }),
    ]).then(([feesRes, classRes, bankRes]) => {
      setFees(feesRes.data.fees || []);
      setClasses(classRes.data.classes || []);
      setBankAccounts(bankRes.data.banks || []);
    }).catch(() => toast.error('Failed to load data')).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setPanelOpen(true); };
  const openEdit = (f: Fee) => {
    setForm({ name: f.name, amount: String(f.amount), type: f.type, category: f.category,
      quantity: f.quantity ? String(f.quantity) : '', scope: f.scope,
      classIds: f.classIds || [], termScope: f.termScope, isCompulsory: f.isCompulsory,
      bankAccountId: f.bankAccountId || '' });
    setEditId(f.id); setPanelOpen(true);
  };
  const closePanel = () => { setPanelOpen(false); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Fee name is required'); return; }
    if (!form.amount || Number(form.amount) < 0) { toast.error('Valid amount is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), amount: Number(form.amount), type: form.type,
      category: form.category, quantity: form.quantity ? Number(form.quantity) : null,
      scope: form.scope, classIds: form.scope === 'CLASS' ? form.classIds : [],
      termScope: form.termScope, isCompulsory: form.isCompulsory,
      bankAccountId: form.bankAccountId || null,
    };
    try {
      if (editId) {
        const res = await axios.put(`/api/v1/finance-v2/fees/${editId}`, payload, { withCredentials: true });
        setFees(p => p.map(f => f.id === editId ? res.data.fee : f));
        toast.success('Fee updated');
      } else {
        const res = await axios.post('/api/v1/finance-v2/fees', payload, { withCredentials: true });
        setFees(p => [res.data.fee, ...p]);
        toast.success('Fee created');
      }
      closePanel();
    } catch (e: any) { toast.error(e.response?.data?.msg || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/v1/finance-v2/fees/${id}`, { withCredentials: true });
      setFees(p => p.filter(f => f.id !== id));
      toast.success('Fee deleted');
    } catch (e: any) { toast.error(e.response?.data?.msg || 'Delete failed'); }
  };

  const displayed = fees.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  const compulsoryCount = fees.filter(f => f.isCompulsory).length;
  const optionalCount = fees.filter(f => !f.isCompulsory).length;
  const itemCount = fees.filter(f => f.type === 'ITEM').length;

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';
  const seg = (active: boolean) => cn('flex-1 rounded-lg py-2 text-xs font-semibold transition-all text-center cursor-pointer', active ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700');

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fs-root,.fs-root *{font-family:'Plus Jakarta Sans',sans-serif!important} .fs-root .mono{font-family:'DM Mono',monospace!important}`}</style>
      <div className="fs-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage:'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize:'28px 28px' }} />
        <div className="relative z-10 mx-auto max-w-6xl">

          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5">
            <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Fees Setup</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-500 shadow-lg shadow-blue-200">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Fees Setup</h1>
                <p className="mt-0.5 text-sm text-slate-500">Define and manage all fee types for your school.</p>
              </div>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
              <Plus className="h-4 w-4" /> Add Fee
            </button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label:'Total Fees', value: fees.length, icon:<DollarSign className="h-4 w-4" />, c:'blue' },
              { label:'Compulsory', value: compulsoryCount, icon:<ShieldCheck className="h-4 w-4" />, c:'emerald' },
              { label:'Optional', value: optionalCount, icon:<Shield className="h-4 w-4" />, c:'amber' },
              { label:'Item (Stock)', value: itemCount, icon:<Package className="h-4 w-4" />, c:'purple' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', `bg-${s.c}-50 text-${s.c}-600`)}>{s.icon}</div>
                <p className="mono text-2xl font-black text-slate-900">{s.value}</p>
                <p className="mono mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-800">Fee List</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fees…"
                  className="h-9 w-56 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><DollarSign className="h-6 w-6 text-slate-400" /></div>
                <p className="font-semibold text-slate-500">{search ? 'No fees match your search' : 'No fees defined yet'}</p>
                {!search && <button onClick={openCreate} className="mt-1 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800">Add your first fee</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                  <thead className="bg-slate-50/60 border-b border-slate-50">
                    <tr>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Fee Details</th>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Type / Category</th>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Assignment</th>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount</th>
                      <th className="px-6 py-2.5 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                      {displayed.map((f, i) => {
                        const termLabel = TERMS.find(t => t.value === f.termScope)?.label || f.termScope;
                        const classLabel = f.scope === 'WHOLE_SCHOOL' ? 'All Classes' : (f.classIds && f.classIds.length > 0 ? f.classIds.map(id => classes.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'Specific Class' : 'Specific Class');
                        return (
                          <motion.tr key={f.id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2, delay: i*0.02 }} className="group hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', f.type === 'ITEM' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600')}>
                                  {f.type === 'ITEM' ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{f.name}</p>
                                  <span className={cn('inline-block mt-1 rounded-full px-2 py-0.5 mono text-[9px] font-bold uppercase', f.isCompulsory ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                                    {f.isCompulsory ? 'Compulsory' : 'Optional'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-700">{f.type === 'ITEM' ? 'Item' : 'Service'}</p>
                              <p className="mono mt-0.5 text-[10px] text-slate-400">{f.category}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-semibold text-slate-700">{classLabel}</p>
                              <p className="mono mt-0.5 text-[10px] text-slate-400">{termLabel}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="mono font-black text-slate-900">{fmt(f.amount)}</p>
                              {f.type === 'ITEM' && f.quantity && <p className="mono mt-0.5 text-[10px] text-slate-400">Qty: {f.quantity}</p>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(f)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(f.id, f.name)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }} transition={{ type:'spring', stiffness:300, damping:30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                <div>
                  <p className="font-bold text-slate-900">{editId ? 'Edit Fee' : 'Add New Fee'}</p>
                  <p className="mono mt-0.5 text-[10px] text-slate-400">{editId ? 'Update fee details below' : 'Fill in the details to create a new fee'}</p>
                </div>
                <button onClick={closePanel} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Fee Name */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Fee Name <span className="text-rose-500">*</span></label>
                  <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. School Fees, Exam Fee, Uniform" className={field} />
                </div>

                {/* Amount */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (₦) <span className="text-rose-500">*</span></label>
                  <input type="number" min={0} value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} placeholder="0.00" className={field} />
                </div>

                {/* Category: Service / Item */}
                <div>
                  <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Category <span className="text-rose-500">*</span></label>
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {([['FEE','Service (Non-countable)'],['ITEM','Item (Countable/Stock)']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setForm(p => ({...p, type: v}))} className={seg(form.type === v)}>{l}</button>
                    ))}
                  </div>
                  <p className="mono mt-1.5 text-[10px] text-slate-400">
                    {form.type === 'FEE' ? 'Service fees cannot be tracked in inventory (e.g. Exam Fee, School Fees, Development Levy)' : 'Item fees can be tracked in inventory (e.g. Books, Uniforms, Biros)'}
                  </p>
                </div>

                {/* Unit Quantity — only for ITEM */}
                <AnimatePresence>
                  {form.type === 'ITEM' && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                      <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Unit Quantity (per pack/bundle)</label>
                      <input type="number" min={1} value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} placeholder="e.g. 1, 10" className={field} />
                      <p className="mono mt-1 text-[10px] text-slate-400">Number of units per pack. Used in inventory tracking.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fee Category */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Fee Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={field}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>

                {/* Class Assignment */}
                <div>
                  <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Assignment <span className="text-rose-500">*</span></label>
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 mb-2">
                    {([['WHOLE_SCHOOL','All Classes'],['CLASS','Specific Class']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setForm(p => ({...p, scope: v}))} className={seg(form.scope === v)}>{l}</button>
                    ))}
                  </div>
                  <AnimatePresence>
                      {form.scope === 'CLASS' && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-600">Select Classes</span>
                            <button onClick={() => setForm(p => ({...p, classIds: p.classIds.length === classes.length ? [] : classes.map(c => c.id)}))} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
                              {form.classIds.length === classes.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                            {classes.map(c => (
                              <label key={c.id} className={cn("flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors", form.classIds.includes(c.id) ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50")}>
                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={form.classIds.includes(c.id)}
                                  onChange={e => {
                                    if (e.target.checked) setForm(p => ({...p, classIds: [...p.classIds, c.id]}));
                                    else setForm(p => ({...p, classIds: p.classIds.filter(id => id !== c.id)}));
                                  }}
                                />
                                <span className="text-xs font-medium text-slate-700">{c.name}</span>
                              </label>
                            ))}
                          </div>
                          {form.classIds.length === 0 && <p className="text-[10px] text-rose-500 mt-1">Please select at least one class.</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>

                {/* Fee Obligation */}
                <div>
                  <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Fee Obligation <span className="text-rose-500">*</span></label>
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {([true, false] as const).map(v => (
                      <button key={String(v)} onClick={() => setForm(p => ({...p, isCompulsory: v}))} className={seg(form.isCompulsory === v)}>
                        {v ? '🔒 Compulsory' : '✅ Optional'}
                      </button>
                    ))}
                  </div>
                  <p className="mono mt-1.5 text-[10px] text-slate-400">
                    {form.isCompulsory ? 'Locked during billing — cannot be removed from a student\'s bill' : 'Can be toggled on/off when generating a student bill'}
                  </p>
                </div>

                {/* Term Assignment */}
                <div>
                  <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Term Assignment <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {TERMS.map(t => (
                      <button key={t.value} onClick={() => setForm(p => ({...p, termScope: t.value}))} className={seg(form.termScope === t.value)}>{t.label}</button>
                    ))}
                  </div>
                </div>

                {/* Target Ledger Account */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Ledger Account</label>
                  <select value={form.bankAccountId} onChange={e => setForm(p => ({...p, bankAccountId: e.target.value}))} className={field}>
                    <option value="">Default Account</option>
                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
                  </select>
                  <p className="mono mt-1 text-[10px] text-slate-400">Select which bank account payments for this fee should route to.</p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button onClick={closePanel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800 disabled:opacity-60 transition-colors">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving…' : editId ? 'Update Fee' : 'Create Fee'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
