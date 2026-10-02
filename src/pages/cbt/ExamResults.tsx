import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardCheck, Download, Eye, EyeOff, FileSpreadsheet, Loader2, Lock, Printer, RefreshCw, RotateCcw, Share2, Unlock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { mobileSafePrint } from '../../lib/printUtils';
import { Button } from '../../components/ui/button';
import { CBT_API, apiError, download, fmtDateTime, type CbtMeta } from './api';
import { ShareSheetDialog } from './ShareSheetDialog';
import { SendToReportCardDialog } from './SendToReportCardDialog';

interface Row {
    studentProfileId: string; name: string; admissionNo: string | null; className: string; status: string; attemptId: string | null; objectiveScore: number | null; essayScore: number | null;
    totalScore: number | null; maxScore: number; percentage: number | null; grade: string | null; passed: boolean | null; markingStatus: string | null; submittedAt: string | null; minutesUsed: number | null;
    flags: { late: boolean; offline: boolean; auto: boolean; tabSwitches: number; lockReason: string | null } | null; position?: number; deadlineAt: string | null;
}
interface Data {
    exam: { id: string; title: string; subject: string; label: string; totalMarks: number; passMark: number; status: string; resultsReleased: boolean; allowReview: boolean; durationMinutes: number };
    rows: Row[]; hasEssays: boolean; powers: Record<string, boolean>;
    stats: { students: number; submitted: number; inProgress: number; locked: number; notStarted: number; exempt: number; pendingEssays: number; average: number | null; highest: number | null; lowest: number | null; passRate: number | null };
}

const STATUS: Record<string, { label: string; cls: string }> = {
    SUBMITTED: { label: 'Submitted', cls: 'bg-emerald-100 text-emerald-700' }, IN_PROGRESS: { label: 'Writing now', cls: 'bg-blue-100 text-blue-700' }, LOCKED: { label: 'Locked', cls: 'bg-rose-100 text-rose-700' },
    NOT_STARTED: { label: 'Not started', cls: 'bg-slate-100 text-slate-500' }, EXEMPT: { label: 'Exempt', cls: 'bg-violet-100 text-violet-700' },
};

export function ExamResults({ examId, meta, onBack, onOpenAttempt }: { examId: string; meta: CbtMeta; onBack: () => void; onOpenAttempt: (attemptId: string, list: string[]) => void }) {
    const [d, setD] = useState<Data | null>(null);
    const [busy, setBusy] = useState('');
    const [share, setShare] = useState(false);
    const [toCard, setToCard] = useState(false);
    const [sortKey, setSortKey] = useState<'rank' | 'name'>('rank');

    const load = useCallback(() => axios.get(`${CBT_API}/exams/${examId}/results`).then(r => setD(r.data)).catch(err => { toast.error(apiError(err, 'Could not load results.')); onBack(); }), [examId, onBack]);
    useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

    if (!d) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const { exam, stats, powers } = d;
    const rows = [...d.rows].sort((a, b) => sortKey === 'name' ? a.name.localeCompare(b.name) : (a.position ?? 9999) - (b.position ?? 9999) || a.name.localeCompare(b.name));
    const markList = rows.filter(r => r.attemptId && r.status === 'SUBMITTED').map(r => r.attemptId!);

    const release = async (released: boolean, force = false, allowReview?: boolean) => {
        setBusy('release');
        try {
            const r = await axios.post(`${CBT_API}/exams/${examId}/release`, { released, force, allowReview });
            toast.success(r.data.msg); await load();
        } catch (err: any) {
            if (err?.response?.status === 409 && window.confirm(`${err.response.data.msg}`)) return release(released, true, allowReview);
            if (err?.response?.status !== 409) toast.error(apiError(err, 'Could not change this.'));
        } finally { setBusy(''); }
    };
    const unlock = async (r: Row) => {
        const input = window.prompt(`Unlock ${r.name}'s exam. Add extra minutes? (0 for none)`, '5');
        if (input === null) return;
        try { const res = await axios.post(`${CBT_API}/attempts/${r.attemptId}/unlock`, { addMinutes: Number(input) || 0 }); toast.success(res.data.msg); load(); }
        catch (err) { toast.error(apiError(err, 'Could not unlock.')); }
    };
    const reset = async (r: Row) => {
        if (!window.confirm(`Clear ${r.name}'s attempt? Their answers and score are deleted and they can start again.`)) return;
        try { await axios.delete(`${CBT_API}/attempts/${r.attemptId}`); toast.success('Attempt cleared'); load(); }
        catch (err) { toast.error(apiError(err, 'Could not reset.')); }
    };
    const exp = async (format: 'xlsx' | 'pdf') => { setBusy(format); try { await download(`/exams/${examId}/results/export`, { format }, `results.${format}`); } catch (e: any) { toast.error(e.message); } finally { setBusy(''); } };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><button onClick={onBack} className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                    <h2 className="text-xl font-bold text-slate-800">{exam.title} · Results</h2><p className="text-xs text-slate-500">{[exam.subject, exam.label, `${exam.totalMarks} marks`, `pass mark ${exam.passMark}%`].filter(Boolean).join(' · ')}</p></div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={load}><RefreshCw /></Button>
                    <Button size="sm" variant="outline" disabled={!!busy} onClick={() => exp('xlsx')}>{busy === 'xlsx' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Excel</Button>
                    <Button size="sm" variant="outline" disabled={!!busy} onClick={() => exp('pdf')}>{busy === 'pdf' ? <Loader2 className="animate-spin" /> : <Download />} PDF</Button>
                    <Button size="sm" variant="outline" onClick={() => mobileSafePrint('cbt-results-print', '@page{size:landscape;margin:10mm}')}><Printer /> Print</Button>
                    <Button size="sm" variant="outline" onClick={() => setShare(true)}><Share2 /> Share</Button>
                    {powers.teachersCanSendToReportCard !== false && <Button size="sm" onClick={() => setToCard(true)}><ClipboardCheck /> Send to report card</Button>}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[['Submitted', `${stats.submitted}/${stats.students}`], ['Average', stats.average !== null ? `${stats.average}%` : '—'], ['Highest', stats.highest !== null ? `${stats.highest}%` : '—'], ['Lowest', stats.lowest !== null ? `${stats.lowest}%` : '—'], ['Pass rate', stats.passRate !== null ? `${stats.passRate}%` : '—'], ['Essays to mark', String(stats.pendingEssays)]].map(([l, v]) => <div key={l} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{l}</p><p className={cn('text-lg font-bold', l === 'Essays to mark' && stats.pendingEssays ? 'text-amber-600' : 'text-slate-800')}>{v}</p></div>)}
            </div>

            <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3', exam.resultsReleased ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white')}>
                <div className="text-sm"><p className="flex items-center gap-2 font-bold text-slate-800">{exam.resultsReleased ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />} {exam.resultsReleased ? 'Students and parents can see their results' : 'Results are hidden from students and parents'}</p>
                    <p className="text-xs text-slate-500">Students never see a score right after the exam. You decide when they do.</p></div>
                <div className="flex items-center gap-3">
                    {powers.teachersCanReleaseResults && <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" className="accent-[#1E4DA6]" checked={exam.allowReview} onChange={e => release(exam.resultsReleased, false, e.target.checked)} /> allow answer review</label>}
                    {powers.teachersCanReleaseResults ? <Button size="sm" variant={exam.resultsReleased ? 'outline' : 'default'} disabled={busy === 'release'} onClick={() => release(!exam.resultsReleased, false, exam.allowReview)}>{busy === 'release' && <Loader2 className="animate-spin" />} {exam.resultsReleased ? 'Hide results' : 'Release results'}</Button>
                        : <span className="flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3.5 w-3.5" /> Only an administrator can release results</span>}
                </div>
            </div>

            {(stats.locked > 0) && <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700"><Lock className="h-4 w-4" /> {stats.locked} exam{stats.locked === 1 ? ' is' : 's are'} locked because the account was used on another device. {powers.teachersCanReleaseLock ? 'Review below and unlock if it was the student.' : 'An administrator must unlock them.'}</p>}

            <div className="flex items-center gap-2 text-xs text-slate-500"><span>Sort by</span>{(['rank', 'name'] as const).map(k => <button key={k} onClick={() => setSortKey(k)} className={cn('rounded-full px-2.5 py-1 font-semibold', sortKey === k ? 'bg-[#1E4DA6] text-white' : 'bg-slate-100')}>{k === 'rank' ? 'Position' : 'Name'}</button>)}</div>

            <div id="cbt-results-print" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="hidden print:block p-3"><h1 className="text-lg font-bold">{exam.title} · Results</h1><p className="text-xs">{[exam.subject, exam.label].filter(Boolean).join(' · ')}</p></div>
                <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2.5 text-left">Pos</th><th className="p-2.5 text-left">Student</th><th className="p-2.5 text-left">Status</th>{d.hasEssays && <><th className="p-2.5 text-right">Objective</th><th className="p-2.5 text-right">Essay</th></>}<th className="p-2.5 text-right">Total</th><th className="p-2.5 text-right">%</th><th className="p-2.5 text-center">Grade</th><th className="p-2.5 text-left print:hidden">Notes</th><th className="p-2.5 print:hidden" /></tr></thead>
                    <tbody>
                        {rows.map(r => { const st = STATUS[r.status] || STATUS.NOT_STARTED; return (
                            <tr key={r.studentProfileId} className="border-t border-slate-100">
                                <td className="p-2.5 font-bold text-slate-500">{r.position ?? ''}</td>
                                <td className="p-2.5"><p className="font-semibold text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.admissionNo} · {r.className}</p></td>
                                <td className="p-2.5"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', st.cls)}>{st.label}</span>{r.markingStatus === 'PENDING' && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Essay pending</span>}</td>
                                {d.hasEssays && <><td className="p-2.5 text-right text-slate-600">{r.objectiveScore ?? ''}</td><td className="p-2.5 text-right text-slate-600">{r.essayScore ?? ''}</td></>}
                                <td className="p-2.5 text-right font-semibold">{r.totalScore ?? ''}{r.totalScore !== null && <span className="text-xs font-normal text-slate-400"> /{r.maxScore}</span>}</td>
                                <td className={cn('p-2.5 text-right font-bold', r.passed === null ? '' : r.passed ? 'text-emerald-600' : 'text-rose-600')}>{r.percentage !== null ? `${Math.round(r.percentage * 10) / 10}` : ''}</td>
                                <td className="p-2.5 text-center font-bold text-slate-700">{r.grade}</td>
                                <td className="p-2.5 text-[11px] text-slate-500 print:hidden">{[r.flags?.offline && 'offline', r.flags?.auto && 'auto-submitted', r.flags?.late && 'late sync', r.flags && r.flags.tabSwitches > 0 && `${r.flags.tabSwitches} tab switches`, r.status === 'IN_PROGRESS' && r.deadlineAt && `ends ${fmtDateTime(r.deadlineAt)}`, r.minutesUsed !== null && `${r.minutesUsed} min`].filter(Boolean).join(' · ')}</td>
                                <td className="p-2.5 text-right print:hidden"><div className="flex justify-end gap-1">
                                    {r.attemptId && <Button size="sm" variant="outline" onClick={() => onOpenAttempt(r.attemptId!, markList)}>{r.markingStatus === 'PENDING' ? 'Mark' : 'View'}</Button>}
                                    {r.status === 'LOCKED' && powers.teachersCanReleaseLock && <Button size="sm" variant="outline" title="Unlock" onClick={() => unlock(r)}><Unlock /></Button>}
                                    {r.attemptId && powers.teachersCanResetAttempt && <Button size="sm" variant="ghost" title="Let the student retake" onClick={() => reset(r)}><RotateCcw /></Button>}</div></td>
                            </tr>); })}
                    </tbody>
                </table>
            </div>

            {toCard && <SendToReportCardDialog examId={examId} onClose={() => setToCard(false)} />}
            {share && <ShareSheetDialog title={`${exam.title} results`} target={{ kind: 'RESULTS', examId }} emailEnabled={meta.settings.allowEmailShare} onClose={() => setShare(false)} />}
        </div>
    );
}
