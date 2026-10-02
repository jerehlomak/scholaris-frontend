import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Loader2, MapPin, RefreshCw, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { ATT_API, STATUS_STYLE, apiError, inputCls, statusLabel, todayStr } from './api';

interface Log { id: string; userType: string; personName: string; groupName: string | null; event: string; status: string | null; method: string; at: string; date: string; lateMinutes: number; distanceM: number | null; byName: string | null; note: string | null }
const METHOD: Record<string, string> = { REGISTER: 'Register', CARD: 'Card scan', WALL_QR: 'Wall code', LOCATION: 'Location', ADMIN: 'Admin', AUTO: 'Automatic' };
const EVENT: Record<string, string> = { SIGN_IN: 'Signed in', SIGN_OUT: 'Signed out', MARKED: 'Marked' };

/** Every sign-in, sign-out and register marking in the school, newest first. */
export default function LogsPage() {
    const [f, setF] = useState({ from: todayStr(), to: todayStr(), userType: '', event: '', method: '', q: '' });
    const [page, setPage] = useState(1);
    const [data, setData] = useState<{ logs: Log[]; total: number; pages: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [live, setLive] = useState(true);

    const load = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        try { const r = await axios.get(`${ATT_API}/logs`, { params: { ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page } }); setData(r.data); }
        catch (err) { toast.error(apiError(err, 'Could not load the log.')); } finally { setLoading(false); }
    }, [f, page]);

    useEffect(() => { const t = setTimeout(() => load(), f.q ? 300 : 0); return () => clearTimeout(t); }, [load, f.q]);
    useEffect(() => { if (!live) return; const t = setInterval(() => load(true), 20000); return () => clearInterval(t); }, [live, load]);

    const set = (p: Partial<typeof f>) => { setF(x => ({ ...x, ...p })); setPage(1); };
    return (
        <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h1 className="text-2xl font-bold text-slate-800">Activity log</h1><p className="text-sm text-slate-500">Every sign-in and sign-out in the school, with how it happened. Turn on alerts in Settings to be told as they happen.</p></div>
                <div className="flex items-center gap-3 text-xs text-slate-500"><label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" className="accent-[#1E4DA6]" checked={live} onChange={e => setLive(e.target.checked)} /> Refresh every 20s</label><Button size="sm" variant="outline" onClick={() => load()}><RefreshCw /></Button></div>
            </div>
            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-3 lg:grid-cols-6">
                <input type="date" className={inputCls} value={f.from} onChange={e => set({ from: e.target.value })} aria-label="From" />
                <input type="date" className={inputCls} value={f.to} onChange={e => set({ to: e.target.value })} aria-label="To" />
                <select className={inputCls} value={f.userType} onChange={e => set({ userType: e.target.value })}><option value="">Staff and students</option><option value="STAFF">Staff</option><option value="STUDENT">Students</option></select>
                <select className={inputCls} value={f.event} onChange={e => set({ event: e.target.value })}><option value="">All events</option><option value="SIGN_IN">Sign-ins</option><option value="SIGN_OUT">Sign-outs</option><option value="MARKED">Register marks</option></select>
                <select className={inputCls} value={f.method} onChange={e => set({ method: e.target.value })}><option value="">Any method</option>{Object.entries(METHOD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search name" value={f.q} onChange={e => set({ q: e.target.value })} /></div>
            </div>
            {loading && !data ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : !data || data.logs.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">No activity for these filters.</p> : (
                <>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2.5 text-left">Time</th><th className="p-2.5 text-left">Who</th><th className="p-2.5 text-left">Event</th><th className="p-2.5 text-left">Status</th><th className="p-2.5 text-left">Method</th><th className="p-2.5 text-left">Details</th></tr></thead>
                            <tbody>{data.logs.map(l => (
                                <tr key={l.id} className="border-t border-slate-100">
                                    <td className="p-2.5 whitespace-nowrap text-xs text-slate-500">{new Date(l.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} <span className="font-semibold text-slate-700">{new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                    <td className="p-2.5"><p className="font-semibold text-slate-800">{l.personName}</p><p className="text-xs text-slate-400">{l.userType === 'STAFF' ? 'Staff' : 'Student'}{l.groupName ? ` · ${l.groupName}` : ''}</p></td>
                                    <td className="p-2.5 text-slate-700">{EVENT[l.event]}</td>
                                    <td className="p-2.5">{l.status && <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_STYLE[l.status])}>{statusLabel(l.status)}</span>}</td>
                                    <td className="p-2.5 text-xs text-slate-600">{METHOD[l.method] || l.method}</td>
                                    <td className="p-2.5 text-xs text-slate-500">{[l.event === 'SIGN_IN' && l.lateMinutes > 0 && `${l.lateMinutes} min late`, l.event === 'SIGN_OUT' && l.lateMinutes > 0 && `${l.lateMinutes} min before closing`, l.byName && l.method !== 'WALL_QR' && `by ${l.byName}`, l.note].filter(Boolean).join(' · ')}{l.distanceM !== null && <span className="ml-1 inline-flex items-center gap-0.5 text-slate-400"><MapPin className="h-3 w-3" />{l.distanceM} m from school</span>}</td>
                                </tr>))}</tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500"><span>{data.total} entr{data.total === 1 ? 'y' : 'ies'}</span>
                        <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft /></Button><span>Page {page} of {data.pages}</span><Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight /></Button></div></div>
                </>
            )}
        </div>
    );
}
