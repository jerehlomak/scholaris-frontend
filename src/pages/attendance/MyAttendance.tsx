import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Loader2, LogIn, LogOut, QrCode } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ATT_API, STATUS_STYLE, apiError, defaultPeriod, fmtTime, periodParams, statusLabel, type PeriodQuery } from './api';
import { PeriodPicker } from './PeriodPicker';
import { RecordsView } from './RecordsView';
import { PrefsPanel } from './PrefsPanel';

interface Status { date: string; today: { status: string; checkInTime: string | null; checkOutTime: string | null; lateMinutes: number } | null; next: 'SIGN_IN' | 'SIGN_OUT' | 'DONE'; isWorkDay: boolean; startTime: string; closeTime: string; geofence: { enabled: boolean; radiusMeters: number }; methods: { wallQr: boolean; locationOnly: boolean } }

/** A staff member's own attendance: today, history over any period, and personal settings. */
export function MyStaffAttendance() {
    const [st, setSt] = useState<Status | null>(null);
    const [period, setPeriod] = useState<PeriodQuery>(defaultPeriod());
    const [data, setData] = useState<{ summary: any; records: any[]; period: { label: string } } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { axios.get(`${ATT_API}/self/status`).then(r => setSt(r.data)).catch(() => setSt(null)); }, []);
    const load = useCallback(() => {
        setLoading(true);
        axios.get(`${ATT_API}/me`, { params: periodParams(period) }).then(r => setData(r.data)).catch(err => { toast.error(apiError(err, 'Could not load your attendance.')); setData(null); }).finally(() => setLoading(false));
    }, [period]);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-6">
            {st && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Today</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                {st.today?.status ? <span className={cn('rounded-full px-3 py-1 text-sm font-bold', STATUS_STYLE[st.today.status])}>{statusLabel(st.today.status)}{st.today.lateMinutes > 0 ? ` · ${st.today.lateMinutes} min late` : ''}</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">Not signed in</span>}
                                <span className="flex items-center gap-1 text-sm text-slate-600"><LogIn className="h-4 w-4 text-emerald-600" /> {st.today?.checkInTime ? fmtTime(st.today.checkInTime) : '—'}</span>
                                <span className="flex items-center gap-1 text-sm text-slate-600"><LogOut className="h-4 w-4 text-slate-500" /> {st.today?.checkOutTime ? fmtTime(st.today.checkOutTime) : '—'}</span>
                            </div>
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" /> Work {st.startTime} – {st.closeTime}{!st.isWorkDay && ' · today is not a working day'}</p></div>
                        {st.next === 'DONE' ? <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-5 w-5" /> Done for today</span>
                            : <div className="text-right text-xs text-slate-500"><p className="mb-1.5 flex items-center justify-end gap-1.5"><QrCode className="h-4 w-4 text-[#1E4DA6]" /> Scan the code on the school wall to {st.next === 'SIGN_IN' ? 'sign in' : 'sign out'}</p>
                                {st.methods.locationOnly && <Link to="/attendance/scan" className="inline-block rounded-lg bg-[#1E4DA6] px-3 py-2 text-xs font-bold text-white">{st.next === 'SIGN_IN' ? 'Sign in with my location' : 'Sign out with my location'}</Link>}</div>}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4"><PeriodPicker value={period} onChange={setPeriod} /></div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : data && <><p className="text-sm font-semibold text-slate-600">{data.period.label}</p><RecordsView kind="staff" summary={data.summary} records={data.records} /></>}
            <PrefsPanel kind="staff" />
        </div>
    );
}

/** A student's own attendance record. */
export function MyStudentAttendance() {
    const [period, setPeriod] = useState<PeriodQuery>(defaultPeriod());
    const [data, setData] = useState<{ summary: any; records: any[]; period: { label: string } } | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        axios.get(`${ATT_API}/me`, { params: periodParams(period) }).then(r => setData(r.data)).catch(err => { toast.error(apiError(err, 'Could not load your attendance.')); setData(null); }).finally(() => setLoading(false));
    }, [period]);
    return (
        <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
            <div><h1 className="text-2xl font-bold text-slate-800">My attendance</h1><p className="text-sm text-slate-500">When you signed in and out, and how often you were present or late.</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4"><PeriodPicker value={period} onChange={setPeriod} /></div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : data && <><p className="text-sm font-semibold text-slate-600">{data.period.label}</p><RecordsView kind="student" summary={data.summary} records={data.records} /></>}
        </div>
    );
}
