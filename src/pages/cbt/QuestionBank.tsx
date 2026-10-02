import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Database, ImageIcon, Loader2, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { CBT_API, DIFFICULTIES, QTYPES, apiError, inputCls, typeLabel, type BankSummary, type CbtMeta, type Question } from './api';
import { QuestionEditor } from './QuestionEditor';
import { ImportDialog } from './ImportDialog';

const DIFF_CLS: Record<string, string> = { EASY: 'bg-emerald-100 text-emerald-700', MEDIUM: 'bg-amber-100 text-amber-700', HARD: 'bg-rose-100 text-rose-700' };

/**
 * The reusable question bank. With `onPick` it becomes a picker (used from the exam editor) where the
 * selected questions are handed back instead of managed.
 */
export function QuestionBank({ meta, onPick, pickLabel = 'Add to exam', defaultSubject, examId, onChanged }: {
    meta: CbtMeta; onPick?: (ids: string[]) => Promise<void> | void; pickLabel?: string; defaultSubject?: string; examId?: string; onChanged?: () => void;
}) {
    const [rows, setRows] = useState<BankSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sel, setSel] = useState<Set<string>>(new Set());
    const [f, setF] = useState({ q: '', subject: defaultSubject || '', type: '', difficulty: '', source: '', topic: '', ownerId: '' });
    const [editor, setEditor] = useState<null | { q?: Question }>(null);
    const [imp, setImp] = useState<null | 'ai' | 'paste' | 'excel' | 'document'>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
        return axios.get(`${CBT_API}/questions`, { params }).then(r => { setRows(r.data.questions); setTotal(r.data.total); })
            .catch(err => toast.error(apiError(err, 'Could not load the question bank.'))).finally(() => setLoading(false));
    }, [f]);
    useEffect(() => { const t = setTimeout(load, f.q || f.topic ? 250 : 0); return () => clearTimeout(t); }, [load, f.q, f.topic]);

    const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const edit = async (id: string) => {
        try { const r = await axios.get(`${CBT_API}/questions/${id}`); setEditor({ q: r.data.question }); }
        catch (err) { toast.error(apiError(err, 'Could not open the question.')); }
    };
    const saveQuestion = async (q: Question) => {
        const body = { ...q };
        const res = q.id ? await axios.patch(`${CBT_API}/questions/${q.id}`, body).catch(e => { throw new Error(apiError(e, 'Could not save.')); })
            : await axios.post(`${CBT_API}/questions`, body).catch(e => { throw new Error(apiError(e, 'Could not save.')); });
        toast.success(res.data.msg); setEditor(null); load(); onChanged?.();
    };
    const remove = async (ids: string[]) => {
        if (!window.confirm(`Delete ${ids.length} question${ids.length === 1 ? '' : 's'} from the bank? Exams that already use them keep their own copy.`)) return;
        try { const r = await axios.post(`${CBT_API}/questions/delete`, { ids }); toast.success(r.data.msg); setSel(new Set()); load(); onChanged?.(); }
        catch (err) { toast.error(apiError(err, 'Could not delete.')); }
    };
    const pick = async () => { setBusy(true); try { await onPick?.([...sel]); setSel(new Set()); } finally { setBusy(false); } };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Database className="h-4 w-4 text-[#1E4DA6]" /> {total} question{total === 1 ? '' : 's'} in the bank</p>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setEditor({})}><Plus /> New question</Button>
                    <Button size="sm" variant="outline" onClick={() => setImp('ai')}><Sparkles /> AI generate</Button>
                    <Button size="sm" variant="outline" onClick={() => setImp('paste')}><Upload /> Paste / import</Button>
                </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search question text…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /></div>
                <input list="qb-subjects" className={inputCls} placeholder="Subject" value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /><datalist id="qb-subjects">{meta.subjects.map(s => <option key={s} value={s} />)}</datalist>
                <select className={inputCls} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">All types</option>{QTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                <select className={inputCls} value={f.difficulty} onChange={e => setF({ ...f, difficulty: e.target.value })}><option value="">Any difficulty</option>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select>
                <select className={inputCls} value={f.source} onChange={e => setF({ ...f, source: e.target.value })}><option value="">All sources</option><option value="MANUAL">Typed</option><option value="AI">AI</option><option value="IMPORT">Imported</option></select>
                <input className={`${inputCls} sm:col-span-2`} placeholder="Topic contains…" value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} />
                {meta.isAdmin && !onPick && <select className={`${inputCls} sm:col-span-2`} value={f.ownerId} onChange={e => setF({ ...f, ownerId: e.target.value })}><option value="">All teachers</option>{meta.owners.map(o => <option key={o.ownerId} value={o.ownerId}>{o.ownerName}</option>)}</select>}
            </div>

            {sel.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#1E4DA6]/5 px-4 py-2 text-sm">
                    <span className="font-semibold text-[#173F8C]">{sel.size} selected</span>
                    {onPick && <Button size="sm" disabled={busy} onClick={pick}>{busy ? <Loader2 className="animate-spin" /> : <Plus />} {pickLabel}</Button>}
                    {!onPick && <Button size="sm" variant="outline" className="text-red-600" onClick={() => remove([...sel])}><Trash2 /> Delete</Button>}
                    <button className="text-xs font-semibold text-slate-500" onClick={() => setSel(new Set())}>Clear</button>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center"><p className="font-semibold text-slate-600">{Object.values(f).some(Boolean) ? 'No questions match these filters' : 'Your question bank is empty'}</p><p className="mt-1 text-sm text-slate-400">Add questions by typing, pasting a list, uploading Excel / Word / PDF, or with AI. They are saved here to reuse in any exam.</p></div>
            ) : (
                <ul className="space-y-1.5">
                    <li className="flex items-center gap-3 px-3 text-xs text-slate-400"><input type="checkbox" className="accent-[#1E4DA6]" checked={sel.size === rows.length} onChange={e => setSel(e.target.checked ? new Set(rows.map(r => r.id)) : new Set())} aria-label="Select all" /> Select all shown</li>
                    {rows.map(r => (
                        <li key={r.id} className={cn('flex items-start gap-3 rounded-xl border bg-white px-3 py-2.5 transition', sel.has(r.id) ? 'border-[#1E4DA6]' : 'border-slate-200 hover:border-slate-300')}>
                            <input type="checkbox" className="mt-1 accent-[#1E4DA6]" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label="Select question" />
                            <button className="min-w-0 flex-1 text-left" onClick={() => (onPick ? toggle(r.id) : edit(r.id))}>
                                <p className="line-clamp-2 text-sm text-slate-800">{r.hasMedia && <ImageIcon className="mr-1 inline h-3.5 w-3.5 text-slate-400" />}{r.preview || '(picture or formula only)'}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                    <span className="rounded-full bg-[#1E4DA6]/10 px-2 py-0.5 font-bold text-[#173F8C]">{typeLabel(r.type)}</span>
                                    <span className={cn('rounded-full px-2 py-0.5 font-bold', DIFF_CLS[r.difficulty])}>{r.difficulty}</span>
                                    <span>{r.subject}</span>{r.classLevel && <span>· {r.classLevel}</span>}{r.topic && <span>· {r.topic}</span>}<span>· {r.marks} mark{r.marks === 1 ? '' : 's'}</span>
                                    {r.source !== 'MANUAL' && <span className="font-semibold text-violet-600">· {r.source === 'AI' ? 'AI' : 'imported'}</span>}
                                    {meta.isAdmin && <span>· {r.ownerName}</span>}
                                </p>
                            </button>
                            {!onPick && <button className="mt-1 text-slate-300 hover:text-red-500" onClick={() => remove([r.id])} aria-label="Delete question"><Trash2 className="h-4 w-4" /></button>}
                        </li>
                    ))}
                </ul>
            )}

            {editor && <QuestionEditor meta={meta} scope="bank" initial={editor.q} defaults={{ subject: f.subject }} onClose={() => setEditor(null)} onSave={saveQuestion} />}
            {imp && <ImportDialog meta={meta} examId={examId} defaultTab={imp} onClose={() => setImp(null)} onDone={() => { setImp(null); load(); onChanged?.(); }} />}
        </div>
    );
}
