import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, Clock, Loader2, LogIn, LogOut, MapPin, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { ATT_API, STATUS_STYLE, apiError, fmtTime, statusLabel } from './api';

interface Status { date: string; name: string; today: { status: string; checkInTime: string | null; checkOutTime: string | null; lateMinutes: number } | null; next: 'SIGN_IN' | 'SIGN_OUT' | 'DONE'; isWorkDay: boolean; exempt: boolean; startTime: string; closeTime: string; geofence: { enabled: boolean; radiusMeters: number }; methods: { wallQr: boolean; locationOnly: boolean } }
type Outcome = { ok: boolean; msg: string; status?: string; action?: string };

const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This phone cannot share its location.'));
    navigator.geolocation.getCurrentPosition(resolve, e => reject(new Error(e.code === 1 ? 'Location access is blocked. Allow location for this site in your browser settings, then try again.' : e.code === 3 ? 'Your location took too long. Move to an open area and try again.' : 'Could not find your location.')), { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 });
});

/**
 * Where the wall QR code leads. A signed-in member of staff taps the button, shares their location, and is signed in or out.
 * Someone who is not signed in is sent to the login page first and brought back here afterwards.
 */
export default function ScanPage() {
    const { user, isLoading } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const token = new URLSearchParams(loc.search).get('t') || '';
    const [st, setSt] = useState<Status | null>(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState('');
    const [out, setOut] = useState<Outcome | null>(null);

    useEffect(() => {
        if (isLoading || !user) return;
        axios.get(`${ATT_API}/self/status`).then(r => setSt(r.data)).catch(e => setErr(e?.response?.status === 401 ? 'Only school staff can sign in with this code.' : apiError(e, 'Could not load your attendance.')));
    }, [isLoading, user]);

    const goLogin = () => { try { sessionStorage.setItem('attendance_scan_return', `${loc.pathname}${loc.search}`); } catch { /* ignore */ } nav('/portal/login'); };

    const run = async () => {
        if (!st) return;
        setBusy(true); setOut(null);
        try {
            setPhase('Finding your location…');
            let geo: { lat?: number; lng?: number; accuracy?: number } = {};
            if (st.geofence.enabled || st.methods.locationOnly) { const p = await getPosition(); geo = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }; }
            else { try { const p = await getPosition(); geo = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }; } catch { /* location is optional when the school does not check it */ } }
            setPhase('Signing you in…');
            const r = await axios.post(`${ATT_API}/self/scan`, { token: token || undefined, ...geo });
            setOut({ ok: true, msg: r.data.msg, status: r.data.status, action: r.data.action });
            const fresh = await axios.get(`${ATT_API}/self/status`); setSt(fresh.data);
        } catch (e: any) { setOut({ ok: false, msg: e?.message && !e.response ? e.message : apiError(e, 'Could not sign you in.') }); }
        finally { setBusy(false); setPhase(''); }
    };

    const Shell = ({ children }: { children: React.ReactNode }) => <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">{children}</div></div>;

    if (isLoading) return <Shell><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1E4DA6]" /></Shell>;
    if (!user) return (
        <Shell><ShieldCheck className="mx-auto mb-3 h-12 w-12 text-[#1E4DA6]" /><h1 className="text-xl font-bold text-slate-800">Staff attendance</h1><p className="mt-2 text-sm text-slate-500">Sign in to your account first. You will come straight back here to sign in for work.</p><Button size="lg" className="mt-5 w-full" onClick={goLogin}><LogIn /> Log in</Button></Shell>
    );
    if (err) return <Shell><AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" /><p className="font-semibold text-slate-800">{err}</p><Link to="/" className="mt-4 inline-block text-sm font-bold text-[#1E4DA6]">Back to my dashboard</Link></Shell>;
    if (!st) return <Shell><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1E4DA6]" /></Shell>;

    const needsCode = st.methods.wallQr && !token && !st.methods.locationOnly;
    const label = st.next === 'SIGN_IN' ? 'Sign in' : st.next === 'SIGN_OUT' ? 'Sign out' : 'Done for today';
    return (
        <Shell>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Staff attendance</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">Hello, {st.name.split(' ')[0]}</h1>
            <p className="text-sm text-slate-500">{new Date(`${st.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · work {st.startTime} – {st.closeTime}</p>

            <div className="my-5 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase text-slate-400">Signed in</p><p className="mt-0.5 text-lg font-bold text-slate-800">{st.today?.checkInTime ? fmtTime(st.today.checkInTime) : '—'}</p>{st.today && st.today.status && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', STATUS_STYLE[st.today.status])}>{statusLabel(st.today.status)}</span>}</div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase text-slate-400">Signed out</p><p className="mt-0.5 text-lg font-bold text-slate-800">{st.today?.checkOutTime ? fmtTime(st.today.checkOutTime) : '—'}</p></div>
            </div>

            {out && <div className={cn('mb-4 flex items-start gap-2 rounded-xl p-3 text-left text-sm font-semibold', out.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700')}>{out.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}<span>{out.msg}</span></div>}
            {st.exempt && <p className="mb-4 rounded-xl bg-violet-50 p-3 text-sm text-violet-700">You are exempt from attendance rules, but you can still sign in and out.</p>}
            {needsCode && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-800">To sign in or out, scan the code on the school wall with your phone camera.</p>}

            <Button size="lg" className="h-14 w-full text-base" disabled={busy || st.next === 'DONE' || needsCode} onClick={run}>
                {busy ? <Loader2 className="animate-spin" /> : st.next === 'SIGN_OUT' ? <LogOut /> : st.next === 'DONE' ? <CheckCircle2 /> : <LogIn />} {busy ? phase : label}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">{st.geofence.enabled ? <><MapPin className="h-3.5 w-3.5" /> You must be within {st.geofence.radiusMeters} m of the school.</> : <><Clock className="h-3.5 w-3.5" /> Your phone's clock is not used; the school's time is.</>}</p>
            <Link to="/teacher/attendance" className="mt-4 inline-block text-sm font-bold text-[#1E4DA6]">My attendance record</Link>
        </Shell>
    );
}
