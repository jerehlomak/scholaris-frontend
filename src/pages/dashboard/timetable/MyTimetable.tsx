import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bell, CalendarDays, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { TT_API, apiError, fmtDate, type MyView, type Slot } from './api';
import { ClassGrid, EntryList } from './TimetableGrid';
import { ReminderPanel } from './ReminderPanel';

interface MyResponse {
    role: string; isAdmin: boolean; term: string | null; academicYear: string | null; fallback: boolean; timezone: string;
    timetables: { doc: { id: string; name: string; kind: string; examType: string | null; term: string | null; academicYear: string | null }; views: MyView[] }[];
    sections: { id: string; name: string }[];
}
interface Inbox { id: string; title: string; message: string; isRead: boolean; createdAt: string }

const dayName = (tz: string) => new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: tz || 'Africa/Lagos' });

/** The signed-in person's own timetable: a student's class, a teacher's lessons, a parent's children, a section head's classes. */
export default function MyTimetable() {
    const [data, setData] = useState<MyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [docId, setDocId] = useState('');
    const [inbox, setInbox] = useState<Inbox[]>([]);

    const loadInbox = () => axios.get(`${TT_API}/inbox`, { withCredentials: true }).then(r => setInbox(r.data.notifications)).catch(() => { });

    useEffect(() => {
        axios.get(`${TT_API}/my`, { withCredentials: true })
            .then(r => { setData(r.data); setDocId(r.data.timetables[0]?.doc.id || ''); })
            .catch(err => toast.error(apiError(err, 'Could not load your timetable.')))
            .finally(() => setLoading(false));
        loadInbox();
    }, []);

    const current = data?.timetables.find(t => t.doc.id === docId);
    const today = useMemo(() => dayName(data?.timezone || 'Africa/Lagos'), [data?.timezone]);
    const unread = inbox.filter(n => !n.isRead).length;

    const markAll = async () => { await axios.post(`${TT_API}/inbox/read-all`, {}, { withCredentials: true }).catch(() => { }); loadInbox(); };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800"><CalendarDays className="h-6 w-6 text-[#1E4DA6]" /> Timetable</h1>
                <p className="text-sm text-slate-500">{[data?.term, data?.academicYear].filter(Boolean).join(' · ') || 'Your schedule'}</p>
            </div>

            {data?.isAdmin ? (
                <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Administrators build and manage timetables in <Link to="/dashboard/timetable" className="font-semibold text-[#1E4DA6] underline">Timetable management</Link>.
                </p>
            ) : (
                <>
                    {data?.fallback && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">No timetable is published for this term yet — showing the most recent one.</p>}

                    {data && data.timetables.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {data.timetables.map(t => (
                                <button key={t.doc.id} onClick={() => setDocId(t.doc.id)}
                                    className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition', t.doc.id === docId ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
                                    {t.doc.name}{t.doc.examType ? ` · ${t.doc.examType}` : ''}
                                </button>
                            ))}
                        </div>
                    )}

                    {!current ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">No timetable has been published for you yet.</p>
                    ) : current.views.map(v => (
                        <section key={v.key} className="space-y-2">
                            <div>
                                <h2 className="text-base font-bold text-slate-700">{v.title}</h2>
                                <p className="text-xs text-slate-400">{v.subtitle}</p>
                            </div>
                            {v.type === 'CLASS_GRID' && v.layout && v.days
                                ? <ClassGrid layout={v.layout} days={v.days} slots={v.slots} highlightDay={today} />
                                : <EntryList slots={v.slots as Slot[]} by={v.type === 'PERSON_WEEK' ? 'day' : 'date'} highlightDay={v.type === 'PERSON_WEEK' ? today : undefined} />}
                        </section>
                    ))}
                </>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <ReminderPanel />
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><Bell className="h-4 w-4 text-[#1E4DA6]" /> Recent alerts {unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{unread}</span>}</h3>
                        {unread > 0 && <button className="text-xs font-semibold text-[#1E4DA6]" onClick={markAll}>Mark all read</button>}
                    </div>
                    {inbox.length === 0 ? <p className="text-sm text-slate-400">No alerts yet.</p> : (
                        <ul className="space-y-2">
                            {inbox.slice(0, 12).map(n => (
                                <li key={n.id} className={cn('rounded-lg border px-3 py-2 text-sm', n.isRead ? 'border-slate-100' : 'border-[#1E4DA6]/30 bg-[#1E4DA6]/5')}>
                                    <p className="font-semibold text-slate-700">{n.title}</p>
                                    <p className="text-xs text-slate-500">{n.message}</p>
                                    <p className="mt-0.5 text-[10px] text-slate-400">{fmtDate(n.createdAt.slice(0, 10))} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
