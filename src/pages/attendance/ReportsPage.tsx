import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2, Printer, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { mobileSafePrint } from '../../lib/printUtils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ATT_API, STATUS_STYLE, apiError, defaultPeriod, downloadFile, fmtDay, fmtTime, inputCls, naira, periodParams, statusLabel, type PeriodQuery } from './api';
import { PeriodPicker } from './PeriodPicker';

type Scope = 'school' | 'class' | 'student' | 'staff-all' | 'staff-one';
interface Report { kind: 'staff' | 'students'; title: string; period: { from: string; to: string; label: string }; totals: Record<string, number | null>; head: string[]; body: (string | number)[][]; rows: any[] }

const SCOPES: [Scope, string][] = [['school', 'Whole school (students)'], ['class', 'One class'], ['student', 'One student'], ['staff-all', 'All staff'], ['staff-one', 'One staff member']];

/** Attendance statistics for the whole school, a class, a person or all staff, over any period, with print and downloads. */
export default function ReportsPage() {
    const [scope, setScope] = useState<Scope>('school');
    const [period, setPeriod] = useState<PeriodQuery>(defaultPeriod());
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [classId, setClassId] = useState('');
    const [staffList, setStaffList] = useState<{ staffId: string; name: string }[]>([]);
    const [staffId, setStaffId] = useState('');
    const [studentId, setStudentId] = useState('');
    const [students, setStudents] = useState<{ studentId: string; name: string }[]>([]);
    const [data, setData] = useState<Report | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState('');
    const [detail, setDetail] = useState<{ type: 'staff' | 'student'; id: string; name: string } | null>(null);

    useEffect(() => {
        axios.get(`${ATT_API}/register-classes`).then(r => { setClasses(r.data.classes); if (r.data.classes[0]) setClassId(r.data.classes[0].id); }).catch(() => { });
        axios.get(`${ATT_API}/staff-rules`).then(r => { setStaffList(r.data.staff); if (r.data.staff[0]) setStaffId(r.data.staff[0].staffId); }).catch(() => { });
    }, []);

    // students of the chosen class, for the "one student" picker
    useEffect(() => {
        if (scope !== 'student' || !classId) return;
        axios.get(`${ATT_API}/reports`, { params: { kind: 'students', classId, period: 'day' } }).then(r => { setStudents(r.data.rows.map((x: any) => ({ studentId: x.studentId, name: x.name }))); setStudentId(s => s || r.data.rows[0]?.studentId || ''); }).catch(() => { });
    }, [scope, classId]);

    const query = useMemo(() => {
        const base: Record<string, string> = { ...periodParams(period) };
        if (scope === 'staff-all' || scope === 'staff-one') { base.kind = 'staff'; if (scope === 'staff-one') base.staffId = staffId; }
        else { base.kind = 'students'; if (scope === 'class') base.classId = classId; if (scope === 'student') { base.classId = classId; base.studentId = studentId; } }
        return base;
    }, [scope, period, classId, staffId, studentId]);

    const ready = (scope !== 'class' || classId) && (scope !== 'student' || studentId) && (scope !== 'staff-one' || staffId) && (period.period !== 'term' || period.termId) && (period.period !== 'session' || period.sessionId);

    const load = useCallback(async () => {
        if (!ready) return;
        setLoading(true);
        try { const r = await axios.get(`${ATT_API}/reports`, { params: query }); setData(r.data); }
        catch (err) { toast.error(apiError(err, 'Could not build the report.')); setData(null); } finally { setLoading(false); }
    }, [query, ready]);
    useEffect(() => { load(); }, [load]);

    const exp = async (format: 'xlsx' | 'pdf') => { setBusy(format); try { await downloadFile('/reports/export', { ...query, format }, `attendance.${format}`); } catch (e: any) { toast.error(e.message); } finally { setBusy(''); } };
    const isStaff = data?.kind === 'staff';

    return (
        <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
            <div><h1 className="text-2xl font-bold text-slate-800">Attendance reports</h1><p className="text-sm text-slate-500">Choose who and when. Download to Excel or PDF, or print. Click a name for that person's day-by-day record.</p></div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Report on</span><select className={`${inputCls} !w-60`} value={scope} onChange={e => setScope(e.target.value as Scope)}>{SCOPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                    {(scope === 'class' || scope === 'student') && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Class</span><select className={`${inputCls} !w-48`} value={classId} onChange={e => { setClassId(e.target.value); setStudentId(''); }}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
                    {scope === 'student' && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Student</span><select className={`${inputCls} !w-56`} value={studentId} onChange={e => setStudentId(e.target.value)}>{students.map(s => <option key={s.studentId} value={s.studentId}>{s.name}</option>)}</select></label>}
                    {scope === 'staff-one' && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Staff member</span><select className={`${inputCls} !w-56`} value={staffId} onChange={e => setStaffId(e.target.value)}>{staffList.map(s => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}</select></label>}
                </div>
                <PeriodPicker value={period} onChange={setPeriod} />
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <Button size="sm" variant="outline" disabled={!data || !!busy} onClick={() => exp('xlsx')}>{busy === 'xlsx' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Excel</Button>
                    <Button size="sm" variant="outline" disabled={!data || !!busy} onClick={() => exp('pdf')}>{busy === 'pdf' ? <Loader2 className="animate-spin" /> : <Download />} PDF</Button>
                    <Button size="sm" variant="outline" disabled={!data} onClick={() => mobileSafePrint('att-report-print', '@page{size:landscape;margin:10mm}')}><Printer /> Print</Button>
                </div>
            </div>

            {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : !data ? <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">Choose what to report on.</p> : (
                <div id="att-report-print" className="space-y-4">
                    <div><h2 className="text-lg font-bold text-slate-800">{data.title}</h2><p className="text-xs text-slate-500">{data.period.label} · {data.period.from} to {data.period.to}</p></div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {(isStaff
                            ? [['Staff', data.totals.staff], ['Present', data.totals.present], ['Late', data.totals.late], ['Absent', data.totals.absent], ['Late minutes', data.totals.lateMinutes], ['Deductions', naira(Number(data.totals.deduction))]]
                            : [['Students', data.totals.students], ['Present', data.totals.present], ['Late', data.totals.late], ['Absent', data.totals.absent], ['Excused', data.totals.excused], ['Attendance', data.totals.rate !== null ? `${data.totals.rate}%` : '—']]
                        ).map(([l, v]) => <div key={String(l)} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{l}</p><p className="text-xl font-bold text-slate-800">{v ?? '—'}</p></div>)}
                    </div>
                    {data.rows.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">No records for this selection.</p> : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500"><tr>{data.head.map((h, i) => <th key={i} className={cn('p-2.5', i === 0 ? 'text-left' : 'text-center')}>{h}</th>)}</tr></thead>
                                <tbody>{data.body.map((r, i) => { const row = data.rows[i]; return (
                                    <tr key={i} className="border-t border-slate-100">{r.map((c, j) => <td key={j} className={cn('p-2.5', j === 0 ? 'text-left' : 'text-center text-slate-600')}>
                                        {j === 0 ? <button className="font-semibold text-slate-800 hover:text-[#1E4DA6] hover:underline print:no-underline" onClick={() => setDetail({ type: isStaff ? 'staff' : 'student', id: isStaff ? row.staffId : row.studentId, name: String(c) })}>{c}</button> : c}</td>)}</tr>); })}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {detail && <PersonDetail person={detail} period={period} onClose={() => setDetail(null)} />}
        </div>
    );
}

function PersonDetail({ person, period, onClose }: { person: { type: 'staff' | 'student'; id: string; name: string }; period: PeriodQuery; onClose: () => void }) {
    const [d, setD] = useState<any>(null);
    const [busy, setBusy] = useState('');
    const q = { type: person.type, id: person.id, ...periodParams(period) };
    useEffect(() => { axios.get(`${ATT_API}/reports/person`, { params: q }).then(r => setD(r.data)).catch(err => { toast.error(apiError(err, 'Could not load this record.')); onClose(); }); /* eslint-disable-next-line */ }, []);
    const exp = async (format: 'xlsx' | 'pdf') => { setBusy(format); try { await downloadFile('/reports/export', { kind: 'person', ...q, format }, `${person.name}.${format}`); } catch (e: any) { toast.error(e.message); } finally { setBusy(''); } };
    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>{person.name}</DialogTitle><DialogDescription>{d?.period?.label || 'Loading…'}</DialogDescription></DialogHeader>
                {!d ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1E4DA6]" /> : (<>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">{[['Present', d.summary?.present], ['Late', d.summary?.late], ['Absent', d.summary?.absent], person.type === 'staff' ? ['Half day', d.summary?.halfDay] : ['Excused', d.summary?.excused]].map(([l, v]) => <span key={String(l)} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{l} {v ?? 0}</span>)}
                        {person.type === 'staff' && d.summary?.deduction?.total > 0 && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Deduction {naira(d.summary.deduction.total)}</span>}</div>
                    <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">In</th><th className="p-2 text-left">Out</th><th className="p-2 text-left">Note</th></tr></thead>
                        <tbody>{d.records.map((r: any) => <tr key={r.id} className="border-t border-slate-100"><td className="p-2">{fmtDay(r.date)}</td><td className="p-2"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_STYLE[r.status])}>{statusLabel(r.status)}</span>{r.lateMinutes > 0 && <span className="ml-1 text-xs text-amber-600">{r.lateMinutes}m</span>}</td><td className="p-2 text-xs">{fmtTime(r.checkInTime || r.checkInAt)}</td><td className="p-2 text-xs">{fmtTime(r.checkOutTime || r.checkOutAt)}</td><td className="p-2 text-xs text-slate-500">{r.note}</td></tr>)}
                            {d.records.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-sm text-slate-400">No records in this period.</td></tr>}</tbody></table></div>
                    <div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={!!busy} onClick={() => exp('xlsx')}><FileSpreadsheet /> Excel</Button><Button size="sm" variant="outline" disabled={!!busy} onClick={() => exp('pdf')}><Download /> PDF</Button><Button size="sm" variant="ghost" onClick={onClose}><X /> Close</Button></div></>)}
            </DialogContent>
        </Dialog>
    );
}
