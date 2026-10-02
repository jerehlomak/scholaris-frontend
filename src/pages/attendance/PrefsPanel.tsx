import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BellRing, Loader2, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ATT_API, apiError, inputCls } from './api';

interface Prefs { reminders: boolean; childAlerts: boolean; channels?: { inApp: boolean; email: boolean; whatsapp: boolean }; phone?: string }

/** A person's own attendance settings: whether to be reminded, and by which channels. The school decides which channels exist. */
export function PrefsPanel({ kind }: { kind: 'staff' | 'parent' }) {
    const [p, setP] = useState<Prefs | null>(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => { axios.get(`${ATT_API}/prefs`).then(r => setP({ channels: { inApp: true, email: true, whatsapp: true }, ...r.data.prefs })).catch(() => setP({ reminders: true, childAlerts: true, channels: { inApp: true, email: true, whatsapp: true } })); }, []);
    if (!p) return null;
    const ch = p.channels || { inApp: true, email: true, whatsapp: true };
    const save = async () => {
        setSaving(true);
        try { const r = await axios.put(`${ATT_API}/prefs`, { prefs: p }); toast.success(r.data.msg); setP({ channels: ch, ...r.data.prefs }); }
        catch (err) { toast.error(apiError(err, 'Could not save.')); } finally { setSaving(false); }
    };
    return (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><BellRing className="h-4 w-4 text-[#1E4DA6]" /> My attendance settings</h3>
                <p className="mt-0.5 text-xs text-slate-500">{kind === 'staff' ? 'Reminders before work starts, before you would be marked late, and before closing time.' : 'Messages when your child signs in at school, leaves, or is marked absent.'}</p></div>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" className="h-4 w-4 accent-[#1E4DA6]" checked={kind === 'staff' ? p.reminders : p.childAlerts} onChange={e => setP({ ...p, [kind === 'staff' ? 'reminders' : 'childAlerts']: e.target.checked })} /> {kind === 'staff' ? 'Remind me' : 'Alert me about my children'}</label>
            <div><p className="mb-1.5 text-xs font-semibold text-slate-600">Send them by</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">{([['inApp', 'Notification'], ['email', 'Email'], ['whatsapp', 'WhatsApp']] as const).map(([k, l]) => <label key={k} className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" className="accent-[#1E4DA6]" checked={ch[k]} onChange={e => setP({ ...p, channels: { ...ch, [k]: e.target.checked } })} /> {l}</label>)}</div>
                <p className="mt-1 text-[11px] text-slate-400">Your school chooses which of these it sends. You can only switch ones off.</p></div>
            <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">WhatsApp number to use (optional)</span><input className={`${inputCls} !w-64`} value={p.phone || ''} onChange={e => setP({ ...p, phone: e.target.value })} placeholder="Leave empty to use the number on file" inputMode="tel" /></label>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
        </section>
    );
}
