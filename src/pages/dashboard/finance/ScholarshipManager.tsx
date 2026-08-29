import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Search, Loader2, ChevronRight, GraduationCap, Percent, DollarSign, Gift, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ScholarshipType = 'SCHOLARSHIP' | 'PERCENTAGE' | 'FIXED_AMOUNT';
type ScholarshipStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

interface Scholarship {
  id: string; studentId: string; type: ScholarshipType; value: number;
  description?: string; sponsorName?: string; status: ScholarshipStatus;
  startTerm?: string; startYear?: string; endTerm?: string; endYear?: string;
  student: { id: string; admissionNo: string; classLevel: string; user: { name: string } };
}
interface Student { id: string; admissionNo: string; classLevel: string; user: { name: string }; }
interface ClassObj { id: string; name: string; }

const TYPE_CFG = {
  SCHOLARSHIP:  { label: 'Scholarship',        icon: <Gift className="h-4 w-4" />,    bg: 'bg-[#1E4DA6]/5', text: 'text-[#173F8C]', desc: 'Full or partial sponsorship by a donor/organisation' },
  PERCENTAGE:   { label: 'Percentage Discount', icon: <Percent className="h-4 w-4" />,  bg: 'bg-[#1E4DA6]/5',   text: 'text-[#173F8C]',   desc: 'Percentage off total fees (e.g. 50%)' },
  FIXED_AMOUNT: { label: 'Fixed Amount',         icon: <DollarSign className="h-4 w-4" />, bg: 'bg-emerald-50', text: 'text-emerald-700', desc: 'Specific agreed amount the student pays' },
};
const STATUS_CFG = {
  ACTIVE:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
  INACTIVE: { label: 'Inactive', bg: 'bg-slate-100',  text: 'text-slate-500'  },
  EXPIRED:  { label: 'Expired',  bg: 'bg-red-50',     text: 'text-red-600'    },
};
const fmt = (n: number) => '₦' + (n || 0).toLocaleString('en-NG');
const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

const emptyForm = {
  assignMode: 'student' as 'student' | 'class',
  studentId: '', classIds: [] as string[], type: 'PERCENTAGE' as ScholarshipType, value: '',
  description: '', sponsorName: '', status: 'ACTIVE' as ScholarshipStatus,
  startTerm: '', startYear: '', endTerm: '', endYear: '',
};

export default function ScholarshipManager() {
  const { terms: metaTerms, sessions: metaSessions } = useFinanceMeta();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [stuSearch, setStuSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    Promise.all([
      axios.get('/api/v1/scholarships', { withCredentials: true }),
      axios.get('/api/v1/students/all', { withCredentials: true }),
      axios.get('/api/v1/classes/all', { withCredentials: true }),
    ]).then(([sRes, stuRes, clsRes]) => {
      setScholarships(sRes.data.scholarships || []);
      setStudents(stuRes.data.students || []);
      setClasses(clsRes.data.classes || []);
    }).catch(() => toast.error('Failed to load data')).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setStuSearch(''); setPanelOpen(true); };
  const openEdit = (s: Scholarship) => {
    setForm({ assignMode: 'student', studentId: s.studentId, classIds: [], type: s.type, value: String(s.value),
      description: s.description || '', sponsorName: s.sponsorName || '',
      status: s.status, startTerm: s.startTerm || '', startYear: s.startYear || '',
      endTerm: s.endTerm || '', endYear: s.endYear || '' });
    setStuSearch(s.student.user.name);
    setEditId(s.id); setPanelOpen(true);
  };
  const closePanel = () => { setPanelOpen(false); setEditId(null); };

  const handleSave = async () => {
    if (form.assignMode === 'student' && !form.studentId) { toast.error('Please select a student'); return; }
    if (form.assignMode === 'class' && form.classIds.length === 0) { toast.error('Please select at least one class'); return; }
    if (!form.value || Number(form.value) < 0) { toast.error('Please enter a valid value'); return; }
    if (form.type === 'PERCENTAGE' && Number(form.value) > 100) { toast.error('Percentage cannot exceed 100'); return; }
    setSaving(true);
    const payload = { ...form, value: Number(form.value) };
    try {
      if (editId) {
        const res = await axios.put(`/api/v1/scholarships/${editId}`, payload, { withCredentials: true });
        setScholarships(p => p.map(s => s.id === editId ? res.data.scholarship : s));
        toast.success('Updated successfully');
      } else {
        const res = await axios.post('/api/v1/scholarships', payload, { withCredentials: true });
        if (res.data.bulk) {
            toast.success(res.data.msg);
            const refreshRes = await axios.get('/api/v1/scholarships', { withCredentials: true });
            setScholarships(refreshRes.data.scholarships || []);
        } else {
            setScholarships(p => [res.data.scholarship, ...p]);
            toast.success('Scholarship/discount created');
        }
      }
      closePanel();
    } catch (e: any) { toast.error(e.response?.data?.msg || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this scholarship/discount?')) return;
    try {
      await axios.delete(`/api/v1/scholarships/${id}`, { withCredentials: true });
      setScholarships(p => p.filter(s => s.id !== id));
      toast.success('Removed');
    } catch (e: any) { toast.error(e.response?.data?.msg || 'Delete failed'); }
  };

  const filteredStudents = students.filter(s =>
    s.user.name.toLowerCase().includes(stuSearch.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(stuSearch.toLowerCase())
  );
  const displayed = scholarships.filter(s =>
    !search ||
    s.student.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = scholarships.filter(s => s.status === 'ACTIVE').length;
  const percentCount = scholarships.filter(s => s.type === 'PERCENTAGE').length;
  const scholarCount = scholarships.filter(s => s.type === 'SCHOLARSHIP').length;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .sm-root .mono{font-family:'DM Mono',monospace!important}`}</style>
      <div className="sm-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-6xl">

          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5">
            <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Scholarships & Discounts</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E4DA6] to-indigo-500 shadow-lg shadow-[#1E4DA6]/20">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Scholarships & Discounts</h1>
                <p className="mt-0.5 text-sm text-slate-500">Register special financial arrangements per student.</p>
              </div>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-[#173F8C] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1E4DA6]/20 transition-all hover:bg-[#122F69] hover:-translate-y-0.5">
              <Plus className="h-4 w-4" /> Add Arrangement
            </button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total', value: scholarships.length, icon: <Users className="h-4 w-4" />, bg: 'bg-slate-100', text: 'text-slate-600' },
              { label: 'Active', value: activeCount, icon: <Gift className="h-4 w-4" />, bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'Scholarships', value: scholarCount, icon: <GraduationCap className="h-4 w-4" />, bg: 'bg-[#1E4DA6]/5', text: 'text-[#1E4DA6]' },
              { label: 'Discounts', value: percentCount, icon: <Percent className="h-4 w-4" />, bg: 'bg-[#1E4DA6]/5', text: 'text-[#1E4DA6]' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', s.bg, s.text)}>{s.icon}</div>
                <p className="mono text-2xl font-black text-slate-900">{s.value}</p>
                <p className="mono mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Main card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl">
            <div className="flex flex-col md:flex-row gap-2 justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-800">All Arrangements</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student…"
                  className="h-9 w-56 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#1E4DA6]" /></div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><GraduationCap className="h-6 w-6 text-slate-400" /></div>
                <p className="font-semibold text-slate-500">{search ? 'No results match your search' : 'No scholarships or discounts registered yet'}</p>
                {!search && <button onClick={openCreate} className="mt-1 rounded-xl bg-[#173F8C] px-4 py-2 text-xs font-bold text-white hover:bg-[#122F69]">Add first arrangement</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                  <thead className="bg-slate-50/60 border-b border-slate-50">
                    <tr>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Type & Status</th>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Description</th>
                      <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Value & Validity</th>
                      <th className="px-6 py-2.5 w-20 text-center mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                      {displayed.map((s, i) => {
                        const tc = TYPE_CFG[s.type];
                        const sc = STATUS_CFG[s.status];
                        return (
                          <motion.tr key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="group transition-colors hover:bg-slate-50/60">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tc.bg, tc.text)}>{tc.icon}</div>
                                <div>
                                  <p className="font-bold text-slate-900">{s.student.user.name}</p>
                                  <span className="mono text-[10px] text-slate-400">{s.student.admissionNo} · {s.student.classLevel}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('rounded-full px-2 py-0.5 mono text-[9px] font-bold uppercase', tc.bg, tc.text)}>{tc.label}</span>
                                <span className={cn('rounded-full px-2 py-0.5 mono text-[9px] font-bold uppercase', sc.bg, sc.text)}>{sc.label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {s.description ? <span className="mono text-[11px] text-slate-500 truncate max-w-[200px] block">{s.description}</span> : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="mono font-black text-slate-900">
                                {s.type === 'PERCENTAGE' ? `${s.value}% off` : fmt(s.value)}
                              </p>
                              {s.startTerm && <p className="mono text-[10px] text-slate-400">{s.startTerm} {s.startYear}</p>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-slate-400 hover:bg-[#1E4DA6]/5 hover:text-[#1E4DA6] transition-colors"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(s.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

              <div className="border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">{editId ? 'Edit Arrangement' : 'New Scholarship / Discount'}</h2>
                    <p className="mono mt-1 text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider">Applies automatically when billing</p>
                  </div>
                  <button onClick={closePanel} className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-200 transition-colors bg-white border border-slate-100 shadow-sm"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-slate-500">Fill in the details below to register a new special rate.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Assignment Target */}
                {!editId && (
                  <div>
                    <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign To <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 mb-3">
                      <button onClick={() => setForm(p => ({ ...p, assignMode: 'student', classIds: [] }))} className={cn('flex-1 rounded-lg py-2 text-xs font-bold transition-all', form.assignMode === 'student' ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Single Student</button>
                      <button onClick={() => setForm(p => ({ ...p, assignMode: 'class', studentId: '' }))} className={cn('flex-1 rounded-lg py-2 text-xs font-bold transition-all', form.assignMode === 'class' ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Whole Class</button>
                    </div>

                    {form.assignMode === 'student' ? (
                      <div>
                        <input value={stuSearch} onChange={e => { setStuSearch(e.target.value); setForm(p => ({ ...p, studentId: '' })); }}
                          placeholder="Search by name or admission no..." className={field} />
                        {stuSearch && !form.studentId && (
                          <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                            {filteredStudents.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-slate-400">No students found</p>
                            ) : filteredStudents.slice(0, 10).map(s => (
                              <button key={s.id} onClick={() => { setForm(p => ({ ...p, studentId: s.id })); setStuSearch(s.user.name); }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#1E4DA6]/5 transition-colors">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E4DA6]/10 text-xs font-bold text-[#173F8C]">
                                  {s.user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{s.user.name}</p>
                                  <p className="mono text-[10px] text-slate-400">{s.admissionNo} • {s.classLevel}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {form.studentId && (
                          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/5 px-3 py-2">
                            <span className="text-sm font-semibold text-[#122F69]">{stuSearch}</span>
                            <button onClick={() => { setForm(p => ({ ...p, studentId: '' })); setStuSearch(''); }} className="ml-auto text-[#1E4DA6]/60 hover:text-[#1E4DA6]"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600">Select Classes</span>
                          <button onClick={() => setForm(p => ({...p, classIds: p.classIds.length === classes.length ? [] : classes.map(c => c.id)}))} className="text-[10px] font-bold text-[#1E4DA6] hover:text-[#122F69]">
                            {form.classIds.length === classes.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {classes.map(c => (
                            <label key={c.id} className={cn("flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors", form.classIds.includes(c.id) ? "border-[#1E4DA6]/35 bg-[#1E4DA6]/5" : "border-slate-200 hover:bg-slate-50")}>
                              <input type="checkbox" className="rounded text-[#1E4DA6] focus:ring-[#1E4DA6]" checked={form.classIds.includes(c.id)}
                                onChange={e => {
                                  if (e.target.checked) setForm(p => ({...p, classIds: [...p.classIds, c.id]}));
                                  else setForm(p => ({...p, classIds: p.classIds.filter(id => id !== c.id)}));
                                }}
                              />
                              <span className="text-xs font-medium text-slate-700">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Arrangement type */}
                <div>
                  <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Arrangement Type <span className="text-rose-500">*</span></label>
                  <div className="space-y-2">
                    {(Object.entries(TYPE_CFG) as [ScholarshipType, typeof TYPE_CFG[ScholarshipType]][]).map(([v, cfg]) => (
                      <button key={v} onClick={() => setForm(p => ({ ...p, type: v }))}
                        className={cn('flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all', form.type === v ? 'border-[#1E4DA6]/60 bg-[#1E4DA6]/8' : 'border-slate-100 hover:border-slate-200')}>
                        <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', cfg.bg, cfg.text)}>{cfg.icon}</span>
                        <div>
                          <p className={cn('text-sm font-bold', form.type === v ? 'text-[#122F69]' : 'text-slate-800')}>{cfg.label}</p>
                          <p className="mono text-[10px] text-slate-400">{cfg.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {form.type === 'PERCENTAGE' ? 'Discount Percentage (%)' : form.type === 'FIXED_AMOUNT' ? 'Fixed Amount Student Pays (₦)' : 'Scholarship Value (₦)'} <span className="text-rose-500">*</span>
                  </label>
                  <input type="number" min={0} max={form.type === 'PERCENTAGE' ? 100 : undefined} value={form.value}
                    onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    placeholder={form.type === 'PERCENTAGE' ? 'e.g. 50' : 'e.g. 25000'} className={field} />
                  {form.type === 'PERCENTAGE' && <p className="mono mt-1 text-[10px] text-slate-400">Enter a number between 0 and 100</p>}
                  {form.type === 'FIXED_AMOUNT' && <p className="mono mt-1 text-[10px] text-slate-400">This is the total amount the student will pay — not the discount</p>}
                </div>

                {/* Sponsor (for scholarship type) */}
                <AnimatePresence>
                  {form.type === 'SCHOLARSHIP' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Sponsor / Organisation Name</label>
                      <input value={form.sponsorName} onChange={e => setForm(p => ({ ...p, sponsorName: e.target.value }))} placeholder="e.g. Government Scholarship Board" className={field} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Description */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Description / Notes</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    placeholder="Optional notes about this arrangement…" className={cn(field, 'resize-none')} />
                </div>

                {/* Term range */}
                <div className="space-y-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div>
                    <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Applies From</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={form.startTerm} onChange={e => setForm(p => ({ ...p, startTerm: e.target.value }))} className={field}>
                        <option value="">Any Term</option>
                        {metaTerms.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={form.startYear} onChange={e => setForm(p => ({ ...p, startYear: e.target.value }))} className={field}>
                        <option value="">Any Year</option>
                        {metaSessions.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mono mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Expires After (End Term)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={form.endTerm} onChange={e => setForm(p => ({ ...p, endTerm: e.target.value }))} className={field}>
                        <option value="">Never Expires (Term)</option>
                        {metaTerms.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={form.endYear} onChange={e => setForm(p => ({ ...p, endYear: e.target.value }))} className={field}>
                        <option value="">Never Expires (Year)</option>
                        {metaSessions.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="mono mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ScholarshipStatus }))} className={field}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button onClick={closePanel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#173F8C] py-2.5 text-sm font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69] disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
