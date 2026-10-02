import { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { LD_API, apiError, emptyMeta, fmtBytes, inputCls, kindLabel, KINDS, type DocMeta, type Meta } from './api';

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Store a lesson note made elsewhere (PDF / Word) in the library. Counts against the school's storage allowance. */
export function UploadDialog({ meta, onClose, onUploaded }: { meta: Meta; onClose: () => void; onUploaded: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [m, setM] = useState<DocMeta>(emptyMeta(meta));
    const [busy, setBusy] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    const set = (p: Partial<DocMeta>) => setM(x => ({ ...x, ...p }));
    const max = meta.settings.maxUploadMB;
    const free = meta.storage.freeBytes;

    const pick = (f: File | undefined) => {
        if (!f) return;
        if (!/\.(pdf|docx?)$/i.test(f.name)) return toast.error('Choose a PDF or Word (.doc, .docx) file.');
        if (f.size > max * 1024 * 1024) return toast.error(`"${f.name}" is ${fmtBytes(f.size)}. The limit is ${max} MB.`);
        if (f.size > free) return toast.error(`Not enough storage. Your school has ${fmtBytes(free)} free.`);
        setFile(f);
        if (!m.title) set({ title: f.name.replace(/\.[^.]+$/, '') });
    };

    const save = async () => {
        if (!file) return toast.error('Choose a file first.');
        if (!m.title.trim()) return toast.error('Give the document a title.');
        const form = new FormData();
        form.append('file', file);
        (Object.entries(m) as [string, string][]).forEach(([k, v]) => { if (v) form.append(k, v); });
        setBusy(true);
        try { const r = await axios.post(`${LD_API}/upload`, form); toast.success(r.data.msg); onUploaded(); }
        catch (err) { toast.error(apiError(err, 'Could not upload the file.')); setBusy(false); }
    };

    return (
        <Dialog open onOpenChange={o => !o && !busy && onClose()}>
            <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
                <DialogHeader><DialogTitle>Upload a document</DialogTitle><DialogDescription>Keep a lesson note you made elsewhere. PDF or Word, up to {max} MB.</DialogDescription></DialogHeader>
                <div className="space-y-3">
                    <button type="button" onClick={() => ref.current?.click()} className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-200 p-6 text-sm text-slate-500 hover:border-[#1E4DA6]/50">
                        <FileUp className="h-6 w-6 text-[#1E4DA6]" />
                        {file ? <span className="font-semibold text-slate-700">{file.name} · {fmtBytes(file.size)}</span> : 'Choose a PDF or Word file'}
                    </button>
                    <input ref={ref} type="file" accept={ACCEPT} hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />

                    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Title</span><input className={inputCls} value={m.title} onChange={e => set({ title: e.target.value })} maxLength={200} /></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Type</span>
                            <select className={inputCls} value={m.kind} onChange={e => set({ kind: e.target.value as any })}>{KINDS.map(k => <option key={k.value} value={k.value}>{kindLabel(k.value)}</option>)}</select></label>
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Subject</span><input list="up-subjects" className={inputCls} value={m.subject} onChange={e => set({ subject: e.target.value })} /><datalist id="up-subjects">{meta.subjects.map(x => <option key={x} value={x} />)}</datalist></label>
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Class / level</span><input list="up-classes" className={inputCls} value={m.classLevel} onChange={e => set({ classLevel: e.target.value })} /><datalist id="up-classes">{meta.classes.map(x => <option key={x} value={x} />)}</datalist></label>
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Week</span>
                            <select className={inputCls} value={m.week} onChange={e => set({ week: e.target.value })}><option value="">—</option>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}</select></label>
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Term</span><input list="up-terms" className={inputCls} value={m.term} onChange={e => set({ term: e.target.value })} /><datalist id="up-terms">{meta.terms.map(x => <option key={x} value={x} />)}</datalist></label>
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Session</span><input list="up-sessions" className={inputCls} value={m.academicYear} onChange={e => set({ academicYear: e.target.value })} /><datalist id="up-sessions">{meta.sessions.map(x => <option key={x} value={x} />)}</datalist></label>
                    </div>
                    <p className="text-xs text-slate-400">School storage free: {fmtBytes(free)} of {meta.storage.limitMB} MB.</p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
                    <Button disabled={busy || !file} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : <FileUp />} Save to library</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
