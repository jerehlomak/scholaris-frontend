import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Award, CalendarClock, CheckCircle2, ClipboardList, Clock, Loader2, Lock, PlayCircle, WifiOff } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { CBT_API, apiError, fmtDateTime } from '../api';
import { RichHtml } from '../RichHtml';
import { loadSaved } from './offlineStore';

interface ExamRow { id: string; title: string; subject: string; examType: string; label: string; durationMinutes: number; startAt: string | null; endAt: string | null; questionCount: number; state: string; canStart: boolean; attemptDeadline: string | null }
interface ResultRow { examId: string; title: string; subject: string; label: string; examType: string; submittedAt: string; score: number; max: number; percentage: number; grade: string; passed: boolean; markingStatus: string; allowReview: boolean }

const STATE: Record<string, { label: string; cls: string }> = {
    OPEN: { label: 'Open', cls: 'bg-emerald-100 text-emerald-700' }, IN_PROGRESS: { label: 'In progress', cls: 'bg-blue-100 text-blue-700' }, UPCOMING: { label: 'Upcoming', cls: 'bg-amber-100 text-amber-700' },
    SUBMITTED: { label: 'Submitted', cls: 'bg-slate-100 text-slate-600' }, LOCKED: { label: 'Locked', cls: 'bg-rose-100 text-rose-700' }, ENDED: { label: 'Closed', cls: 'bg-slate-100 text-slate-500' },
};

/** `reviewPath` says where a paper's answers come from (a student's own, or a child's for a parent). */
export function ResultCards({ results, reviewPath = (examId: string) => `${CBT_API}/my/results/${examId}` }: { results: ResultRow[]; reviewPath?: (examId: string) => string }) {
    const [open, setOpen] = useState<string | null>(null);
    const [review, setReview] = useState<any[] | null>(null);
    const load = async (examId: string) => {
        if (open === examId) { setOpen(null); return; }
        try { const r = await axios.get(reviewPath(examId)); setReview(r.data.review); setOpen(examId); } catch (err) { toast.error(apiError(err, 'Could not open the review.')); }
    };
    if (!results.length) return <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">No results to show yet. Your school releases results when they are ready.</p>;
    return (
        <div className="space-y-3">{results.map(r => (
            <div key={r.examId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="font-bold text-slate-800">{r.title}</p><p className="text-xs text-slate-500">{[r.subject, r.label].filter(Boolean).join(' · ')}</p></div>
                    <div className="flex items-center gap-4 text-right">
                        <div><p className="text-xl font-bold text-slate-800">{r.score}<span className="text-sm font-normal text-slate-400"> / {r.max}</span></p><p className="text-xs text-slate-500">{Math.round(r.percentage * 10) / 10}%</p></div>
                        <span className={cn('flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold', r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{r.grade}</span>
                    </div>
                </div>
                {r.markingStatus === 'PENDING' && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">Your essay answers are still being marked, so this score may go up.</p>}
                {!r.allowReview && <p className="mt-2 text-xs text-slate-400">Answer review has not been opened for this exam.</p>}
                {r.allowReview && <button className="mt-2 text-xs font-bold text-[#1E4DA6]" onClick={() => load(r.examId)}>{open === r.examId ? 'Hide' : 'Review'} my answers</button>}
                {open === r.examId && review && (
                    <ol className="mt-3 space-y-3 border-t border-slate-100 pt-3">{review.map((q: any) => (
                        <li key={q.number} className="text-sm"><div className="flex items-center justify-between"><span className="font-bold text-slate-500">Question {q.number}</span><span className={cn('text-xs font-bold', q.earned >= q.marks ? 'text-emerald-600' : q.earned > 0 ? 'text-amber-600' : 'text-rose-600')}>{q.earned ?? '-'} / {q.marks}</span></div>
                            <RichHtml html={q.stem} className="text-sm" />
                            {q.options && <ul className="mt-1 space-y-0.5">{q.options.map((o: any) => { const mine = (Array.isArray(q.yourAnswer) ? q.yourAnswer : [q.yourAnswer]).includes(o.id); return <li key={o.id} className={cn('flex gap-2 rounded px-2 py-0.5 text-xs', o.correct ? 'bg-emerald-50 text-emerald-800' : mine ? 'bg-rose-50 text-rose-800' : 'text-slate-500')}><span>{o.id}.</span><RichHtml html={o.html} inline />{mine && <b>(you)</b>}{o.correct && <b>✓</b>}</li>; })}</ul>}
                            {q.type === 'SHORT' && <p className="mt-1 text-xs">You wrote <b>{q.yourAnswer || '(blank)'}</b>. Accepted: {(q.answers || []).join(' / ')}</p>}
                            {q.type === 'ESSAY' && <div className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">{q.yourAnswer || '(no answer)'}{q.essay?.comment && <p className="mt-1 font-semibold text-[#173F8C]">Teacher: {q.essay.comment}</p>}</div>}
                            {q.explanation && <div className="mt-1 text-xs text-slate-500">Explanation: <RichHtml html={q.explanation} inline /></div>}</li>))}</ol>)}
            </div>))}</div>
    );
}

export default function StudentExams() {
    const nav = useNavigate();
    const [tab, setTab] = useState<'exams' | 'results'>('exams');
    const [exams, setExams] = useState<ExamRow[] | null>(null);
    const [results, setResults] = useState<ResultRow[] | null>(null);
    const [offlineSaved, setOfflineSaved] = useState<Record<string, boolean>>({});

    useEffect(() => {
        axios.get(`${CBT_API}/my/exams`).then(async r => {
            setExams(r.data.exams);
            const flags: Record<string, boolean> = {};
            for (const e of r.data.exams as ExamRow[]) { const s = await loadSaved(e.id); if (s?.pending) flags[e.id] = true; }
            setOfflineSaved(flags);
        }).catch(err => { toast.error(apiError(err, 'Could not load your exams.')); setExams([]); });
        axios.get(`${CBT_API}/my/results`).then(r => setResults(r.data.results)).catch(() => setResults([]));
    }, []);

    return (
        <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
            <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><ClipboardList className="h-6 w-6 text-[#1E4DA6]" /> CBT Exams</h1><p className="text-sm text-slate-500">Exams set for your class. Use one device only while you are writing.</p></div>
            <div className="flex gap-1 border-b border-slate-200">{([['exams', 'My exams'], ['results', 'Results']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-bold', tab === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500')}>{l}{k === 'results' && results?.length ? ` (${results.length})` : ''}</button>)}</div>

            {tab === 'exams' ? (!exams ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : exams.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">No exams for you right now.</p> : (
                <div className="space-y-3">{exams.map(e => { const st = STATE[e.state] || STATE.ENDED; return (
                    <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-slate-800">{e.title}</p><span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', st.cls)}>{st.label}</span></div>
                            <p className="mt-0.5 text-xs text-slate-500">{[e.subject, e.examType, e.label].filter(Boolean).join(' · ')}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {e.durationMinutes} min · {e.questionCount} questions</span>
                                {e.startAt && <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> opens {fmtDateTime(e.startAt)}</span>}{e.endAt && <span>start before {fmtDateTime(e.endAt)}</span>}</p>
                            {offlineSaved[e.id] && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600"><WifiOff className="h-3.5 w-3.5" /> Finished on this device and waiting to upload. Open it while online.</p>}</div>
                        <div>{e.canStart || offlineSaved[e.id] ? <Button onClick={() => nav(`/student/cbt/take/${e.id}`)}><PlayCircle /> {e.state === 'IN_PROGRESS' || offlineSaved[e.id] ? 'Continue' : 'Open'}</Button>
                            : e.state === 'SUBMITTED' ? <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Submitted</span>
                                : e.state === 'LOCKED' ? <Button variant="outline" onClick={() => nav(`/student/cbt/take/${e.id}`)}><Lock /> Locked</Button> : null}</div>
                    </div>); })}</div>
            )) : (!results ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : <ResultCards results={results} />)}
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><Award className="h-3.5 w-3.5" /> Results appear here only after your school releases them.</p>
        </div>
    );
}
