import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCheck, Loader2, LogIn, LogOut, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { ATT_API, STATUS_STYLE, apiError, inputCls, todayStr } from './api';

interface Row { staffId: string; name: string; employeeId: string; department: string; exempt: boolean; status: string | null; excused: boolean; checkIn: string; checkOut: string; lateMinutes: number; note: string; method: string | null }
type Edit = Partial<Pick<Row, 'status' | 'excused' | 'checkIn' | 'checkOut' | 'note'>>;
const STATUSES: [string, string][] = [['PRESENT', 'Present'], ['LATE', 'Late'], ['HALF_DAY', 'Half day'], ['ABSENT', 'Absent']];

/** The administrator's staff tick sheet: mark anyone present, late, half day or absent (with or without a reason), with times. */
export function StaffRegister() {
    const [date, setDate] = useState(todayStr());
    const [rows, setRows] = useState<Row[]>([]);
    const [edits, setEdits] = useState<Record<string, Edit>>({});
    const [workDay, setWorkDay] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try { const r = await axios.get(`${ATT_API}/staff-register`, { params: { date } }); setRows(r.data.roster); setWorkDay(r.data.isWorkDay); setEdits({}); }
        catch (err) { toast.error(apiError(err, 'Could not load staff.')); } finally { setLoading(false); }
    }, [date]);
    useEffect(() => { load(); }, [load]);

    const val = <K extends keyof Edit>(r: Row, k: K) => (edits[r.staffId]?.[k] ?? (r as any)[k]) as any;
    const setEdit = (id: string, patch: Edit) => setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }));
    const dirty = Object.keys(edits).length;

    const save = async () => {
        const records = rows.filter(r => val(r, 'status')).map(r => ({ staffId: r.staffId, status: val(r, 'status'), checkIn: val(r, 'checkIn') || undefined, checkOut: val(r, 'checkOut') || undefined, excused: val(r, 'excused'), note: val(r, 'note') }));
        if (!records.length) return toast.error('Mark at least one person first.');
        setSaving(true);
        try { const r = await axios.post(`${ATT_API}/staff-register`, { date, records }); toast.success(r.data.msg); await load(); }
        catch (err) { toast.error(apiError(err, 'Could not save.')); } finally { setSaving(false); }
    };
    const event = async (r: Row, action: 'SIGN_IN' | 'SIGN_OUT') => {
        setBusyId(r.staffId + action);
        try { const res = await axios.post(`${ATT_API}/event`, { type: 'staff', id: r.staffId, action }); toast.success(res.data.msg); await load(); }
        catch (err) { toast.error(apiError(err, 'Could not record that.')); } finally { setBusyId(''); }
    };

    return (
        <div className="space-y-5">
            <div><h1 className="text-2xl font-bold text-slate-800">Staff register</h1><p className="text-sm text-slate-500">Tick staff attendance by hand (besides the wall code and cards). Lateness is worked out from the times and counts towards salary deductions.</p></div>
            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Date</span><input type="date" max={todayStr()} className={`${inputCls} !w-44`} value={date} onChange={e => setDate(e.target.value)} /></label>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" disabled={!rows.length} onClick={() => setEdits(e => { const n = { ...e }; rows.forEach(r => { if (!r.status && !r.exempt) n[r.staffId] = { ...n[r.staffId], status: 'PRESENT' }; }); return n; })}><CheckCheck /> Unmarked: present</Button>
                    <Button size="sm" disabled={saving || !rows.length} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save{dirty ? ` (${dirty})` : ''}</Button>
                </div>
            </div>
            {!workDay && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">This is not a working day (weekend or holiday), so absences are not counted.</p>}

            {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2.5 text-left">Staff</th><th className="p-2.5 text-left">Status</th><th className="p-2.5 text-left">Sign in</th><th className="p-2.5 text-left">Sign out</th><th className="p-2.5 text-left">Reason / note</th><th className="p-2.5" /></tr></thead>
                        <tbody>{rows.map(r => { const st = val(r, 'status'); return (
                            <tr key={r.staffId} className={cn('border-t border-slate-100', r.exempt && 'opacity-50')}>
                                <td className="p-2.5"><p className="font-semibold text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{[r.employeeId, r.department, r.exempt && 'exempt'].filter(Boolean).join(' · ')}</p></td>
                                <td className="p-2.5"><select className={cn('h-9 rounded-lg border px-2 text-sm outline-none', st ? `${STATUS_STYLE[st]} border-transparent font-semibold` : 'border-slate-200')} value={st || ''} disabled={r.exempt} onChange={e => setEdit(r.staffId, { status: e.target.value || null })}><option value="">Not marked</option>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                                    {r.lateMinutes > 0 && <span className="ml-2 text-xs text-amber-600">{r.lateMinutes} min late</span>}</td>
                                <td className="p-2.5"><input type="time" className="h-9 rounded-lg border border-slate-200 px-2 text-sm" disabled={!st || st === 'ABSENT'} value={val(r, 'checkIn')} onChange={e => setEdit(r.staffId, { checkIn: e.target.value })} /></td>
                                <td className="p-2.5"><input type="time" className="h-9 rounded-lg border border-slate-200 px-2 text-sm" disabled={!st || st === 'ABSENT'} value={val(r, 'checkOut')} onChange={e => setEdit(r.staffId, { checkOut: e.target.value })} /></td>
                                <td className="p-2.5"><div className="flex items-center gap-2"><input className="h-9 w-full min-w-[140px] rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#1E4DA6]" placeholder="Note" value={val(r, 'note') || ''} onChange={e => setEdit(r.staffId, { note: e.target.value })} />
                                    {st === 'ABSENT' && <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-slate-600" title="Excused absences are not deducted"><input type="checkbox" className="accent-[#1E4DA6]" checked={!!val(r, 'excused')} onChange={e => setEdit(r.staffId, { excused: e.target.checked })} /> excused</label>}</div></td>
                                <td className="p-2.5"><div className="flex gap-1">
                                    {!r.checkIn && date === todayStr() && <Button size="sm" variant="outline" disabled={!!busyId || r.exempt} onClick={() => event(r, 'SIGN_IN')} title="Sign in now">{busyId === r.staffId + 'SIGN_IN' ? <Loader2 className="animate-spin" /> : <LogIn />}</Button>}
                                    {r.checkIn && !r.checkOut && date === todayStr() && <Button size="sm" variant="outline" disabled={!!busyId} onClick={() => event(r, 'SIGN_OUT')} title="Sign out now">{busyId === r.staffId + 'SIGN_OUT' ? <Loader2 className="animate-spin" /> : <LogOut />}</Button>}</div></td>
                            </tr>); })}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
