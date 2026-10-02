import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Save, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { CBT_API, apiError, inputCls, typeLabel, type CbtMeta, type Option } from './api';
import { RichHtml } from './RichHtml';

interface RQ { id: string; number: number; type: string; stem: string; marks: number; options: Option[] | null; answers: any; explanation: string | null; answer: any; earned: number | null; essay?: { score: number; comment: string } | null }
interface Detail {
    attempt: { id: string; status: string; startedAt: string; submittedAt: string | null; objectiveScore: number; essayScore: number; totalScore: number; maxScore: number; percentage: number; markingStatus: string; lockReason: string | null; flags: { late: boolean; offline: boolean; auto: boolean; tabSwitches: number } };
    student: { name: string; admissionNo: string | null }; exam: { id: string; title: string }; questions: RQ[];
}

/** One student's paper: what they answered, the key, and the boxes where the teacher gives marks for essays. */
export function AttemptReview({ attemptId, meta, onBack, siblings, onNavigate }: { attemptId: string; meta: CbtMeta; onBack: () => void; siblings: string[]; onNavigate: (id: string) => void }) {
    const [d, setD] = useState<Detail | null>(null);
    const [marks, setMarks] = useState<Record<string, { score: string; comment: string }>>({});
    const [saving, setSaving] = useState(false);
    const [suggesting, setSuggesting] = useState('');

    useEffect(() => {
        setD(null);
        axios.get(`${CBT_API}/attempts/${attemptId}`).then(r => {
            const det: Detail = r.data; setD(det);
            setMarks(Object.fromEntries(det.questions.filter(q => q.type === 'ESSAY').map(q => [q.id, { score: q.essay ? String(q.essay.score) : '', comment: q.essay?.comment || '' }])));
        }).catch(err => { toast.error(apiError(err, 'Could not open this paper.')); onBack(); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId]);

    if (!d) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const idx = siblings.indexOf(attemptId);
    const essays = d.questions.filter(q => q.type === 'ESSAY');
    const setM = (id: string, p: Partial<{ score: string; comment: string }>) => setMarks(m => ({ ...m, [id]: { ...m[id], ...p } }));

    const save = async () => {
        for (const q of essays) { const s = marks[q.id]?.score; if (s !== '' && s !== undefined && (Number(s) > q.marks || Number(s) < 0)) return toast.error(`Question ${q.number}: marks must be between 0 and ${q.marks}.`); }
        setSaving(true);
        try {
            const body = Object.fromEntries(essays.map(q => [q.id, { score: marks[q.id]?.score === '' ? null : Number(marks[q.id]?.score), comment: marks[q.id]?.comment || '' }]));
            const r = await axios.put(`${CBT_API}/attempts/${attemptId}/essay`, { marks: body });
            toast.success(`Saved. ${r.data.totalScore} marks (${Math.round(r.data.percentage)}%)`);
            const fresh = await axios.get(`${CBT_API}/attempts/${attemptId}`); setD(fresh.data);
        } catch (err) { toast.error(apiError(err, 'Could not save the marks.')); } finally { setSaving(false); }
    };
    const suggest = async (q: RQ) => {
        setSuggesting(q.id);
        try { const r = await axios.post(`${CBT_API}/attempts/${attemptId}/essay/${q.id}/suggest`); setM(q.id, { score: String(r.data.score), comment: r.data.feedback }); toast.success('AI suggestion filled in. Check it, then Save.'); }
        catch (err) { toast.error(apiError(err, 'The AI could not suggest a mark.')); } finally { setSuggesting(''); }
    };

    const a = d.attempt;
    const picked = (q: RQ): string[] => (Array.isArray(q.answer) ? q.answer : q.answer ? [String(q.answer)] : []);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><button onClick={onBack} className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> Results</button>
                    <h2 className="text-xl font-bold text-slate-800">{d.student.name} <span className="text-sm font-normal text-slate-400">{d.student.admissionNo}</span></h2><p className="text-xs text-slate-500">{d.exam.title}</p></div>
                <div className="flex items-center gap-2">
                    {siblings.length > 1 && <><Button variant="outline" size="sm" disabled={idx <= 0} onClick={() => onNavigate(siblings[idx - 1])}><ChevronLeft /> Previous</Button><span className="text-xs text-slate-400">{idx + 1}/{siblings.length}</span><Button variant="outline" size="sm" disabled={idx < 0 || idx >= siblings.length - 1} onClick={() => onNavigate(siblings[idx + 1])}>Next <ChevronRight /></Button></>}
                    {essays.length > 0 && <Button size="sm" disabled={saving || a.status !== 'SUBMITTED'} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save marks</Button>}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
                {[['Total', `${a.totalScore} / ${a.maxScore}`], ['Percentage', `${Math.round(a.percentage)}%`], ['Objective', String(a.objectiveScore)], ['Essay', essays.length ? String(a.essayScore) : '—']].map(([l, v]) => <div key={l} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{l}</p><p className="text-lg font-bold text-slate-800">{v}</p></div>)}
            </div>
            {(a.flags.late || a.flags.offline || a.flags.auto || a.flags.tabSwitches > 0 || a.status === 'LOCKED') && <p className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800"><AlertTriangle className="h-4 w-4" />
                {a.status === 'LOCKED' && <span className="font-bold">Exam locked ({a.lockReason === 'LOGIN_ELSEWHERE' ? 'account used on another device' : a.lockReason === 'DEVICE_MISMATCH' ? 'opened on a second device' : a.lockReason}).</span>}
                {a.flags.offline && <span>Written partly offline.</span>}{a.flags.auto && <span>Submitted automatically when time ran out.</span>}{a.flags.late && <span>Reached the server after the deadline.</span>}{a.flags.tabSwitches > 0 && <span>Left the exam tab {a.flags.tabSwitches} time{a.flags.tabSwitches === 1 ? '' : 's'}.</span>}</p>}

            <ol className="space-y-3">
                {d.questions.map(q => (
                    <li key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E4DA6]/10 font-bold text-[#173F8C]">{q.number}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{typeLabel(q.type)}</span>
                            <span className={cn('ml-auto font-bold', q.earned === null ? 'text-amber-600' : q.earned >= q.marks ? 'text-emerald-600' : q.earned > 0 ? 'text-amber-600' : 'text-rose-600')}>{q.earned === null ? 'Needs marking' : `${q.earned} / ${q.marks}`}</span></div>
                        <RichHtml html={q.stem} className="text-sm" />
                        {q.options && <ul className="mt-2 space-y-1">{q.options.map(o => { const chose = picked(q).includes(o.id); return (
                            <li key={o.id} className={cn('flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-sm', o.correct ? 'border-emerald-300 bg-emerald-50' : chose ? 'border-rose-300 bg-rose-50' : 'border-slate-100')}>
                                <span className="font-bold text-slate-500">{o.id}.</span><RichHtml html={o.html} inline className="flex-1" />
                                {chose && <span className="shrink-0 text-xs font-bold text-slate-500">student</span>}{o.correct ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : chose ? <X className="h-4 w-4 shrink-0 text-rose-500" /> : null}</li>); })}</ul>}
                        {q.type === 'SHORT' && <p className="mt-2 text-sm"><span className="text-slate-500">Student wrote:</span> <strong>{q.answer || '(blank)'}</strong> <span className="ml-2 text-xs text-emerald-700">Accepted: {(q.answers || []).join(' / ')}</span></p>}
                        {q.type === 'ESSAY' && (
                            <div className="mt-2 space-y-3">
                                <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{q.answer ? String(q.answer) : <span className="text-slate-400">(no answer)</span>}</div>
                                {q.answers?.guide && <details className="text-xs text-slate-500"><summary className="cursor-pointer font-semibold">Marking guide</summary><RichHtml html={q.answers.guide} className="mt-1" /></details>}
                                <div className="flex flex-wrap items-start gap-3">
                                    <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Marks (out of {q.marks})</span><input type="number" min={0} max={q.marks} step={0.5} className={`${inputCls} !w-28`} value={marks[q.id]?.score ?? ''} onChange={e => setM(q.id, { score: e.target.value })} disabled={a.status !== 'SUBMITTED'} /></label>
                                    <label className="min-w-[220px] flex-1 space-y-1"><span className="block text-xs font-semibold text-slate-600">Comment (optional)</span><input className={inputCls} value={marks[q.id]?.comment ?? ''} onChange={e => setM(q.id, { comment: e.target.value })} disabled={a.status !== 'SUBMITTED'} /></label>
                                    {meta.ai.enabled && q.answer && <Button size="sm" variant="outline" className="mt-5" disabled={!!suggesting || a.status !== 'SUBMITTED'} onClick={() => suggest(q)}>{suggesting === q.id ? <Loader2 className="animate-spin" /> : <Sparkles />} AI suggestion</Button>}
                                </div>
                            </div>
                        )}
                        {q.explanation && <div className="mt-2 text-xs text-slate-500">Explanation: <RichHtml html={q.explanation} inline /></div>}
                    </li>
                ))}
            </ol>
        </div>
    );
}
