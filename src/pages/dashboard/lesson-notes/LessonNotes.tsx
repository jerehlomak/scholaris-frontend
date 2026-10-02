import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BookOpenText, Download, FileText, FileUp, Loader2, Plus, Search, Share2, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { KINDS, LD_API, apiError, downloadDoc, emptyMeta, fmtBytes, inputCls, kindLabel, type DocSummary, type Kind, type Meta } from './api';
import { GenerateDialog } from './GenerateDialog';
import { UploadDialog } from './UploadDialog';
import { ShareDialog } from './ShareDialog';
import { DocEditor, type Seed } from './DocEditor';
import { SettingsPanel } from './SettingsPanel';

const SOURCE: Record<string, { label: string; cls: string }> = {
    AI: { label: 'AI', cls: 'bg-violet-100 text-violet-700' },
    MANUAL: { label: 'Typed', cls: 'bg-slate-100 text-slate-600' },
    UPLOAD: { label: 'Uploaded', cls: 'bg-amber-100 text-amber-700' },
};

type View = { name: 'library' } | { name: 'settings' } | { name: 'editor'; docId?: string; seed?: Seed };

/** Lesson notes, schemes of work and curricula. Teachers see their own library; admins see everyone's. */
export default function LessonNotes() {
    const [meta, setMeta] = useState<Meta | null>(null);
    const [docs, setDocs] = useState<DocSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>({ name: 'library' });
    const [dialog, setDialog] = useState<null | { type: 'generate'; kind: Kind } | { type: 'upload' } | { type: 'share'; doc: DocSummary }>(null);
    const [f, setF] = useState({ q: '', kind: '', term: '', academicYear: '', week: '', source: '', ownerId: '' });
    const [busyId, setBusyId] = useState('');

    const loadMeta = useCallback(() => axios.get(`${LD_API}/meta`).then(r => setMeta(r.data)), []);
    const loadDocs = useCallback(() => {
        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
        return axios.get(LD_API, { params }).then(r => setDocs(r.data.docs));
    }, [f]);

    useEffect(() => { loadMeta().catch(err => toast.error(apiError(err, 'Could not load this page.'))); }, [loadMeta]);
    useEffect(() => {
        const t = setTimeout(() => { loadDocs().catch(err => toast.error(apiError(err, 'Could not load documents.'))).finally(() => setLoading(false)); }, f.q ? 250 : 0);
        return () => clearTimeout(t);
    }, [loadDocs, f.q]);

    const refresh = () => { loadDocs(); loadMeta(); };

    const remove = async (d: DocSummary) => {
        if (!window.confirm(`Delete “${d.title}”? This cannot be undone.`)) return;
        try { await axios.delete(`${LD_API}/${d.id}`); toast.success('Deleted.'); refresh(); }
        catch (err) { toast.error(apiError(err, 'Could not delete.')); }
    };
    const download = async (d: DocSummary, format: 'pdf' | 'docx' | 'original') => {
        setBusyId(d.id + format);
        try { await downloadDoc(d.id, format); } catch (err: any) { toast.error(err.message); } finally { setBusyId(''); }
    };

    const terms = useMemo(() => [...new Set([...(meta?.terms || []), ...docs.map(d => d.term).filter(Boolean) as string[]])], [meta, docs]);
    const years = useMemo(() => [...new Set([...(meta?.sessions || []), ...docs.map(d => d.academicYear).filter(Boolean) as string[]])], [meta, docs]);

    if (!meta) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;

    if (view.name === 'editor') {
        return <div className="mx-auto max-w-6xl p-4 md:p-6"><DocEditor meta={meta} docId={view.docId} seed={view.seed} onClose={() => { setView({ name: 'library' }); refresh(); }} onSaved={refresh} /></div>;
    }

    const st = meta.storage;
    const pct = Math.min(100, Math.round((st.usedBytes / st.limitBytes) * 100));
    const canUpload = meta.isAdmin || meta.settings.allowTeacherUploads;

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><BookOpenText className="h-6 w-6 text-[#1E4DA6]" /> Lesson Notes &amp; Curriculum</h1>
                    <p className="text-sm text-slate-500">{meta.isAdmin ? 'Create documents and see everything your teachers have saved.' : 'Your lesson notes, schemes of work and curricula.'}</p>
                </div>
                {view.name === 'library' && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setDialog({ type: 'generate', kind: 'LESSON_NOTE' })}><Sparkles /> Generate with AI</Button>
                        <Button variant="outline" onClick={() => setView({ name: 'editor', seed: { html: '', meta: emptyMeta(meta), source: 'MANUAL' } })}><Plus /> Write manually</Button>
                        {canUpload && <Button variant="outline" onClick={() => setDialog({ type: 'upload' })}><FileUp /> Upload file</Button>}
                    </div>
                )}
            </div>

            {meta.isAdmin && (
                <div className="flex gap-1 border-b border-slate-200">
                    {([['library', 'Library'], ['settings', 'Settings']] as const).map(([k, label]) => (
                        <button key={k} onClick={() => setView(k === 'library' ? { name: 'library' } : { name: 'settings' })} className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-bold', view.name === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500 hover:text-slate-700')}>{label}</button>
                    ))}
                </div>
            )}

            {view.name === 'settings' ? <SettingsPanel meta={meta} onSaved={loadMeta} /> : (
                <>
                    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="relative lg:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search title, subject, topic…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /></div>
                        <select className={inputCls} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="">All types</option>{KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
                        <select className={inputCls} value={f.academicYear} onChange={e => setF({ ...f, academicYear: e.target.value })}><option value="">All sessions</option>{years.map(y => <option key={y}>{y}</option>)}</select>
                        <select className={inputCls} value={f.term} onChange={e => setF({ ...f, term: e.target.value })}><option value="">All terms</option>{terms.map(t => <option key={t}>{t}</option>)}</select>
                        <select className={inputCls} value={f.week} onChange={e => setF({ ...f, week: e.target.value })}><option value="">Any week</option>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}</select>
                        <select className={inputCls} value={f.source} onChange={e => setF({ ...f, source: e.target.value })}><option value="">All sources</option><option value="AI">AI generated</option><option value="MANUAL">Typed</option><option value="UPLOAD">Uploaded</option></select>
                        {meta.isAdmin && <select className={`${inputCls} lg:col-span-2`} value={f.ownerId} onChange={e => setF({ ...f, ownerId: e.target.value })}><option value="">All teachers</option>{meta.owners.map(o => <option key={o.ownerId} value={o.ownerId}>{o.ownerName}</option>)}</select>}
                    </div>

                    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : docs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                            <p className="font-semibold text-slate-600">{Object.values(f).some(Boolean) ? 'No documents match these filters' : 'Nothing saved yet'}</p>
                            <p className="mt-1 text-sm text-slate-400">Generate a lesson note with AI, write one yourself, or upload one you already have.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {docs.map(d => {
                                const src = SOURCE[d.source];
                                const isUp = d.source === 'UPLOAD';
                                return (
                                    <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#1E4DA6]/40">
                                        <button onClick={() => setView({ name: 'editor', docId: d.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4DA6]/10 text-[#1E4DA6]"><FileText className="h-5 w-5" /></span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-bold text-slate-800">{d.title}</span>
                                                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                                    <span className={cn('rounded-full px-2 py-0.5 font-bold', src.cls)}>{src.label}</span>
                                                    <span>{kindLabel(d.kind)}</span>
                                                    {d.subject && <span>· {d.subject}</span>}{d.classLevel && <span>· {d.classLevel}</span>}
                                                    {d.weekLabel && <span className="rounded-full bg-[#1E4DA6]/10 px-2 py-0.5 font-bold text-[#173F8C]">{d.weekLabel}</span>}
                                                    {meta.isAdmin && <span>· {d.ownerName}</span>}
                                                    {isUp && <span>· {fmtBytes(d.fileSize)}</span>}
                                                    {d.sharing && <span className="font-semibold text-emerald-600">· shared</span>}
                                                </span>
                                            </span>
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {isUp
                                                ? <Button variant="ghost" size="sm" disabled={!!busyId} onClick={() => download(d, 'original')}>{busyId === d.id + 'original' ? <Loader2 className="animate-spin" /> : <Download />} {d.fileMime === 'application/pdf' ? 'PDF' : 'Word'}</Button>
                                                : (<>
                                                    <Button variant="ghost" size="sm" disabled={!!busyId} onClick={() => download(d, 'pdf')}>{busyId === d.id + 'pdf' ? <Loader2 className="animate-spin" /> : <Download />} PDF</Button>
                                                    <Button variant="ghost" size="sm" disabled={!!busyId} onClick={() => download(d, 'docx')}>{busyId === d.id + 'docx' ? <Loader2 className="animate-spin" /> : <Download />} Word</Button>
                                                </>)}
                                            <Button variant="ghost" size="icon" title="Share" onClick={() => setDialog({ type: 'share', doc: d })}><Share2 /></Button>
                                            <Button variant="ghost" size="icon" title="Delete" className="text-slate-400 hover:text-red-600" onClick={() => remove(d)}><Trash2 /></Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <div className="mb-1 flex justify-between text-xs text-slate-500"><span>School storage used by lesson documents</span><span className="font-semibold">{fmtBytes(st.usedBytes)} of {st.limitMB} MB</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={cn('h-full rounded-full', pct > 90 ? 'bg-red-500' : 'bg-[#1E4DA6]')} style={{ width: `${Math.max(pct, st.usedBytes > 0 ? 1 : 0)}%` }} /></div>
                    </div>
                </>
            )}

            {dialog?.type === 'generate' && <GenerateDialog meta={meta} initialKind={dialog.kind} onClose={() => setDialog(null)} onGenerated={(html, m) => { setDialog(null); setView({ name: 'editor', seed: { html, meta: m, source: 'AI' } }); }} />}
            {dialog?.type === 'upload' && <UploadDialog meta={meta} onClose={() => setDialog(null)} onUploaded={() => { setDialog(null); refresh(); }} />}
            {dialog?.type === 'share' && <ShareDialog doc={dialog.doc} emailEnabled={meta.settings.allowEmailShare} onClose={() => setDialog(null)} onChanged={refresh} />}
        </div>
    );
}
