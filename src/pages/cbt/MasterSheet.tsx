import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2, Printer, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { mobileSafePrint } from '../../lib/printUtils';
import { Button } from '../../components/ui/button';
import { CBT_API, apiError, download, inputCls, type CbtMeta } from './api';
import { ShareSheetDialog } from './ShareSheetDialog';

interface Sheet { title: string; subtitle: string; summary: string; head: string[]; body: (string | number)[][]; footnote?: string }
interface Master { exams: { id: string; title: string; subject: string; totalMarks: number }[]; className: string; sheet: Sheet }

/** Class master sheet: every student against every CBT exam, with total, average, position and grade. */
export function MasterSheet({ meta }: { meta: CbtMeta }) {
    const [classId, setClassId] = useState('');
    const [term, setTerm] = useState(meta.currentTerm || '');
    const [year, setYear] = useState(meta.currentYear || '');
    const [pickExams, setPickExams] = useState<string[]>([]);
    const [data, setData] = useState<Master | null>(null);
    const [loading, setLoading] = useState(false);
    const [share, setShare] = useState(false);
    const [busy, setBusy] = useState('');

    const params = { classId, term, academicYear: year, examIds: pickExams.join(',') };
    const clean = () => Object.fromEntries(Object.entries(params).filter(([, v]) => v));

    useEffect(() => {
        if (!classId) { setData(null); return; }
        setLoading(true);
        axios.get(`${CBT_API}/master`, { params: clean() }).then(r => setData(r.data)).catch(err => toast.error(apiError(err, 'Could not build the master sheet.'))).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, term, year, pickExams.join(',')]);

    const exp = async (format: 'xlsx' | 'pdf') => { setBusy(format); try { await download('/master/export', { ...clean(), format }, `master_sheet.${format}`); } catch (e: any) { toast.error(e.message); } finally { setBusy(''); } };

    return (
        <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"><div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Class</span><select className={inputCls} value={classId} onChange={e => { setClassId(e.target.value); setPickExams([]); }}><option value="">Choose a class…</option>{meta.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Term</span><input list="ms-terms" className={inputCls} value={term} onChange={e => setTerm(e.target.value)} placeholder="All terms" /><datalist id="ms-terms">{meta.terms.map(t => <option key={t} value={t} />)}</datalist></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Session</span><input list="ms-years" className={inputCls} value={year} onChange={e => setYear(e.target.value)} placeholder="All sessions" /><datalist id="ms-years">{meta.sessions.map(t => <option key={t} value={t} />)}</datalist></label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" disabled={!data || !!busy} onClick={() => exp('xlsx')}>{busy === 'xlsx' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Excel</Button>
                    <Button size="sm" variant="outline" disabled={!data || !!busy} onClick={() => exp('pdf')}>{busy === 'pdf' ? <Loader2 className="animate-spin" /> : <Download />} PDF</Button>
                    <Button size="sm" variant="outline" disabled={!data} onClick={() => mobileSafePrint('cbt-master-print', '@page{size:landscape;margin:10mm}')}><Printer /> Print</Button>
                    <Button size="sm" variant="outline" disabled={!data} onClick={() => setShare(true)}><Share2 /> Share</Button>
                </div>
            </div>

            {data && data.exams.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs"><span className="font-semibold text-slate-500">Include:</span>
                    {data.exams.map(e => { const on = !pickExams.length || pickExams.includes(e.id); return <button key={e.id} onClick={() => setPickExams(p => { const base = p.length ? p : data.exams.map(x => x.id); const next = base.includes(e.id) ? base.filter(x => x !== e.id) : [...base, e.id]; return next.length === data.exams.length ? [] : next; })} className={cn('rounded-full border px-2.5 py-1 font-semibold', on ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-400')}>{e.subject}: {e.title}</button>; })}</div>
            )}

            {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : !data ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">Choose a class to see its master sheet.</p>
            ) : data.exams.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">No published CBT exams for {data.className} in this term and session.</p> : (
                <div id="cbt-master-print" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <div className="p-4"><h2 className="text-lg font-bold text-slate-800">{data.sheet.title}</h2><p className="text-xs text-slate-500">{data.sheet.subtitle} · {data.sheet.summary}</p></div>
                    <table className="w-full min-w-[640px] text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500"><tr>{data.sheet.head.map((h, i) => <th key={i} className={cn('p-2.5', i === 1 ? 'text-left' : 'text-center')}>{h}</th>)}</tr></thead>
                        <tbody>{data.sheet.body.map((r, i) => <tr key={i} className="border-t border-slate-100">{r.map((c, j) => <td key={j} className={cn('p-2.5', j === 1 ? 'font-semibold text-slate-800' : 'text-center text-slate-600', j === r.length - 2 && 'font-bold text-slate-800')}>{c}</td>)}</tr>)}</tbody>
                    </table>
                    {data.sheet.footnote && <p className="p-3 text-[11px] text-slate-400">{data.sheet.footnote}</p>}
                </div>
            )}
            {share && data && <ShareSheetDialog title={`${data.className} CBT master sheet`} target={{ kind: 'MASTER', classId, term, academicYear: year, examIds: pickExams }} emailEnabled={meta.settings.allowEmailShare} onClose={() => setShare(false)} />}
        </div>
    );
}
