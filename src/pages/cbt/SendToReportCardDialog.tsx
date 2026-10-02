import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CBT_API, apiError, inputCls } from './api';

interface Options {
    exam: { title: string; subject: string; term: string | null; academicYear: string | null; totalMarks: number };
    classes: { id: string; name: string }[]; classId: string; parts: { id: string; name: string; weight: number }[];
    subjects: { id: string; name: string }[]; suggestedSubjectId: string | null; ready: boolean;
}
interface Row { studentProfileId: string; name: string; admissionNo: string; status: string; percentage: number | null; cbtScore: number | null; cbtMax: number; value: number | null; existing: number | null }

const STATUS: Record<string, string> = {
    READY: '', EXEMPT: 'Exempt: left blank', NOT_STARTED: 'Absent: left blank', IN_PROGRESS: 'Still writing', LOCKED: 'Locked: left blank', ESSAY_PENDING: 'Essay not marked yet',
};

/** Pushes the exam's scores into one column of the report card, converted to that column's maximum. */
export function SendToReportCardDialog({ examId, onClose }: { examId: string; onClose: () => void }) {
    const [opt, setOpt] = useState<Options | null>(null);
    const [classId, setClassId] = useState('');
    const [partName, setPartName] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [rows, setRows] = useState<Row[] | null>(null);
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [overwrite, setOverwrite] = useState(false);
    const [includePending, setIncludePending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const loadOptions = (cid?: string) => axios.get(`${CBT_API}/exams/${examId}/report-card/options`, { params: cid ? { classId: cid } : {} }).then(r => {
        const o: Options = r.data;
        setOpt(o); setClassId(o.classId);
        setPartName(p => o.parts.some(x => x.name === p) ? p : o.parts[0]?.name || '');
        setSubjectId(s => o.subjects.some(x => x.id === s) ? s : o.suggestedSubjectId || '');
    }).catch(err => { toast.error(apiError(err, 'Could not open this.')); onClose(); });

    useEffect(() => { loadOptions(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

    const part = opt?.parts.find(p => p.name === partName);

    useEffect(() => {
        setRows(null);
        if (!opt || !classId || !partName || !subjectId || !opt.ready) return;
        setLoading(true);
        axios.get(`${CBT_API}/exams/${examId}/report-card/preview`, { params: { classId, partName, subjectId } }).then(r => {
            const rs: Row[] = r.data.rows;
            setRows(rs); setEdits({});
            setPicked(new Set(rs.filter(x => x.status === 'READY').map(x => x.studentProfileId)));
        }).catch(err => toast.error(apiError(err, 'Could not load the preview.'))).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opt?.classId, classId, partName, subjectId]);

    const valueOf = (r: Row) => edits[r.studentProfileId] !== undefined ? edits[r.studentProfileId] : r.value === null ? '' : String(r.value);
    const sendable = (r: Row) => r.status === 'READY' || (includePending && r.status === 'ESSAY_PENDING');
    const chosen = useMemo(() => (rows || []).filter(r => sendable(r) && picked.has(r.studentProfileId) && valueOf(r) !== ''), [rows, picked, edits, includePending]); // eslint-disable-line
    const clashes = chosen.filter(r => r.existing !== null).length;
    const badValue = chosen.some(r => { const n = Number(valueOf(r)); return !Number.isFinite(n) || n < 0 || (part ? n > part.weight : false); });

    const send = async () => {
        if (!part) return;
        setSending(true);
        try {
            // edited marks are written by sending the row's value through the exam's own conversion, so edits go as a separate pass
            const { data } = await axios.post(`${CBT_API}/exams/${examId}/report-card/send`, {
                classId, partName, subjectId, overwrite, includePending, studentProfileIds: chosen.map(r => r.studentProfileId),
                overrides: Object.fromEntries(chosen.filter(r => edits[r.studentProfileId] !== undefined).map(r => [r.studentProfileId, Number(edits[r.studentProfileId])])),
            });
            toast.success(data.msg); onClose();
        } catch (err) { toast.error(apiError(err, 'Could not send the scores.')); } finally { setSending(false); }
    };

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-[#1E4DA6]" /> Send to report card</DialogTitle>
                    <DialogDescription>Scores are converted to the maximum of the column you pick (a CBT mark of 22/30 becomes 14.7/20) and added to the student's report card for {opt?.exam.term || 'the exam term'}.</DialogDescription></DialogHeader>
                {!opt ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div> : !opt.ready ? (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This exam has no term and session yet. Set them on the exam's Details tab so the scores go to the right report card.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="text-xs font-semibold text-slate-500">Class
                                <select className={cn(inputCls, 'mt-1')} value={classId} onChange={e => { setClassId(e.target.value); loadOptions(e.target.value); }}>{opt.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            <label className="text-xs font-semibold text-slate-500">Report-card subject
                                <select className={cn(inputCls, 'mt-1')} value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">Choose…</option>{opt.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                            <label className="text-xs font-semibold text-slate-500">Column
                                <select className={cn(inputCls, 'mt-1')} value={partName} onChange={e => setPartName(e.target.value)}>{opt.parts.map(p => <option key={p.id} value={p.name}>{p.name} (out of {p.weight})</option>)}</select></label>
                        </div>
                        {!opt.parts.length && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This class has no assessment columns yet. Set them up under Result Management first.</p>}

                        {loading && <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-400" /></div>}
                        {rows && part && (
                            <>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="p-2" /><th className="p-2">Student</th><th className="p-2">CBT</th><th className="p-2">Report card /{part.weight}</th><th className="p-2">Already there</th></tr></thead>
                                        <tbody>{rows.map(r => {
                                            const ok = sendable(r);
                                            return (
                                                <tr key={r.studentProfileId} className="border-t border-slate-100">
                                                    <td className="p-2"><input type="checkbox" className="accent-[#1E4DA6]" disabled={!ok} checked={ok && picked.has(r.studentProfileId)} onChange={e => setPicked(p => { const n = new Set(p); e.target.checked ? n.add(r.studentProfileId) : n.delete(r.studentProfileId); return n; })} /></td>
                                                    <td className="p-2"><p className="font-semibold text-slate-800">{r.name}</p><p className="text-[11px] text-slate-400">{r.admissionNo}</p></td>
                                                    <td className="p-2 text-slate-600">{r.cbtScore !== null ? `${r.cbtScore}/${r.cbtMax} (${r.percentage}%)` : <span className="text-xs text-slate-400">{STATUS[r.status]}</span>}{r.status === 'ESSAY_PENDING' && <span className="ml-1 text-xs text-amber-600">{STATUS[r.status]}</span>}</td>
                                                    <td className="p-2">{ok ? <input type="number" step="0.1" min={0} max={part.weight} className={cn(inputCls, 'h-8 w-24')} value={valueOf(r)} onChange={e => setEdits(x => ({ ...x, [r.studentProfileId]: e.target.value }))} /> : '—'}</td>
                                                    <td className="p-2">{r.existing !== null ? <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700">{r.existing}</span> : <span className="text-slate-300">—</span>}</td>
                                                </tr>
                                            );
                                        })}</tbody>
                                    </table>
                                </div>
                                {rows.some(r => r.status === 'ESSAY_PENDING') && <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="accent-[#1E4DA6]" checked={includePending} onChange={e => setIncludePending(e.target.checked)} /> Also send students whose essays are not marked yet (their score may rise later)</label>}
                                {clashes > 0 && <label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><input type="checkbox" className="mt-0.5 accent-[#1E4DA6]" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} /> {clashes} student{clashes === 1 ? ' has' : 's have'} a mark in this column already. Tick to replace {clashes === 1 ? 'it' : 'them'}; otherwise the existing mark is kept.</label>}
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-slate-500">{chosen.length} student{chosen.length === 1 ? '' : 's'} will be sent. Absent and exempt students are left blank, not zero.</p>
                                    <Button disabled={sending || !chosen.length || badValue || !subjectId} onClick={send}>{sending && <Loader2 className="animate-spin" />} Send to report card</Button>
                                </div>
                                {badValue && <p className="text-xs text-rose-600">Each mark must be between 0 and {part.weight}.</p>}
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
