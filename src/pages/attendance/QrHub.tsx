import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, Camera, CameraOff, CreditCard, Download, Loader2, MapPin, Printer, QrCode, RefreshCw, ScanLine, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';
import { mobileSafePrint } from '../../lib/printUtils';
import { Button } from '../../components/ui/button';
import { ATT_API, STATUS_STYLE, apiError, downloadFile, fmtTime, inputCls, statusLabel } from './api';
import QRManagement from '../dashboard/attendance/QRManagement';

type Tab = 'wall' | 'scan' | 'cards';

// ─── wall code ───────────────────────────────────────────────────────────────

function WallCode() {
    const [d, setD] = useState<{ url: string; png: string; version: number; rotatedAt: string; rotateDays: number; geofenceReady: boolean } | null>(null);
    const [busy, setBusy] = useState('');
    useEffect(() => { axios.get(`${ATT_API}/wall-qr`).then(r => setD(r.data)).catch(err => toast.error(apiError(err, 'Could not load the wall code.'))); }, []);

    const rotate = async () => {
        if (!window.confirm('Create a new wall code? The code currently on the wall stops working straight away, so you must print and replace it.')) return;
        setBusy('rotate');
        try { const r = await axios.post(`${ATT_API}/wall-qr/rotate`); setD(x => (x ? { ...x, ...r.data } : x)); toast.success(r.data.msg); }
        catch (err) { toast.error(apiError(err, 'Could not change the code.')); } finally { setBusy(''); }
    };
    const poster = async () => { setBusy('poster'); try { await downloadFile('/wall-qr/poster', {}, 'attendance_wall_qr.pdf'); } catch (e: any) { toast.error(e.message); } finally { setBusy(''); } };

    if (!d) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    return (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div id="wall-poster" className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Staff attendance</p>
                <img src={d.png} alt="Attendance QR code" className="mx-auto my-3 h-64 w-64" />
                <p className="font-bold text-slate-800">Scan to sign in or out</p>
                <p className="mt-1 text-xs text-slate-500">Open your phone's camera, point it here and tap the link.</p>
                <p className="mt-3 text-[11px] text-slate-400">Code {d.version} · issued {new Date(d.rotatedAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-4">
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-slate-700">Put it on the school wall</h3>
                    <p className="text-sm text-slate-600">Download the poster, print it and stick it where staff arrive. When a teacher arrives they scan it with their phone and sign in or out. Their phone must be at the school for it to work.</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button onClick={poster} disabled={!!busy}>{busy === 'poster' ? <Loader2 className="animate-spin" /> : <Download />} Poster (PDF)</Button>
                        <Button variant="outline" onClick={() => mobileSafePrint('wall-poster')}><Printer /> Print this</Button>
                        <Button variant="outline" onClick={rotate} disabled={!!busy}>{busy === 'rotate' ? <Loader2 className="animate-spin" /> : <RefreshCw />} Change the code</Button>
                    </div>
                    <p className="text-xs text-slate-500">{d.rotateDays ? `The code changes by itself every ${d.rotateDays} days and you are told when it does.` : 'The code stays the same until you change it. You can also make it change automatically in Settings.'}</p>
                </div>
                {d.geofenceReady
                    ? <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> The school location check is on, so staff cannot sign in from home or anywhere else.</p>
                    : <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> The school location is not set. Anyone who has a photo of this code could sign in from anywhere. <Link to="/dashboard/attendance/settings" className="font-bold underline">Set the school location</Link></p>}
                <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"><summary className="cursor-pointer font-semibold">The link inside the code</summary><p className="mt-2 break-all text-xs text-slate-500">{d.url}</p></details>
            </div>
        </div>
    );
}

// ─── card terminal ───────────────────────────────────────────────────────────

interface ScanResult { id: number; ok: boolean; name?: string; subtitle?: string; photo?: string | null; action?: string; status?: string; lateMinutes?: number; at?: string; type?: string; message?: string }

const beep = (ok: boolean) => {
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext; const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = ok ? 880 : 220; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + (ok ? 0.12 : 0.3));
    } catch { /* sound is optional */ }
};

function CardTerminal() {
    const [code, setCode] = useState('');
    const [action, setAction] = useState<'AUTO' | 'SIGN_IN' | 'SIGN_OUT'>('AUTO');
    const [busy, setBusy] = useState(false);
    const [feed, setFeed] = useState<ScanResult[]>([]);
    const [camera, setCamera] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const seq = useRef(0);
    const lastCode = useRef({ code: '', at: 0 });
    const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

    const submit = useCallback(async (value: string) => {
        const v = value.trim();
        if (!v) return;
        setBusy(true);
        const id = ++seq.current;
        try {
            const r = await axios.post(`${ATT_API}/scan/card`, { code: v, action: action === 'AUTO' ? undefined : action });
            setFeed(f => [{ id, ok: true, ...r.data }, ...f].slice(0, 12)); beep(true);
        } catch (err) { setFeed(f => [{ id, ok: false, message: apiError(err, 'Scan failed.') }, ...f].slice(0, 12)); beep(false); }
        finally { setBusy(false); setCode(''); inputRef.current?.focus(); }
    }, [action]);

    useEffect(() => { inputRef.current?.focus(); }, []);

    // optional camera scanning, where the browser can read QR codes
    useEffect(() => {
        if (!camera || !hasDetector) return;
        let stream: MediaStream | null = null; let timer: number; let stopped = false;
        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                const loop = async () => {
                    if (stopped || !videoRef.current) return;
                    try {
                        const found = await detector.detect(videoRef.current);
                        const raw = found[0]?.rawValue as string | undefined;
                        if (raw && !(raw === lastCode.current.code && Date.now() - lastCode.current.at < 4000)) { lastCode.current = { code: raw, at: Date.now() }; await submit(raw); }
                    } catch { /* keep looking */ }
                    timer = window.setTimeout(loop, 400);
                };
                loop();
            } catch { toast.error('Could not open the camera. Allow camera access, or use a card scanner / type the number.'); setCamera(false); }
        })();
        return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
    }, [camera, hasDetector, submit]);

    const latest = feed[0];
    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700"><ScanLine className="h-4 w-4 text-[#1E4DA6]" /> Scan a staff or student card</p>
                    <form onSubmit={e => { e.preventDefault(); submit(code); }} className="flex flex-wrap gap-2">
                        <input ref={inputRef} className={`${inputCls} !h-12 min-w-[220px] flex-1 !text-base`} value={code} onChange={e => setCode(e.target.value)} placeholder="Scan the card, or type an admission / staff number, then press Enter" autoComplete="off" />
                        <Button type="submit" size="lg" disabled={busy || !code.trim()}>{busy ? <Loader2 className="animate-spin" /> : <CreditCard />} Record</Button>
                    </form>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-500">Each scan:</span>
                        {([['AUTO', 'Sign in, then out'], ['SIGN_IN', 'Always sign in'], ['SIGN_OUT', 'Always sign out']] as const).map(([k, l]) => <button key={k} onClick={() => setAction(k)} className={cn('rounded-full border px-3 py-1 font-semibold', action === k ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-200 text-slate-600')}>{l}</button>)}
                        {hasDetector && <button onClick={() => setCamera(c => !c)} className={cn('ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold', camera ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600')}>{camera ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />} {camera ? 'Stop camera' : 'Use camera'}</button>}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">A USB or Bluetooth card scanner works as a keyboard: click the box and scan. {hasDetector ? '' : 'This browser cannot read QR codes with the camera; use a card scanner or type the number.'}</p>
                    {camera && <video ref={videoRef} muted playsInline className="mt-3 h-56 w-full rounded-xl bg-black object-cover" />}
                </div>

                {latest && (
                    <div className={cn('flex items-center gap-4 rounded-2xl border-2 p-5', latest.ok ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50')}>
                        {latest.ok ? (latest.photo ? <img src={latest.photo} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200 text-2xl font-bold text-emerald-800">{latest.name?.[0]}</span>) : <AlertTriangle className="h-10 w-10 text-rose-500" />}
                        <div className="min-w-0">
                            {latest.ok ? (<>
                                <p className="text-lg font-bold text-slate-800">{latest.name}</p><p className="text-xs text-slate-500">{latest.type === 'staff' ? 'Staff' : 'Student'} · {latest.subtitle}</p>
                                <p className="mt-1 text-sm font-semibold text-emerald-800">{latest.action === 'SIGN_IN' ? 'Signed in' : 'Signed out'} at {fmtTime(latest.at)}{latest.status === 'LATE' && latest.action === 'SIGN_IN' ? ` · late by ${latest.lateMinutes} min` : ''}</p>
                            </>) : <p className="font-semibold text-rose-700">{latest.message}</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">This session</p>
                {feed.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Scans appear here.</p> : (
                    <ul className="space-y-1.5">{feed.map(f => (
                        <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 text-sm">
                            {f.ok ? <><span className="min-w-0 truncate font-semibold text-slate-700">{f.name}</span><span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', f.action === 'SIGN_IN' ? STATUS_STYLE[f.status || 'PRESENT'] : 'bg-slate-100 text-slate-600')}>{f.action === 'SIGN_IN' ? statusLabel(f.status || 'PRESENT') : 'Out'}</span></>
                                : <span className="truncate text-xs text-rose-600">{f.message}</span>}
                        </li>))}</ul>)}
            </div>
        </div>
    );
}

export default function QrHub() {
    const [tab, setTab] = useState<Tab>('wall');
    const TABS: [Tab, string, typeof QrCode][] = [['wall', 'Wall code', QrCode], ['scan', 'Scan cards', ScanLine], ['cards', 'ID cards', CreditCard]];
    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><Wifi className="h-6 w-6 text-[#1E4DA6]" /> Sign-in codes and cards</h1>
                <p className="text-sm text-slate-500">Staff scan the wall code on their phones, or you scan their cards. Students are signed in by scanning their cards.</p></div>
            <div className="flex gap-1 border-b border-slate-200">{TABS.map(([k, l, Icon]) => <button key={k} onClick={() => setTab(k)} className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-bold', tab === k ? 'border-[#1E4DA6] text-[#173F8C]' : 'border-transparent text-slate-500 hover:text-slate-700')}><Icon className="h-4 w-4" /> {l}</button>)}</div>
            {tab === 'wall' && <WallCode />}
            {tab === 'scan' && <CardTerminal />}
            {tab === 'cards' && <QRManagement />}
        </div>
    );
}
