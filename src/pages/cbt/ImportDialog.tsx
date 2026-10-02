import { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ClipboardPaste, Download, FileSpreadsheet, FileText, Loader2, Pencil, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CBT_API, DIFFICULTIES, QTYPES, apiError, download, inputCls, streamSse, typeLabel, type CbtMeta, type Question } from './api';
import { RichHtml } from './RichHtml';
import { QuestionEditor } from './QuestionEditor';
import { ClassSubjectFields } from './ClassSubjectFields';

type Tab = 'ai' | 'paste' | 'excel' | 'document';
const TABS: [Tab, string, typeof Sparkles][] = [['ai', 'AI generate', Sparkles], ['paste', 'Paste', ClipboardPaste], ['excel', 'Excel', FileSpreadsheet], ['document', 'Word / PDF', FileText]];
const Label = ({ t, children, className }: { t: string; children: React.ReactNode; className?: string }) => (
    <label className={cn('block space-y-1', className)}><span className="text-xs font-semibold text-slate-600">{t}</span>{children}</label>
);

function ReviewCard({ q, i, checked, onCheck, onEdit, onRemove, onMarks }: { q: Question; i: number; checked: boolean; onCheck: (v: boolean) => void; onEdit: () => void; onRemove: () => void; onMarks: (m: number) => void }) {
    return (
        <div className={cn('rounded-xl border p-3', checked ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50 opacity-60')}>
            <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1E4DA6]" checked={checked} onChange={e => onCheck(e.target.checked)} aria-label="Include this question" />
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-slate-500">{i + 1}.</span>
                        <span className="rounded-full bg-[#1E4DA6]/10 px-2 py-0.5 font-bold text-[#173F8C]">{typeLabel(q.type)}</span>
                        {q.topic && <span className="text-slate-400">{q.topic}</span>}
                        <label className="ml-auto flex items-center gap-1 text-slate-500">marks <input type="number" min={0.5} step={0.5} className="h-6 w-14 rounded border border-slate-200 px-1 text-xs" value={q.marks} onChange={e => onMarks(Number(e.target.value))} /></label>
                    </div>
                    <RichHtml html={q.stem} className="text-sm" />
                    {q.options && <ul className="mt-1.5 space-y-0.5 text-sm">{q.options.map(o => <li key={o.id} className={cn('flex gap-2', o.correct && 'font-semibold text-emerald-700')}><span>{o.id}.</span><RichHtml html={o.html} inline />{o.correct && <span>✓</span>}</li>)}</ul>}
                    {q.type === 'SHORT' && <p className="mt-1 text-sm font-semibold text-emerald-700">Answer: {(q.answers || []).join(' / ')}</p>}
                    {q.type === 'ESSAY' && q.answers?.guide && <div className="mt-1 text-xs text-slate-500">Guide: <RichHtml html={q.answers.guide} inline /></div>}
                    {q.warnings?.map((w, k) => <p key={k} className="mt-1 text-xs font-semibold text-amber-600">⚠ {w}</p>)}
                </div>
                <div className="flex shrink-0 gap-1"><button className="text-slate-400 hover:text-[#1E4DA6]" onClick={onEdit} aria-label="Edit"><Pencil className="h-4 w-4" /></button><button className="text-slate-400 hover:text-red-500" onClick={onRemove} aria-label="Remove"><Trash2 className="h-4 w-4" /></button></div>
            </div>
        </div>
    );
}

/** Brings questions in from AI, pasted text, Excel or a Word / PDF file. Everything is reviewed before anything is saved. */
export function ImportDialog({ meta, examId, defaultTab = 'paste', onClose, onDone }: { meta: CbtMeta; examId?: string; defaultTab?: Tab; onClose: () => void; onDone: () => void }) {
    const [tab, setTab] = useState<Tab>(defaultTab);
    const [items, setItems] = useState<(Question & { _on: boolean })[] | null>(null);
    const [note, setNote] = useState<string | null>(null);
    const [problems, setProblems] = useState<{ row: number; message: string }[]>([]);
    const [source, setSource] = useState<'AI' | 'IMPORT'>('IMPORT');
    const [busy, setBusy] = useState(false);
    const [chars, setChars] = useState(0);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [alsoAdd, setAlsoAdd] = useState(true);
    const abort = useRef<AbortController | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    // shared defaults applied to every question that does not carry its own
    const [d, setD] = useState({ subject: '', classLevel: '', topic: '', difficulty: 'MEDIUM' });
    const setDef = (p: Partial<typeof d>) => setD(x => ({ ...x, ...p }));
    // source options
    const [text, setText] = useState('');
    const [useAi, setUseAi] = useState(false);
    const [counts, setCounts] = useState<Record<string, number>>({ MCQ: 10, MULTI: 0, TRUE_FALSE: 0, SHORT: 0, ESSAY: 0 });
    const [gen, setGen] = useState({ curriculum: '', difficulty: 'MEDIUM', includeDiagrams: false, sourceText: '', instructions: '', language: 'English' });

    const finish = (questions: Question[], errors: any[], n: string | null, src: 'AI' | 'IMPORT') => {
        if (!questions.length) { toast.error(errors[0]?.message || 'No questions were found.'); return; }
        setItems(questions.map(q => ({ ...q, _on: true })));
        setProblems(errors); setNote(n); setSource(src);
    };

    const run = async (fn: (signal: AbortSignal) => Promise<any>, src: 'AI' | 'IMPORT') => {
        setBusy(true); setChars(0);
        abort.current = new AbortController();
        try { const r = await fn(abort.current.signal); finish(r.questions || [], r.errors || [], r.note || null, src); }
        catch (err: any) { if (err?.name !== 'AbortError') toast.error(err?.message || apiError(err, 'That did not work.')); }
        finally { setBusy(false); }
    };

    const doPaste = () => text.trim() ? run(s => streamSse(`${CBT_API}/questions/import/text`, { text, useAi, topic: d.topic, difficulty: d.difficulty }, setChars, s), useAi ? 'AI' : 'IMPORT') : toast.error('Paste some questions first.');
    const doFile = (kind: 'excel' | 'document') => {
        if (!file) return toast.error('Choose a file first.');
        const form = new FormData(); form.append('file', file); form.append('topic', d.topic); form.append('difficulty', d.difficulty);
        if (kind === 'document') form.append('useAi', String(useAi));
        return run(s => streamSse(`${CBT_API}/questions/import/${kind}`, form, setChars, s), kind === 'document' && useAi ? 'AI' : 'IMPORT');
    };
    const doAi = () => {
        const total = Object.values(counts).reduce((n, v) => n + (v || 0), 0);
        if (!total) return toast.error('Choose how many questions you want.');
        if (!d.subject.trim()) return toast.error('Choose a subject.');
        if (!d.topic.trim() && !gen.sourceText.trim() && !gen.instructions.trim()) return toast.error('Give a topic, some source material or instructions.');
        return run(s => streamSse(`${CBT_API}/questions/ai/generate`, { counts, subject: d.subject, classLevel: d.classLevel, topic: d.topic, ...gen }, setChars, s), 'AI');
    };

    const chosen = (items || []).filter(i => i._on);
    const save = async () => {
        if (!chosen.length) return toast.error('Tick at least one question.');
        if (!d.subject.trim()) return toast.error('Choose a subject so the questions can be filed in the bank.');
        setSaving(true);
        try {
            const res = await axios.post(`${CBT_API}/questions/bulk`, { questions: chosen.map(({ _on, warnings, ...q }) => q), defaults: { subject: d.subject, classLevel: d.classLevel, topic: d.topic, difficulty: d.difficulty }, source });
            let msg = res.data.msg;
            if (res.data.skipped) toast.warning(`${res.data.skipped} skipped: ${res.data.errors?.[0]?.message || ''}`);
            if (examId && alsoAdd && res.data.ids?.length) { const add = await axios.post(`${CBT_API}/exams/${examId}/questions`, { bankIds: res.data.ids }); msg += `. ${add.data.msg} to the exam`; }
            toast.success(msg); onDone();
        } catch (err) { toast.error(apiError(err, 'Could not save the questions.')); setSaving(false); }
    };

    return (
        <Dialog open onOpenChange={o => { if (!o && !saving && !busy) onClose(); }}>
            <DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto">
                <DialogHeader><DialogTitle>{items ? `Review ${items.length} question${items.length === 1 ? '' : 's'}` : 'Add questions'}</DialogTitle>
                    <DialogDescription>{items ? 'Check them, fix anything flagged, untick what you do not want, then save to your bank.' : 'Generate with AI, paste a list, or upload a file. You review everything before it is saved.'}</DialogDescription></DialogHeader>

                {busy ? (
                    <div className="space-y-3 py-12 text-center"><Loader2 className="mx-auto h-9 w-9 animate-spin text-[#1E4DA6]" /><p className="font-semibold text-slate-700">Working on it…</p>
                        {chars > 0 && <p className="text-xs text-slate-500">About {Math.round(chars / 6).toLocaleString()} words written so far</p>}
                        <Button variant="outline" onClick={() => abort.current?.abort()}><X /> Cancel</Button></div>
                ) : !items ? (
                    <div className="space-y-4">
                        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{TABS.map(([k, label, Icon]) => <button key={k} onClick={() => { setTab(k); setFile(null); }} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold', tab === k ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500')}><Icon className="h-3.5 w-3.5" /> {label}</button>)}</div>

                        <div className="grid gap-3 sm:grid-cols-4">
                            <ClassSubjectFields meta={meta} classLevel={d.classLevel} subject={d.subject} onChange={p => setDef(p)} />
                            <Label t="Topic"><input className={inputCls} value={d.topic} onChange={e => setDef({ topic: e.target.value })} /></Label>
                            <Label t="Difficulty"><select className={inputCls} value={d.difficulty} onChange={e => { setDef({ difficulty: e.target.value }); setGen(g => ({ ...g, difficulty: e.target.value })); }}>{DIFFICULTIES.map(x => <option key={x}>{x}</option>)}<option value="MIXED">MIXED (AI)</option></select></Label>
                        </div>

                        {tab === 'paste' && (<div className="space-y-3">
                            <textarea className={`${inputCls} !h-64 py-2 font-mono text-xs`} value={text} onChange={e => setText(e.target.value)} placeholder={'Paste many questions at once, for example:\n\n1. What is 2 + 2?\nA. 3\nB. 4\nC. 5\nAnswer: B\n\n2. The capital of Nigeria is ____.\nAnswer: Abuja\n\n3. Explain photosynthesis. [10 marks]'} />
                            <p className="text-xs text-slate-500">Numbered questions with A–D options and an “Answer:” line are split automatically. Put formulas between $ signs, e.g. $x^2 + 3x = 0$. Questions with no options become short-answer (if they have an answer) or essay.</p>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="accent-[#1E4DA6]" checked={useAi} disabled={!meta.ai.enabled} onChange={e => setUseAi(e.target.checked)} /> Use AI to read messy layouts {!meta.ai.enabled && <span className="text-xs text-slate-400">({meta.ai.reason})</span>}</label>
                            <Button onClick={doPaste}><ClipboardPaste /> Split into questions</Button></div>)}

                        {(tab === 'excel' || tab === 'document') && (<div className="space-y-3">
                            {tab === 'excel' && <button type="button" className="flex items-center gap-1.5 text-sm font-bold text-[#1E4DA6]" onClick={() => download('/questions/import/template', {}, 'cbt_question_template.xlsx').catch(e => toast.error(e.message))}><Download className="h-4 w-4" /> Download the Excel template</button>}
                            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-200 p-8 text-sm text-slate-500 hover:border-[#1E4DA6]/50">
                                <Upload className="h-6 w-6 text-[#1E4DA6]" />{file ? <span className="font-semibold text-slate-700">{file.name}</span> : tab === 'excel' ? 'Choose an Excel file (.xlsx)' : 'Choose a Word (.docx) or PDF file'}</button>
                            <input ref={fileRef} type="file" hidden accept={tab === 'excel' ? '.xlsx,.xls' : '.docx,.pdf'} onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
                            {tab === 'document' && <><p className="text-xs text-slate-500">Text is read from the file and split into questions. Pictures and diagrams inside the file are not imported; add them afterwards.</p>
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="accent-[#1E4DA6]" checked={useAi} disabled={!meta.ai.enabled} onChange={e => setUseAi(e.target.checked)} /> Use AI to read messy layouts {!meta.ai.enabled && <span className="text-xs text-slate-400">({meta.ai.reason})</span>}</label></>}
                            <Button disabled={!file} onClick={() => doFile(tab)}><Upload /> Read the file</Button></div>)}

                        {tab === 'ai' && (<div className="space-y-3">
                            {!meta.ai.enabled && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{meta.ai.reason}</p>}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{QTYPES.map(t => <Label key={t.value} t={t.label}><input type="number" min={0} max={40} className={inputCls} value={counts[t.value]} onChange={e => setCounts(c => ({ ...c, [t.value]: Number(e.target.value) }))} /></Label>)}</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Label t="Curriculum / exam body"><input list="id-curr" className={inputCls} value={gen.curriculum} onChange={e => setGen(g => ({ ...g, curriculum: e.target.value }))} placeholder="e.g. WAEC, NECO, British, Cambridge" /><datalist id="id-curr">{['WAEC', 'NECO', 'BECE', 'Common Entrance', 'Nigerian (NERDC)', 'British (National Curriculum)', 'Cambridge IGCSE', 'American (Common Core)', 'IB'].map(c => <option key={c} value={c} />)}</datalist></Label>
                                <Label t="Language"><input className={inputCls} value={gen.language} onChange={e => setGen(g => ({ ...g, language: e.target.value }))} /></Label>
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="accent-[#1E4DA6]" checked={gen.includeDiagrams} onChange={e => setGen(g => ({ ...g, includeDiagrams: e.target.checked }))} /> Include diagrams where a question needs one</label>
                            <Label t="Base the questions on this material (optional)"><textarea className={`${inputCls} !h-24 py-2`} value={gen.sourceText} onChange={e => setGen(g => ({ ...g, sourceText: e.target.value }))} placeholder="Paste a lesson note or passage and the questions will come from it" /></Label>
                            <Label t="Anything else? (optional)"><input className={inputCls} value={gen.instructions} onChange={e => setGen(g => ({ ...g, instructions: e.target.value }))} placeholder="e.g. Include calculation questions; use naira in examples" /></Label>
                            <div className="flex items-center gap-3"><Button disabled={!meta.ai.enabled} onClick={doAi}><Sparkles /> Generate</Button>{meta.ai.remaining !== null && <span className="text-xs text-slate-500">{meta.ai.remaining} AI requests left today</span>}</div></div>)}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {note && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">{note}</p>}
                        {problems.length > 0 && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><p className="font-bold">{problems.length} row{problems.length === 1 ? '' : 's'} could not be read:</p><ul className="ml-4 list-disc">{problems.slice(0, 6).map((p, i) => <li key={i}>{p.row ? `Row ${p.row}: ` : ''}{p.message}</li>)}</ul></div>}
                        {!d.subject.trim() && <Label t="Subject (needed to file these in the bank)"><input list="id-subjects2" className={inputCls} value={d.subject} onChange={e => setDef({ subject: e.target.value })} /><datalist id="id-subjects2">{meta.subjects.map(s => <option key={s} value={s} />)}</datalist></Label>}
                        <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                            {items.map((q, i) => <ReviewCard key={i} q={q} i={i} checked={q._on} onCheck={v => setItems(items.map((x, j) => (j === i ? { ...x, _on: v } : x)))} onEdit={() => setEditing(i)} onRemove={() => setItems(items.filter((_, j) => j !== i))} onMarks={m => setItems(items.map((x, j) => (j === i ? { ...x, marks: m } : x)))} />)}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-slate-700">{chosen.length} of {items.length} selected</p>
                                {examId && <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="accent-[#1E4DA6]" checked={alsoAdd} onChange={e => setAlsoAdd(e.target.checked)} /> Also add them to this exam</label>}
                            </div>
                            <div className="flex gap-2"><Button variant="outline" disabled={saving} onClick={() => setItems(null)}>Back</Button><Button disabled={saving || !chosen.length} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Plus />} Save {chosen.length} to the bank</Button></div>
                        </div>
                    </div>
                )}

                {editing !== null && items && <QuestionEditor meta={meta} scope="exam" initial={items[editing]} onClose={() => setEditing(null)} onSave={async (q) => { setItems(items.map((x, j) => (j === editing ? { ...q, warnings: [], _on: true } : x))); setEditing(null); }} />}
            </DialogContent>
        </Dialog>
    );
}
