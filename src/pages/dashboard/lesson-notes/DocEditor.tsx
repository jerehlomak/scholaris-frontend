import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileText, Loader2, Save, Share2, Sparkles, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { KINDS, LD_API, apiError, downloadDoc, downloadDraft, emptyMeta, fmtBytes, formatLabel, inputCls, kindLabel, streamAi, type DocFull, type DocMeta, type DocSummary, type Meta, type Source } from './api';
import { RichEditor, type EditorHandle } from './RichEditor';
import { ShareDialog } from './ShareDialog';

export interface Seed { html: string; meta: DocMeta; source: Source }

const Field = ({ t, children, className }: { t: string; children: React.ReactNode; className?: string }) => (
    <label className={cn('block space-y-1', className)}><span className="text-[11px] font-semibold text-slate-500">{t}</span>{children}</label>
);

const toMeta = (d: DocSummary): DocMeta => ({
    title: d.title, kind: d.kind, subject: d.subject || '', classLevel: d.classLevel || '', topic: d.topic || '', curriculum: d.curriculum || '',
    term: d.term || '', academicYear: d.academicYear || '', week: d.week ? String(d.week) : '',
});

/** Opens an existing document (id) or a new one (seed: blank, or fresh from AI). */
export function DocEditor({ meta, docId, seed, onClose, onSaved }: { meta: Meta; docId?: string; seed?: Seed; onClose: () => void; onSaved: () => void }) {
    const [id, setId] = useState<string | undefined>(docId);
    const [doc, setDoc] = useState<DocFull | null>(null);
    const [m, setM] = useState<DocMeta>(seed?.meta || emptyMeta(meta));
    const [html, setHtml] = useState(seed?.html || '');
    const [source, setSource] = useState<Source>(seed?.source || 'MANUAL');
    const [loading, setLoading] = useState(!!docId);
    const [dirty, setDirty] = useState(!!seed?.html);
    const [saving, setSaving] = useState(false);
    const [busy, setBusy] = useState('');
    const [showShare, setShowShare] = useState(false);
    const [showRevise, setShowRevise] = useState(false);
    const handle = useRef<EditorHandle | null>(null);
    const htmlRef = useRef(html);
    const [editorKey, setEditorKey] = useState(0);

    useEffect(() => {
        if (!docId) return;
        axios.get(`${LD_API}/${docId}`)
            .then(r => { const d: DocFull = r.data.doc; setDoc(d); setM(toMeta(d)); setHtml(d.content); htmlRef.current = d.content; setSource(d.source); setEditorKey(k => k + 1); })
            .catch(err => { toast.error(apiError(err, 'Could not open the document.')); onClose(); })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId]);

    const isUpload = source === 'UPLOAD';
    const set = (p: Partial<DocMeta>) => { setM(x => ({ ...x, ...p })); setDirty(true); };
    const onEdit = useCallback((h: string) => { htmlRef.current = h; setHtml(h); setDirty(true); }, []);

    const save = async (silent = false): Promise<string | undefined> => {
        if (!m.title.trim()) { toast.error('Give the document a title before saving.'); return; }
        setSaving(true);
        try {
            const body = { ...m, ...(isUpload ? {} : { content: htmlRef.current }), source };
            const res = id ? await axios.patch(`${LD_API}/${id}`, body) : await axios.post(`${LD_API}`, body);
            setId(res.data.doc.id); setDoc(res.data.doc); setDirty(false);
            if (!silent) toast.success(res.data.msg || 'Saved');
            onSaved();
            return res.data.doc.id as string;
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };

    const close = () => { if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return; onClose(); };

    const download = async (format: 'pdf' | 'docx' | 'original') => {
        setBusy(format);
        try {
            if (id && !dirty) await downloadDoc(id, format);
            else if (!isUpload && format !== 'original') await downloadDraft(format, htmlRef.current, m); // unsaved edits are included
            else if (id) await downloadDoc(id, format);
        } catch (err: any) { toast.error(err.message); }
        finally { setBusy(''); }
    };

    const share = async () => {
        const savedId = id && !dirty ? id : await save(true);
        if (savedId) setShowShare(true);
    };

    const uploadFmt = doc?.fileMime === 'application/pdf' ? 'PDF' : 'Word';

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button onClick={close} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> Library</button>
                <div className="flex flex-wrap items-center gap-2">
                    {dirty && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
                    {!isUpload && meta.ai.enabled && html.trim() && <Button variant="outline" size="sm" onClick={() => setShowRevise(true)}><Sparkles /> Improve with AI</Button>}
                    {isUpload
                        ? <Button variant="outline" size="sm" disabled={!!busy} onClick={() => download('original')}>{busy ? <Loader2 className="animate-spin" /> : <Download />} Download {uploadFmt}</Button>
                        : (<>
                            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => download('pdf')}>{busy === 'pdf' ? <Loader2 className="animate-spin" /> : <Download />} PDF</Button>
                            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => download('docx')}>{busy === 'docx' ? <Loader2 className="animate-spin" /> : <FileText />} Word</Button>
                        </>)}
                    <Button variant="outline" size="sm" onClick={share}><Share2 /> Share</Button>
                    <Button size="sm" disabled={saving || (!dirty && !!id)} onClick={() => save()}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
                </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-6">
                <Field t="Title" className="sm:col-span-4"><input className={inputCls} value={m.title} onChange={e => set({ title: e.target.value })} maxLength={200} placeholder="Document title" /></Field>
                <Field t="Type" className="sm:col-span-2"><select className={inputCls} value={m.kind} onChange={e => set({ kind: e.target.value as any })}>{KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}</select></Field>
                <Field t="Subject" className="sm:col-span-2"><input list="de-subjects" className={inputCls} value={m.subject} onChange={e => set({ subject: e.target.value })} /><datalist id="de-subjects">{meta.subjects.map(x => <option key={x} value={x} />)}</datalist></Field>
                <Field t="Class / level" className="sm:col-span-2"><input list="de-classes" className={inputCls} value={m.classLevel} onChange={e => set({ classLevel: e.target.value })} /><datalist id="de-classes">{meta.classes.map(x => <option key={x} value={x} />)}</datalist></Field>
                <Field t="Curriculum" className="sm:col-span-2"><input list="de-curricula" className={inputCls} value={m.curriculum} onChange={e => set({ curriculum: e.target.value })} /><datalist id="de-curricula">{meta.settings.curricula.map(x => <option key={x} value={x} />)}</datalist></Field>
                <Field t="Week" className="sm:col-span-1"><select className={inputCls} value={m.week} onChange={e => set({ week: e.target.value })}><option value="">—</option>{Array.from({ length: 52 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}</select></Field>
                <Field t="Term" className="sm:col-span-2"><input list="de-terms" className={inputCls} value={m.term} onChange={e => set({ term: e.target.value })} /><datalist id="de-terms">{meta.terms.map(x => <option key={x} value={x} />)}</datalist></Field>
                <Field t="Session" className="sm:col-span-2"><input list="de-sessions" className={inputCls} value={m.academicYear} onChange={e => set({ academicYear: e.target.value })} /><datalist id="de-sessions">{meta.sessions.map(x => <option key={x} value={x} />)}</datalist></Field>
                <div className="flex items-end sm:col-span-1">
                    {formatLabel(m) && <span className="w-full truncate rounded-lg bg-[#1E4DA6]/10 px-2.5 py-2 text-center text-xs font-bold text-[#173F8C]" title={formatLabel(m)}>{formatLabel(m)}</span>}
                </div>
            </div>

            {isUpload ? (
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6">
                    <FileText className="h-10 w-10 text-[#1E4DA6]" />
                    <div className="text-sm">
                        <p className="font-bold text-slate-800">{doc?.fileName}</p>
                        <p className="text-xs text-slate-500">{kindLabel(m.kind)} · {fmtBytes(doc?.fileSize || 0)} · uploaded file</p>
                        <p className="mt-1 text-xs text-slate-400">Uploaded files are stored as they are. To change the content, download it, edit it, and upload the new version.</p>
                    </div>
                </div>
            ) : (
                <RichEditor key={editorKey} initialHtml={html} onChange={onEdit} handleRef={handle} />
            )}

            {showShare && id && doc && <ShareDialog doc={{ ...doc, title: m.title, weekLabel: formatLabel(m) }} emailEnabled={meta.settings.allowEmailShare} onClose={() => setShowShare(false)} onChanged={onSaved} />}
            {showRevise && <ReviseDialog html={htmlRef.current} onClose={() => setShowRevise(false)} onRevised={(h) => { handle.current?.setHtml(h); setShowRevise(false); toast.success('Updated. Review the changes, then save.'); }} />}
        </div>
    );
}

function ReviseDialog({ html, onClose, onRevised }: { html: string; onClose: () => void; onRevised: (html: string) => void }) {
    const [instruction, setInstruction] = useState('');
    const [busy, setBusy] = useState(false);
    const abort = useRef<AbortController | null>(null);
    const ideas = ['Make it simpler for younger learners', 'Add a diagram', 'Add more practice questions', 'Shorten it to one page', 'Add a group activity'];

    const go = async () => {
        if (!instruction.trim()) return toast.error('Tell the AI what to change.');
        setBusy(true);
        abort.current = new AbortController();
        try { const r = await streamAi(`${LD_API}/revise`, { html, instruction }, () => { }, abort.current.signal); onRevised(r.html); }
        catch (err: any) { if (err?.name !== 'AbortError') toast.error(err?.message || 'The AI could not complete this request.'); setBusy(false); }
    };

    return (
        <Dialog open onOpenChange={o => { if (!o && !busy) onClose(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#1E4DA6]" /> Improve with AI</DialogTitle><DialogDescription>Say what to change. Everything else stays as it is. Your current version is replaced in the editor, so use Undo if you do not like it.</DialogDescription></DialogHeader>
                {busy ? (
                    <div className="space-y-3 py-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1E4DA6]" /><p className="text-sm font-semibold text-slate-700">Updating your document…</p><Button variant="outline" onClick={() => { abort.current?.abort(); setBusy(false); }}><X /> Cancel</Button></div>
                ) : (
                    <div className="space-y-3">
                        <textarea className={`${inputCls} !h-24 py-2`} value={instruction} onChange={e => setInstruction(e.target.value)} maxLength={1500} placeholder="e.g. Add a labelled diagram of the water cycle after the introduction" autoFocus />
                        <div className="flex flex-wrap gap-1.5">{ideas.map(i => <button key={i} type="button" onClick={() => setInstruction(i)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-[#1E4DA6]/40">{i}</button>)}</div>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={go}><Sparkles /> Apply</Button></div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
