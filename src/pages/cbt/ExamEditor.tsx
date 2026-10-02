import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowDown, ArrowLeft, ArrowUp, BarChart3, Copy, Database, Download, FileText, Loader2, Lock, Pencil, Plus, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CBT_API, apiError, download, fmtDateTime, inputCls, subjectsForClasses, toLocalInput, typeLabel, type CbtMeta, type ExamSummary, type Question } from './api';
import { CbtEditor } from './CbtEditor';
import { QuestionEditor } from './QuestionEditor';
import { QuestionBank } from './QuestionBank';
import { ImportDialog } from './ImportDialog';
import { RichHtml } from './RichHtml';

type Tab = 'details' | 'instructions' | 'questions' | 'students';
interface FullQuestion extends Question { id: string; position: number }
interface Student { id: string; name: string; admissionNo: string | null; className: string; exempt: { id: string } | null; extra: { id: string; extraMinutes: number } | null; attempt: { status: string; deadlineAt: string } | null }

const Label = ({ t, children, className, hint }: { t: string; children: React.ReactNode; className?: string; hint?: string }) => (
    <label className={cn('block space-y-1', className)}><span className="text-xs font-semibold text-slate-600">{t}</span>{children}{hint && <span className="block text-[11px] text-slate-400">{hint}</span>}</label>
);

const STANDARD_INSTRUCTIONS = `<h3>Before you begin</h3><ul><li>Read every question carefully before you answer.</li><li>The timer starts as soon as you press <strong>Start</strong> and keeps running even if you lose your internet connection.</li><li>Your answers are saved automatically. Do <strong>not</strong> refresh or close this page while writing.</li><li>You cannot sign in to your account on another device while the exam is in progress. If you try, your exam will be locked.</li><li>Use the question numbers on the side to move around. Flag questions you want to return to.</li><li>Submit before the time runs out. When time is up, your exam is submitted for you.</li></ul><p>Good luck!</p>`;

export function ExamEditor({ examId, meta, onClose, onOpenResults }: { examId: string | null; meta: CbtMeta; onClose: () => void; onOpenResults: (id: string) => void }) {
    const [id, setId] = useState<string | null>(examId);
    const [exam, setExam] = useState<ExamSummary | null>(null);
    const [questions, setQuestions] = useState<FullQuestion[]>([]);
    const [hasAttempts, setHasAttempts] = useState(false);
    const [loading, setLoading] = useState(!!examId);
    const [tab, setTab] = useState<Tab>('details');
    const [saving, setSaving] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [form, setForm] = useState<any>(() => ({
        title: '', subject: '', classIds: [] as string[], examType: meta.settings.examTypes[0] || 'Exam', term: meta.currentTerm || '', academicYear: meta.currentYear || '', week: '',
        durationMinutes: meta.settings.defaultDuration, warnMinutes: meta.settings.defaultWarnMinutes, startAt: '', endAt: '', passMark: meta.settings.defaultPassMark,
        shuffleQuestions: meta.settings.defaultShuffleQuestions, shuffleOptions: meta.settings.defaultShuffleOptions, allowReview: false,
    }));
    const [picker, setPicker] = useState(false);
    const [newQ, setNewQ] = useState<null | { q?: FullQuestion }>(null);
    const [imp, setImp] = useState<null | 'ai' | 'paste'>(null);
    const [students, setStudents] = useState<Student[] | null>(null);
    const [busy, setBusy] = useState('');

    const load = useCallback(async (examId: string) => {
        try {
            const r = await axios.get(`${CBT_API}/exams/${examId}`);
            const e = r.data.exam;
            setExam(e); setQuestions(r.data.questions); setHasAttempts(r.data.hasAttempts); setInstructions(e.instructions || '');
            setForm({ title: e.title, subject: e.subject, classIds: e.classIds || [], examType: e.examType, term: e.term || '', academicYear: e.academicYear || '', week: e.week ? String(e.week) : '', durationMinutes: e.durationMinutes, warnMinutes: e.warnMinutes, startAt: toLocalInput(e.startAt), endAt: toLocalInput(e.endAt), passMark: e.passMark, shuffleQuestions: e.shuffleQuestions, shuffleOptions: e.shuffleOptions, allowReview: e.allowReview });
        } catch (err) { toast.error(apiError(err, 'Could not open the exam.')); onClose(); }
        finally { setLoading(false); }
    }, [onClose]);
    useEffect(() => { if (examId) load(examId); /* eslint-disable-next-line */ }, [examId]);

    const set = (p: any) => setForm((f: any) => ({ ...f, ...p }));
    const iso = (v: string) => (v ? new Date(v).toISOString() : null);
    const canTimer = meta.powers.teachersCanSetTimer;
    // subjects offered follow the classes ticked below; a stored value from before stays selectable
    const subjectOptions = (() => { const l = subjectsForClasses(meta, form.classIds); return form.subject && !l.includes(form.subject) ? [form.subject, ...l] : l; })();

    const saveDetails = async () => {
        if (!form.title.trim()) return toast.error('Give the exam a title.');
        if (!form.subject.trim()) return toast.error('Choose a subject.');
        if (!form.classIds.length) return toast.error('Choose at least one class.');
        setSaving(true);
        try {
            const body = { ...form, startAt: iso(form.startAt), endAt: iso(form.endAt), week: form.week || null };
            if (id) { await axios.patch(`${CBT_API}/exams/${id}`, body); toast.success('Saved'); await load(id); }
            else { const r = await axios.post(`${CBT_API}/exams`, body); toast.success(r.data.msg); setId(r.data.exam.id); await load(r.data.exam.id); setTab('questions'); }
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };

    const saveInstructions = async () => {
        if (!id) return;
        setSaving(true);
        try { await axios.patch(`${CBT_API}/exams/${id}`, { instructions }); toast.success('Instructions saved'); await load(id); }
        catch (err) { toast.error(apiError(err, 'Could not save.')); } finally { setSaving(false); }
    };

    const setStatus = async (status: 'PUBLISHED' | 'CLOSED' | 'DRAFT') => {
        if (!id) return;
        setBusy(status);
        try { const r = await axios.post(`${CBT_API}/exams/${id}/status`, { status }); toast.success(r.data.msg); await load(id); }
        catch (err) { toast.error(apiError(err, 'Could not change the status.')); } finally { setBusy(''); }
    };

    const duplicate = async () => {
        if (!id) return;
        const term = window.prompt('Copy into which term? (leave as is to keep the same)', exam?.term || '');
        if (term === null) return;
        try { const r = await axios.post(`${CBT_API}/exams/${id}/duplicate`, { term }); toast.success(r.data.msg); onClose(); }
        catch (err) { toast.error(apiError(err, 'Could not copy.')); }
    };
    const remove = async () => {
        if (!id || !window.confirm('Delete this exam? Students will no longer see it.')) return;
        try { await axios.delete(`${CBT_API}/exams/${id}`); toast.success('Exam deleted'); onClose(); }
        catch (err) { toast.error(apiError(err, 'Could not delete.')); }
    };
    const paper = async (format: 'pdf' | 'docx', key: boolean) => {
        if (!id) return;
        setBusy(`paper-${format}${key}`);
        try { await download(`/exams/${id}/paper`, { format, key: key ? '1' : '0' }, `exam.${format}`); } catch (err: any) { toast.error(err.message); } finally { setBusy(''); }
    };

    // ── questions ──
    const addFromBank = async (ids: string[]) => {
        if (!id) return;
        try { const r = await axios.post(`${CBT_API}/exams/${id}/questions`, { bankIds: ids }); toast.success(r.data.msg); setPicker(false); await load(id); }
        catch (err) { toast.error(apiError(err, 'Could not add the questions.')); }
    };
    const saveQuestion = async (q: Question) => {
        if (!id || !exam) return;
        try {
            if (q.id) await axios.patch(`${CBT_API}/exams/${id}/questions/${q.id}`, q);
            else {
                // new questions are kept in the bank too, so they can be reused
                const saved = await axios.post(`${CBT_API}/questions`, { ...q, subject: exam.subject });
                await axios.post(`${CBT_API}/exams/${id}/questions`, { bankIds: [saved.data.question.id] });
            }
            toast.success('Saved'); setNewQ(null); await load(id);
        } catch (err) { throw new Error(apiError(err, 'Could not save the question.')); }
    };
    const removeQuestion = async (qid: string) => {
        if (!id || !window.confirm('Remove this question from the exam? It stays in your question bank.')) return;
        try { await axios.delete(`${CBT_API}/exams/${id}/questions/${qid}`); await load(id); }
        catch (err) { toast.error(apiError(err, 'Could not remove it.')); }
    };
    const move = async (i: number, dir: -1 | 1) => {
        if (!id) return;
        const next = [...questions]; const j = i + dir;
        if (j < 0 || j >= next.length) return;
        [next[i], next[j]] = [next[j], next[i]];
        setQuestions(next);
        try { await axios.put(`${CBT_API}/exams/${id}/questions/order`, { ids: next.map(q => q.id) }); }
        catch (err) { toast.error(apiError(err, 'Could not reorder.')); await load(id); }
    };

    // ── students ──
    const loadStudents = useCallback(async () => {
        if (!id) return;
        try { const r = await axios.get(`${CBT_API}/exams/${id}/exceptions`); setStudents(r.data.students); }
        catch (err) { toast.error(apiError(err, 'Could not load students.')); }
    }, [id]);
    useEffect(() => { if (tab === 'students') loadStudents(); }, [tab, loadStudents]);

    const grant = async (s: Student, kind: 'EXEMPT' | 'EXTRA_TIME', minutes?: number) => {
        try { const r = await axios.post(`${CBT_API}/exams/${id}/exceptions`, { studentProfileId: s.id, kind, extraMinutes: minutes }); toast.success(r.data.msg); loadStudents(); }
        catch (err) { toast.error(apiError(err, 'Could not save.')); }
    };
    const revoke = async (exId: string) => {
        try { await axios.delete(`${CBT_API}/exams/${id}/exceptions/${exId}`); loadStudents(); }
        catch (err) { toast.error(apiError(err, 'Could not remove.')); }
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const locked = hasAttempts;
    const TABS: [Tab, string][] = [['details', 'Details'], ['instructions', 'Instructions'], ['questions', `Questions${questions.length ? ` (${questions.length})` : ''}`], ['students', 'Students']];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <button onClick={onClose} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> All exams</button>
                    <h2 className="text-xl font-bold text-slate-800">{exam ? exam.title : 'New exam'}</h2>
                    {exam && <p className="text-xs text-slate-500">{[exam.subject, exam.examType, exam.label].filter(Boolean).join(' · ')} · {exam.totalMarks} marks
                        <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold', exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : exam.status === 'CLOSED' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700')}>{exam.status === 'PUBLISHED' ? 'Published' : exam.status === 'CLOSED' ? 'Closed' : 'Draft'}</span></p>}
                </div>
                {exam && (
                    <div className="flex flex-wrap gap-2">
                        {exam.status !== 'PUBLISHED' ? <Button size="sm" disabled={!!busy} onClick={() => setStatus('PUBLISHED')}>{busy === 'PUBLISHED' && <Loader2 className="animate-spin" />} {exam.status === 'CLOSED' ? 'Reopen' : 'Publish'}</Button>
                            : <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setStatus('CLOSED')}>Close exam</Button>}
                        <Button size="sm" variant="outline" onClick={() => onOpenResults(exam.id)}><BarChart3 /> Results</Button>
                        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => paper('pdf', false)}><Download /> Paper PDF</Button>
                        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => paper('docx', false)}><FileText /> Word</Button>
                        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => paper('pdf', true)} title="Question paper with the correct answers marked">Answer key</Button>
                        <Button size="sm" variant="ghost" onClick={duplicate} title="Copy as a new draft"><Copy /></Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={remove}><Trash2 /></Button>
                    </div>
                )}
            </div>

            {locked && <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800"><Lock className="h-4 w-4" /> Students have started this exam, so the questions are locked. You can still change instructions, dates and settings. To change questions, copy the exam.</p>}

            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map(([k, label]) => <button key={k} disabled={!id && k !== 'details'} onClick={() => setTab(k)} className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-bold disabled:opacity-40', tab === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500 hover:text-slate-700')}>{label}</button>)}
            </div>

            {tab === 'details' && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Label t="Exam title" className="sm:col-span-2"><input className={inputCls} value={form.title} onChange={e => set({ title: e.target.value })} maxLength={200} placeholder="e.g. First Term Mathematics Examination" /></Label>
                        <Label t="Type"><input list="ee-types" className={inputCls} value={form.examType} onChange={e => set({ examType: e.target.value })} /><datalist id="ee-types">{meta.settings.examTypes.map(t => <option key={t} value={t} />)}</datalist></Label>
                        <Label t="Subject"><select className={inputCls} value={form.subject} onChange={e => set({ subject: e.target.value })}><option value="">{subjectOptions.length ? 'Choose a subject…' : 'No subjects assigned'}</option>{subjectOptions.map(n => <option key={n} value={n}>{n}</option>)}</select></Label>
                        <Label t="Term"><input list="ee-terms" className={inputCls} value={form.term} onChange={e => set({ term: e.target.value })} /><datalist id="ee-terms">{meta.terms.map(t => <option key={t} value={t} />)}</datalist></Label>
                        <Label t="Session"><input list="ee-sessions" className={inputCls} value={form.academicYear} onChange={e => set({ academicYear: e.target.value })} /><datalist id="ee-sessions">{meta.sessions.map(t => <option key={t} value={t} />)}</datalist></Label>
                    </div>
                    <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-600">Classes taking this exam {!meta.isAdmin && <span className="font-normal text-slate-400">(classes you teach)</span>}</p>
                        <div className="grid max-h-40 gap-1 overflow-auto rounded-lg border border-slate-200 p-2.5 sm:grid-cols-3">
                            {meta.classes.map(c => <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="accent-[#1E4DA6]" checked={form.classIds.includes(c.id)} onChange={e => set({ classIds: e.target.checked ? [...form.classIds, c.id] : form.classIds.filter((x: string) => x !== c.id) })} /> {c.name}</label>)}
                            {!meta.classes.length && <p className="text-xs text-slate-400">No classes available.</p>}
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                        <Label t="Time allowed (minutes)" hint={canTimer ? undefined : 'Set by your administrator'}><input type="number" min={5} max={600} disabled={!canTimer} className={inputCls} value={form.durationMinutes} onChange={e => set({ durationMinutes: Number(e.target.value) })} /></Label>
                        <Label t="Warn when minutes left" hint={canTimer ? undefined : 'Set by your administrator'}><input type="number" min={1} max={60} disabled={!canTimer} className={inputCls} value={form.warnMinutes} onChange={e => set({ warnMinutes: Number(e.target.value) })} /></Label>
                        <Label t="Pass mark (%)"><input type="number" min={0} max={100} className={inputCls} value={form.passMark} onChange={e => set({ passMark: Number(e.target.value) })} /></Label>
                        <Label t="Week"><select className={inputCls} value={form.week} onChange={e => set({ week: e.target.value })}><option value="">—</option>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}</select></Label>
                        <Label t="Opens at" className="sm:col-span-2"><input type="datetime-local" className={inputCls} value={form.startAt} onChange={e => set({ startAt: e.target.value })} /></Label>
                        <Label t="Last time students can start" className="sm:col-span-2" hint="Each student still gets the full time once they start."><input type="datetime-local" className={inputCls} value={form.endAt} onChange={e => set({ endAt: e.target.value })} /></Label>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                        {([['shuffleQuestions', 'Shuffle the order of questions'], ['shuffleOptions', 'Shuffle the order of options'], ['allowReview', 'Let students review their answers once results are released']] as const).map(([k, l]) => <label key={k} className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="accent-[#1E4DA6]" checked={form[k]} onChange={e => set({ [k]: e.target.checked })} /> {l}</label>)}
                    </div>
                    <Button onClick={saveDetails} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} {id ? 'Save changes' : 'Create exam'}</Button>
                </div>
            )}

            {tab === 'instructions' && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-600">Students read this before they can start. Type anything: rules, materials allowed, how marks are given.</p>
                        <Button size="sm" variant="outline" onClick={() => setInstructions(instructions ? `${instructions}${STANDARD_INSTRUCTIONS}` : STANDARD_INSTRUCTIONS)}>Insert standard instructions</Button></div>
                    <CbtEditor value={instructions} onChange={setInstructions} minHeight={260} placeholder="Type the instructions students must read before starting…" />
                    <Button onClick={saveInstructions} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save instructions</Button>
                </div>
            )}

            {tab === 'questions' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-600">{questions.length} question{questions.length === 1 ? '' : 's'} · {exam?.totalMarks ?? 0} marks</p>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" disabled={locked} onClick={() => setPicker(true)}><Database /> From question bank</Button>
                            <Button size="sm" variant="outline" disabled={locked} onClick={() => setNewQ({})}><Plus /> New question</Button>
                            <Button size="sm" variant="outline" disabled={locked} onClick={() => setImp('ai')}><Sparkles /> AI generate</Button>
                            <Button size="sm" variant="outline" disabled={locked} onClick={() => setImp('paste')}><Upload /> Paste / import</Button>
                        </div>
                    </div>
                    {questions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No questions yet. Add some from your bank, type them, paste a list, import a file or generate them with AI.</div> : (
                        <ol className="space-y-2">
                            {questions.map((q, i) => (
                                <li key={q.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E4DA6]/10 text-xs font-bold text-[#173F8C]">{i + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-1 flex flex-wrap items-center gap-2 text-[11px]"><span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{typeLabel(q.type)}</span><span className="text-slate-400">{q.marks} mark{q.marks === 1 ? '' : 's'}</span></p>
                                        <div className="max-h-28 overflow-hidden text-sm"><RichHtml html={q.stem} /></div>
                                        {q.options && <ul className="mt-1 space-y-0.5 text-xs">{q.options.map(o => <li key={o.id} className={cn('flex gap-1.5', o.correct ? 'font-semibold text-emerald-700' : 'text-slate-600')}><span>{o.id}.</span><RichHtml html={o.html} inline />{o.correct && <span>✓</span>}</li>)}</ul>}
                                        {q.type === 'SHORT' && <p className="mt-1 text-xs font-semibold text-emerald-700">Answer: {(q.answers || []).join(' / ')}</p>}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-0.5">
                                        <button disabled={locked || i === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                                        <button disabled={locked || i === questions.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                                        <button disabled={locked} className="p-1 text-slate-400 hover:text-[#1E4DA6] disabled:opacity-30" onClick={() => setNewQ({ q })} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                                        <button disabled={locked} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30" onClick={() => removeQuestion(q.id)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}

            {tab === 'students' && (
                <div className="space-y-3">
                    <p className="text-sm text-slate-600">Give a student extra time (for example, after a lost connection or for special needs) or exempt them from this exam. Extra time reaches a student who is already writing straight away.</p>
                    {!students ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1E4DA6]" /> : students.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">No students in the selected classes.</p> : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                            <table className="w-full min-w-[640px] text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2.5 text-left">Student</th><th className="p-2.5 text-left">Class</th><th className="p-2.5 text-left">Status</th><th className="p-2.5 text-left">Extra time</th><th className="p-2.5 text-left">Exempt</th></tr></thead>
                                <tbody>{students.map(s => <StudentRow key={s.id} s={s} powers={meta.powers} onExtra={m => grant(s, 'EXTRA_TIME', m)} onExempt={() => grant(s, 'EXEMPT')} onRevoke={revoke} />)}</tbody></table>
                        </div>
                    )}
                </div>
            )}

            {picker && (
                <Dialog open onOpenChange={o => !o && setPicker(false)}>
                    <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
                        <DialogHeader><DialogTitle>Choose from your question bank</DialogTitle><DialogDescription>Tick the questions to add. The exam gets its own copy, so later edits to the bank never change a live exam.</DialogDescription></DialogHeader>
                        <QuestionBank meta={meta} onPick={addFromBank} pickLabel="Add to this exam" defaultSubject={exam?.subject} examId={id || undefined} />
                    </DialogContent>
                </Dialog>
            )}
            {newQ && <QuestionEditor meta={meta} scope="exam" initial={newQ.q} onClose={() => setNewQ(null)} onSave={saveQuestion} />}
            {imp && <ImportDialog meta={meta} examId={id || undefined} defaultTab={imp} onClose={() => setImp(null)} onDone={() => { setImp(null); if (id) load(id); }} />}
        </div>
    );
}

function StudentRow({ s, powers, onExtra, onExempt, onRevoke }: { s: Student; powers: Record<string, boolean>; onExtra: (m: number) => void; onExempt: () => void; onRevoke: (id: string) => void }) {
    const [mins, setMins] = useState(s.extra?.extraMinutes || 10);
    const st = s.exempt ? 'Exempt' : s.attempt ? { IN_PROGRESS: 'Writing now', SUBMITTED: 'Submitted', LOCKED: 'Locked' }[s.attempt.status] || s.attempt.status : 'Not started';
    return (
        <tr className="border-t border-slate-100">
            <td className="p-2.5"><p className="font-semibold text-slate-800">{s.name}</p><p className="text-xs text-slate-400">{s.admissionNo}</p></td>
            <td className="p-2.5 text-slate-600">{s.className}</td>
            <td className="p-2.5 text-xs font-semibold text-slate-600">{st}{s.attempt?.status === 'IN_PROGRESS' && <span className="block font-normal text-slate-400">ends {fmtDateTime(s.attempt.deadlineAt)}</span>}</td>
            <td className="p-2.5"><div className="flex items-center gap-1.5">
                <input type="number" min={1} max={600} disabled={!powers.teachersCanAddTime || !!s.exempt} className="h-8 w-16 rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-50" value={mins} onChange={e => setMins(Number(e.target.value))} /><span className="text-xs text-slate-400">min</span>
                <Button size="sm" variant="outline" disabled={!powers.teachersCanAddTime || !!s.exempt} onClick={() => onExtra(mins)}>{s.extra ? 'Update' : 'Give'}</Button>
                {s.extra && powers.teachersCanAddTime && <button className="text-slate-400 hover:text-red-500" onClick={() => onRevoke(s.extra!.id)} aria-label="Remove extra time"><Trash2 className="h-4 w-4" /></button>}</div></td>
            <td className="p-2.5">{s.exempt ? <Button size="sm" variant="ghost" disabled={!powers.teachersCanExempt} onClick={() => onRevoke(s.exempt!.id)}>Undo</Button> : <Button size="sm" variant="outline" disabled={!powers.teachersCanExempt || (!!s.attempt && s.attempt.status !== 'LOCKED')} onClick={onExempt}>Exempt</Button>}</td>
        </tr>
    );
}
