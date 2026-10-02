import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, ClipboardList, GraduationCap, Loader2, QrCode, ScrollText, Settings2, UserCheck, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ATT_API, STATUS_STYLE, apiError, fmtDay, inputCls, statusLabel, todayStr } from './api';

interface Data {
    date: string; isToday: boolean; isWorkDay: boolean;
    students: { total: number; present: number; late: number; absent: number; excused: number; marked: number };
    staff: { total: number; signedIn: number; signedOut: number; late: number; halfDay: number; notYet: number; pendingNames: string[] };
    trend: { date: string; students: number; studentsMarked: number; staff: number; staffLate: number }[];
    recent: { id: string; personName: string; userType: string; event: string; status: string | null; at: string; method: string }[];
}

const Stat = ({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={cn('mt-0.5 text-2xl font-bold', tone || 'text-slate-800')}>{value}</p>{sub && <p className="text-xs text-slate-400">{sub}</p>}</div>
);

export default function Overview() {
    const [date, setDate] = useState(todayStr());
    const [d, setD] = useState<Data | null>(null);
    const [loading, setLoading] = useState(true);
    const load = useCallback(() => axios.get(`${ATT_API}/overview`, { params: { date } }).then(r => setD(r.data)).catch(err => toast.error(apiError(err, 'Could not load attendance.'))).finally(() => setLoading(false)), [date]);
    useEffect(() => { setLoading(true); load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

    if (loading || !d) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const rate = d.students.marked ? Math.round(((d.students.present + d.students.late) / Math.max(1, d.students.marked - d.students.excused)) * 100) : null;
    const LINKS: [string, string, typeof Users][] = [['/dashboard/attendance/students', 'Student register', GraduationCap], ['/dashboard/attendance/staff', 'Staff register', UserCheck], ['/dashboard/attendance/qr', 'Codes & cards', QrCode], ['/dashboard/attendance/logs', 'Activity log', ScrollText], ['/dashboard/attendance/reports', 'Reports', BarChart3], ['/dashboard/attendance/settings', 'Settings', Settings2]];

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><ClipboardList className="h-6 w-6 text-[#1E4DA6]" /> Attendance</h1><p className="text-sm text-slate-500">{d.isToday ? 'Today' : fmtDay(d.date)}{!d.isWorkDay && ' · not a working day'}</p></div>
                <input type="date" max={todayStr()} className={`${inputCls} !w-44`} value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Students present" value={d.students.present + d.students.late} sub={`of ${d.students.total}`} tone="text-emerald-600" />
                <Stat label="Students absent" value={d.students.absent} tone={d.students.absent ? 'text-rose-600' : undefined} />
                <Stat label="Students late" value={d.students.late} tone="text-amber-600" />
                <Stat label="Register rate" value={rate !== null ? `${rate}%` : '—'} sub={`${d.students.marked} marked`} />
                <Stat label="Staff signed in" value={d.staff.signedIn} sub={`of ${d.staff.total}`} tone="text-emerald-600" />
                <Stat label="Staff late" value={d.staff.late} tone={d.staff.late ? 'text-amber-600' : undefined} sub={`${d.staff.notYet} not in yet`} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
                    <p className="mb-2 text-sm font-bold text-slate-700">Last 14 days</p>
                    <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.trend.map(t => ({ ...t, label: fmtDay(t.date).replace(/^\w+, /, '') }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="students" name="Students present" fill="#1E4DA6" radius={[3, 3, 0, 0]} /><Bar dataKey="staff" name="Staff in" fill="#F5B800" radius={[3, 3, 0, 0]} />
                        </BarChart></ResponsiveContainer></div>
                </div>
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="mb-2 text-sm font-bold text-slate-700">Staff not signed in yet</p>
                        {d.staff.notYet === 0 ? <p className="text-sm text-emerald-600">Everyone is in.</p> : <><ul className="space-y-1 text-sm text-slate-700">{d.staff.pendingNames.map(n => <li key={n}>· {n}</li>)}</ul>{d.staff.notYet > d.staff.pendingNames.length && <p className="mt-1 text-xs text-slate-400">and {d.staff.notYet - d.staff.pendingNames.length} more</p>}</>}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-slate-700">Latest activity</p><Link to="/dashboard/attendance/logs" className="text-xs font-bold text-[#1E4DA6]">See all</Link></div>
                        {d.recent.length === 0 ? <p className="text-sm text-slate-400">Nothing yet.</p> : <ul className="space-y-1.5">{d.recent.map(l => (
                            <li key={l.id} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0 truncate"><span className="font-semibold text-slate-700">{l.personName}</span> <span className="text-xs text-slate-400">{l.event === 'SIGN_IN' ? 'in' : l.event === 'SIGN_OUT' ? 'out' : 'marked'}</span></span>
                                <span className="flex shrink-0 items-center gap-1.5">{l.status && <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', STATUS_STYLE[l.status])}>{statusLabel(l.status)}</span>}<span className="text-xs text-slate-400">{new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span></li>))}</ul>}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{LINKS.map(([to, label, Icon]) => <Link key={to} to={to} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-4 text-center text-xs font-bold text-slate-600 transition hover:border-[#1E4DA6]/40 hover:text-[#173F8C]"><Icon className="h-5 w-5 text-[#1E4DA6]" />{label}</Link>)}</div>
        </div>
    );
}
