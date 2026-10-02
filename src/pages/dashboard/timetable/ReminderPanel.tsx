import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BellPlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TT_API, apiError, fmtDate, inputCls } from './api';

interface Reminder {
    id: string; title: string; note: string | null; eventAt: string; leadMinutes: number; status: string;
    channels: { inApp: boolean; email: boolean; whatsapp: boolean }; setByAdmin: boolean;
}
interface Person { id: string; name: string; role: string }

const LEADS = [0, 5, 10, 15, 30, 60, 120, 1440];
const leadLabel = (m: number) => (m === 0 ? 'At the time' : m < 60 ? `${m} min before` : m === 1440 ? '1 day before' : `${m / 60} hr before`);
const today = () => new Date().toISOString().slice(0, 10);

/** Personal reminders for a class, period or break. Admins can also set one for another person. */
export function ReminderPanel({ isAdmin = false }: { isAdmin?: boolean }) {
    const [items, setItems] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', date: today(), time: '08:00', leadMinutes: 10, note: '', inApp: true, email: false, whatsapp: false });
    const [query, setQuery] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [target, setTarget] = useState<Person | null>(null);

    const load = useCallback(() => {
        axios.get(`${TT_API}/reminders`, { withCredentials: true })
            .then(r => setItems(r.data.reminders))
            .catch(err => toast.error(apiError(err, 'Could not load reminders.')))
            .finally(() => setLoading(false));
    }, []);
    useEffect(load, [load]);

    useEffect(() => {
        if (!isAdmin || query.trim().length < 2) { setPeople([]); return; }
        const t = setTimeout(() => {
            axios.get(`${TT_API}/recipients`, { params: { q: query }, withCredentials: true }).then(r => setPeople(r.data.users)).catch(() => setPeople([]));
        }, 250);
        return () => clearTimeout(t);
    }, [query, isAdmin]);

    const set = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }));

    const submit = async () => {
        if (!form.title.trim()) return toast.error('Give the reminder a title, e.g. "Maths with JSS1 A".');
        setSaving(true);
        try {
            const res = await axios.post(`${TT_API}/reminders`, {
                title: form.title, date: form.date, time: form.time, leadMinutes: form.leadMinutes, note: form.note || undefined,
                channels: { inApp: form.inApp, email: form.email, whatsapp: form.whatsapp }, userId: target?.id,
            }, { withCredentials: true });
            toast.success(res.data.msg);
            set({ title: '', note: '' });
            setTarget(null); setQuery('');
            load();
        } catch (err) { toast.error(apiError(err, 'Could not save the reminder.')); }
        finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        try { await axios.delete(`${TT_API}/reminders/${id}`, { withCredentials: true }); load(); }
        catch (err) { toast.error(apiError(err, 'Could not remove it.')); }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><BellPlus className="h-4 w-4 text-[#1E4DA6]" /> Reminders</h3>
                <p className="text-xs text-slate-500">Get alerted before a class, period or break on a date you choose.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <input className={`${inputCls} sm:col-span-2`} placeholder="What is it for? e.g. Maths with JSS1 A, or Break duty" value={form.title} onChange={e => set({ title: e.target.value })} maxLength={120} />
                <input type="date" className={inputCls} min={today()} value={form.date} onChange={e => set({ date: e.target.value })} />
                <input type="time" className={inputCls} value={form.time} onChange={e => set({ time: e.target.value })} />
                <select className={inputCls} value={form.leadMinutes} onChange={e => set({ leadMinutes: Number(e.target.value) })}>
                    {LEADS.map(m => <option key={m} value={m}>{leadLabel(m)}</option>)}
                </select>
                <input className={inputCls} placeholder="Note (optional)" value={form.note} onChange={e => set({ note: e.target.value })} maxLength={300} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {([['inApp', 'Notification'], ['email', 'Email'], ['whatsapp', 'WhatsApp']] as const).map(([k, label]) => (
                    <label key={k} className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form[k]} onChange={e => set({ [k]: e.target.checked } as any)} className="h-4 w-4 accent-[#1E4DA6]" /> {label}
                    </label>
                ))}
            </div>

            {isAdmin && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-600">Set for someone else (optional)</p>
                    {target ? (
                        <p className="flex items-center justify-between text-sm font-semibold text-[#173F8C]">
                            {target.name} <span className="text-xs font-normal text-slate-500">{target.role.toLowerCase()}</span>
                            <button className="text-xs text-slate-500 underline" onClick={() => setTarget(null)}>change</button>
                        </p>
                    ) : (
                        <>
                            <input className={inputCls} placeholder="Search a teacher, student or parent by name" value={query} onChange={e => setQuery(e.target.value)} />
                            {people.length > 0 && (
                                <ul className="max-h-40 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200 bg-white text-sm">
                                    {people.map(p => (
                                        <li key={p.id}><button className="flex w-full justify-between px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setTarget(p); setPeople([]); }}>
                                            <span>{p.name}</span><span className="text-xs text-slate-400">{p.role.toLowerCase()}</span></button></li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            )}

            <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <BellPlus />} Set reminder</Button>

            <div className="border-t border-slate-100 pt-3">
                {loading ? <p className="text-sm text-slate-400">Loading…</p> : items.length === 0 ? <p className="text-sm text-slate-400">No reminders yet.</p> : (
                    <ul className="space-y-2">
                        {items.map(r => (
                            <li key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                                <div className="min-w-0 text-sm">
                                    <p className="font-semibold text-slate-700">{r.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {fmtDate(r.eventAt.slice(0, 10))} · {new Date(r.eventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {leadLabel(r.leadMinutes)}
                                        {r.status === 'SENT' && ' · sent'}{r.setByAdmin && ' · set by admin'}
                                    </p>
                                </div>
                                <button onClick={() => remove(r.id)} className="text-slate-400 hover:text-red-500" aria-label="Remove reminder"><Trash2 className="h-4 w-4" /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
