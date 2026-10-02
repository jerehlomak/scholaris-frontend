import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCheck, Loader2, LogIn, LogOut, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { ATT_API, STATUS_STYLE, apiError, fmtTime, inputCls, todayStr } from './api';

interface Row { studentId: string; name: string; admissionNo: string | null; gender: string | null; status: string | null; note: string; checkInAt: string | null; checkOutAt: string | null; lateMinutes: number; method: string | null }
const OPTIONS: [string, string, string][] = [['PRESENT', 'P', 'Present'], ['LATE', 'L', 'Late'], ['ABSENT', 'A', 'Absent'], ['EXCUSED', 'E', 'Excused']];

/** The class register. Admins can open any class; teachers see only their own. */
export function StudentRegister({ title = 'Student register' }: { title?: string }) {
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [classId, setClassId] = useState('');
    const [date, setDate] = useState(todayStr());
    const [rows, setRows] = useState<Row[]>([]);
    const [edits, setEdits] = useState<Record<string, { status?: string; note?: string }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState('');

    useEffect(() => { axios.get(`${ATT_API}/register-classes`).then(r => { setClasses(r.data.classes); if (r.data.classes[0]) setClassId(r.data.classes[0].id); }).catch(err => toast.error(apiError(err, 'Could not load classes.'))); }, []);

    const load = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        try { const r = await axios.get(`${ATT_API}/register`, { params: { classId, date } }); setRows(r.data.roster); setEdits({}); }
        catch (err) { toast.error(apiError(err, 'Could not load the register.')); setRows([]); }
        finally { setLoading(false); }
    }, [classId, date]);
    useEffect(() => { load(); }, [load]);

    const current = (r: Row) => edits[r.studentId]?.status ?? r.status;
    const counts = useMemo(() => { const c: Record<string, number> = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0, NONE: 0 }; rows.forEach(r => { c[current(r) || 'NONE']++; }); return c; }, [rows, edits]); // eslint-disable-line react-hooks/exhaustive-deps
    const dirty = Object.keys(edits).length;

    const setEdit = (id: string, patch: { status?: string; note?: string }) => setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }));
    const markAll = (status: string) => setEdits(e => { const n = { ...e }; rows.forEach(r => { n[r.studentId] = { ...n[r.studentId], status }; }); return n; });

    const save = async () => {
        const records = rows.filter(r => current(r)).map(r => ({ studentId: r.studentId, status: current(r), note: edits[r.studentId]?.note ?? r.note }));
        if (!records.length) return toast.error('Mark at least one student first.');
        setSaving(true);
        try { const r = await axios.post(`${ATT_API}/register`, { classId, date, records }); toast.success(r.data.msg); await load(); }
        catch (err) { toast.error(apiError(err, 'Could not save the register.')); } finally { setSaving(false); }
    };

    const event = async (r: Row, action: 'SIGN_IN' | 'SIGN_OUT') => {
        setBusyId(r.studentId + action);
        try { const res = await axios.post(`${ATT_API}/event`, { type: 'student', id: r.studentId, action }); toast.success(res.data.msg); await load(); }
        catch (err) { toast.error(apiError(err, 'Could not record that.')); } finally { setBusyId(''); }
    };

    return (
        <div className="space-y-5">
            <div><h1 className="text-2xl font-bold text-slate-800">{title}</h1><p className="text-sm text-slate-500">Tick each student, or use Sign in / Sign out to record the time. Parents are alerted as you save.</p></div>

            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Class</span>
                    <select className={`${inputCls} !w-52`} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Date</span><input type="date" max={todayStr()} className={`${inputCls} !w-44`} value={date} onChange={e => setDate(e.target.value)} /></label>
                <div className="ml-auto flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')} disabled={!rows.length}><CheckCheck /> All present</Button>
                    <Button size="sm" onClick={save} disabled={saving || !rows.length}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save register{dirty ? ` (${dirty})` : ''}</Button>
                </div>
            </div>

            {rows.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {OPTIONS.map(([k, , l]) => <span key={k} className={cn('rounded-full px-3 py-1', STATUS_STYLE[k])}>{l} {counts[k]}</span>)}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Not marked {counts.NONE}</span>
                </div>
            )}

            {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : rows.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">{classId ? 'No students in this class.' : 'Choose a class.'}</p>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="w-10 p-2.5 text-left">#</th><th className="p-2.5 text-left">Student</th><th className="p-2.5 text-left">Status</th><th className="p-2.5 text-left">Sign in / out</th><th className="p-2.5 text-left">Note</th></tr></thead>
                        <tbody>{rows.map((r, i) => (
                            <tr key={r.studentId} className="border-t border-slate-100">
                                <td className="p-2.5 text-slate-400">{i + 1}</td>
                                <td className="p-2.5"><p className="font-semibold text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.admissionNo}</p></td>
                                <td className="p-2.5"><div className="flex gap-1">{OPTIONS.map(([k, short, l]) => { const on = current(r) === k; return <button key={k} type="button" title={l} onClick={() => setEdit(r.studentId, { status: k })} className={cn('h-8 w-8 rounded-lg border-2 text-xs font-bold transition', on ? `${STATUS_STYLE[k]} border-current` : 'border-slate-200 text-slate-400 hover:border-slate-300')}>{short}</button>; })}</div></td>
                                <td className="p-2.5"><div className="flex items-center gap-1.5 text-xs">
                                    {r.checkInAt ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">in {fmtTime(r.checkInAt)}</span> : <button className="flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 font-semibold text-slate-600 hover:border-emerald-400" disabled={!!busyId || date !== todayStr()} onClick={() => event(r, 'SIGN_IN')}>{busyId === r.studentId + 'SIGN_IN' ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />} In</button>}
                                    {r.checkOutAt ? <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">out {fmtTime(r.checkOutAt)}</span> : r.checkInAt ? <button className="flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 font-semibold text-slate-600 hover:border-slate-400" disabled={!!busyId || date !== todayStr()} onClick={() => event(r, 'SIGN_OUT')}>{busyId === r.studentId + 'SIGN_OUT' ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />} Out</button> : null}
                                    {r.lateMinutes > 0 && <span className="text-amber-600">{r.lateMinutes} min late</span>}</div></td>
                                <td className="p-2.5"><input className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-[#1E4DA6]" placeholder="Note" value={edits[r.studentId]?.note ?? r.note ?? ''} onChange={e => setEdit(r.studentId, { note: e.target.value })} /></td>
                            </tr>))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
