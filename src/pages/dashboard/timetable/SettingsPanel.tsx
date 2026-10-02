import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { TT_API, WEEKDAYS, apiError, inputCls, type Meta } from './api';

interface Break { afterPeriod: number; minutes: number; label: string }
interface Cfg { days: string[]; periodsPerDay: number; startTime: string; periodMinutes: number; breaks: Break[]; maxSameSubjectPerDay: number }
interface StoredCfg extends Cfg { id: string; scope: 'SCHOOL' | 'SECTION' | 'CLASS'; scopeId: string }

const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
            <h3 className="text-sm font-bold text-slate-700">{title}</h3>
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {children}
    </section>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label>
);

// ─── period rules ────────────────────────────────────────────────────────────

function PeriodRules({ meta }: { meta: Meta }) {
    const [scope, setScope] = useState<'SCHOOL' | 'SECTION' | 'CLASS'>('SCHOOL');
    const [scopeId, setScopeId] = useState('');
    const [configs, setConfigs] = useState<StoredCfg[]>([]);
    const [defaults, setDefaults] = useState<Cfg | null>(null);
    const [cfg, setCfg] = useState<Cfg | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => axios.get(`${TT_API}/configs`, { withCredentials: true }).then(r => { setConfigs(r.data.configs); setDefaults(r.data.defaults); }), []);
    useEffect(() => { load().catch(err => toast.error(apiError(err, 'Could not load settings.'))); }, [load]);

    const stored = configs.find(c => c.scope === scope && c.scopeId === (scope === 'SCHOOL' ? '' : scopeId));
    const inherited = useMemo(() => {
        const cls = scope === 'CLASS' ? meta.classes.find(c => c.id === scopeId) : null;
        const sectionId = scope === 'SECTION' ? scopeId : cls?.sectionId;
        return (sectionId && configs.find(c => c.scope === 'SECTION' && c.scopeId === sectionId)) || configs.find(c => c.scope === 'SCHOOL') || defaults;
    }, [configs, defaults, scope, scopeId, meta.classes]);

    useEffect(() => { setCfg(stored || inherited || null); }, [stored, inherited]);

    const needsTarget = scope !== 'SCHOOL' && !scopeId;
    const patch = (p: Partial<Cfg>) => setCfg(c => (c ? { ...c, ...p } : c));
    const setBreak = (i: number, p: Partial<Break>) => patch({ breaks: cfg!.breaks.map((b, j) => (j === i ? { ...b, ...p } : b)) });

    const save = async () => {
        if (!cfg || needsTarget) return;
        if (!cfg.days.length) return toast.error('Pick at least one school day.');
        setSaving(true);
        try {
            await axios.put(`${TT_API}/configs`, { scope, scopeId, config: cfg }, { withCredentials: true });
            toast.success('Saved. Refresh a timetable\'s settings to apply this to it.');
            await load();
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };
    const removeOverride = async () => {
        if (!stored) return;
        try { await axios.delete(`${TT_API}/configs/${stored.id}`, { withCredentials: true }); toast.success('Override removed.'); await load(); }
        catch (err) { toast.error(apiError(err, 'Could not remove.')); }
    };

    const total = cfg ? cfg.periodsPerDay * cfg.periodMinutes + cfg.breaks.reduce((n, b) => n + b.minutes, 0) : 0;
    const endAt = cfg ? (() => { const [h, m] = cfg.startTime.split(':').map(Number); const t = h * 60 + m + total; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; })() : '';

    return (
        <Card title="School days, periods and breaks" hint="Set once for the whole school, then override for a section or a single class where it differs. The most specific setting wins.">
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Applies to">
                    <select className={inputCls} value={scope} onChange={e => { setScope(e.target.value as any); setScopeId(''); }}>
                        <option value="SCHOOL">Whole school</option><option value="SECTION">A section</option><option value="CLASS">A single class</option>
                    </select>
                </Field>
                {scope !== 'SCHOOL' && (
                    <Field label={scope === 'SECTION' ? 'Section' : 'Class'}>
                        <select className={inputCls} value={scopeId} onChange={e => setScopeId(e.target.value)}>
                            <option value="">Choose…</option>
                            {(scope === 'SECTION' ? meta.sections : meta.classes).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                    </Field>
                )}
            </div>

            {cfg && !needsTarget && (
                <>
                    {!stored && scope !== 'SCHOOL' && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Showing the settings this {scope.toLowerCase()} currently inherits. Save to give it its own.</p>}
                    <div>
                        <p className="mb-1.5 text-xs font-semibold text-slate-600">School days (weekends are optional)</p>
                        <div className="flex flex-wrap gap-2">
                            {WEEKDAYS.map(d => {
                                const on = cfg.days.includes(d);
                                return (
                                    <button key={d} type="button" onClick={() => patch({ days: on ? cfg.days.filter(x => x !== d) : [...cfg.days, d] })}
                                        className={cn('rounded-lg border px-3 py-1.5 text-xs font-bold', on ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>{d.slice(0, 3)}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                        <Field label="Periods per day"><input type="number" min={1} max={14} className={inputCls} value={cfg.periodsPerDay} onChange={e => patch({ periodsPerDay: Number(e.target.value) })} /></Field>
                        <Field label="Day starts at"><input type="time" className={inputCls} value={cfg.startTime} onChange={e => patch({ startTime: e.target.value })} /></Field>
                        <Field label="Minutes per period"><input type="number" min={10} max={180} className={inputCls} value={cfg.periodMinutes} onChange={e => patch({ periodMinutes: Number(e.target.value) })} /></Field>
                        <Field label="Max same subject / day"><input type="number" min={1} max={6} className={inputCls} value={cfg.maxSameSubjectPerDay} onChange={e => patch({ maxSameSubjectPerDay: Number(e.target.value) })} /></Field>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-600">Breaks</p>
                            <button className="flex items-center gap-1 text-xs font-bold text-[#1E4DA6]" onClick={() => patch({ breaks: [...cfg.breaks, { afterPeriod: Math.min(cfg.periodsPerDay - 1, Math.max(1, ...cfg.breaks.map(b => b.afterPeriod + 1))), minutes: 15, label: 'Break' }] })}><Plus className="h-3 w-3" /> Add break</button>
                        </div>
                        {cfg.breaks.length === 0 && <p className="text-xs text-slate-400">No breaks — lessons run back to back.</p>}
                        {cfg.breaks.map((b, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_auto] items-end gap-2">
                                <Field label="After period"><input type="number" min={1} max={cfg.periodsPerDay - 1} className={inputCls} value={b.afterPeriod} onChange={e => setBreak(i, { afterPeriod: Number(e.target.value) })} /></Field>
                                <Field label="Minutes"><input type="number" min={5} max={120} className={inputCls} value={b.minutes} onChange={e => setBreak(i, { minutes: Number(e.target.value) })} /></Field>
                                <Field label="Name"><input className={inputCls} value={b.label} maxLength={30} onChange={e => setBreak(i, { label: e.target.value })} /></Field>
                                <button className="mb-2 text-slate-400 hover:text-red-500" onClick={() => patch({ breaks: cfg.breaks.filter((_, j) => j !== i) })} aria-label="Remove break"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500">School day runs {cfg.startTime} – {endAt} ({cfg.days.length} day{cfg.days.length === 1 ? '' : 's'}, {cfg.periodsPerDay * cfg.days.length} lessons a week).</p>
                    <div className="flex gap-2">
                        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>
                        {stored && scope !== 'SCHOOL' && <Button variant="outline" onClick={removeOverride}>Use inherited settings</Button>}
                    </div>
                </>
            )}
        </Card>
    );
}

// ─── subject rules (periods per week, double / triple) ───────────────────────

interface RuleRow { subjectId: string; subject: string; teacherName: string | null; periodsPerWeek: number | null; blockSize: number; suggested: number; hasRule: boolean }

function SubjectRules({ meta }: { meta: Meta }) {
    const [classId, setClassId] = useState('');
    const [rows, setRows] = useState<RuleRow[]>([]);
    const [capacity, setCapacity] = useState(0);
    const [copyTo, setCopyTo] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!classId) { setRows([]); return; }
        setLoading(true); setCopyTo([]);
        axios.get(`${TT_API}/subject-rules`, { params: { classId }, withCredentials: true })
            .then(r => { setRows(r.data.subjects); setCapacity(r.data.capacity); })
            .catch(err => toast.error(apiError(err, 'Could not load subjects.')))
            .finally(() => setLoading(false));
    }, [classId]);

    const used = rows.reduce((n, r) => n + (r.periodsPerWeek ?? r.suggested), 0);
    const edit = (i: number, p: Partial<RuleRow>) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`${TT_API}/subject-rules`, {
                classId, copyToClassIds: copyTo,
                rules: rows.map(r => ({ subjectId: r.subjectId, periodsPerWeek: r.periodsPerWeek ?? r.suggested, blockSize: r.blockSize })),
            }, { withCredentials: true });
            toast.success(res.data.msg);
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };

    return (
        <Card title="Periods per subject" hint="How many periods a subject gets each week, and whether they sit together as a double or triple period. Leave blank to let the system share the week sensibly.">
            <Field label="Class">
                <select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)}>
                    <option value="">Choose a class…</option>
                    {meta.classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.sectionName ? ` (${c.sectionName})` : ''}</option>)}
                </select>
            </Field>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-[#1E4DA6]" />}
            {classId && !loading && rows.length === 0 && <p className="text-sm text-slate-400">No subjects are assigned to this class yet. Assign subjects and teachers first.</p>}
            {rows.length > 0 && (
                <>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2 text-left">Subject</th><th className="p-2 text-left">Teacher</th><th className="p-2 text-left">Periods / week</th><th className="p-2 text-left">Sits as</th></tr></thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={r.subjectId} className="border-t border-slate-100">
                                        <td className="p-2 font-semibold text-slate-700">{r.subject}</td>
                                        <td className={cn('p-2 text-xs', r.teacherName ? 'text-slate-500' : 'text-amber-600')}>{r.teacherName || 'No teacher assigned'}</td>
                                        <td className="p-2"><input type="number" min={1} max={20} placeholder={String(r.suggested)} className={`${inputCls} !h-9 w-24`} value={r.periodsPerWeek ?? ''} onChange={e => edit(i, { periodsPerWeek: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                                        <td className="p-2"><select className={`${inputCls} !h-9 w-32`} value={r.blockSize} onChange={e => edit(i, { blockSize: Number(e.target.value) })}><option value={1}>Single</option><option value={2}>Double</option><option value={3}>Triple</option></select></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={cn('text-xs', used > capacity ? 'font-semibold text-red-600' : 'text-slate-500')}>{used} of {capacity} weekly periods used{used > capacity ? ' — too many; some cannot be placed.' : '.'}</p>
                    <details className="rounded-xl border border-slate-200 p-3 text-sm">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-600">Copy to other classes ({copyTo.length})</summary>
                        <div className="mt-2 grid max-h-44 gap-1 overflow-auto sm:grid-cols-2">
                            {meta.classes.filter(c => c.id !== classId).map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-slate-600">
                                    <input type="checkbox" className="accent-[#1E4DA6]" checked={copyTo.includes(c.id)} onChange={e => setCopyTo(s => (e.target.checked ? [...s, c.id] : s.filter(x => x !== c.id)))} /> {c.name}
                                </label>
                            ))}
                        </div>
                    </details>
                    <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
                </>
            )}
        </Card>
    );
}

// ─── alerts ──────────────────────────────────────────────────────────────────

interface AudienceCfg { enabled: boolean; leadMinutes: number[]; channels: { inApp: boolean; email: boolean; whatsapp: boolean } }
interface AlertCfg { enabled: boolean; audiences: Record<'teacher' | 'student' | 'parent', AudienceCfg> }
const AUDIENCES = [['teacher', 'Teachers'], ['student', 'Students'], ['parent', 'Parents']] as const;

function AlertSettings() {
    const [s, setS] = useState<AlertCfg | null>(null);
    const [leadText, setLeadText] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${TT_API}/alert-settings`, { withCredentials: true }).then(r => {
            setS(r.data.settings);
            setLeadText(Object.fromEntries(AUDIENCES.map(([k]) => [k, r.data.settings.audiences[k].leadMinutes.join(', ')])));
        }).catch(err => toast.error(apiError(err, 'Could not load alert settings.')));
    }, []);

    if (!s) return null;
    const aud = (k: keyof AlertCfg['audiences'], p: Partial<AudienceCfg>) => setS({ ...s, audiences: { ...s.audiences, [k]: { ...s.audiences[k], ...p } } });

    const save = async () => {
        const next: AlertCfg = { ...s, audiences: { ...s.audiences } };
        for (const [k] of AUDIENCES) next.audiences[k] = { ...s.audiences[k], leadMinutes: (leadText[k] || '').split(/[,\s]+/).map(Number).filter(n => Number.isFinite(n) && n >= 0) };
        setSaving(true);
        try {
            const res = await axios.put(`${TT_API}/alert-settings`, { settings: next }, { withCredentials: true });
            setS(res.data.settings);
            setLeadText(Object.fromEntries(AUDIENCES.map(([k]) => [k, res.data.settings.audiences[k].leadMinutes.join(', ')])));
            toast.success(res.data.msg);
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };

    return (
        <Card title="Automatic alerts" hint="Tell people before a lesson or exam starts. Teachers can be alerted hours ahead and again just before.">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-[#1E4DA6]" checked={s.enabled} onChange={e => setS({ ...s, enabled: e.target.checked })} /> Send timetable alerts
            </label>
            <div className={cn('grid gap-3 lg:grid-cols-3', !s.enabled && 'pointer-events-none opacity-50')}>
                {AUDIENCES.map(([k, label]) => (
                    <div key={k} className="space-y-3 rounded-xl border border-slate-200 p-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" className="h-4 w-4 accent-[#1E4DA6]" checked={s.audiences[k].enabled} onChange={e => aud(k, { enabled: e.target.checked })} /> {label}
                        </label>
                        <Field label="Minutes before (comma separated, up to 720)">
                            <input className={inputCls} value={leadText[k] ?? ''} onChange={e => setLeadText(t => ({ ...t, [k]: e.target.value }))} placeholder="e.g. 120, 10" />
                        </Field>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                            {([['inApp', 'Notification'], ['email', 'Email'], ['whatsapp', 'WhatsApp']] as const).map(([c, cl]) => (
                                <label key={c} className="flex cursor-pointer items-center gap-1.5">
                                    <input type="checkbox" className="accent-[#1E4DA6]" checked={s.audiences[k].channels[c]} onChange={e => aud(k, { channels: { ...s.audiences[k].channels, [c]: e.target.checked } })} /> {cl}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-400">Email and WhatsApp use the school's configured email and messaging services. Parents are alerted about their own children's classes.</p>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save alert settings</Button>
        </Card>
    );
}

// ─── section heads ───────────────────────────────────────────────────────────

function SectionHeads({ meta, onSaved }: { meta: Meta; onSaved: () => void }) {
    const [sectionId, setSectionId] = useState('');
    const [picked, setPicked] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => { setPicked(meta.sectionHeads.filter(h => h.sectionId === sectionId).map(h => h.userId)); }, [sectionId, meta.sectionHeads]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`${TT_API}/section-heads`, { sectionId, userIds: picked }, { withCredentials: true });
            toast.success(res.data.msg); onSaved();
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };

    return (
        <Card title="Heads of section" hint="Staff you pick here see the timetable of every class in that section, on top of their own lessons.">
            <Field label="Section">
                <select className={inputCls} value={sectionId} onChange={e => setSectionId(e.target.value)}>
                    <option value="">Choose a section…</option>{meta.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </Field>
            {sectionId && (
                <>
                    <div className="grid max-h-56 gap-1 overflow-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                        {meta.staff.map(u => (
                            <label key={u.id} className="flex items-center gap-2 text-sm text-slate-600">
                                <input type="checkbox" className="accent-[#1E4DA6]" checked={picked.includes(u.id)} onChange={e => setPicked(p => (e.target.checked ? [...p, u.id] : p.filter(x => x !== u.id)))} /> {u.name}
                                <span className="text-[10px] uppercase text-slate-400">{u.role.replace(/_/g, ' ').toLowerCase()}</span>
                            </label>
                        ))}
                    </div>
                    <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
                </>
            )}
        </Card>
    );
}

export default function SettingsPanel({ meta, reloadMeta }: { meta: Meta; reloadMeta: () => void }) {
    return (
        <div className="space-y-6">
            <PeriodRules meta={meta} />
            <SubjectRules meta={meta} />
            <AlertSettings />
            <SectionHeads meta={meta} onSaved={reloadMeta} />
        </div>
    );
}
