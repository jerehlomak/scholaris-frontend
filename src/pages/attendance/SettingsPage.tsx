import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Crosshair, ExternalLink, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ATT_API, apiError, inputCls, naira, type AttConfig, type Channels, type Deduction } from './api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="text-sm font-bold text-slate-700">{title}</h3>{hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}</div>{children}</section>
);
const Field = ({ t, hint, children }: { t: string; hint?: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t}</span>{children}{hint && <span className="block text-[11px] text-slate-400">{hint}</span>}</label>
);
const Toggle = ({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) => (
    <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1E4DA6]" checked={on} onChange={e => set(e.target.checked)} /><span><span className="text-sm font-semibold text-slate-700">{label}</span>{hint && <span className="block text-xs text-slate-400">{hint}</span>}</span></label>
);
const ChannelPick = ({ v, set }: { v: Channels; set: (c: Channels) => void }) => (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">{([['inApp', 'Notification'], ['email', 'Email'], ['whatsapp', 'WhatsApp']] as const).map(([k, l]) => <label key={k} className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" className="accent-[#1E4DA6]" checked={v[k]} onChange={e => set({ ...v, [k]: e.target.checked })} /> {l}</label>)}</div>
);
const leads = (txt: string) => txt.split(/[,\s]+/).map(Number).filter(n => Number.isFinite(n) && n >= 0);

const MODE_LABEL: Record<Deduction['mode'], string> = { PER_LATE_FIXED: 'A fixed amount for each late', PER_LATE_PERCENT_DAILY: 'A percentage of one day’s pay for each late', PER_MINUTE: 'An amount for each minute late' };
const amountLabel = (m: Deduction['mode']) => (m === 'PER_LATE_FIXED' ? 'Amount per late (₦)' : m === 'PER_LATE_PERCENT_DAILY' ? 'Percent of a day’s pay' : 'Amount per minute late (₦)');

function DeductionFields({ d, set, partial }: { d: Partial<Deduction>; set: (p: Partial<Deduction>) => void; partial?: boolean }) {
    const mode = d.mode || 'PER_LATE_FIXED';
    return (
        <div className="space-y-3">
            <Field t="How lateness is charged"><select className={inputCls} value={d.mode || (partial ? '' : mode)} onChange={e => set({ mode: (e.target.value || undefined) as Deduction['mode'] })}>{partial && <option value="">Same as school</option>}{(Object.keys(MODE_LABEL) as Deduction['mode'][]).map(m => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}</select></Field>
            <div className="grid gap-3 sm:grid-cols-3">
                <Field t={amountLabel(mode)}><input type="number" min={0} className={inputCls} value={d.amount ?? ''} placeholder={partial ? 'Same as school' : ''} onChange={e => set({ amount: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field>
                <Field t="Free lates each month" hint="Not charged"><input type="number" min={0} max={100} className={inputCls} value={d.freeLates ?? ''} placeholder={partial ? 'Same as school' : ''} onChange={e => set({ freeLates: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field>
                {!partial && <Field t="Never more than (% of pay)" hint="A safety cap"><input type="number" min={0} max={100} className={inputCls} value={d.maxPercentOfGross ?? 50} onChange={e => set({ maxPercentOfGross: Number(e.target.value) })} /></Field>}
            </div>
            <Toggle on={!!d.deductAbsent} set={v => set({ deductAbsent: v })} label="Also deduct a day's pay for each unexcused absence" />
        </div>
    );
}

interface StaffItem { staffId: string; name: string; employeeId: string; department: string; rule: any; effective: any }

function StaffRuleDialog({ s, base, onClose, onSaved }: { s: StaffItem; base: AttConfig; onClose: () => void; onSaved: () => void }) {
    const [r, setR] = useState<any>({ exempt: false, ...s.rule });
    const [saving, setSaving] = useState(false);
    const set = (p: any) => setR((x: any) => ({ ...x, ...p }));
    const save = async (clear = false) => {
        setSaving(true);
        try { const res = await axios.put(`${ATT_API}/staff-rules/${s.staffId}`, { rule: clear ? {} : r }); toast.success(res.data.msg); onSaved(); }
        catch (err) { toast.error(apiError(err, 'Could not save.')); setSaving(false); }
    };
    return (
        <Dialog open onOpenChange={o => !o && !saving && onClose()}>
            <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
                <DialogHeader><DialogTitle>{s.name}</DialogTitle><DialogDescription>Anything left empty follows the school settings ({base.staff.startTime}, {base.staff.graceMinutes} min grace, closes {base.staff.closeTime}).</DialogDescription></DialogHeader>
                <div className="space-y-4">
                    <Toggle on={!!r.exempt} set={v => set({ exempt: v })} label="Exempt from attendance" hint="Never counted late or absent and never deducted (for example a head or a part-time visitor)." />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field t="Starts at"><input type="time" className={inputCls} value={r.startTime || ''} onChange={e => set({ startTime: e.target.value || undefined })} /></Field>
                        <Field t="Grace (minutes)"><input type="number" min={0} max={180} className={inputCls} value={r.graceMinutes ?? ''} onChange={e => set({ graceMinutes: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field>
                        <Field t="Closes at"><input type="time" className={inputCls} value={r.closeTime || ''} onChange={e => set({ closeTime: e.target.value || undefined })} /></Field>
                    </div>
                    <div><p className="mb-1 text-xs font-semibold text-slate-600">Working days (empty = school days)</p>
                        <div className="flex flex-wrap gap-1.5">{DAYS.map(d => { const on = (r.workDays || []).includes(d); return <button key={d} type="button" onClick={() => set({ workDays: on ? (r.workDays || []).filter((x: string) => x !== d) : [...(r.workDays || []), d] })} className={cn('rounded-lg border px-2.5 py-1 text-xs font-bold', on ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-200 text-slate-500')}>{d.slice(0, 3)}</button>; })}</div></div>
                    <div className="rounded-xl border border-slate-200 p-3"><Toggle on={r.deduction?.enabled ?? base.deduction.enabled} set={v => set({ deduction: { ...r.deduction, enabled: v } })} label="Deduct salary for lateness" /><div className="mt-3"><DeductionFields partial d={r.deduction || {}} set={p => set({ deduction: { ...r.deduction, ...p } })} /></div></div>
                </div>
                <div className="flex justify-between gap-2"><Button variant="ghost" disabled={saving} onClick={() => save(true)}>Use school settings</Button><div className="flex gap-2"><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => save()}>{saving && <Loader2 className="animate-spin" />} Save</Button></div></div>
            </DialogContent>
        </Dialog>
    );
}

export default function SettingsPage() {
    const [c, setC] = useState<AttConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [leadTxt, setLeadTxt] = useState({ resume: '', late: '', out: '' });
    const [holiday, setHoliday] = useState('');
    const [locating, setLocating] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [editing, setEditing] = useState<StaffItem | null>(null);

    const loadStaff = () => axios.get(`${ATT_API}/staff-rules`).then(r => setStaff(r.data.staff)).catch(() => { });
    const sync = (cfg: AttConfig) => { setC(cfg); setLeadTxt({ resume: cfg.staffReminders.resumeLeadMinutes.join(', '), late: cfg.staffReminders.lateWarnMinutes.join(', '), out: cfg.staffReminders.signOutLeadMinutes.join(', ') }); };
    useEffect(() => { axios.get(`${ATT_API}/config`).then(r => sync(r.data.config)).catch(err => toast.error(apiError(err, 'Could not load settings.'))); loadStaff(); }, []);

    if (!c) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const upd = <K extends keyof AttConfig>(k: K, v: Partial<AttConfig[K]> | AttConfig[K]) => setC(x => (x ? { ...x, [k]: typeof v === 'object' && v !== null && !Array.isArray(v) ? { ...(x[k] as object), ...(v as object) } : v } : x));

    const useMyLocation = () => {
        if (!navigator.geolocation) return toast.error('This browser cannot share its location.');
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            pos => { upd('geofence', { lat: Math.round(pos.coords.latitude * 1e6) / 1e6, lng: Math.round(pos.coords.longitude * 1e6) / 1e6 }); setAccuracy(Math.round(pos.coords.accuracy)); setLocating(false); toast.success('Location captured. Check it on the map, then save.'); },
            err => { setLocating(false); toast.error(err.code === 1 ? 'Location access was blocked. Allow it for this site and try again.' : 'Could not get your location. Try outdoors.'); },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
    };

    const save = async () => {
        setSaving(true);
        try {
            const body: AttConfig = { ...c, staffReminders: { ...c.staffReminders, resumeLeadMinutes: leads(leadTxt.resume), lateWarnMinutes: leads(leadTxt.late), signOutLeadMinutes: leads(leadTxt.out) } };
            const r = await axios.put(`${ATT_API}/config`, { config: body }); sync(r.data.config); toast.success(r.data.msg);
            if (body.geofence.enabled && !r.data.config.geofence.enabled) toast.warning('The location check stays off until you capture the school location.');
        } catch (err) { toast.error(apiError(err, 'Could not save.')); } finally { setSaving(false); }
    };

    const g = c.geofence;
    return (
        <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
            <div><h1 className="text-2xl font-bold text-slate-800">Attendance settings</h1><p className="text-sm text-slate-500">Everything about attendance in your school, in one place.</p></div>

            <Card title="General">
                <Toggle on={c.enabled} set={v => upd('enabled', v)} label="Attendance is on" />
                <div><p className="mb-1.5 text-xs font-semibold text-slate-600">School days</p><div className="flex flex-wrap gap-2">{DAYS.map(d => { const on = c.workDays.includes(d); return <button key={d} type="button" onClick={() => upd('workDays', on ? c.workDays.filter(x => x !== d) : [...c.workDays, d])} className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold', on ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-200 text-slate-500')}>{d.slice(0, 3)}</button>; })}</div></div>
                <div><p className="mb-1.5 text-xs font-semibold text-slate-600">Holidays (not counted as absences)</p>
                    <div className="flex gap-2"><input type="date" className={`${inputCls} !w-48`} value={holiday} onChange={e => setHoliday(e.target.value)} /><Button variant="outline" size="sm" disabled={!holiday} onClick={() => { upd('holidays', [...new Set([...c.holidays, holiday])].sort()); setHoliday(''); }}><Plus /> Add</Button></div>
                    {c.holidays.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{c.holidays.map(h => <span key={h} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{h}<button onClick={() => upd('holidays', c.holidays.filter(x => x !== h))} aria-label={`Remove ${h}`}><Trash2 className="h-3 w-3" /></button></span>)}</div>}</div>
                <Field t="Time zone"><input list="att-tz" className={`${inputCls} !w-64`} value={c.timezone} onChange={e => upd('timezone', e.target.value)} /><datalist id="att-tz">{['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'Asia/Dubai'].map(z => <option key={z} value={z} />)}</datalist></Field>
            </Card>

            <Card title="Staff hours" hint="Late means signing in after the start time plus the grace period.">
                <div className="grid gap-3 sm:grid-cols-4">
                    <Field t="Work starts"><input type="time" className={inputCls} value={c.staff.startTime} onChange={e => upd('staff', { startTime: e.target.value })} /></Field>
                    <Field t="Grace (minutes)"><input type="number" min={0} max={180} className={inputCls} value={c.staff.graceMinutes} onChange={e => upd('staff', { graceMinutes: Number(e.target.value) })} /></Field>
                    <Field t="Work ends"><input type="time" className={inputCls} value={c.staff.closeTime} onChange={e => upd('staff', { closeTime: e.target.value })} /></Field>
                    <Field t="Sign-in opens"><input type="time" className={inputCls} value={c.staff.earliestSignIn} onChange={e => upd('staff', { earliestSignIn: e.target.value })} /></Field>
                    <Field t="Half day if under (hours)" hint="Worked less than this"><input type="number" min={0} max={12} step={0.5} className={inputCls} value={c.staff.halfDayHours} onChange={e => upd('staff', { halfDayHours: Number(e.target.value) })} /></Field>
                    <Field t="Earliest sign-out (min after in)"><input type="number" min={0} max={240} className={inputCls} value={c.staff.minMinutesBeforeSignOut} onChange={e => upd('staff', { minMinutesBeforeSignOut: Number(e.target.value) })} /></Field>
                </div>
                <Toggle on={c.staff.autoSignOut} set={v => upd('staff', { autoSignOut: v })} label="Sign out automatically at closing time for people who forget" hint="Done 30 minutes after work ends." />
            </Card>

            <Card title="Student hours">
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field t="School starts"><input type="time" className={inputCls} value={c.students.startTime} onChange={e => upd('students', { startTime: e.target.value })} /></Field>
                    <Field t="Late after (minutes)"><input type="number" min={0} max={180} className={inputCls} value={c.students.lateAfterMinutes} onChange={e => upd('students', { lateAfterMinutes: Number(e.target.value) })} /></Field>
                    <Field t="School closes"><input type="time" className={inputCls} value={c.students.closeTime} onChange={e => upd('students', { closeTime: e.target.value })} /></Field>
                </div>
            </Card>

            <Card title="Ways to sign in" hint="Choose which methods are allowed.">
                <Toggle on={c.methods.register} set={v => upd('methods', { register: v })} label="Class registers (tick sheet)" />
                <Toggle on={c.methods.cardScan} set={v => upd('methods', { cardScan: v })} label="Card scanning by an administrator" />
                <Toggle on={c.scanners.teachersCanScanCards} set={v => upd('scanners', { teachersCanScanCards: v })} label="Teachers may scan cards too" hint="For example a gate or duty teacher." />
                <Toggle on={c.methods.wallQr} set={v => upd('methods', { wallQr: v })} label="Staff scan the code on the school wall" />
                <Toggle on={c.methods.locationOnly} set={v => upd('methods', { locationOnly: v })} label="Staff may sign in with their location alone (no code)" hint="Only works inside the school area. Less secure than the wall code." />
            </Card>

            <Card title="School location" hint="Stops staff signing in from home. They must be at the school when they scan.">
                <Toggle on={g.enabled} set={v => upd('geofence', { enabled: v })} label="Only allow sign-in at the school" />
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-xs text-slate-600">Stand in the middle of the school grounds with your phone or laptop and capture the location.</p>
                    <Button variant="outline" onClick={useMyLocation} disabled={locating}>{locating ? <Loader2 className="animate-spin" /> : <Crosshair />} Use my current location</Button>
                    {accuracy !== null && <span className="ml-3 text-xs text-slate-500">accurate to about {accuracy} m</span>}
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                    <Field t="Latitude"><input type="number" step="any" className={inputCls} value={g.lat ?? ''} onChange={e => upd('geofence', { lat: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                    <Field t="Longitude"><input type="number" step="any" className={inputCls} value={g.lng ?? ''} onChange={e => upd('geofence', { lng: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                    <Field t="Allowed distance (m)" hint="From that point"><input type="number" min={20} max={5000} className={inputCls} value={g.radiusMeters} onChange={e => upd('geofence', { radiusMeters: Number(e.target.value) })} /></Field>
                    <Field t="Reject phones with GPS worse than (m)"><input type="number" min={20} max={1000} className={inputCls} value={g.maxAccuracyMeters} onChange={e => upd('geofence', { maxAccuracyMeters: Number(e.target.value) })} /></Field>
                </div>
                {g.lat !== null && g.lng !== null && <a className="inline-flex items-center gap-1 text-xs font-bold text-[#1E4DA6]" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${g.lat},${g.lng}`}><ExternalLink className="h-3.5 w-3.5" /> Check this point on the map</a>}
            </Card>

            <Card title="Wall code" hint="You can change the code any time from Codes & cards.">
                <Field t="Change the code automatically every (days)" hint="0 means only when you change it yourself. You are told when it changes."><input type="number" min={0} max={365} className={`${inputCls} !w-32`} value={c.wallQr.rotateDays} onChange={e => upd('wallQr', { rotateDays: Number(e.target.value) })} /></Field>
            </Card>

            <Card title="Reminders to staff" hint="Told shortly before they must sign in or out.">
                <Toggle on={c.staffReminders.enabled} set={v => upd('staffReminders', { enabled: v })} label="Send reminders" hint="People can switch their own off in their attendance settings." />
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field t="Before work starts (minutes)" hint="e.g. 30, 10"><input className={inputCls} value={leadTxt.resume} onChange={e => setLeadTxt(t => ({ ...t, resume: e.target.value }))} /></Field>
                    <Field t="Before being marked late (minutes)"><input className={inputCls} value={leadTxt.late} onChange={e => setLeadTxt(t => ({ ...t, late: e.target.value }))} /></Field>
                    <Field t="Before closing, to sign out (minutes)"><input className={inputCls} value={leadTxt.out} onChange={e => setLeadTxt(t => ({ ...t, out: e.target.value }))} /></Field>
                </div>
                <ChannelPick v={c.staffReminders.channels} set={ch => upd('staffReminders', { channels: ch })} />
            </Card>

            <Card title="Alerts to parents" hint="Tell parents when their child is in school, leaves, or is absent.">
                <Toggle on={c.parentAlerts.enabled} set={v => upd('parentAlerts', { enabled: v })} label="Alert parents" />
                <div className="flex flex-wrap gap-x-6 gap-y-2"><Toggle on={c.parentAlerts.onSignIn} set={v => upd('parentAlerts', { onSignIn: v })} label="Child signed in" /><Toggle on={c.parentAlerts.onSignOut} set={v => upd('parentAlerts', { onSignOut: v })} label="Child left school" /><Toggle on={c.parentAlerts.onAbsent} set={v => upd('parentAlerts', { onAbsent: v })} label="Child marked absent" /></div>
                <ChannelPick v={c.parentAlerts.channels} set={ch => upd('parentAlerts', { channels: ch })} />
            </Card>

            <Card title="Alerts to administrators" hint="The activity log always records everything. These alerts tell you as it happens.">
                <Toggle on={c.adminAlerts.staffEvents} set={v => upd('adminAlerts', { staffEvents: v })} label="Every staff sign-in and sign-out" />
                <Toggle on={c.adminAlerts.studentEvents} set={v => upd('adminAlerts', { studentEvents: v })} label="Every student sign-in and sign-out" hint="Can be a lot of messages in a big school." />
                <ChannelPick v={c.adminAlerts.channels} set={ch => upd('adminAlerts', { channels: ch })} />
            </Card>

            <Card title="Salary deduction for lateness" hint="Counted for each month and added to the payroll run as a deduction.">
                <Toggle on={c.deduction.enabled} set={v => upd('deduction', { enabled: v })} label="Deduct pay for lateness" hint="Individual staff can be exempted or given their own rule below." />
                {c.deduction.enabled && <DeductionFields d={c.deduction} set={p => upd('deduction', p)} />}
                <div className="border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Individual staff rules</p>
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr><th className="p-2 text-left">Staff</th><th className="p-2 text-left">Hours</th><th className="p-2 text-left">Lateness charge</th><th className="p-2" /></tr></thead>
                        <tbody>{staff.map(s => { const own = Object.keys(s.rule).some(k => (k === 'exempt' ? s.rule.exempt : true)); return (
                            <tr key={s.staffId} className="border-t border-slate-100"><td className="p-2"><p className="font-semibold text-slate-700">{s.name}</p><p className="text-xs text-slate-400">{s.department || s.employeeId}</p></td>
                                <td className="p-2 text-xs text-slate-600">{s.effective.exempt ? <span className="font-bold text-violet-600">Exempt</span> : `${s.effective.startTime} – ${s.effective.closeTime} (+${s.effective.graceMinutes}m)`}</td>
                                <td className="p-2 text-xs text-slate-600">{s.effective.exempt ? '—' : s.effective.deduction.enabled ? (s.effective.deduction.mode === 'PER_LATE_PERCENT_DAILY' ? `${s.effective.deduction.amount}% of a day` : s.effective.deduction.mode === 'PER_MINUTE' ? `${naira(s.effective.deduction.amount)}/min` : `${naira(s.effective.deduction.amount)} per late`) : 'None'}{own && <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">custom</span>}</td>
                                <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil /></Button></td></tr>); })}</tbody></table></div>
                </div>
            </Card>

            <div className="sticky bottom-3 flex justify-end"><Button size="lg" className="shadow-lg" onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button></div>
            {editing && <StaffRuleDialog s={editing} base={c} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadStaff(); }} />}
        </div>
    );
}
