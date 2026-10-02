import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { LD_API, apiError, fmtBytes, inputCls, type Meta, type Settings } from './api';

const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h3 className="text-sm font-bold text-slate-700">{title}</h3>{hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}</div>
        {children}
    </section>
);
const Field = ({ t, hint, children }: { t: string; hint?: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t}</span>{children}{hint && <span className="block text-[11px] text-slate-400">{hint}</span>}</label>
);
const Toggle = ({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) => (
    <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1E4DA6]" checked={on} onChange={e => set(e.target.checked)} />
        <span><span className="text-sm font-semibold text-slate-700">{label}</span>{hint && <span className="block text-xs text-slate-400">{hint}</span>}</span>
    </label>
);
const lines = (v: string) => v.split('\n').map(s => s.trim()).filter(Boolean);

export function SettingsPanel({ meta, onSaved }: { meta: Meta; onSaved: () => void }) {
    const [s, setS] = useState<Settings>(meta.settings);
    const [curricula, setCurricula] = useState(meta.settings.curricula.join('\n'));
    const [sections, setSections] = useState(meta.settings.lessonNoteSections.join('\n'));
    const [saving, setSaving] = useState(false);
    const set = (p: Partial<Settings>) => setS(x => ({ ...x, ...p }));
    const st = meta.storage;
    const pct = Math.min(100, Math.round((st.usedBytes / st.limitBytes) * 100));

    const save = async () => {
        setSaving(true);
        try {
            await axios.put(`${LD_API}/settings`, { settings: { ...s, curricula: lines(curricula), lessonNoteSections: lines(sections) } });
            toast.success('Settings saved'); onSaved();
        } catch (err) { toast.error(apiError(err, 'Could not save.')); }
        finally { setSaving(false); }
    };

    const curriculaList = lines(curricula);

    return (
        <div className="space-y-6">
            <Card title="AI generation" hint="Who can use AI, and how much.">
                {!meta.ai.configured && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">The AI service is not connected on the server yet (ANTHROPIC_API_KEY). Typing, saving, uploading and sharing still work.</p>}
                <Toggle on={s.aiEnabled} set={v => set({ aiEnabled: v })} label="Turn on AI generation" hint="Switch off to disable AI for everyone, including admins." />
                <Toggle on={s.teachersCanUseAi} set={v => set({ teachersCanUseAi: v })} label="Teachers can use AI" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field t="AI generations per person per day" hint="0 means no limit. Each generation or AI revision counts as one."><input type="number" min={0} max={200} className={inputCls} value={s.dailyAiLimit} onChange={e => set({ dailyAiLimit: Number(e.target.value) })} /></Field>
                    <Field t="Language"><input className={inputCls} value={s.defaultLanguage} onChange={e => set({ defaultLanguage: e.target.value })} /></Field>
                </div>
                <Toggle on={s.includeDiagrams} set={v => set({ includeDiagrams: v })} label="Include diagrams by default" hint="Teachers can still switch this off for each document." />
            </Card>

            <Card title="Curricula and defaults" hint="What teachers can pick when generating. They can also type any other curriculum.">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field t="Curricula (one per line)"><textarea className={`${inputCls} !h-40 py-2`} value={curricula} onChange={e => setCurricula(e.target.value)} /></Field>
                    <div className="space-y-3">
                        <Field t="Default curriculum"><select className={inputCls} value={s.defaultCurriculum} onChange={e => set({ defaultCurriculum: e.target.value })}>{curriculaList.map(c => <option key={c}>{c}</option>)}</select></Field>
                        <Field t="Default lesson length (minutes)"><input type="number" min={10} max={240} className={inputCls} value={s.defaultDuration} onChange={e => set({ defaultDuration: Number(e.target.value) })} /></Field>
                    </div>
                </div>
            </Card>

            <Card title="Lesson note format" hint="The sections every AI lesson note includes, in order, plus any house rules the AI must always follow.">
                <Field t="Sections (one per line)"><textarea className={`${inputCls} !h-44 py-2`} value={sections} onChange={e => setSections(e.target.value)} /></Field>
                <Field t="School style notes" hint="Added to every AI request, e.g. “Use British spelling. Always end with a 5-question quiz.”"><textarea className={`${inputCls} !h-20 py-2`} maxLength={1500} value={s.schoolStyleNotes} onChange={e => set({ schoolStyleNotes: e.target.value })} /></Field>
            </Card>

            <Card title="Uploads, storage and sharing">
                <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Storage used by lesson documents</span><span className="font-semibold">{fmtBytes(st.usedBytes)} of {st.limitMB} MB</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full', pct > 90 ? 'bg-red-500' : 'bg-[#1E4DA6]')} style={{ width: `${pct}%` }} /></div>
                    <p className="mt-1 text-[11px] text-slate-400">The allowance comes from your school's subscription plan. Contact your platform administrator to change it.</p>
                </div>
                <Toggle on={s.allowTeacherUploads} set={v => set({ allowTeacherUploads: v })} label="Teachers can upload PDF / Word files" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field t="Largest upload (MB)"><input type="number" min={1} max={20} className={inputCls} value={s.maxUploadMB} onChange={e => set({ maxUploadMB: Number(e.target.value) })} /></Field>
                    <Field t="Share links last (days)"><input type="number" min={1} max={90} className={inputCls} value={s.shareLinkDays} onChange={e => set({ shareLinkDays: Number(e.target.value) })} /></Field>
                </div>
                <Toggle on={s.allowEmailShare} set={v => set({ allowEmailShare: v })} label="Allow sharing by email" hint="Uses the school's email settings." />
            </Card>

            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>
        </div>
    );
}
