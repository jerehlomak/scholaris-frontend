import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DIFFICULTIES, QTYPES, emptyQuestion, inputCls, type CbtMeta, type Question, type QType } from './api';
import { CbtEditor } from './CbtEditor';
import { ClassSubjectFields } from './ClassSubjectFields';

const LETTERS = 'ABCDEFGH';
const Label = ({ t, children, className }: { t: string; children: React.ReactNode; className?: string }) => (
    <label className={cn('block space-y-1', className)}><span className="text-xs font-semibold text-slate-600">{t}</span>{children}</label>
);
const hasContent = (html: string) => html.replace(/<[^>]+>/g, '').trim().length > 0 || /<img|data-type="math"/.test(html);

/**
 * Create or edit one question. `scope` decides which fields show: a bank question also carries subject, level, topic
 * and difficulty; a question inside an exam only its content and marks.
 */
export function QuestionEditor({ meta, initial, scope, defaults, onClose, onSave }: {
    meta: CbtMeta; initial?: Question; scope: 'bank' | 'exam'; defaults?: Partial<Question>; onClose: () => void; onSave: (q: Question) => Promise<void>;
}) {
    const [q, setQ] = useState<Question>(() => ({ ...emptyQuestion('MCQ'), subject: defaults?.subject || '', classLevel: defaults?.classLevel || '', topic: defaults?.topic || '', difficulty: 'MEDIUM', ...(initial || {}) }));
    const [saving, setSaving] = useState(false);
    const set = (p: Partial<Question>) => setQ(x => ({ ...x, ...p }));

    const changeType = (type: QType) => {
        const fresh = emptyQuestion(type);
        // keep what the teacher already typed where it still makes sense
        const keepOpts = (type === 'MCQ' || type === 'MULTI') && (q.type === 'MCQ' || q.type === 'MULTI') && q.options;
        set({ type, options: keepOpts ? q.options : fresh.options, answers: fresh.answers, marks: q.marks === emptyQuestion(q.type).marks ? fresh.marks : q.marks });
    };

    const setOpt = (i: number, patch: Partial<{ html: string; correct: boolean }>) => setQ(x => ({ ...x, options: (x.options || []).map((o, j) => (j === i ? { ...o, ...patch } : (patch.correct && x.type === 'MCQ' ? { ...o, correct: false } : o))) }));
    const answers: string[] = Array.isArray(q.answers) ? q.answers : [];

    const save = async () => {
        if (!hasContent(q.stem)) return toast.error('Write the question first.');
        if (scope === 'bank' && !String(q.subject || '').trim()) return toast.error('Choose a subject.');
        if (q.type === 'MCQ' || q.type === 'MULTI') {
            const filled = (q.options || []).filter(o => hasContent(o.html));
            if (filled.length < 2) return toast.error('Add at least two options.');
            if (!filled.some(o => o.correct)) return toast.error('Mark the correct answer.');
        }
        if (q.type === 'SHORT' && !answers.some(a => a.trim())) return toast.error('Give at least one accepted answer.');
        setSaving(true);
        try { await onSave({ ...q, answers: q.type === 'SHORT' ? answers.map(a => a.trim()).filter(Boolean) : q.answers }); }
        catch (err: any) { toast.error(err?.message || 'Could not save.'); setSaving(false); }
    };

    return (
        <Dialog open onOpenChange={o => !o && !saving && onClose()}>
            <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto">
                <DialogHeader><DialogTitle>{initial?.id ? 'Edit question' : 'New question'}</DialogTitle><DialogDescription>Use Σ for formulas and the picture button for diagrams.</DialogDescription></DialogHeader>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                        {QTYPES.map(t => <button key={t.value} type="button" title={t.hint} onClick={() => changeType(t.value)} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold', q.type === t.value ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300')}>{t.label}</button>)}
                    </div>

                    <Label t="Question"><CbtEditor value={q.stem} onChange={stem => set({ stem })} placeholder="Type the question here…" minHeight={110} /></Label>

                    {(q.type === 'MCQ' || q.type === 'MULTI') && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600">Options <span className="font-normal text-slate-400">({q.type === 'MCQ' ? 'tick the one correct answer' : 'tick every correct answer'})</span></p>
                            {(q.options || []).map((o, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <button type="button" onClick={() => setOpt(i, { correct: q.type === 'MCQ' ? true : !o.correct })} title="Correct answer"
                                        className={cn('mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold', o.correct ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-500')}>{LETTERS[i]}</button>
                                    <div className="min-w-0 flex-1"><CbtEditor mini value={o.html} onChange={html => setOpt(i, { html })} placeholder={`Option ${LETTERS[i]}`} /></div>
                                    {(q.options || []).length > 2 && <button type="button" className="mt-2 text-slate-400 hover:text-red-500" aria-label="Remove option" onClick={() => set({ options: (q.options || []).filter((_, j) => j !== i).map((x, j) => ({ ...x, id: LETTERS[j] })) })}><Trash2 className="h-4 w-4" /></button>}
                                </div>
                            ))}
                            {(q.options || []).length < 8 && <button type="button" className="flex items-center gap-1 text-xs font-bold text-[#1E4DA6]" onClick={() => set({ options: [...(q.options || []), { id: LETTERS[(q.options || []).length], html: '', correct: false }] })}><Plus className="h-3 w-3" /> Add option</button>}
                        </div>
                    )}

                    {q.type === 'TRUE_FALSE' && (
                        <div className="flex gap-3">{['True', 'False'].map((t, i) => (
                            <label key={t} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-bold', q.options?.[i]?.correct ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500')}>
                                <input type="radio" className="accent-emerald-600" checked={!!q.options?.[i]?.correct} onChange={() => set({ options: [{ id: 'A', html: '<p>True</p>', correct: i === 0 }, { id: 'B', html: '<p>False</p>', correct: i === 1 }] })} /> {t} is correct
                            </label>))}
                        </div>
                    )}

                    {q.type === 'SHORT' && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-600">Accepted answers <span className="font-normal text-slate-400">(capital letters and spaces are ignored; 4 and 4.0 match)</span></p>
                            {answers.map((a, i) => (
                                <div key={i} className="flex gap-2"><input className={inputCls} value={a} onChange={e => set({ answers: answers.map((x, j) => (j === i ? e.target.value : x)) })} placeholder="e.g. Abuja" />
                                    {answers.length > 1 && <button type="button" className="text-slate-400 hover:text-red-500" onClick={() => set({ answers: answers.filter((_, j) => j !== i) })} aria-label="Remove answer"><Trash2 className="h-4 w-4" /></button>}</div>
                            ))}
                            <button type="button" className="flex items-center gap-1 text-xs font-bold text-[#1E4DA6]" onClick={() => set({ answers: [...answers, ''] })}><Plus className="h-3 w-3" /> Add another accepted answer</button>
                        </div>
                    )}

                    {q.type === 'ESSAY' && (
                        <Label t="Marking guide (only teachers see this)"><CbtEditor mini value={q.answers?.guide || ''} onChange={guide => set({ answers: { guide } })} placeholder="Key points and how the marks are shared…" minHeight={70} /></Label>
                    )}

                    {q.type !== 'ESSAY' && <Label t="Explanation (optional, shown to students if answer review is on)"><CbtEditor mini value={q.explanation || ''} onChange={explanation => set({ explanation })} minHeight={44} /></Label>}

                    <div className="grid gap-3 sm:grid-cols-4">
                        <Label t="Marks"><input type="number" min={0.5} max={100} step={0.5} className={inputCls} value={q.marks} onChange={e => set({ marks: Number(e.target.value) })} /></Label>
                        {scope === 'bank' && (<>
                            <ClassSubjectFields meta={meta} classLevel={q.classLevel || ''} subject={q.subject || ''} onChange={p => set(p)} />
                            <Label t="Difficulty"><select className={inputCls} value={q.difficulty} onChange={e => set({ difficulty: e.target.value })}>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></Label>
                            <Label t="Topic" className="sm:col-span-4"><input className={inputCls} value={q.topic || ''} onChange={e => set({ topic: e.target.value })} placeholder="e.g. Linear equations" /></Label>
                        </>)}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-1"><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving && <Loader2 className="animate-spin" />} Save question</Button></div>
            </DialogContent>
        </Dialog>
    );
}
