import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart3, ClipboardCheck, Database, Grid3x3, Loader2, Plus, Search, Settings2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { CBT_API, apiError, fmtDateTime, inputCls, type CbtMeta, type ExamSummary } from './api';
import { ExamEditor } from './ExamEditor';
import { QuestionBank } from './QuestionBank';
import { ExamResults } from './ExamResults';
import { AttemptReview } from './AttemptReview';
import { MasterSheet } from './MasterSheet';
import { CbtSettingsPanel } from './CbtSettingsPanel';

type Tab = 'exams' | 'bank' | 'master' | 'settings';
type View = { name: 'list' } | { name: 'editor'; id: string | null } | { name: 'results'; id: string } | { name: 'attempt'; id: string; examId: string; siblings: string[] };

const STATUS: Record<string, string> = { DRAFT: 'bg-amber-100 text-amber-700', PUBLISHED: 'bg-emerald-100 text-emerald-700', CLOSED: 'bg-slate-200 text-slate-600' };

/** CBT for teachers and admins: exams, the question bank, results and master sheets. Admins also get settings. */
export default function CbtHome({ initialTab = 'exams' }: { initialTab?: Tab }) {
    const [meta, setMeta] = useState<CbtMeta | null>(null);
    const [tab, setTab] = useState<Tab>(initialTab);
    const [view, setView] = useState<View>({ name: 'list' });
    const [exams, setExams] = useState<ExamSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [f, setF] = useState({ q: '', status: '', term: '', ownerId: '' });

    const loadMeta = useCallback(() => axios.get(`${CBT_API}/meta`).then(r => setMeta(r.data)), []);
    const loadExams = useCallback(() => {
        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
        return axios.get(`${CBT_API}/exams`, { params }).then(r => setExams(r.data.exams)).catch(err => toast.error(apiError(err, 'Could not load exams.'))).finally(() => setLoading(false));
    }, [f]);

    useEffect(() => { loadMeta().catch(err => toast.error(apiError(err, 'Could not load CBT.'))); }, [loadMeta]);
    useEffect(() => { const t = setTimeout(loadExams, f.q ? 250 : 0); return () => clearTimeout(t); }, [loadExams, f.q]);

    if (!meta) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const wrap = (node: React.ReactNode) => <div className="mx-auto max-w-6xl p-4 md:p-6">{node}</div>;
    const back = () => { setView({ name: 'list' }); loadExams(); };

    if (view.name === 'editor') return wrap(<ExamEditor examId={view.id} meta={meta} onClose={back} onOpenResults={id => setView({ name: 'results', id })} />);
    if (view.name === 'results') return wrap(<ExamResults examId={view.id} meta={meta} onBack={() => setView({ name: 'list' })} onOpenAttempt={(id, list) => setView({ name: 'attempt', id, examId: view.id, siblings: list })} />);
    if (view.name === 'attempt') return wrap(<AttemptReview attemptId={view.id} meta={meta} siblings={view.siblings} onBack={() => setView({ name: 'results', id: view.examId })} onNavigate={id => setView({ ...view, id })} />);

    const TABS: [Tab, string, typeof Database][] = [['exams', 'Exams', ClipboardCheck], ['bank', 'Question bank', Database], ['master', 'Master sheets', Grid3x3], ...(meta.isAdmin ? [['settings', 'Settings', Settings2] as [Tab, string, typeof Database]] : [])];

    return wrap(
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><ClipboardCheck className="h-6 w-6 text-[#1E4DA6]" /> CBT Exams</h1>
                    <p className="text-sm text-slate-500">{meta.isAdmin ? 'Set and manage computer-based exams for every class, and see all results.' : 'Set computer-based exams for your classes and mark them.'}</p></div>
                {tab === 'exams' && <Button onClick={() => setView({ name: 'editor', id: null })}><Plus /> New exam</Button>}
            </div>

            <div className="flex gap-1 border-b border-slate-200">{TABS.map(([k, l, Icon]) => <button key={k} onClick={() => setTab(k)} className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-bold', tab === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500 hover:text-slate-700')}><Icon className="h-4 w-4" /> {l}</button>)}</div>

            {tab === 'exams' && (
                <div className="space-y-4">
                    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                        <div className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search exams…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /></div>
                        <select className={inputCls} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option></select>
                        {meta.isAdmin ? <select className={inputCls} value={f.ownerId} onChange={e => setF({ ...f, ownerId: e.target.value })}><option value="">All teachers</option>{meta.owners.map(o => <option key={o.ownerId} value={o.ownerId}>{o.ownerName}</option>)}</select>
                            : <select className={inputCls} value={f.term} onChange={e => setF({ ...f, term: e.target.value })}><option value="">All terms</option>{meta.terms.map(t => <option key={t}>{t}</option>)}</select>}
                    </div>
                    {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : exams.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center"><p className="font-semibold text-slate-600">No exams yet</p><p className="mt-1 text-sm text-slate-400">Create an exam, add questions, publish it, and students in the chosen classes can write it on their dashboard.</p></div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {exams.map(e => (
                                <div key={e.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <button className="text-left" onClick={() => setView({ name: 'editor', id: e.id })}>
                                        <div className="flex items-start justify-between gap-2"><p className="font-bold text-slate-800">{e.title}</p><span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', STATUS[e.status])}>{e.status === 'PUBLISHED' ? 'Published' : e.status === 'CLOSED' ? 'Closed' : 'Draft'}</span></div>
                                        <p className="mt-1 text-xs text-slate-500">{[e.subject, e.classNames?.join(', '), e.examType].filter(Boolean).join(' · ')}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">{[e.label, `${e.questionCount ?? 0} questions`, `${e.totalMarks} marks`, `${e.durationMinutes} min`].filter(Boolean).join(' · ')}{e.startAt ? ` · opens ${fmtDateTime(e.startAt)}` : ''}</p>
                                        {meta.isAdmin && <p className="mt-0.5 text-[11px] text-slate-400">By {e.ownerName}</p>}
                                    </button>
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                                        <span>{e.submitted ?? 0} submitted{e.inProgress ? ` · ${e.inProgress} writing` : ''}{e.locked ? <span className="font-bold text-rose-600"> · {e.locked} locked</span> : ''}</span>
                                        <button className="flex items-center gap-1 font-bold text-[#1E4DA6]" onClick={() => setView({ name: 'results', id: e.id })}><BarChart3 className="h-3.5 w-3.5" /> Results</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'bank' && <QuestionBank meta={meta} onChanged={loadMeta} />}
            {tab === 'master' && <MasterSheet meta={meta} />}
            {tab === 'settings' && meta.isAdmin && <CbtSettingsPanel meta={meta} onSaved={loadMeta} />}
        </div>,
    );
}
