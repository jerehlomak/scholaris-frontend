import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, Loader2, Lock, Send, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { CBT_API, apiError } from '../api';
import { RichHtml } from '../RichHtml';
import { clearSaved, deviceId, loadSaved, putSaved, type SavedAttempt } from './offlineStore';

type Phase = 'loading' | 'info' | 'running' | 'submitting' | 'submitted' | 'locked' | 'ended' | 'offline-start';
interface Opt { id: string; html: string }
interface Q { id: string; number: number; type: 'MCQ' | 'MULTI' | 'TRUE_FALSE' | 'SHORT' | 'ESSAY'; stem: string; marks: number; options: Opt[] }
interface Info { exam: { id: string; title: string; subject: string; label: string; instructions: string; durationMinutes: number; warnMinutes: number; totalMarks: number; questionCount: number; startAt: string | null; endAt: string | null; offline: boolean; status: string }; window: string; attempt: { status: string; deadlineAt: string; lockReason: string | null } | null; serverNow: string }

const hhmmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`; };
const isAnswered = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : false);
const isNetworkError = (err: any) => !err?.response;

export default function ExamRunner() {
    const { id: examId = '' } = useParams();
    const nav = useNavigate();
    const [phase, setPhase] = useState<Phase>('loading');
    const [info, setInfo] = useState<Info | null>(null);
    const [msg, setMsg] = useState('');
    const [agree, setAgree] = useState(false);
    const [starting, setStarting] = useState(false);
    const [questions, setQuestions] = useState<Q[]>([]);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [flagged, setFlagged] = useState<string[]>([]);
    const [cur, setCur] = useState(0);
    const [now, setNow] = useState(Date.now());
    const [online, setOnline] = useState(navigator.onLine);
    const [syncState, setSyncState] = useState<'saved' | 'syncing' | 'device'>('saved');
    const [confirm, setConfirm] = useState(false);
    const [warnShown, setWarnShown] = useState(false);
    const [showWarnModal, setShowWarnModal] = useState(false);
    const [pending, setPending] = useState(false);

    // everything the timer and sync loops need lives in refs so they never use stale values
    const S = useRef<SavedAttempt | null>(null);
    const clock = useRef({ server: Date.now(), perf: performance.now() }); // monotonic: immune to the student changing the device clock
    const dirty = useRef(false);
    const busySync = useRef(false);
    const submitting = useRef(false);
    const offlineSince = useRef<number | null>(navigator.onLine ? null : Date.now());
    const serverNow = () => clock.current.server + (performance.now() - clock.current.perf);
    const setClock = (serverMs: number) => { clock.current = { server: serverMs, perf: performance.now() }; };

    const persist = useCallback(() => {
        if (!S.current) return;
        S.current = { ...S.current, answers: answersRef.current, flagged: flaggedRef.current, clock: { server: serverNow(), wall: Date.now() } };
        putSaved(S.current);
    }, []);
    const answersRef = useRef(answers); answersRef.current = answers;
    const flaggedRef = useRef(flagged); flaggedRef.current = flagged;

    // ── load ──
    useEffect(() => {
        let dead = false;
        (async () => {
            const saved = await loadSaved(examId);
            if (saved?.pending) { // finished earlier but never reached the server
                S.current = saved; setAnswers(saved.answers); setQuestions(saved.questions); setPending(true); setPhase('submitting'); return;
            }
            try {
                const r = await axios.get(`${CBT_API}/my/exams/${examId}/info`);
                if (dead) return;
                setInfo(r.data); setClock(Date.parse(r.data.serverNow));
                setPhase(r.data.attempt?.status === 'LOCKED' ? 'locked' : r.data.attempt?.status === 'SUBMITTED' ? 'submitted' : 'info');
                if (r.data.attempt?.status === 'LOCKED') setMsg('This exam has been locked for security. Please see your school administrator to unlock it.');
            } catch (err: any) {
                if (dead) return;
                if (isNetworkError(err) && saved && saved.attemptId) { // opened offline in the middle of an exam: carry on from the device copy
                    S.current = saved; resumeFrom(saved); return;
                }
                setMsg(isNetworkError(err) ? 'You need an internet connection to start this exam.' : apiError(err, 'Could not open this exam.'));
                setPhase(isNetworkError(err) ? 'offline-start' : 'ended');
            }
        })();
        return () => { dead = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    const resumeFrom = (saved: SavedAttempt) => {
        // continue the clock from where this device last knew it, using the wall clock only when the page was reloaded
        setClock(saved.clock.server + Math.max(0, Date.now() - saved.clock.wall));
        setQuestions(saved.questions); setAnswers(saved.answers || {}); setFlagged(saved.flagged || []);
        setInfo({ exam: saved.exam, window: 'OPEN', attempt: { status: 'IN_PROGRESS', deadlineAt: new Date(saved.deadlineAt).toISOString(), lockReason: null }, serverNow: '' } as Info);
        setPhase('running');
    };

    // ── start / resume (needs the server once) ──
    const start = async () => {
        setStarting(true);
        try {
            const r = await axios.post(`${CBT_API}/my/exams/${examId}/start`, { deviceId: deviceId() });
            const d = r.data;
            const local = await loadSaved(examId);
            const sameAttempt = local && local.attemptId === d.attempt.id;
            const merged = { ...(d.attempt.answers || {}), ...(sameAttempt ? local!.answers : {}) };
            setClock(Date.parse(d.serverNow));
            S.current = {
                examId, attemptId: d.attempt.id, deviceId: deviceId(), exam: d.exam, questions: d.questions, deadlineAt: Date.parse(d.attempt.deadlineAt), answers: merged,
                flagged: sameAttempt ? local!.flagged : (d.attempt.flagged || []), events: sameAttempt ? local!.events : { tabSwitches: 0, offlineSeconds: 0 },
                clock: { server: Date.parse(d.serverNow), wall: Date.now() }, everOffline: sameAttempt ? local!.everOffline : false, pending: null, savedAt: Date.now(),
            };
            await putSaved(S.current);
            setQuestions(d.questions); setAnswers(merged); setFlagged(S.current.flagged); setInfo(i => (i ? { ...i, exam: { ...i.exam, ...d.exam } } : i));
            setCur(0); setPhase('running');
        } catch (err: any) {
            if (err?.response?.status === 423) { setMsg(err.response.data.msg); setPhase('locked'); }
            else if (err?.response?.status === 409) { setMsg(err.response.data.msg || 'This exam can no longer be started.'); setPhase('submitted'); }
            else toast.error(isNetworkError(err) ? 'No internet connection. You need to be online to start.' : apiError(err, 'Could not start the exam.'));
        } finally { setStarting(false); }
    };

    // ── timer ──
    const deadline = S.current?.deadlineAt ?? (info?.attempt ? Date.parse(info.attempt.deadlineAt) : 0);
    const remaining = phase === 'running' ? deadline - serverNow() : 0;
    useEffect(() => {
        if (phase !== 'running') return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [phase]);
    void now;

    const warnMs = (S.current?.exam?.warnMinutes ?? info?.exam.warnMinutes ?? 5) * 60000;
    useEffect(() => {
        if (phase === 'running' && remaining > 0 && remaining <= warnMs && !warnShown) { setWarnShown(true); setShowWarnModal(true); }
    }, [phase, remaining, warnMs, warnShown]);
    useEffect(() => { if (phase === 'running' && remaining <= 0 && S.current) { submit(true); } /* eslint-disable-next-line */ }, [phase, remaining <= 0]);

    // ── connectivity + sync ──
    useEffect(() => {
        const up = () => {
            setOnline(true);
            if (offlineSince.current && S.current) { S.current.events.offlineSeconds += Math.round((Date.now() - offlineSince.current) / 1000); }
            offlineSince.current = null; syncNow(); trySubmitPending();
        };
        const down = () => { setOnline(false); offlineSince.current = Date.now(); if (S.current) S.current.everOffline = true; };
        window.addEventListener('online', up); window.addEventListener('offline', down);
        return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const syncNow = useCallback(async () => {
        const s = S.current;
        if (!s || busySync.current || submitting.current || !navigator.onLine) return;
        busySync.current = true; setSyncState('syncing');
        try {
            const r = await axios.put(`${CBT_API}/my/attempts/${s.attemptId}/sync`, { deviceId: s.deviceId, answers: answersRef.current, flagged: flaggedRef.current, events: s.events });
            setClock(Date.parse(r.data.serverNow));
            if (r.data.status === 'SUBMITTED') { await clearSaved(examId); S.current = null; setPhase('submitted'); setMsg('Your time ran out and your exam was submitted.'); return; }
            if (r.data.deadlineAt) { const d = Date.parse(r.data.deadlineAt); if (d !== s.deadlineAt) { s.deadlineAt = d; toast.info('Your time was updated by your teacher.'); } }
            dirty.current = false; setSyncState('saved');
        } catch (err: any) {
            if (err?.response?.status === 423) { setMsg(err.response.data.msg); setPhase('locked'); }
            else setSyncState('device');
        } finally { busySync.current = false; }
    }, [examId]);

    useEffect(() => {
        if (phase !== 'running') return;
        const t = setInterval(() => { persist(); if (dirty.current || Math.random() < 0.34) syncNow(); }, 10000);
        return () => clearInterval(t);
    }, [phase, persist, syncNow]);

    // left the exam tab?
    useEffect(() => {
        if (phase !== 'running') return;
        const onHide = () => { if (document.hidden && S.current) { S.current.events.tabSwitches += 1; dirty.current = true; persist(); } };
        const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        document.addEventListener('visibilitychange', onHide); window.addEventListener('beforeunload', guard);
        return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('beforeunload', guard); };
    }, [phase, persist]);

    // ── answering ──
    const setAnswer = (qid: string, value: unknown) => { setAnswers(a => { const n = { ...a, [qid]: value }; answersRef.current = n; return n; }); dirty.current = true; setSyncState('device'); setTimeout(persist, 0); };
    const toggleFlag = (qid: string) => { setFlagged(f => { const n = f.includes(qid) ? f.filter(x => x !== qid) : [...f, qid]; flaggedRef.current = n; return n; }); dirty.current = true; setTimeout(persist, 0); };

    // ── submit (works offline: stored and uploaded when the connection returns) ──
    const submit = async (auto = false) => {
        const s = S.current;
        if (!s || submitting.current) return;
        submitting.current = true; setConfirm(false); setPhase('submitting');
        const finishedAt = Math.min(serverNow(), s.deadlineAt + (auto ? 0 : 0));
        s.pending = { finishedAt, answers: answersRef.current, flagged: flaggedRef.current, events: s.events, offline: s.everOffline };
        await putSaved(s);
        await uploadPending();
    };

    const uploadPending = useCallback(async (): Promise<boolean> => {
        const s = S.current;
        if (!s?.pending) return false;
        try {
            const r = await axios.post(`${CBT_API}/my/attempts/${s.attemptId}/submit`, { deviceId: s.deviceId, answers: s.pending.answers, flagged: s.pending.flagged, events: s.pending.events, finishedAt: new Date(s.pending.finishedAt).toISOString(), offline: s.pending.offline });
            await clearSaved(s.examId); S.current = null; submitting.current = false; setPending(false);
            setMsg(r.data.msg || 'Your exam has been submitted.'); setPhase('submitted');
            return true;
        } catch (err: any) {
            const st = err?.response?.status;
            if (st === 423) { submitting.current = false; setMsg(err.response.data.msg); setPhase('locked'); return false; }
            if (st === 409) { await clearSaved(s.examId); S.current = null; submitting.current = false; setMsg('Your exam was already submitted.'); setPhase('submitted'); return true; }
            setPending(true); return false; // offline or server busy: keep it on the device and try again
        }
    }, []);
    const trySubmitPending = useCallback(() => { if (S.current?.pending) uploadPending(); }, [uploadPending]);

    useEffect(() => {
        if (phase !== 'submitting') return;
        if (!S.current?.pending) return;
        submitting.current = true; uploadPending();
        const t = setInterval(() => { if (navigator.onLine) uploadPending(); }, 5000);
        return () => clearInterval(t);
    }, [phase, uploadPending]);

    // ── derived ──
    const answered = useMemo(() => questions.filter(q => isAnswered(answers[q.id])).length, [questions, answers]);
    const q = questions[cur];

    // ── screens ──
    const Shell = ({ children }: { children: React.ReactNode }) => <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6"><div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">{children}</div></div>;

    if (phase === 'loading') return <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-[#1E4DA6]" /></div>;
    if (phase === 'offline-start' || phase === 'ended') return <Shell><WifiOff className="mx-auto mb-3 h-10 w-10 text-slate-400" /><p className="font-bold text-slate-800">{msg}</p><Button className="mt-5" variant="outline" onClick={() => nav('/student/cbt')}><ArrowLeft /> Back to exams</Button></Shell>;
    if (phase === 'locked') return <Shell><Lock className="mx-auto mb-3 h-10 w-10 text-rose-500" /><p className="text-lg font-bold text-slate-800">Exam locked</p><p className="mt-2 text-sm text-slate-600">{msg}</p><Button className="mt-5" variant="outline" onClick={() => nav('/student/cbt')}><ArrowLeft /> Back to exams</Button></Shell>;
    if (phase === 'submitted') return <Shell><CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" /><p className="text-lg font-bold text-slate-800">Exam submitted</p><p className="mt-2 text-sm text-slate-600">{msg || 'Your answers have been received.'} Your result will be shared by your school when it is ready.</p><Button className="mt-5" onClick={() => nav('/student/cbt')}>Back to exams</Button></Shell>;
    if (phase === 'submitting') return (
        <Shell>{pending ? <WifiOff className="mx-auto mb-3 h-10 w-10 text-amber-500" /> : <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-[#1E4DA6]" />}
            <p className="text-lg font-bold text-slate-800">{pending ? 'Saved on this device' : 'Submitting your exam…'}</p>
            <p className="mt-2 text-sm text-slate-600">{pending ? 'There is no internet right now. Your answers are safe on this device and will be sent automatically as soon as you are back online. Keep this page open.' : 'Please wait a moment.'}</p>
            {pending && <Button className="mt-5" onClick={uploadPending}><Send /> Try again now</Button>}</Shell>
    );

    if (phase === 'info' && info) {
        const e = info.exam;
        const resuming = info.attempt?.status === 'IN_PROGRESS';
        const blocked = !resuming && (info.window !== 'OPEN' || e.status !== 'PUBLISHED');
        return (
            <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
                <button onClick={() => nav('/student/cbt')} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> Exams</button>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-800">{e.title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{[e.subject, e.label].filter(Boolean).join(' · ')}</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">{[['Questions', e.questionCount], ['Time', `${e.durationMinutes} min`], ['Marks', e.totalMarks]].map(([l, v]) => <div key={String(l)} className="rounded-xl bg-slate-50 p-3"><p className="text-lg font-bold text-slate-800">{v}</p><p className="text-[11px] font-semibold uppercase text-slate-400">{l}</p></div>)}</div>
                    <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Instructions</h2>
                    <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">{e.instructions ? <RichHtml html={e.instructions} className="text-sm" /> : <p className="text-sm text-slate-500">Answer all the questions in the time given. Your answers are saved automatically.</p>}</div>
                    {e.offline && <p className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700"><WifiOff className="mt-0.5 h-4 w-4 shrink-0" /> If your internet drops while you write, keep going. The timer keeps running and your answers upload when you are back online. Do not refresh the page.</p>}
                    {blocked ? (
                        <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{info.window === 'UPCOMING' ? `This exam opens on ${new Date(e.startAt!).toLocaleString()}.` : 'This exam is closed.'}</p>
                    ) : (<>
                        <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1E4DA6]" checked={agree} onChange={ev => setAgree(ev.target.checked)} /> I have read the instructions and I am ready. I understand the timer starts when I press the button and that I must not sign in on another device.</label>
                        <Button size="lg" className="mt-4 w-full" disabled={!agree || starting} onClick={start}>{starting ? <Loader2 className="animate-spin" /> : <Clock />} {resuming ? 'Continue exam' : 'Start exam'}</Button>
                    </>)}
                </div>
            </div>
        );
    }

    if (phase !== 'running' || !q || !info) return null;
    const lowTime = remaining <= warnMs;
    const critical = remaining <= 60000;
    const val = answers[q.id];

    return (
        <div className="mx-auto max-w-6xl space-y-3 p-3 md:p-5" onContextMenu={e => e.preventDefault()}>
            <div className="sticky top-0 z-20 -mx-3 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:-mx-5 md:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0"><p className="truncate font-bold text-slate-800">{info.exam.title}</p><p className="text-xs text-slate-500">{info.exam.subject}</p></div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold', online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800')} title={online ? '' : 'Your answers are saved on this device'}>
                            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{online ? (syncState === 'syncing' ? 'Saving…' : syncState === 'saved' ? 'Saved' : 'Online') : 'Offline · saved on device'}</span>
                        <span className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-lg font-bold tabular-nums', critical ? 'animate-pulse bg-rose-600 text-white' : lowTime ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white')}><Clock className="h-4 w-4" />{hhmmss(remaining)}</span>
                        <Button size="sm" onClick={() => setConfirm(true)}><Send /> Submit</Button>
                    </div>
                </div>
                <div className="mt-2 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} /></div>
                    <p className="shrink-0 text-xs font-semibold text-slate-600">Answered {answered} of {questions.length} · <span className={questions.length - answered ? 'text-amber-600' : 'text-emerald-600'}>{questions.length - answered} remaining</span></p></div>
            </div>

            {lowTime && <div className={cn('flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold', critical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900')}><AlertTriangle className="h-5 w-5 shrink-0" /> {critical ? 'Less than a minute left! Finish and submit now.' : `Only ${Math.ceil(remaining / 60000)} minute${Math.ceil(remaining / 60000) === 1 ? '' : 's'} left. Please finish quickly.`}</div>}
            {!online && <p className="rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-800">You are offline. Keep writing: the timer is still running and your answers are saved on this device. They will be sent when your connection returns. Please do not refresh the page.</p>}

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                    <div className="select-none rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" onCopy={e => e.preventDefault()}>
                        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-[#173F8C]">Question {q.number} <span className="font-normal text-slate-400">of {questions.length}</span></p><div className="flex items-center gap-3"><span className="text-xs text-slate-400">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                            <button onClick={() => toggleFlag(q.id)} className={cn('flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold', flagged.includes(q.id) ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500')}><Flag className="h-3.5 w-3.5" /> {flagged.includes(q.id) ? 'Flagged' : 'Flag'}</button></div></div>
                        <RichHtml html={q.stem} className="text-[15px]" />

                        <div className="mt-4 space-y-2">
                            {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && q.options.map((o, i) => { const on = val === o.id; return (
                                <button key={o.id} type="button" onClick={() => setAnswer(q.id, o.id)} className={cn('flex w-full items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition', on ? 'border-[#1E4DA6] bg-[#1E4DA6]/5' : 'border-slate-200 hover:border-slate-300')}>
                                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold', on ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-300 text-slate-500')}>{q.type === 'TRUE_FALSE' ? (i === 0 ? 'T' : 'F') : 'ABCDEFGH'[i]}</span><RichHtml html={o.html} inline className="flex-1 pt-0.5 text-[15px]" /></button>); })}
                            {q.type === 'MULTI' && <><p className="text-xs font-semibold text-slate-500">Select all that apply.</p>{q.options.map((o, i) => { const sel = Array.isArray(val) ? (val as string[]) : []; const on = sel.includes(o.id); return (
                                <button key={o.id} type="button" onClick={() => setAnswer(q.id, on ? sel.filter(x => x !== o.id) : [...sel, o.id])} className={cn('flex w-full items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition', on ? 'border-[#1E4DA6] bg-[#1E4DA6]/5' : 'border-slate-200 hover:border-slate-300')}>
                                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold', on ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-300 text-slate-500')}>{'ABCDEFGH'[i]}</span><RichHtml html={o.html} inline className="flex-1 pt-0.5 text-[15px]" /></button>); })}</>}
                            {q.type === 'SHORT' && <input className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-base outline-none focus:border-[#1E4DA6]" placeholder="Type your answer" value={typeof val === 'string' ? val : ''} onChange={e => setAnswer(q.id, e.target.value)} autoComplete="off" onPaste={e => e.preventDefault()} />}
                            {q.type === 'ESSAY' && <><textarea className="min-h-[220px] w-full rounded-xl border-2 border-slate-200 p-4 text-base outline-none focus:border-[#1E4DA6]" placeholder="Write your answer here" value={typeof val === 'string' ? val : ''} onChange={e => setAnswer(q.id, e.target.value)} onPaste={e => e.preventDefault()} />
                                <p className="text-right text-xs text-slate-400">{typeof val === 'string' && val.trim() ? val.trim().split(/\s+/).length : 0} words</p></>}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button variant="outline" disabled={cur === 0} onClick={() => setCur(c => c - 1)}><ChevronLeft /> Previous</Button>
                        {cur < questions.length - 1 ? <Button onClick={() => setCur(c => c + 1)}>Next <ChevronRight /></Button> : <Button onClick={() => setConfirm(true)}><Send /> Finish &amp; submit</Button>}
                    </div>
                </div>

                <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Questions</p>
                        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
                            {questions.map((x, i) => { const a = isAnswered(answers[x.id]); return (
                                <button key={x.id} onClick={() => setCur(i)} className={cn('relative flex h-9 items-center justify-center rounded-lg border-2 text-xs font-bold transition', i === cur ? 'border-[#173F8C] ring-2 ring-[#1E4DA6]/30' : 'border-transparent', a ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                                    {x.number}{flagged.includes(x.id) && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />}</button>); })}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-emerald-500" /> Answered</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-slate-200" /> Not answered</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Flagged</span></div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded-lg bg-emerald-50 p-2"><p className="text-lg font-bold text-emerald-700">{answered}</p><p className="text-[10px] font-semibold uppercase text-emerald-600">Answered</p></div><div className="rounded-lg bg-amber-50 p-2"><p className="text-lg font-bold text-amber-700">{questions.length - answered}</p><p className="text-[10px] font-semibold uppercase text-amber-600">Remaining</p></div></div>
                    </div>
                </aside>
            </div>

            <Dialog open={confirm} onOpenChange={setConfirm}>
                <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Submit your exam?</DialogTitle><DialogDescription>You cannot change your answers after you submit.</DialogDescription></DialogHeader>
                    <div className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm"><p><strong className="text-emerald-700">{answered}</strong> of {questions.length} questions answered</p>
                        {questions.length - answered > 0 && <p className="font-semibold text-amber-700">{questions.length - answered} not answered yet</p>}{flagged.length > 0 && <p className="text-slate-600">{flagged.length} flagged for review</p>}<p className="text-slate-500">Time left: {hhmmss(remaining)}</p></div>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirm(false)}>Go back</Button><Button onClick={() => submit(false)}><Send /> Yes, submit</Button></div></DialogContent>
            </Dialog>
            <Dialog open={showWarnModal} onOpenChange={setShowWarnModal}>
                <DialogContent className="max-w-sm text-center"><DialogHeader><DialogTitle className="flex items-center justify-center gap-2 text-amber-600"><AlertTriangle className="h-6 w-6" /> {Math.round(warnMs / 60000)} minutes left</DialogTitle><DialogDescription>Please finish up quickly. The exam is submitted automatically when time runs out.</DialogDescription></DialogHeader>
                    <Button onClick={() => setShowWarnModal(false)}>Continue writing</Button></DialogContent>
            </Dialog>
        </div>
    );
}
