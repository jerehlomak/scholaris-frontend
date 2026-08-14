import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { toast } from 'sonner';
import { Award, Plus, Trash2, AlertCircle, Brain, Settings2, ToggleLeft, FileText, UserCheck, BarChart3, MessageSquare, Layout, Eye, Globe, X, Pencil, Loader2 } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { TemplateGallery } from './shared/TemplateGallery';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const TABS = [
  { id: 'general',    label: 'General',              icon: Settings2 },
  { id: 'assessment', label: 'Assessment Structure',  icon: BarChart3 },
  { id: 'grading',    label: 'Grading Scale',         icon: Award },
  { id: 'traits',     label: 'Trait Ratings',         icon: Brain },
  { id: 'comment-based', label: 'Comment-Based Config', icon: FileText },
  { id: 'display',    label: 'Display Toggles',       icon: ToggleLeft },
  { id: 'signatures', label: 'Signatures',            icon: UserCheck },
  { id: 'ranking',    label: 'Positions & Ranking',   icon: BarChart3 },
  { id: 'attendance', label: 'Attendance Stats',      icon: BarChart3 },
  { id: 'comments',   label: 'Automated Comments',    icon: MessageSquare },
  { id: 'templates',  label: 'Templates',             icon: Layout },
  { id: 'visibility', label: 'Release & Visibility', icon: Eye },
];

interface GradeRow { id: string; grade: string; minScore: string; maxScore: string; remark: string; status: 'PASS' | 'FAIL'; }
interface AssessmentPart { id: string; name: string; weight: number; }
interface TraitRow { id: string; name: string; }

const DEFAULT_GRADES: GradeRow[] = [
  { id: 'g1', grade: 'A', minScore: '75', maxScore: '100', remark: 'Excellent', status: 'PASS' },
  { id: 'g2', grade: 'B', minScore: '65', maxScore: '74',  remark: 'Very Good',  status: 'PASS' },
  { id: 'g3', grade: 'C', minScore: '55', maxScore: '64',  remark: 'Good',       status: 'PASS' },
  { id: 'g4', grade: 'D', minScore: '45', maxScore: '54',  remark: 'Pass',       status: 'PASS' },
  { id: 'g5', grade: 'F', minScore: '0',  maxScore: '44',  remark: 'Fail',       status: 'FAIL' },
];

/* ── GRADING TAB ─────────────────────────────────────────── */
function GradingTab() {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [section, setSection] = useState('ALL');
  const [scaleType, setScaleType] = useState('SUBJECT');
  const [resultType, setResultType] = useState('SCORE_BASED');
  const [assessmentType, setAssessmentType] = useState('EXAM');
  const [grades, setGrades] = useState<GradeRow[]>(DEFAULT_GRADES);
  const [passMark, setPassMark] = useState('40');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/sections`, { withCredentials: true });
      const fetchedSections = (r.data.sections || []).map((s: any) => ({ id: s.id, name: `Section: ${s.name}` }));
      setCategories([{ id: 'ALL', name: 'Global Default (All Sections)' }, ...fetchedSections]);
    } catch { setCategories([{ id: 'ALL', name: 'Global Default (All Sections)' }]); }
  }, []);

  const fetchScale = useCallback(async (cat: string, type: string, rType: string, aType: string) => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/results/grading-scale?category=${encodeURIComponent(cat)}&type=${type}&resultType=${rType}&assessmentType=${aType}`, { withCredentials: true });
      if (r.data.scale) {
        setGrades(r.data.scale.grades.map((g: any) => ({ ...g, minScore: String(g.minScore), maxScore: String(g.maxScore) })));
        setPassMark(String(r.data.scale.passMark || 40));
      } else { setGrades(DEFAULT_GRADES); setPassMark('40'); }
    } catch { setGrades(DEFAULT_GRADES); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchScale(section, scaleType, resultType, assessmentType); }, [section, scaleType, resultType, assessmentType, fetchScale]);

  const up = (id: string, field: keyof GradeRow, val: string) =>
    setGrades(p => p.map(g => g.id === id ? { ...g, [field]: val } : g));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/results/grading-scale`, { 
        category: section, 
        type: scaleType, 
        resultType,
        assessmentType,
        passMark: Number(passMark), 
        grades: grades.map((g: any) => ({ ...g, minScore: Number(g.minScore), maxScore: Number(g.maxScore) })) 
      }, { withCredentials: true });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { console.error('Failed to save scale.'); }
    finally { setSaving(false); }
  };

  const isValid = !grades.some(g => !g.grade || g.minScore === '' || g.maxScore === '' || Number(g.minScore) > Number(g.maxScore));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Section</p><p className="text-xs text-gray-500 mt-0.5">Configure a grading scale per school section.</p></div>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-full sm:w-52 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>


      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Assessment Component</p></div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          <button onClick={() => setAssessmentType('EXAM')} className={cn('px-4 py-2 text-sm font-semibold rounded-md transition-colors', assessmentType === 'EXAM' ? 'bg-[#1E4DA6] text-white' : 'text-gray-500 hover:text-gray-700')}>Exam</button>
          <button onClick={() => setAssessmentType('CA')} className={cn('px-4 py-2 text-sm font-semibold rounded-md transition-colors', assessmentType === 'CA' ? 'bg-[#1E4DA6] text-white' : 'text-gray-500 hover:text-gray-700')}>CA</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Grading Scope</p><p className="text-xs text-gray-500 mt-0.5">Subject Grading maps individual subject scores to letter grades. Final Grade maps the overall average to a class (e.g. Distinction).</p></div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          <button onClick={() => setScaleType('SUBJECT')} className={cn('px-4 py-2 text-sm font-semibold rounded-md transition-colors', scaleType === 'SUBJECT' ? 'bg-[#1E4DA6] text-white' : 'text-gray-500 hover:text-gray-700')}>Subject Grading</button>
          <button onClick={() => setScaleType('FINAL')} className={cn('px-4 py-2 text-sm font-semibold rounded-md transition-colors', scaleType === 'FINAL' ? 'bg-[#1E4DA6] text-white' : 'text-gray-500 hover:text-gray-700')}>Final Grade</button>
        </div>
      </div>

      {scaleType === 'SUBJECT' && (
      <div className="flex items-center gap-3 p-2 bg-[#1E4DA6]/5 rounded-xl border border-[#1E4DA6]/10">
        <span className="text-sm font-bold text-[#122F69]">Pass Mark:</span>
        <div className="relative w-20">
          <input type="number" value={passMark} onChange={e => setPassMark(e.target.value)} className="w-full border border-[#1E4DA6]/20 rounded-lg px-2 py-1.5 pr-6 text-center text-sm font-black outline-none focus:border-[#1E4DA6]/60" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#1E4DA6]/60 font-bold">%</span>
        </div>
      </div>
      )}

      {loading ? <div className="py-10 text-center text-gray-400">Loading scale…</div> : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-center w-24">Grade</th>
                  <th className="px-4 py-3 text-center w-28">Min (%)</th>
                  <th className="px-4 py-3 text-center w-28">Max (%)</th>
                  <th className="px-4 py-3 min-w-[200px]">Remark</th>
                  <th className="px-4 py-3 text-center w-32">Status</th>
                  <th className="px-4 py-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...grades].sort((a, b) => Number(b.maxScore) - Number(a.maxScore)).map(g => (
                  <tr key={g.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <input value={g.grade} onChange={e => up(g.id, 'grade', e.target.value.toUpperCase())} placeholder="A" className="w-full rounded-lg border border-gray-200 px-2 py-2 text-center font-black text-lg outline-none focus:border-[#1E4DA6]" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={g.minScore} onChange={e => up(g.id, 'minScore', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-center text-sm font-semibold outline-none focus:border-[#1E4DA6]" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={g.maxScore} onChange={e => up(g.id, 'maxScore', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-center text-sm font-semibold outline-none focus:border-[#1E4DA6]" />
                    </td>
                    <td className="px-4 py-3">
                      <textarea value={g.remark || ''} onChange={e => up(g.id, 'remark', e.target.value)} rows={2} placeholder="e.g. Excellent performance" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1E4DA6] resize-y min-h-[60px]" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => up(g.id, 'status', g.status === 'PASS' ? 'FAIL' : 'PASS')} className={cn('w-full rounded-lg py-2.5 text-xs font-bold uppercase transition-colors', g.status === 'PASS' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100')}>{g.status}</button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setGrades(p => p.filter(x => x.id !== g.id))} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <button onClick={() => setGrades(p => [...p, { id: `g-${Date.now()}`, grade: '', minScore: '', maxScore: '', remark: '', status: 'PASS' }])} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1E4DA6]/20 py-4 text-sm font-semibold text-[#1E4DA6] hover:bg-[#1E4DA6]/5">
        <Plus className="w-4 h-4" />Add Grade Range
      </button>
      {!isValid && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"><AlertCircle className="w-4 h-4 shrink-0" />Fix invalid rows before saving.</div>}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <SaveButton onClick={handleSave} saved={saved} disabled={!isValid || loading || saving} saving={saving} saveLabel="Save Grading Scale" savedLabel="Scale Saved!" />
      </div>
    </div>
  );
}

/* ── ASSESSMENT TAB ─────────────────────────────────────── */
function AssessmentTab() {
  const [categories, setCategories] = useState<{id: string, name: string, isClass: boolean, rawVal: string}[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [resultType, setResultType] = useState('SCORE_BASED');
  const [parts, setParts] = useState<AssessmentPart[]>([]);
  const [saved, setSaved] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingParts, setLoadingParts] = useState(false);
  const [savingParts, setSavingParts] = useState(false);
  const total = parts.reduce((s, p) => s + (Number(p.weight) || 0), 0);

  useEffect(() => {
    setLoadingCategories(true);
    axios.get(`${API}/sections`, { withCredentials: true })
      .then((res) => {
        const allCat = { id: 'CAT_ALL', name: 'Global Default (All Sections)', isClass: false, rawVal: 'ALL' };
        const sectionsList = (res.data.sections || []).map((s: any) => ({ id: `SEC_${s.id}`, name: `Section: ${s.name}`, isClass: false, rawVal: s.id }));
        const combined = [allCat, ...sectionsList];
        setCategories(combined);
        if (combined[0]) setSelectedId(combined[0].id);
      }).catch(console.error).finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const cat = categories.find(c => c.id === selectedId);
    if (!cat) return;
    setLoadingParts(true);
    const query = cat.isClass ? `classId=${cat.rawVal}` : `category=${encodeURIComponent(cat.rawVal)}`;
    axios.get(`${API}/assessments/structure?${query}&resultType=${resultType}`, { withCredentials: true })
      .then(r => {
          if (r.data.parts) setParts(r.data.parts);
          else setParts([{ id: '1', name: '1st CA', weight: 20 }, { id: '2', name: '2nd CA', weight: 20 }, { id: '3', name: 'Exam', weight: 60 }]);
      })
      .catch(() => setParts([{ id: '1', name: '1st CA', weight: 20 }, { id: '2', name: '2nd CA', weight: 20 }, { id: '3', name: 'Exam', weight: 60 }]))
      .finally(() => setLoadingParts(false));
  }, [selectedId, categories, resultType]);

  const up = (id: string, field: keyof AssessmentPart, val: string | number) =>
    setParts(p => p.map(x => x.id === id ? { ...x, [field]: field === 'weight' ? Number(val) : val } : x));

  const handleSave = async () => {
    const catInfo = categories.find(c => c.id === selectedId);
    if (!catInfo || total !== 100 || parts.length === 0) return;
    setSavingParts(true);
    const payload = catInfo.isClass ? { classId: catInfo.rawVal, parts, resultType } : { category: catInfo.rawVal, parts, resultType };
    try {
      await axios.patch(`${API}/assessments/structure`, payload, { withCredentials: true });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { console.error('Failed to save assessment structure.'); }
    finally { setSavingParts(false); }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Section or Class</p><p className="text-xs text-gray-500 mt-0.5">Set default structures per section, or override per class.</p></div>
        {loadingCategories ? (
          <div className="w-full sm:w-64 h-10 bg-gray-200 animate-pulse rounded-lg" />
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full sm:w-64 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loadingParts ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-gray-200" />
              <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
              <div className="w-20 h-9 bg-gray-200 rounded-lg" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {parts.map((p, i) => (
              <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                <input value={p.name} onChange={e => up(p.id, 'name', e.target.value)} placeholder="Assessment name" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4DA6] w-full" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <input type="number" value={p.weight} onChange={e => up(p.id, 'weight', e.target.value)} className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-center text-sm font-bold outline-none focus:border-[#1E4DA6]" min="0" max="100" />
                  <span className="text-xs text-gray-400 font-bold">%</span>
                </div>
                <button onClick={() => setParts(prev => prev.filter(x => x.id !== p.id))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setParts(p => [...p, { id: Date.now().toString(), name: 'New Component', weight: 0 }])} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1E4DA6]/20 py-4 text-sm font-semibold text-[#1E4DA6] hover:bg-[#1E4DA6]/5">
            <Plus className="w-4 h-4" />Add Assessment Component
          </button>
          <div className="mt-8 border-t border-gray-100 pt-6">
            <SaveButton onClick={handleSave} saved={saved} disabled={total !== 100 || parts.length === 0 || loadingParts || savingParts} saving={savingParts} saveLabel="Save Assessment Structure" savedLabel="Structure Saved!" />
          </div>
        </>
      )}
    </div>
  );
}

/* ── TRAITS TAB ─────────────────────────────────────────── */
function TraitsTab() {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [configs, setConfigs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [traits, setTraits] = useState<TraitRow[]>([]);
  const [ratingScale, setRatingScale] = useState<'ALPHA' | 'NUMERIC'>('ALPHA');
  const [saved, setSaved] = useState(false);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingDomainName, setEditingDomainName] = useState('');
  // useEffect removed because fetchConfigs is now called with selectedCategory below

  const handleTabSwitch = (cfg: any) => {
    // flush
    if (cfg) {
      setTraits(cfg.traits.map((t: string, i: number) => ({ id: String(i), name: t })));
      // Determine if it's ALPHA or NUMERIC based on the first item in ratingScale
      if (cfg.ratingScale && cfg.ratingScale.length > 0) {
        const first = cfg.ratingScale[0].rating;
        setRatingScale(isNaN(Number(first)) ? 'ALPHA' : 'NUMERIC');
      } else {
        setRatingScale('ALPHA');
      }
    } else {
      setTraits([]);
      setRatingScale('ALPHA');
    }
  };

  const updateTraits = (updater: any) => {
    setTraits(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setConfigs(cfgs => cfgs.map(c => c.domain === activeTab ? { ...c, traits: next.map((t: any) => t.name) } : c));
      return next;
    });
  };

  const updateRatingScale = (newScale: string) => {
    setRatingScale(newScale as any);
    setConfigs(cfgs => cfgs.map(c => {
      if (c.domain === activeTab) {
        const scale = newScale === 'ALPHA'
          ? [{ rating: 'A', description: 'Excellent' }, { rating: 'B', description: 'Good' }, { rating: 'C', description: 'Average' }, { rating: 'D', description: 'Below Average' }, { rating: 'E', description: 'Poor' }]
          : [1, 2, 3, 4, 5].map(n => ({ rating: String(n), description: String(n) }));
        return { ...c, ratingScale: scale };
      }
      return c;
    }));
  };

  const fetchCategories = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/sections`, { withCredentials: true });
      const fetchedSections = (r.data.sections || []).map((s: any) => ({ id: s.id, name: `Section: ${s.name}` }));
      setCategories([{ id: 'ALL', name: 'Global Default (All Sections)' }, ...fetchedSections]);
    } catch { setCategories([{ id: 'ALL', name: 'Global Default (All Sections)' }]); }
  }, []);

  const fetchConfigs = useCallback(async (cat: string, currentActive: string) => {
    try {
      const r = await axios.get(`${API}/results/traits/config?category=${encodeURIComponent(cat)}`, { withCredentials: true });
      const cfgs = r.data.configs || [];
      cfgs.sort((a: any, b: any) => a.domain.localeCompare(b.domain));
      setConfigs(cfgs);
      if (cfgs.length > 0 && !currentActive) {
        setActiveTab(cfgs[0].domain);
        handleTabSwitch(cfgs[0]);
      } else if (cfgs.length === 0) {
        setActiveTab('');
        handleTabSwitch(null);
      }
    } catch (err) {
      console.error(err);
    }
  }, []); // Remove activeTab dependency to prevent unnecessary recreation

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchConfigs(selectedCategory, activeTab); }, [selectedCategory, fetchConfigs]); // activeTab omitted intentionally

  const [savingTraits, setSavingTraits] = useState(false);

  const handleSave = async () => {
    if (!activeTab) return;
    setSavingTraits(true);
    const scale = ratingScale === 'ALPHA'
      ? [{ rating: 'A', description: 'Excellent' }, { rating: 'B', description: 'Good' }, { rating: 'C', description: 'Average' }, { rating: 'D', description: 'Below Average' }, { rating: 'E', description: 'Poor' }]
      : [1, 2, 3, 4, 5].map(n => ({ rating: String(n), description: String(n) }));
    try {
      await axios.post(`${API}/results/traits/config`, { domain: activeTab, category: selectedCategory, traits: traits.map((t: any) => t.name), ratingScale: scale }, { withCredentials: true });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { 
      console.error('Failed to save traits.', err);
      toast.error(err.response?.data?.msg || 'Failed to save traits. Please try again.');
    }
    finally { setSavingTraits(false); }
  };

  const deleteGroup = async (e: React.MouseEvent, domainToDelete: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the trait group "${domainToDelete}"?`)) return;
    
    // flush
    try {
        await axios.delete(`${API}/results/traits/config?domain=${encodeURIComponent(domainToDelete)}&category=${encodeURIComponent(selectedCategory)}`, { withCredentials: true });
        const newConfigs = configs.filter(c => c.domain !== domainToDelete);
        setConfigs(newConfigs);
        
        if (activeTab === domainToDelete) {
            const nextTab = newConfigs.length > 0 ? newConfigs[0].domain : '';
            setActiveTab(nextTab);
            if (nextTab) {
                handleTabSwitch(newConfigs[0]);
            } else {
                setRatingScale('NUMERIC');
                setTraits([]);
            }
        }
    } catch (err) {
        console.error('Failed to delete trait group', err);
        alert('Failed to delete trait group.');
    }
  };

  const startRenameGroup = (e: React.MouseEvent, domain: string) => {
    e.stopPropagation();
    setEditingDomain(domain);
    setEditingDomainName(domain);
  };

  const saveRenameGroup = async (oldDomain: string) => {
    if (!editingDomainName.trim() || editingDomainName === oldDomain) {
        setEditingDomain(null);
        return;
    }
    try {
        await axios.patch(`${API}/results/traits/config`, { oldDomain, newDomain: editingDomainName.trim(), category: selectedCategory }, { withCredentials: true });
        
        setConfigs(cfgs => cfgs.map(c => c.domain === oldDomain ? { ...c, domain: editingDomainName.trim() } : c));
        if (activeTab === oldDomain) {
            setActiveTab(editingDomainName.trim());
        }
        setEditingDomain(null);
    } catch (err) {
        console.error('Failed to rename trait group', err);
        alert('Failed to rename trait group. It may already exist.');
    }
  };

  const addGroup = async () => {
    if (!newGroupName.trim() || configs.some(c => c.domain.toLowerCase() === newGroupName.trim().toLowerCase())) return;
    // flush
    const newCfg = { domain: newGroupName.trim(), traits: [], ratingScale: [] };
    setConfigs([...configs, newCfg]);
    setActiveTab(newGroupName.trim());
    handleTabSwitch(newCfg);
    setNewGroupName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Section</p><p className="text-xs text-gray-500 mt-0.5">Configure traits per school section.</p></div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-52 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Trait Groups</p><p className="text-xs text-gray-500 mt-0.5">Create open trait groups like Affective Domain or Psychomotor.</p></div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="New Group Name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-48" />
          <Button onClick={addGroup} className="bg-[#1E4DA6] hover:bg-[#173F8C]">Add</Button>
        </div>
      </div>

      {configs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {configs.map(c => (
            <div key={c.domain} className={cn('px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 group cursor-pointer', activeTab === c.domain ? 'bg-[#1E4DA6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')} onClick={() => {
              if (editingDomain !== c.domain) {
                setActiveTab(c.domain);
                handleTabSwitch(c);
              }
            }}>
              {editingDomain === c.domain ? (
                <div className="flex items-center gap-1">
                  <input autoFocus value={editingDomainName} onChange={e => setEditingDomainName(e.target.value)} onBlur={() => saveRenameGroup(c.domain)} onKeyDown={e => { if (e.key === 'Enter') saveRenameGroup(c.domain); if (e.key === 'Escape') setEditingDomain(null); }} className={cn("px-2 py-0.5 rounded outline-none w-28 text-sm transition-colors border", activeTab === c.domain ? "bg-white/10 text-white border-white/30 focus:border-white focus:bg-white/20" : "bg-white text-gray-900 border-gray-300 focus:border-[#1E4DA6]")} onClick={e => e.stopPropagation()} />
                </div>
              ) : (
                <>
                  {c.domain}
                  <div className="flex gap-1 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                    <div onClick={(e) => startRenameGroup(e, c.domain)} className={cn("p-0.5 rounded-full hover:bg-black/20 transition-colors", activeTab === c.domain ? "text-white hover:text-white" : "text-gray-500 hover:text-[#1E4DA6]")} title="Rename Group">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </div>
                    <div onClick={(e) => deleteGroup(e, c.domain)} className={cn("p-0.5 rounded-full hover:bg-black/20 transition-colors", activeTab === c.domain ? "text-white hover:text-white" : "text-gray-500 hover:text-red-500")} title="Delete Group">
                      <X className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab && (
        <>
          <div className="flex items-center gap-3 p-3 bg-[#1E4DA6]/5 rounded-xl border border-[#1E4DA6]/10">
            <span className="text-sm font-bold text-[#0E2450]">Rating Scale:</span>
            <Select value={ratingScale} onValueChange={(v: any) => updateRatingScale(v)}>
              <SelectTrigger className="w-48 bg-white border-[#1E4DA6]/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALPHA">A, B, C, D, E</SelectItem>
                <SelectItem value="NUMERIC">1, 2, 3, 4, 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {traits.map((t, i) => (
              <div key={t.id} className="flex flex-row items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                <input value={t.name} onChange={e => updateTraits((p: any[]) => p.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} className="flex-1 min-w-0 border-0 border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-semibold outline-none focus:border-[#1E4DA6] focus:bg-gray-50 rounded-t-lg transition-all" placeholder="Enter trait name (e.g. Neatness)" />
                <button onClick={() => updateTraits((p: any[]) => p.filter(x => x.id !== t.id))} className="p-2 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => updateTraits((p: any[]) => [...p, { id: Date.now().toString(), name: '' }])} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1E4DA6]/20 py-4 text-sm font-semibold text-[#1E4DA6] hover:bg-[#1E4DA6]/5 transition-colors">
            <Plus className="w-4 h-4" />Add Trait Element
          </button>
          <div className="mt-8 border-t border-gray-100 pt-6">
            <SaveButton onClick={handleSave} saved={saved} disabled={traits.length === 0 || savingTraits} saving={savingTraits} saveLabel="Save Trait Group" savedLabel="Group Saved!" />
          </div>
        </>
      )}
    </div>
  );
}

/* ── PLACEHOLDER TAB ────────────────────────────────────── */
function PlaceholderTab({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><Icon className="w-7 h-7 text-gray-400" /></div>
      <h3 className="font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{desc}</p>
    </div>
  );
}


/* ── TEMPLATES TAB ──────────────────────────────────────── */
// Rewritten 12 Aug 2026: used to open a drag-and-drop TemplateBuilder modal
// and call the now-retired /results/template(s) API. Replaced with the same
// fixed-gallery picker used on the Report Card Templates settings page
// (client/src/pages/dashboard/settings/shared/TemplateGallery.tsx) so there
// is exactly one place to manage result templates, not two — see
// PROJECT_BRIEF.md section 3 for the full "three disconnected systems"
// writeup this consolidates.
function TemplatesTab() {
  const [resultType, setResultType] = useState('SCORE_BASED');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-4 items-start md:items-center">
          <h3 className="font-bold text-gray-900">Result Templates</h3>
          <Select value={resultType} onValueChange={setResultType}>
            <SelectTrigger className="w-56 bg-white text-xs h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SCORE_BASED">Score-Based Results</SelectItem>
              <SelectItem value="COMMENT_BASED">Comment-Based Reports</SelectItem>
              <SelectItem value="TRANSCRIPT">Transcripts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-[#FDF6E3]/60 border border-[#F5B800]/30 rounded-xl p-4 mb-6 text-sm text-[#0B1F4E]">
          <p className="font-bold mb-1">How to use templates:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pick one of the pre-made designs below — there's no layout builder anymore, each design is finished as-is.</li>
            <li>Apply it to a specific section (e.g. Primary, Secondary) or the whole school as the default.</li>
            <li>A section-specific template always wins over the school default for that section.</li>
          </ul>
        </div>

        <TemplateGallery resultType={resultType} />
      </div>
    </div>
  );
}


/* ── COMMENTS TAB ───────────────────────────────────────── */
function CommentsTab() {
  const [categories, setCategories] = useState<{id: string, name: string, isClass: boolean, rawVal: string}[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({ minScore: 0, maxScore: 100, comment: '', role: 'Class Teacher', resultType: 'EXAM' });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([{ roleName: 'Class Teacher' }, { roleName: 'Principal' }]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/sections`, { withCredentials: true }),
      axios.get(`${API}/classes/all`, { withCredentials: true }),
      axios.get(`${API}/school-settings`, { withCredentials: true })
    ]).then(([sectionsRes, classesRes, settingsRes]) => {
      const allCat = { id: 'CAT_ALL', name: 'Global Default (All Sections)', isClass: false, rawVal: 'ALL' };
      const sectionsList = (sectionsRes.data.sections || []).map((s: any) => ({ id: `SEC_${s.id}`, name: `Section: ${s.name}`, isClass: false, rawVal: s.id }));
      const combined = [allCat, ...sectionsList];
      setCategories(combined);
      if (combined[0]) setSelectedId(combined[0].id);

      const rawSigs = settingsRes.data.settings?.resultConfig?.signatures || {};
      let activeSigs = rawSigs['ALL'] || [];
      if (rawSigs && typeof rawSigs === 'object' && !Array.isArray(rawSigs['ALL'])) {
          activeSigs = [];
          if (rawSigs.showSignature1) activeSigs.push({ roleName: rawSigs.signature1Label || 'Class Teacher' });
          if (rawSigs.showSignature2) activeSigs.push({ roleName: rawSigs.signature2Label || 'Principal' });
          if (rawSigs.showSignature3) activeSigs.push({ roleName: rawSigs.signature3Label || 'Director' });
      }
      setSignatures(Array.isArray(activeSigs) && activeSigs.length > 0 ? activeSigs : [{ roleName: 'Class Teacher' }, { roleName: 'Principal' }]);
      
      // Update newRule default role to match the first signature if any
      if (activeSigs && activeSigs.length > 0) {
        setNewRule(prev => ({ ...prev, role: activeSigs[0].roleName || activeSigs[0].role || activeSigs[0].label || 'Class Teacher' }));
      }
    }).catch(console.error);
  }, []);

  const fetchRules = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const cat = categories.find(c => c.id === selectedId);
      const query = cat ? `?category=${encodeURIComponent(cat.rawVal)}` : '';
      const res = await fetch(`${API}/results/comment-rules${query}`, { credentials: 'include' });
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedId, categories]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const addRule = async () => {
    if (!newRule.comment) return;
    setSaving(true);
    try {
      const cat = categories.find(c => c.id === selectedId);
      if (editingRuleId) {
        const res = await fetch(`${API}/results/comment-rules/${editingRuleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...newRule, category: cat ? cat.rawVal : 'ALL' })
        });
        const data = await res.json();
        setRules(prev => prev.map(r => r.id === editingRuleId ? data.rule : r));
        setEditingRuleId(null);
      } else {
        const res = await fetch(`${API}/results/comment-rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...newRule, category: cat ? cat.rawVal : 'ALL' })
        });
        const data = await res.json();
        setRules(prev => [...prev, data.rule]);
      }
      setNewRule({ minScore: 0, maxScore: 100, comment: '', role: newRule.role, resultType: newRule.resultType });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleEditRule = (rule: any) => {
    setNewRule({
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        comment: rule.comment,
        role: rule.role,
        resultType: rule.resultType || 'EXAM'
    });
    setEditingRuleId(rule.id);
  };

  const deleteRule = async (id: string) => {
    try {
      await fetch(`${API}/results/comment-rules/${id}`, { method: 'DELETE', credentials: 'include' });
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Section Scope</p><p className="text-xs text-gray-500 mt-0.5">Configure comment rules globally, or specifically per section.</p></div>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:w-64 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl">
        <h3 className="font-bold text-gray-900 mb-4">Auto-Comment Ranges</h3>
        <p className="text-sm text-gray-500 mb-4">Define multiple score ranges and their corresponding automatic comments. If a student's final score falls within a range, this comment is automatically applied. If no range applies, the teacher provides a manual comment.</p>

        {loading ? <p className="text-sm text-gray-500">Loading rules...</p> : (
          <div className="space-y-3">
            {rules.length === 0 && <p className="text-sm text-gray-400">No ranges configured yet. Add one below.</p>}
            {rules.map(rule => (
              <div key={rule.id} className="flex flex-col sm:flex-row gap-4 sm:items-center border border-gray-100 rounded-xl p-4 bg-gray-50 hover:border-gray-200">
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-[#1E4DA6] bg-[#1E4DA6]/5 px-2 py-1 rounded-md uppercase w-28 text-center">{rule.role}</span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase">{rule.resultType || 'EXAM'}</span>
                </div>
                <div className="flex gap-2 items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-sm font-bold text-gray-700">{rule.minScore}%</span>
                  <span className="text-gray-400">to</span>
                  <span className="text-sm font-bold text-gray-700">{rule.maxScore}%</span>
                </div>
                <div className="flex-1 text-sm text-gray-700 italic">"{rule.comment}"</div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditRule(rule)} className="p-2 text-gray-400 hover:text-[#1E4DA6] hover:bg-[#1E4DA6]/5 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                {editingRuleId ? <Pencil className="w-4 h-4 text-[#1E4DA6]" /> : <Plus className="w-4 h-4 text-[#1E4DA6]" />} 
                {editingRuleId ? 'Edit Range' : 'Add New Range'}
            </h4>
            {editingRuleId && (
                <button onClick={() => { setEditingRuleId(null); setNewRule({ minScore: 0, maxScore: 100, comment: '', role: newRule.role, resultType: newRule.resultType }); }} className="text-xs text-gray-500 hover:text-gray-700 underline">Cancel Edit</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Target Role</label>
              <select value={newRule.role} onChange={e => setNewRule(p => ({ ...p, role: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#1E4DA6]">
                {signatures.map((s, idx) => {
                    const roleName = s.roleName || s.role || s.label;
                    return <option key={idx} value={roleName}>{roleName}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Result Type</label>
              <select value={newRule.resultType} onChange={e => setNewRule(p => ({ ...p, resultType: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#1E4DA6]">
                <option value="EXAM">Exam / Final Score</option>
                <option value="CA">Continuous Assessment (CA)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Min Score (%)</label>
              <input type="number" value={newRule.minScore} onChange={e => setNewRule(p => ({ ...p, minScore: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#1E4DA6]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Max Score (%)</label>
              <input type="number" value={newRule.maxScore} onChange={e => setNewRule(p => ({ ...p, maxScore: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#1E4DA6]" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-xs font-bold text-gray-500 uppercase">Generated Comment</label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <input type="text" value={newRule.comment} onChange={e => setNewRule(p => ({ ...p, comment: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4DA6]" placeholder="e.g. Excellent performance, keep it up!" />
                <Button onClick={addRule} disabled={saving} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white">
                  {saving ? (editingRuleId ? 'Updating...' : 'Adding...') : (editingRuleId ? 'Update Range' : 'Add Range')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── SIGNATURES TAB ─────────────────────────────────────── */
function SignaturesTab() {
  const [categories, setCategories] = useState<{id: string, name: string, isClass: boolean, rawVal: string}[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/school-settings/class-levels`, { withCredentials: true }),
      axios.get(`${API}/classes/all`, { withCredentials: true })
    ]).then(([levelsRes, classesRes]) => {
      const allCat = { id: 'CAT_ALL', name: 'Global Default (All Sections)', isClass: false, rawVal: 'ALL' };
      const uniqueCats = Array.from(new Set((levelsRes.data.levels || []).map((l: any) => l.category).filter(Boolean))) as string[];
      const levels = uniqueCats.map((c: string) => ({ id: `CAT_${c}`, name: `Section: ${c}`, isClass: false, rawVal: c }));
      const classes = (classesRes.data.classes || []).map((x: any) => ({ id: `CLASS_${x.id}`, name: `Class: ${x.name}`, isClass: true, rawVal: x.id }));
      const combined = [allCat, ...levels, ...classes];
      setCategories(combined);
      if (combined[0]) setSelectedId(combined[0].id);
    }).catch(console.error);
  }, []);

  const loadConfig = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/school-settings`, { withCredentials: true });
      const rawSigs = r.data.settings?.resultConfig?.signatures || {};
      
      const cat = categories.find(c => c.id === selectedId);
      const key = cat ? cat.rawVal : 'ALL';
      
      // Migrate old format to new format if needed
      let activeSigs = rawSigs[key];
      if (!activeSigs && rawSigs.showSignature1 !== undefined) {
         // It's the old flat format, convert to array format for ALL
         activeSigs = [];
         if (rawSigs.showSignature1) activeSigs.push({ id: 'sig1', roleName: rawSigs.signature1Label || 'Director', url: rawSigs.signature1Url });
         if (rawSigs.showSignature2) activeSigs.push({ id: 'sig2', roleName: rawSigs.signature2Label || 'Principal', url: rawSigs.signature2Url });
      }

      setSignatures(Array.isArray(activeSigs) ? activeSigs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedId, categories]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    const cat = categories.find(c => c.id === selectedId);
    if (!cat) return;
    const key = cat.rawVal;
    setSaving(true);
    try {
      const r = await axios.get(`${API}/school-settings`, { withCredentials: true });
      const currentConfig = r.data.settings?.resultConfig || {};
      const allSigs = currentConfig.signatures || {};
      allSigs[key] = signatures;

      await axios.patch(`${API}/school-settings`, {
        resultConfig: { ...currentConfig, signatures: allSigs }
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save signatures');
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setSignatures(p => p.map(s => s.id === id ? { ...s, url: b64 } : s));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSignature = () => {
    setSignatures(p => [...p, { id: 'sig_' + Date.now(), roleName: 'New Role', url: '' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div><p className="font-bold text-sm text-gray-900">Section or Class Scope</p><p className="text-xs text-gray-500 mt-0.5">Set signatures globally, or override them per section (e.g. Primary vs Secondary).</p></div>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:w-64 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white">
        <h3 className="font-bold text-gray-900 mb-4">Signatures</h3>
        <p className="text-sm text-gray-500 mb-6">Configure the signatures that appear on result cards for the selected section. You can add as many signature roles as you need (e.g. Principal, Exam Officer, Headteacher).</p>

        {loading ? <div className="py-10 text-center text-gray-400">Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {signatures.map((sig, idx) => (
              <div key={sig.id} className="border border-gray-200 rounded-xl p-4 relative group">
                <button onClick={() => setSignatures(p => p.filter(s => s.id !== sig.id))} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 z-10"><Trash2 className="w-4 h-4" /></button>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Signature Role / Title</label>
                  <input type="text" value={sig.roleName} onChange={e => setSignatures(p => p.map(s => s.id === sig.id ? { ...s, roleName: e.target.value } : s))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4DA6]" />
                </div>
                <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer overflow-hidden bg-white">
                  {sig.url ? (
                    <img src={sig.url} alt={sig.roleName} className="h-16 mx-auto object-contain mb-2" />
                  ) : (
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  )}
                  <p className="text-xs text-gray-500">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG or JPG (Max 200KB)</p>
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleSignatureUpload(sig.id, e)} />
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-600 cursor-pointer" htmlFor={`edit_${sig.id}`}>
                    Editable by Class Teachers?
                  </label>
                  <Switch 
                    id={`edit_${sig.id}`} 
                    checked={sig.editableByTeachers ?? false} 
                    onCheckedChange={(c) => setSignatures(p => p.map(s => s.id === sig.id ? { ...s, editableByTeachers: c } : s))} 
                  />
                </div>
              </div>
            ))}
            
            <button onClick={addSignature} className="border-2 border-dashed border-[#1E4DA6]/20 rounded-xl p-6 text-center hover:bg-[#1E4DA6]/5 transition-colors flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-10 h-10 rounded-full bg-[#1E4DA6]/10 text-[#1E4DA6] flex items-center justify-center mb-3">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#173F8C]">Add Signature Role</p>
            </button>
          </div>
        )}

        <div className="mt-8 border-t border-gray-100 pt-6">
          <SaveButton onClick={handleSave} saved={saved} disabled={saving} saveLabel="Save Signatures" savedLabel="Signatures Saved!" />
        </div>
      </div>
    </div>
  );
}


/* ── DISPLAY TAB ────────────────────────────────────────── */
const AUTO_TOGGLES = [
  { key: 'showBorder', label: 'Result Border' },
  { key: 'showArabicName', label: 'Arabic School Name' },
  { key: 'showFinalAverage', label: 'Final Average' },
  { key: 'showFinalGrade', label: 'Final Grade' },
  { key: 'showOutof', label: 'Out of (Maximum Score)' },
  { key: 'showHighestAvgClass', label: 'Highest Average in Class' },
  { key: 'showLowestAvgClass', label: 'Lowest Average in Class' },
  { key: 'showHighestAvgSubj', label: 'Highest Average in Subject' },
  { key: 'showLowestAvgSubj', label: 'Lowest Average in Subject' },
  { key: 'showSubjectPosition', label: 'Subject Position' },
  { key: 'showClassPosition', label: 'Class Position' },
  { key: 'showClassAverage', label: 'Overall Class Average (Summary)' },
  { key: 'showSubjectClassAverage', label: 'Subject Class Average (Table)' },
  { key: 'showStudentPicture', label: 'Student / Pupil Picture' },
  { key: 'showGender', label: 'Gender' },
  { key: 'showTotalStudents', label: 'Total No. of Students in Class' },
  { key: 'showCorePassed', label: 'No. of Core Subjects Passed' },
  { key: 'showCoreFailed', label: 'No. of Core Subjects Failed' },
  { key: 'showElectivePassed', label: 'No. of Elective Subjects Passed' },
  { key: 'showElectiveFailed', label: 'No. of Elective Subjects Failed' },
  { key: 'showTotalSubjects', label: 'Total No. of Subjects Offered' },
  { key: 'showNextTermFees', label: 'Next Term Fees' },
  { key: 'parentTranscriptAccess', label: 'Parent Transcript Access' },
  // Additional blocks
  { key: 'showAttendance', label: 'Attendance Block' },
  { key: 'showClassTeacherRemark', label: 'Class Teacher Remark' },
  { key: 'showHeadTeacherRemark', label: 'Head Teacher or Principal Remark' },
  { key: 'showAcademicSummaryCards', label: 'Academic Summary Cards' },
  { key: 'showNarrative', label: 'Narrative Block' },
  { key: 'showCumulativeSummary', label: 'Cumulative Summary' },
  { key: 'showStatistics', label: 'Statistics Block' },
];

const MANUAL_TOGGLES = [
  { key: 'showStudentName', label: 'Student Name' },
  { key: 'showClass', label: 'Class' },
  { key: 'showAcademicYear', label: 'Academic Year' },
  { key: 'showStudentId', label: 'Student ID' },
  { key: 'showTerm', label: 'Term' },
  { key: 'showDateIssued', label: 'Date Issued' },
  { key: 'showNextTermBegins', label: 'Next Term Begins (Date)' },
  { key: 'showTermEnds', label: 'Term Ends (Date)' },
  { key: 'showAge', label: 'Age' },
  { key: 'showClub', label: 'Club / Society' },
];

const BLOCK_TOGGLES = [
  { key: 'showStudentPicture', label: 'Student Passport Picture' },
  { key: 'showAttendance', label: 'Attendance Statistics' },
  { key: 'showNarrative', label: 'Teacher & Principal Comments' },
  { key: 'showAcademicSummaryCards', label: 'Academic Summary Cards' },
  { key: 'showSignatures', label: 'Signatures & Stamps' },
];

function DisplayTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [headerLayoutMode, setHeaderLayoutMode] = useState<'LEFT'|'CENTER'|'RIGHT'>('LEFT');
  const [layoutDensity, setLayoutDensity] = useState<'STANDARD'|'COMPACT'|'ULTRA_COMPACT'>('STANDARD');
  const [footerLayout, setFooterLayout] = useState<'STACKED'|'MULTI_COLUMN'>('STACKED');
  const [summaryGridLayout, setSummaryGridLayout] = useState<'2'|'3'|'4'|'5'|'6'|'RIBBON'>('4');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${API}/school-settings`, { withCredentials: true })
      .then(r => {
        if (r.data.settings?.resultConfig?.display) {
          setToggles(r.data.settings.resultConfig.display);
        } else {
          // Defaults
          const def: Record<string, boolean> = {};
          [...AUTO_TOGGLES, ...MANUAL_TOGGLES, ...BLOCK_TOGGLES].forEach(t => def[t.key] = true);
          setToggles(def);
        }
        if (r.data.settings?.resultConfig?.headerLayoutMode) {
          setHeaderLayoutMode(r.data.settings.resultConfig.headerLayoutMode);
        }
        if (r.data.settings?.resultConfig?.layoutDensity) setLayoutDensity(r.data.settings.resultConfig.layoutDensity);
        if (r.data.settings?.resultConfig?.footerLayout) setFooterLayout(r.data.settings.resultConfig.footerLayout);
        if (r.data.settings?.resultConfig?.summaryGridLayout) setSummaryGridLayout(r.data.settings.resultConfig.summaryGridLayout);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: string) => {
    setToggles(p => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await axios.get(`${API}/school-settings`, { withCredentials: true });
      const currentConfig = r.data.settings?.resultConfig || {};
      await axios.patch(`${API}/school-settings`, {
        resultConfig: { 
          ...currentConfig, 
          display: toggles, 
          headerLayoutMode: headerLayoutMode,
          layoutDensity: layoutDensity,
          footerLayout: footerLayout,
          summaryGridLayout: summaryGridLayout
        }
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save display settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-400">Loading toggles...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white">
        <h3 className="font-bold text-gray-900 mb-2">Display Toggles</h3>
        <p className="text-sm text-gray-500 mb-6">Control which fields appear on the printed result sheet.</p>

        <h4 className="text-xs font-bold text-[#1E4DA6] uppercase tracking-wider mb-3">Header Layout Options</h4>
        <p className="text-xs text-gray-500 mb-4">Choose how the school name and logo are positioned on report cards.</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <label className={cn("flex-1 p-4 border rounded-xl cursor-pointer transition-all", headerLayoutMode === 'LEFT' ? "border-[#1E4DA6] bg-[#1E4DA6]/5 ring-2 ring-[#1E4DA6]/20" : "border-gray-200 hover:border-[#1E4DA6]/20 bg-white")}>
                <div className="flex items-center gap-3 mb-2">
                    <input type="radio" name="headerMode" checked={headerLayoutMode === 'LEFT'} onChange={() => setHeaderLayoutMode('LEFT')} className="w-4 h-4 text-[#1E4DA6]" />
                    <span className="font-bold text-gray-900">Left Aligned</span>
                </div>
                <p className="text-xs text-gray-500 ml-7">Logo on left, School name aligned left.</p>
            </label>
            <label className={cn("flex-1 p-4 border rounded-xl cursor-pointer transition-all", headerLayoutMode === 'CENTER' ? "border-[#1E4DA6] bg-[#1E4DA6]/5 ring-2 ring-[#1E4DA6]/20" : "border-gray-200 hover:border-[#1E4DA6]/20 bg-white")}>
                <div className="flex items-center gap-3 mb-2">
                    <input type="radio" name="headerMode" checked={headerLayoutMode === 'CENTER'} onChange={() => setHeaderLayoutMode('CENTER')} className="w-4 h-4 text-[#1E4DA6]" />
                    <span className="font-bold text-gray-900">Centered</span>
                </div>
                <p className="text-xs text-gray-500 ml-7">School name and Logo centered.</p>
            </label>
            <label className={cn("flex-1 p-4 border rounded-xl cursor-pointer transition-all", headerLayoutMode === 'RIGHT' ? "border-[#1E4DA6] bg-[#1E4DA6]/5 ring-2 ring-[#1E4DA6]/20" : "border-gray-200 hover:border-[#1E4DA6]/20 bg-white")}>
                <div className="flex items-center gap-3 mb-2">
                    <input type="radio" name="headerMode" checked={headerLayoutMode === 'RIGHT'} onChange={() => setHeaderLayoutMode('RIGHT')} className="w-4 h-4 text-[#1E4DA6]" />
                    <span className="font-bold text-gray-900">Right Aligned</span>
                </div>
                <p className="text-xs text-gray-500 ml-7">Logo on right, School name aligned right.</p>
            </label>
        </div>

        <h4 className="text-xs font-bold text-[#1E4DA6] uppercase tracking-wider mb-3">1-Page Layout Optimization</h4>
        <p className="text-xs text-gray-500 mb-4">Settings to help bulky report cards fit perfectly on one page.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 border border-gray-200 rounded-xl">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Layout Density</label>
                <Select value={layoutDensity} onValueChange={(v: any) => setLayoutDensity(v)}>
                    <SelectTrigger className="w-full bg-white border-gray-200 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STANDARD">Standard Padding</SelectItem>
                        <SelectItem value="COMPACT">Compact (Saves Space)</SelectItem>
                        <SelectItem value="ULTRA_COMPACT">Ultra Compact (Tightest)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="bg-white p-4 border border-gray-200 rounded-xl">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Footer Layout</label>
                <Select value={footerLayout} onValueChange={(v: any) => setFooterLayout(v)}>
                    <SelectTrigger className="w-full bg-white border-gray-200 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STACKED">Stacked (Vertical)</SelectItem>
                        <SelectItem value="MULTI_COLUMN">Multi-Column (Side-by-side)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white p-4 border border-gray-200 rounded-xl">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Summary Grid</label>
                <Select value={summaryGridLayout} onValueChange={(v: any) => setSummaryGridLayout(v)}>
                    <SelectTrigger className="w-full bg-white border-gray-200 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2 Columns</SelectItem>
                        <SelectItem value="3">3 Columns</SelectItem>
                        <SelectItem value="4">4 Columns (Default)</SelectItem>
                        <SelectItem value="5">5 Columns</SelectItem>
                        <SelectItem value="6">6 Columns</SelectItem>
                        <SelectItem value="RIBBON">Horizontal Ribbon (1-line)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <h4 className="text-xs font-bold text-[#1E4DA6] uppercase tracking-wider mb-3">Major Report Blocks</h4>
        <p className="text-xs text-gray-500 mb-4">Toggle entire sections of the report card ON or OFF.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {BLOCK_TOGGLES.map(t => (
            <label key={t.key} className="flex items-center justify-between p-3 border border-[#1E4DA6]/10 rounded-lg hover:bg-[#1E4DA6]/5 cursor-pointer bg-white shadow-sm">
              <span className="text-sm font-bold text-[#0E2450]">{t.label}</span>
              <Switch checked={toggles[t.key] ?? true} onCheckedChange={() => handleToggle(t.key)} />
            </label>
          ))}
        </div>

        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Auto-Calculated Fields</h4>
        <p className="text-xs text-gray-500 mb-4">These fields are automatically calculated by the system and shown as values.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {AUTO_TOGGLES.map(t => (
            <label key={t.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">{t.label}</span>
              <Switch checked={toggles[t.key] ?? true} onCheckedChange={() => handleToggle(t.key)} />
            </label>
          ))}
        </div>

        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Manually Entered Fields</h4>
        <p className="text-xs text-gray-500 mb-4">These fields require manual input (e.g. from the teacher comment page) to display on the result.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MANUAL_TOGGLES.map(t => (
            <label key={t.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-[#1E4DA6]/5 cursor-pointer bg-[#1E4DA6]/8">
              <span className="text-sm font-semibold text-[#0E2450]">{t.label}</span>
              <Switch checked={toggles[t.key] ?? true} onCheckedChange={() => handleToggle(t.key)} />
            </label>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6">
          <SaveButton onClick={handleSave} saved={saved} disabled={saving} saveLabel="Save Display Settings" savedLabel="Settings Saved!" />
        </div>
      </div>
    </div>
  );
}


/* ── RANKING TAB ────────────────────────────────────────── */
function RankingTab() {
  const [config, setConfig] = useState({
    strategy: 'standard',
    tieBreaker: 'total',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${API}/school-settings`, { withCredentials: true })
      .then(r => {
        if (r.data.settings) {
          setConfig({
            strategy: r.data.settings.resultConfig?.rankingStrategy || 'standard',
            tieBreaker: r.data.settings.resultConfig?.tieBreaker || 'total',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await axios.get(`${API}/school-settings`, { withCredentials: true });
      const currentConfig = r.data.settings?.resultConfig || {};
      await axios.patch(`${API}/school-settings`, {
        resultConfig: {
          ...currentConfig,
          rankingStrategy: config.strategy,
          tieBreaker: config.tieBreaker,
        }
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save ranking config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-400">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white">
        <h3 className="font-bold text-gray-900 mb-4">Positions & Ranking</h3>
        <p className="text-sm text-gray-500 mb-6">Configure how class positions and ties are calculated.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Ranking Strategy</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <label className={cn('p-3 border rounded-lg cursor-pointer flex justify-between items-center', config.strategy === 'standard' ? 'border-[#1E4DA6] bg-[#1E4DA6]/5' : 'border-gray-200')}>
                <div>
                  <div className="font-semibold text-sm">Standard Ranking</div>
                  <div className="text-xs text-gray-500">Ties share rank, skips next (1, 2, 2, 4)</div>
                </div>
                <input type="radio" name="strategy" checked={config.strategy === 'standard'} onChange={() => setConfig(p => ({...p, strategy: 'standard'}))} className="text-[#1E4DA6]" />
              </label>
              <label className={cn('p-3 border rounded-lg cursor-pointer flex justify-between items-center', config.strategy === 'dense' ? 'border-[#1E4DA6] bg-[#1E4DA6]/5' : 'border-gray-200')}>
                <div>
                  <div className="font-semibold text-sm">Dense Ranking</div>
                  <div className="text-xs text-gray-500">Ties share rank, no skips (1, 2, 2, 3)</div>
                </div>
                <input type="radio" name="strategy" checked={config.strategy === 'dense'} onChange={() => setConfig(p => ({...p, strategy: 'dense'}))} className="text-[#1E4DA6]" />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tie Breaker</label>
            <Select value={config.tieBreaker} onValueChange={(val) => setConfig(p => ({...p, tieBreaker: val}))}>
              <SelectTrigger className="w-full md:w-1/2 mt-1 border-gray-200">
                <SelectValue placeholder="Select tie breaker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">By Total Score</SelectItem>
                <SelectItem value="average">By Average Score</SelectItem>
                <SelectItem value="none">No Tie Breaker (Alphabetic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className=" border-t border-gray-100 mt-4 whitespace-nowrap">
          <SaveButton onClick={handleSave} saved={saved} saveLabel="Save Ranking Config" savedLabel="Saved!" />
        </div>
      </div>
    </div>
  );
}

/* ── ATTENDANCE TAB ─────────────────────────────────────── */
function AttendanceTab() {
  const [daysOpened, setDaysOpened] = useState(120);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch active term to get the current daysOpened
    axios.get(`${API}/terms`, { withCredentials: true })
      .then(res => {
        const active = res.data.terms?.find((t: any) => t.isActive);
        if (active && active.daysOpened !== undefined) {
          setDaysOpened(active.daysOpened);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/terms/active/days-opened`, { daysOpened }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to save attendance configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white">
        <h3 className="font-bold text-gray-900 mb-4">Attendance Statistics</h3>
        <p className="text-sm text-gray-500 mb-6">Link attendance records into the result computation.</p>

        {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
            <>
                <div className="space-y-4">
                  <div className="w-full md:w-1/2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Total Days School Opened</label>
                    <input type="number" value={daysOpened} onChange={e => setDaysOpened(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>

                  <div className="border border-gray-100 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-700 mb-2">Note on Student Attendance</p>
                    <p>Individual student attendance (Days Present/Absent) is pulled automatically from the Attendance Module if available, or can be entered manually during score entry.</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 mt-4 whitespace-nowrap">
                  <SaveButton onClick={handleSave} disabled={saving} saved={saved} saveLabel={saving ? "Saving..." : "Save Attendance Config"} savedLabel="Saved!" />
                </div>
            </>
        )}
      </div>
    </div>
  );
}

/* ── GENERAL TAB ────────────────────────────────────────── */
function GeneralTab() {
  const [config, setConfig] = useState({
    schoolName: 'Skooly International School',
    address: '123 School Lane, Lagos',
    phone: '',
    motto: '',
    logoUrl: '',
    termEndDate: '2026-07-20',
    nextTermStartDate: '2026-09-15',
    nextTermFees: '150,000',
    reportTitle: 'STUDENT PROGRESS REPORT',
    issuedResultTypes: 'BOTH',
    caResultMode: 'NUMERIC',
    examResultMode: 'NUMERIC',
    resultAutomaticComments: false,
    parentResultAccessMode: 'DIRECT',
    pinLifespan: 'PER_TERM',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${API}/school-settings`, { withCredentials: true })
      .then(r => {
        if (r.data.settings) {
          setConfig(p => ({
            ...p,
            schoolName: r.data.settings.schoolName || p.schoolName,
            address: r.data.settings.address || p.address,
            phone: r.data.settings.phone || '',
            motto: r.data.settings.motto || '',
            logoUrl: r.data.settings.logoUrl || '',
            // Assuming the other fields are part of settings too. For simplicity, focusing on new ones.
            issuedResultTypes: r.data.settings.issuedResultTypes || 'BOTH',
            caResultMode: r.data.settings.caResultMode || 'NUMERIC',
            examResultMode: r.data.settings.examResultMode || 'NUMERIC',
            resultAutomaticComments: r.data.settings.resultAutomaticComments ?? false,
            parentResultAccessMode: r.data.settings.parentResultAccessMode || 'DIRECT',
            pinLifespan: r.data.settings.pinLifespan || 'PER_TERM',
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/school-settings`, {
        schoolName: config.schoolName,
        address: config.address,
        phone: config.phone,
        motto: config.motto,
        logoUrl: config.logoUrl,
        issuedResultTypes: config.issuedResultTypes,
        caResultMode: config.caResultMode,
        examResultMode: config.examResultMode,
        resultAutomaticComments: config.resultAutomaticComments,
        parentResultAccessMode: config.parentResultAccessMode,
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white">
        <h3 className="font-bold text-gray-900 mb-4">General Result Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-semibold text-sm text-gray-800 border-b pb-2 mb-2">School Information</h4>
          </div>
          
          <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
              <div className="h-16 w-16 shrink-0 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                      <span className="text-[10px] text-gray-400 font-medium">No Logo</span>
                  )}
              </div>
              <div className="flex-1 min-w-0 w-full">
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">School Logo</label>
                  <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setConfig(p => ({ ...p, logoUrl: reader.result as string }));
                          reader.readAsDataURL(file);
                      }
                  }} className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1E4DA6]/5 file:text-[#173F8C] hover:file:bg-[#1E4DA6]/10 truncate" />
                  <p className="text-[10px] text-gray-400 mt-1 truncate sm:whitespace-normal">This logo will be used at the top of the report cards.</p>
              </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">School Name (on Result)</label>
            <input type="text" value={config.schoolName} onChange={e => setConfig(p => ({ ...p, schoolName: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
            <input type="text" value={config.address} onChange={e => setConfig(p => ({ ...p, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
            <input type="text" value={config.phone} onChange={e => setConfig(p => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Motto</label>
            <input type="text" value={config.motto} onChange={e => setConfig(p => ({ ...p, motto: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          
          <div className="col-span-1 md:col-span-2 mt-2">
            <h4 className="font-semibold text-sm text-gray-800 border-b pb-2 mb-2">Term Details</h4>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Term End Date</label>
            <input type="date" value={config.termEndDate} onChange={e => setConfig(p => ({ ...p, termEndDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Next Term Resumes</label>
            <input type="date" value={config.nextTermStartDate} onChange={e => setConfig(p => ({ ...p, nextTermStartDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Report Title Label</label>
            <input type="text" value={config.reportTitle} onChange={e => setConfig(p => ({ ...p, reportTitle: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>

          <div className="col-span-1 md:col-span-2 mt-2">
            <h4 className="font-semibold text-sm text-gray-800 border-b pb-2 mb-2">Result Types & Input Modes</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-1 md:col-span-2">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Issued Result Types</label>
              <select value={config.issuedResultTypes} onChange={e => setConfig(p => ({ ...p, issuedResultTypes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                <option value="BOTH">Both CA and Exam</option>
                <option value="CA_ONLY">CA Result Only</option>
                <option value="EXAM_ONLY">Exam Result Only</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">CA Result Mode</label>
              <select value={config.caResultMode} onChange={e => setConfig(p => ({ ...p, caResultMode: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                <option value="NUMERIC">Numeric Score</option>
                <option value="COMMENT">Comment-Based</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Exam Result Mode</label>
              <select value={config.examResultMode} onChange={e => setConfig(p => ({ ...p, examResultMode: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">
                <option value="NUMERIC">Numeric Score</option>
                <option value="COMMENT">Comment-Based</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <div className="col-span-2 w-full">
            <h4 className="font-semibold text-sm text-gray-800 border-b pb-2 mb-2">Automation Rules</h4>
          </div>
          
          <div className="col-span-2 w-full flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-[#1E4DA6]/5 bg-[#1E4DA6]/8 gap-4">
              <div>
                <span className="text-sm font-semibold text-[#0E2450] block mb-1">Automatic Result Comments</span>
                <p className="text-xs text-gray-600">If enabled, comments will be auto-generated based on the student's average score using the rules defined in the "Comments" tab.</p>
              </div>
              <Switch checked={config.resultAutomaticComments} onCheckedChange={(val) => setConfig(p => ({...p, resultAutomaticComments: val}))} />
          </div>

          <div className="col-span-2 w-full flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-emerald-50 bg-emerald-50/30 gap-4">
              <div>
                <span className="text-sm font-semibold text-emerald-900 block mb-1">Require PIN for Result Checking</span>
                <p className="text-xs text-gray-600">If enabled, parents and students must enter a valid purchased PIN to view or download their report cards.</p>
              </div>
              <Switch checked={config.parentResultAccessMode === 'PIN'} onCheckedChange={(val) => setConfig(p => ({...p, parentResultAccessMode: val ? 'PIN' : 'DIRECT'}))} />
          </div>

          {config.parentResultAccessMode === 'PIN' && (
              <div className="col-span-2 w-full flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-emerald-50 bg-emerald-50/30 gap-4 transition-all duration-300">
                  <div>
                    <span className="text-sm font-semibold text-emerald-900 block mb-1">PIN Validity Lifespan</span>
                    <p className="text-xs text-gray-600">Determine how long a PIN stays valid once activated by a student.</p>
                  </div>
                  <select 
                      value={config.pinLifespan} 
                      onChange={e => setConfig(p => ({ ...p, pinLifespan: e.target.value }))} 
                      className="w-full md:w-64 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                      <option value="PER_TERM">Termly (Valid for 1 Term)</option>
                      <option value="PER_SESSION">Session (Valid for whole Year)</option>
                      <option value="PERMANENT">Permanent (Valid Forever)</option>
                  </select>
              </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 mt-6">
          <SaveButton onClick={handleSave} saved={saved} disabled={loading || saving} saveLabel={saving ? "Saving..." : "Save General Settings"} savedLabel="Saved!" />
        </div>
      </div>
    </div>
  );
}


/* ── VISIBILITY & RELEASE TAB ──────────────────────────── */
function VisibilityTab() {
  const [categories, setCategories] = useState<{id: string, name: string, isClass: boolean, rawVal: string}[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [term, setTerm] = useState('First Term');
  const [year, setYear] = useState(new Date().getFullYear() + '/' + (new Date().getFullYear() + 1));
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/school-settings/class-levels`, { withCredentials: true }),
      axios.get(`${API}/classes/all`, { withCredentials: true })
    ]).then(([levelsRes, classesRes]) => {
      const allCat = { id: 'CAT_ALL', name: 'Global Default (Whole School)', isClass: false, rawVal: 'ALL' };
      const levels = (levelsRes.data.levels || []).map((x: any) => ({ id: `CAT_${x.name}`, name: `Section: ${x.name}`, isClass: false, rawVal: x.name }));
      const classes = (classesRes.data.classes || []).map((x: any) => ({ id: `CLASS_${x.id}`, name: `Class: ${x.name}`, isClass: true, rawVal: x.id }));
      const combined = [allCat, ...levels, ...classes];
      setCategories(combined);
      if (combined[0]) setSelectedId(combined[0].id);
    }).catch(console.error);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!selectedId) return;
    const cat = categories.find(c => c.id === selectedId);
    if (!cat) return;
    
    setLoading(true);
    try {
      // We will create a generic endpoint or just use release-status endpoint in backend
      const query = cat.isClass ? `classId=${cat.rawVal}` : `category=${encodeURIComponent(cat.rawVal)}`;
      const res = await axios.get(`${API}/results/release-status?${query}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { withCredentials: true });
      setStatus(res.data.status || { isReleased: false, visibleTypes: ['CA', 'EXAM', 'FULL', 'COMMENT'] });
    } catch {
      setStatus({ isReleased: false, visibleTypes: ['CA', 'EXAM', 'FULL', 'COMMENT'] });
    } finally {
      setLoading(false);
    }
  }, [selectedId, categories, term, year]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const toggleType = (type: string) => {
    if (!status) return;
    const types = status.visibleTypes || [];
    const next = types.includes(type) ? types.filter((t: string) => t !== type) : [...types, type];
    setStatus({ ...status, visibleTypes: next });
  };

  const handleSave = async () => {
    if (!selectedId || !status) return;
    const cat = categories.find(c => c.id === selectedId);
    if (!cat) return;

    setSaving(true);
    try {
      const payload = {
        term, academicYear: year,
        isReleased: status.isReleased,
        visibleTypes: status.visibleTypes,
        ...(cat.isClass ? { classId: cat.rawVal } : { category: cat.rawVal })
      };
      await axios.post(`${API}/results/release-status/advanced`, payload, { withCredentials: true });
      alert('Saved successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl">
        <h3 className="font-bold text-gray-900 mb-4">Result Visibility & Release Controls</h3>
        <p className="text-sm text-gray-500 mb-6">Control whether results are published to the parent portal, and exactly what types of results they can see (e.g. CA only, Exam only).</p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full sm:w-64 bg-white"><SelectValue placeholder="Select Scope" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="2026/2027" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 outline-none focus:border-[#1E4DA6]" />
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-full sm:w-48 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="First Term">First Term</SelectItem>
              <SelectItem value="Second Term">Second Term</SelectItem>
              <SelectItem value="Third Term">Third Term</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-sm text-gray-400">Loading...</p> : status && (
          <div className="space-y-6 border border-gray-200 p-3 sm:p-6 rounded-xl">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900">Publish Results</h4>
                <p className="text-sm text-gray-500">If disabled, parents will not see any results for this term.</p>
              </div>
              <Switch checked={status.isReleased} onCheckedChange={e => setStatus({ ...status, isReleased: e })} />
            </div>

            <div className={status.isReleased ? '' : 'opacity-50 pointer-events-none'}>
              <h4 className="font-bold text-gray-900 mb-4">Allowed Result Types</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'FULL', label: 'Full Result (CA + Exam + Total)' },
                  { id: 'CA', label: 'Continuous Assessment (CA) Only' },
                  { id: 'EXAM', label: 'Exam Scores Only' },
                  { id: 'COMMENT', label: 'Comments / Traits Only' }
                ].map(t => (
                  <label key={t.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" className="mt-1" checked={(status.visibleTypes || []).includes(t.id)} onChange={() => toggleType(t.id)} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{t.label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── COMMENT BASED SETUP TAB ────────────────────────────── */
function CommentBasedSetupTab() {
  const [config, setConfig] = useState<any>({ categories: [], ratingScale: [], narrativeTopics: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullResultConfig, setFullResultConfig] = useState<any>({});

  useEffect(() => {
    axios.get(`${API}/school-settings`, { withCredentials: true })
      .then(r => {
        if (r.data.settings) {
          const resConfig = r.data.settings.resultConfig || {};
          setFullResultConfig(resConfig);
          setConfig(resConfig.commentBasedSettings || { categories: [], ratingScale: [], narrativeTopics: [] });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        resultConfig: {
          ...fullResultConfig,
          commentBasedSettings: config
        }
      };
      await axios.patch(`${API}/school-settings`, payload, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save Comment Based settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => setConfig((p: any) => ({ ...p, categories: [...(p.categories || []), { id: `cat-${Date.now()}`, name: '', skills: [] }] }));
  const updateCategory = (id: string, name: string) => setConfig((p: any) => ({ ...p, categories: p.categories.map((c: any) => c.id === id ? { ...c, name } : c) }));
  const removeCategory = (id: string) => setConfig((p: any) => ({ ...p, categories: p.categories.filter((c: any) => c.id !== id) }));
  
  const addSkill = (catId: string) => setConfig((p: any) => ({ ...p, categories: p.categories.map((c: any) => c.id === catId ? { ...c, skills: [...(c.skills || []), { id: `skill-${Date.now()}`, name: '' }] } : c) }));
  const updateSkill = (catId: string, skillId: string, name: string) => setConfig((p: any) => ({ ...p, categories: p.categories.map((c: any) => c.id === catId ? { ...c, skills: c.skills.map((s: any) => s.id === skillId ? { ...s, name } : s) } : c) }));
  const removeSkill = (catId: string, skillId: string) => setConfig((p: any) => ({ ...p, categories: p.categories.map((c: any) => c.id === catId ? { ...c, skills: c.skills.filter((s: any) => s.id !== skillId) } : c) }));

  const addScale = () => setConfig((p: any) => ({ ...p, ratingScale: [...(p.ratingScale || []), { id: `scale-${Date.now()}`, label: '' }] }));
  const updateScale = (id: string, label: string) => setConfig((p: any) => ({ ...p, ratingScale: p.ratingScale.map((s: any) => s.id === id ? { ...s, label } : s) }));
  const removeScale = (id: string) => setConfig((p: any) => ({ ...p, ratingScale: p.ratingScale.filter((s: any) => s.id !== id) }));

  const addTopic = () => setConfig((p: any) => ({ ...p, narrativeTopics: [...(p.narrativeTopics || []), { id: `topic-${Date.now()}`, name: '' }] }));
  const updateTopic = (id: string, name: string) => setConfig((p: any) => ({ ...p, narrativeTopics: p.narrativeTopics.map((t: any) => t.id === id ? { ...t, name } : t) }));
  const removeTopic = (id: string) => setConfig((p: any) => ({ ...p, narrativeTopics: p.narrativeTopics.filter((t: any) => t.id !== id) }));

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white">
        <h3 className="font-bold text-gray-900 mb-4">Comment-Based Results Configuration</h3>
        <p className="text-sm text-gray-500 mb-6">Setup categories (e.g. General Development), their skills (e.g. Academic, Language), Rating Scales, and Narrative Topics for your nursery/comment-based reports.</p>

        {/* Categories & Skills */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h4 className="font-semibold text-gray-800">Categories & Skills</h4>
            <Button size="sm" variant="outline" onClick={addCategory} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Add Category</Button>
          </div>
          <div className="space-y-4">
            {(config.categories || []).map((cat: any) => (
              <div key={cat.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex flex-row items-center gap-2 mb-4">
                  <input type="text" value={cat.name} onChange={e => updateCategory(cat.id, e.target.value)} placeholder="Category Name (e.g. General Development)" className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold" />
                  <Button variant="ghost" size="sm" onClick={() => removeCategory(cat.id)} className="text-red-500 hover:bg-red-50 shrink-0 px-2"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <div className="pl-2 sm:pl-4 space-y-2 border-l-2 border-gray-200">
                  {(cat.skills || []).map((skill: any) => (
                    <div key={skill.id} className="flex flex-row items-center gap-2">
                      <input type="text" value={skill.name} onChange={e => updateSkill(cat.id, skill.id, e.target.value)} placeholder="Skill (e.g. Academic)" className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                      <Button variant="ghost" size="sm" onClick={() => removeSkill(cat.id, skill.id)} className="text-gray-400 hover:text-red-500 shrink-0 px-2"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => addSkill(cat.id)} className="text-[#1E4DA6] hover:bg-[#1E4DA6]/5 mt-2 text-xs font-semibold"><Plus className="w-3 h-3 mr-1" />Add Skill</Button>
                </div>
              </div>
            ))}
            {!(config.categories?.length > 0) && <p className="text-xs text-gray-400 italic">No categories added yet.</p>}
          </div>
        </div>

        {/* Rating Scale */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h4 className="font-semibold text-gray-800">Rating Scale</h4>
            <Button size="sm" variant="outline" onClick={addScale} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Add Grade/Rating</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(config.ratingScale || []).map((scale: any) => (
              <div key={scale.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1.5 rounded-lg border border-gray-200">
                <input type="text" value={scale.label} onChange={e => updateScale(scale.id, e.target.value)} className="w-24 bg-transparent outline-none text-sm font-semibold text-center border-b border-dashed focus:border-gray-400" placeholder="e.g. A" />
                <button onClick={() => removeScale(scale.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {!(config.ratingScale?.length > 0) && <p className="text-xs text-gray-400 italic">No rating scale added yet.</p>}
          </div>
        </div>

        {/* Narrative Topics */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h4 className="font-semibold text-gray-800">Narrative Topics (Optional)</h4>
            <Button size="sm" variant="outline" onClick={addTopic} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Add Topic</Button>
          </div>
          <div className="space-y-2">
            {(config.narrativeTopics || []).map((topic: any) => (
              <div key={topic.id} className="flex flex-row items-center gap-2 max-w-md bg-gray-50 p-2 rounded-lg border border-gray-200">
                <input type="text" value={topic.name} onChange={e => updateTopic(topic.id, e.target.value)} placeholder="Topic (e.g. Class Teacher's Report)" className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                <Button variant="ghost" size="sm" onClick={() => removeTopic(topic.id)} className="text-gray-400 hover:text-red-500 shrink-0 px-2"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {!(config.narrativeTopics?.length > 0) && <p className="text-xs text-gray-400 italic">No narrative topics added yet.</p>}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <SaveButton onClick={handleSave} saved={saved} disabled={loading || saving} saveLabel={saving ? "Saving..." : "Save Comment-Based Setup"} savedLabel="Saved!" />
        </div>
      </div>
    </div>
  );
}

export function ResultSettings() {
  const [tab, setTab] = useState('grading');

  return (
    <SettingsShell breadcrumbParent="Results & Reports" breadcrumbCurrent="Result Settings" tabLabel="Result Settings" tabIcon={<Award className="h-3.5 w-3.5" />}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap text-left w-auto lg:w-full shrink-0', tab === t.id ? 'bg-[#1E4DA6] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100')}>
                  <Icon className="w-4 h-4 shrink-0" />{t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-2xl py-6 px-3 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{TABS.find(t => t.id === tab)?.label}</h2>
          <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            {tab === 'grading' && 'Configure grading scales per section. Calculation engine uses these to assign grades.'}
            {tab === 'assessment' && 'Define assessment components (CA, Exam weights) per section.'}
            {tab === 'traits' && 'Configure Affective & Psychomotor trait lists and rating scale.'}
            {tab === 'comment-based' && 'Configure Comment-Based Result categories, rating scales, and narrative topics.'}
            {tab === 'display' && 'Toggle which fields appear on the printed report card.'}
            {tab === 'signatures' && 'Upload principal and head teacher signatures.'}
            {tab === 'general' && 'School info, term dates, next term fees, result title label.'}
            {tab === 'ranking' && 'Configure how class positions and ties are calculated.'}
            {tab === 'attendance' && 'Map attendance data into the result report.'}
            {tab === 'comments' && 'Set automatic comment templates triggered by score ranges.'}
            {tab === 'templates' && 'Select and configure the PDF layout for report cards.'}
          </p>

          {tab === 'grading' && <GradingTab />}
          {tab === 'assessment' && <AssessmentTab />}
          {tab === 'traits' && <TraitsTab />}
          {tab === 'comment-based' && <CommentBasedSetupTab />}
          {tab === 'general' && <GeneralTab />}
          {tab === 'display' && <DisplayTab />}
          {tab === 'signatures' && <SignaturesTab />}
          {tab === 'ranking' && <RankingTab />}
          {tab === 'attendance' && <AttendanceTab />}
          {tab === 'comments' && <CommentsTab />}
          {tab === 'templates' && <TemplatesTab />}
            {tab === 'visibility' && <VisibilityTab />}
        </div>
      </div>
    </SettingsShell>
  );
}
