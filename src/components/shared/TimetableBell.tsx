import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Bell, CalendarClock, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Item { id: string; title: string; message: string; isRead: boolean; createdAt: string }

/** Top-bar bell for timetable alerts (class / exam reminders). Polls once a minute. */
export function TimetableBell({ timetablePath, calendar = false }: { timetablePath: string; calendar?: boolean }) {
    const [items, setItems] = useState<Item[]>([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const Icon: LucideIcon = calendar ? CalendarClock : Bell;

    const load = useCallback(() => {
        axios.get('/api/v1/timetable/inbox', { withCredentials: true })
            .then(r => { setItems(r.data.notifications); setUnread(r.data.unreadCount); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(load, 60000);
        return () => clearInterval(t);
    }, [load]);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const markAll = async () => {
        await axios.post('/api/v1/timetable/inbox/read-all', {}, { withCredentials: true }).catch(() => { });
        setUnread(0);
        setItems(p => p.map(n => ({ ...n, isRead: true })));
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => { setOpen(o => !o); if (!open) load(); }} title="Alerts" aria-label="Alerts"
                className="relative rounded-lg p-2 text-slate-500 outline-none transition-colors hover:bg-slate-100">
                <Icon size={18} />
                {unread > 0 && (
                    <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 top-11 z-[100] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-3 py-2">
                        <h3 className="text-sm font-bold text-slate-800">Alerts</h3>
                        {unread > 0 && <button onClick={markAll} className="text-xs font-semibold text-[#1E4DA6]">Mark all read</button>}
                    </div>
                    <div className="max-h-80 space-y-1 overflow-auto">
                        {items.length === 0 ? <p className="px-3 py-6 text-center text-sm text-slate-400">No alerts yet.</p> : items.slice(0, 10).map(n => (
                            <div key={n.id} className={cn('rounded-xl px-3 py-2', !n.isRead && 'bg-[#1E4DA6]/5')}>
                                <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                                <p className="text-xs text-slate-500">{n.message}</p>
                                <p className="mt-0.5 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        ))}
                    </div>
                    <Link to={timetablePath} onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-3 py-2 text-center text-xs font-bold text-[#1E4DA6] hover:bg-slate-50">Open timetable</Link>
                </div>
            )}
        </div>
    );
}
