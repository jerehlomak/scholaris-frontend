import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CalendarDays, FileInput, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { EXAM_TYPES, KIND_LABEL, TT_API, apiError, inputCls, type DocSummary, type Meta } from './timetable/api';
import TimetableEditor from './timetable/TimetableEditor';
import SettingsPanel from './timetable/SettingsPanel';
import { ReminderPanel } from './timetable/ReminderPanel';

const withCreds = { withCredentials: true };
type Tab = 'timetables' | 'settings' | 'reminders';
const TABS: [Tab, string][] = [['timetables', 'Timetables'], ['settings', 'Settings & alerts'], ['reminders', 'Reminders']];

const Label = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t}</span>{children}</label>
);

function CreateDialog({ meta, onClose, onCreated }: { meta: Meta; onClose: () => void; onCreated: (id: string) => void }) {
    const [kind, setKind] = useState<'CLASS' | 'EXAM' | 'ACTIVITY'>('CLASS');
    const [name, setName] = useState('');
    const [examType, setExamType] = useState(EXAM_TYPES[0]);
    const [term, setTerm] = useState(meta.currentTerm || '');
    const [academicYear, setYear] = useState(meta.currentYear || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!name.trim()) return toast.error('Give the timetable a name.');
        setSaving(true);
        try {
            const res = await axios.post(`${TT_API}/docs`, { name, kind, examType: kind === 'EXAM' ? examType : undefined, term, academicYear }, withCreds);
            onCreated(res.data.doc.id);
        } catch (err) { toast.error(apiError(err, 'Could not create it.')); setSaving(false); }
    };
    const placeholder = kind === 'CLASS' ? 'e.g. First Term Class Timetable' : kind === 'EXAM' ? 'e.g. Second Term Examination' : 'e.g. Inter-house Sports Week';

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent>
                <DialogHeader><DialogTitle>New timetable</DialogTitle><DialogDescription>Create it empty, then auto-generate or fill it in by hand.</DialogDescription></DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        {(['CLASS', 'EXAM', 'ACTIVITY'] as const).map(k => (
                            <button key={k} onClick={() => setKind(k)} className={cn('rounded-xl border-2 px-2 py-2 text-xs font-bold', kind === k ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-500')}>
                                {k === 'CLASS' ? 'Class lessons' : k === 'EXAM' ? 'Exam' : 'Activity'}
                            </button>
                        ))}
                    </div>
                    <Label t="Name"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder={placeholder} autoFocus /></Label>
                    {kind === 'EXAM' && <Label t="Exam type"><select className={inputCls} value={examType} onChange={e => setExamType(e.target.value)}>{EXAM_TYPES.map(t => <option key={t}>{t}</option>)}</select></Label>}
                    <div className="grid grid-cols-2 gap-3">
                        <Label t="Term"><input list="tt-terms" className={inputCls} value={term} onChange={e => setTerm(e.target.value)} /><datalist id="tt-terms">{meta.terms.map(t => <option key={t} value={t} />)}</datalist></Label>
                        <Label t="Session"><input list="tt-sessions" className={inputCls} value={academicYear} onChange={e => setYear(e.target.value)} /><datalist id="tt-sessions">{meta.sessions.map(t => <option key={t} value={t} />)}</datalist></Label>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving && <Loader2 className="animate-spin" />} Create</Button></div>
            </DialogContent>
        </Dialog>
    );
}

export default function Timetable() {
    const [tab, setTab] = useState<Tab>('timetables');
    const [meta, setMeta] = useState<Meta | null>(null);
    const [docs, setDocs] = useState<DocSummary[]>([]);
    const [legacy, setLegacy] = useState(0);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [importing, setImporting] = useState(false);

    const loadMeta = useCallback(() => axios.get(`${TT_API}/meta`, withCreds).then(r => setMeta(r.data)), []);
    const loadDocs = useCallback(() => axios.get(`${TT_API}/docs`, withCreds).then(r => { setDocs(r.data.docs); setLegacy(r.data.legacyEntries); }), []);

    useEffect(() => {
        Promise.all([loadMeta(), loadDocs()]).catch(err => toast.error(apiError(err, 'Could not load timetables.'))).finally(() => setLoading(false));
    }, [loadMeta, loadDocs]);

    const remove = async (d: DocSummary) => {
        if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
        try { await axios.delete(`${TT_API}/docs/${d.id}`, withCreds); toast.success('Deleted.'); loadDocs(); }
        catch (err) { toast.error(apiError(err, 'Could not delete.')); }
    };

    const importLegacy = async () => {
        setImporting(true);
        try {
            const res = await axios.post(`${TT_API}/docs/import-legacy`, { name: 'Imported timetable' }, withCreds);
            toast.success(`Imported ${res.data.imported} lessons for ${res.data.classes} classes.`);
            await loadDocs(); setOpenId(res.data.doc.id);
        } catch (err) { toast.error(apiError(err, 'Could not import.')); }
        finally { setImporting(false); }
    };

    if (loading || !meta) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;

    if (openId) return <div className="mx-auto max-w-7xl p-4 md:p-6"><TimetableEditor docId={openId} meta={meta} onBack={() => { setOpenId(null); loadDocs(); }} onChanged={loadDocs} /></div>;

    // group by term + session so a school can manage each term separately
    const groups = new Map<string, DocSummary[]>();
    for (const d of docs) {
        const key = [d.term, d.academicYear].filter(Boolean).join(' · ') || 'No term set';
        groups.set(key, [...(groups.get(key) || []), d]);
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><CalendarDays className="h-6 w-6 text-[#1E4DA6]" /> Timetable</h1>
                    <p className="text-sm text-slate-500">Class lessons, exams and activities — by term and session.</p>
                </div>
                {tab === 'timetables' && <Button onClick={() => setCreating(true)}><Plus /> New timetable</Button>}
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)} className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-bold', tab === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500 hover:text-slate-700')}>{label}</button>
                ))}
            </div>

            {tab === 'timetables' && (
                <div className="space-y-6">
                    {legacy > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                            <p>You have {legacy} lessons from the old timetable. Bring them across to keep working with them here.</p>
                            <Button size="sm" disabled={importing} onClick={importLegacy}>{importing ? <Loader2 className="animate-spin" /> : <FileInput />} Import old timetable</Button>
                        </div>
                    )}
                    {docs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                            <p className="font-semibold text-slate-600">No timetables yet</p>
                            <p className="mt-1 text-sm text-slate-400">Set your school days and periods under Settings, then create one here.</p>
                        </div>
                    ) : [...groups.entries()].map(([label, list]) => (
                        <section key={label} className="space-y-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {list.map(d => (
                                    <div key={d.id} className="group flex items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1E4DA6]/40">
                                        <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(d.id)}>
                                            <p className="truncate font-bold text-slate-800">{d.name}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{[KIND_LABEL[d.kind], d.examType].filter(Boolean).join(' · ')} · {d.slotCount ?? 0} entries</p>
                                            <span className={cn('mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold', d.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{d.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span>
                                        </button>
                                        <button onClick={() => remove(d)} className="text-slate-300 hover:text-red-500" aria-label="Delete timetable"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {tab === 'settings' && <SettingsPanel meta={meta} reloadMeta={loadMeta} />}
            {tab === 'reminders' && <ReminderPanel isAdmin />}

            {creating && <CreateDialog meta={meta} onClose={() => setCreating(false)} onCreated={id => { setCreating(false); loadDocs(); setOpenId(id); }} />}
        </div>
    );
}
