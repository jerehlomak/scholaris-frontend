import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { CBT_API, apiError, inputCls, fmtBytes, type CbtMeta, type CbtSettings } from './api';

const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="text-sm font-bold text-slate-700">{title}</h3>{hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}</div>{children}</section>
);
const Field = ({ t, hint, children }: { t: string; hint?: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t}</span>{children}{hint && <span className="block text-[11px] text-slate-400">{hint}</span>}</label>
);
const Toggle = ({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) => (
    <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1E4DA6]" checked={on} onChange={e => set(e.target.checked)} /><span><span className="text-sm font-semibold text-slate-700">{label}</span>{hint && <span className="block text-xs text-slate-400">{hint}</span>}</span></label>
);

/** School-wide CBT rules. The administrator decides what teachers are allowed to change. */
export function CbtSettingsPanel({ meta, onSaved }: { meta: CbtMeta; onSaved: () => void }) {
    const [s, setS] = useState<CbtSettings>(meta.settings);
    const [types, setTypes] = useState(meta.settings.examTypes.join('\n'));
    const [saving, setSaving] = useState(false);
    const set = (p: Partial<CbtSettings>) => setS(x => ({ ...x, ...p }));
    const st = meta.storage;
    const pct = Math.min(100, Math.round((st.usedBytes / st.limitBytes) * 100));

    const save = async () => {
        setSaving(true);
        try { await axios.put(`${CBT_API}/settings`, { settings: { ...s, examTypes: types.split('\n').map(x => x.trim()).filter(Boolean) } }); toast.success('Settings saved'); onSaved(); }
        catch (err) { toast.error(apiError(err, 'Could not save.')); } finally { setSaving(false); }
    };
    const setGrade = (i: number, p: Partial<{ min: number; grade: string }>) => set({ gradeScale: s.gradeScale.map((g, j) => (j === i ? { ...g, ...p } : g)) });

    return (
        <div className="space-y-6">
            <Card title="What teachers may do" hint="Administrators can always do all of these. Switch off anything you want to keep for yourself.">
                <Toggle on={s.teachersCanSetTimer} set={v => set({ teachersCanSetTimer: v })} label="Set the exam timer" hint="When off, exams use your default time and warning." />
                <Toggle on={s.teachersCanAddTime} set={v => set({ teachersCanAddTime: v })} label="Give students extra time" />
                <Toggle on={s.teachersCanExempt} set={v => set({ teachersCanExempt: v })} label="Exempt students from an exam" />
                <Toggle on={s.teachersCanReleaseResults} set={v => set({ teachersCanReleaseResults: v })} label="Release results to students and parents" hint="Off by default: students only see results when you release them." />
                <Toggle on={s.teachersCanReleaseLock} set={v => set({ teachersCanReleaseLock: v })} label="Unlock an exam that was locked" />
                <Toggle on={s.teachersCanResetAttempt} set={v => set({ teachersCanResetAttempt: v })} label="Clear an attempt so a student can retake" />
                <Toggle on={s.teachersCanSendToReportCard} set={v => set({ teachersCanSendToReportCard: v })} label="Send CBT scores to the report card" hint="Teachers can only send subjects they teach or their own form class." />
            </Card>

            <Card title="Exam security and offline" hint="Applies to every exam in the school.">
                <Toggle on={s.lockOnLoginElsewhere} set={v => set({ lockOnLoginElsewhere: v })} label="Lock the exam if the account is used on another device" hint="While a student is writing, a sign-in elsewhere is refused and the exam stays locked until an administrator releases it." />
                <Toggle on={s.offlineMode} set={v => set({ offlineMode: v })} label="Allow students to keep writing if their internet drops" hint="Answers are kept on the device and the timer keeps running. They upload when the connection returns." />
                <Field t="Accept offline work for up to (minutes after the deadline)" hint="Offline answers that arrive later than this are still graded but marked as late. 1440 = 24 hours."><input type="number" min={0} max={10080} className={`${inputCls} !w-40`} value={s.syncGraceMinutes} onChange={e => set({ syncGraceMinutes: Number(e.target.value) })} /></Field>
            </Card>

            <Card title="Exam defaults" hint="Pre-filled when a teacher creates an exam.">
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field t="Time allowed (minutes)"><input type="number" min={5} max={600} className={inputCls} value={s.defaultDuration} onChange={e => set({ defaultDuration: Number(e.target.value) })} /></Field>
                    <Field t="Warn when minutes left"><input type="number" min={1} max={60} className={inputCls} value={s.defaultWarnMinutes} onChange={e => set({ defaultWarnMinutes: Number(e.target.value) })} /></Field>
                    <Field t="Pass mark (%)"><input type="number" min={0} max={100} className={inputCls} value={s.defaultPassMark} onChange={e => set({ defaultPassMark: Number(e.target.value) })} /></Field>
                </div>
                <div className="flex flex-wrap gap-6"><Toggle on={s.defaultShuffleQuestions} set={v => set({ defaultShuffleQuestions: v })} label="Shuffle questions" /><Toggle on={s.defaultShuffleOptions} set={v => set({ defaultShuffleOptions: v })} label="Shuffle options" /></div>
                <Field t="Exam types (one per line)"><textarea className={`${inputCls} !h-24 py-2`} value={types} onChange={e => setTypes(e.target.value)} /></Field>
            </Card>

            <Card title="Grades" hint="Used on result sheets and master sheets.">
                <div className="space-y-2">
                    {s.gradeScale.map((g, i) => <div key={i} className="flex items-center gap-2"><span className="text-xs text-slate-500">from</span><input type="number" min={0} max={100} className={`${inputCls} !w-20`} value={g.min} onChange={e => setGrade(i, { min: Number(e.target.value) })} /><span className="text-xs text-slate-500">% grade</span><input className={`${inputCls} !w-20`} maxLength={4} value={g.grade} onChange={e => setGrade(i, { grade: e.target.value })} />
                        {s.gradeScale.length > 1 && <button className="text-slate-400 hover:text-red-500" onClick={() => set({ gradeScale: s.gradeScale.filter((_, j) => j !== i) })} aria-label="Remove grade"><Trash2 className="h-4 w-4" /></button>}</div>)}
                    <button className="flex items-center gap-1 text-xs font-bold text-[#1E4DA6]" onClick={() => set({ gradeScale: [...s.gradeScale, { min: 0, grade: '' }] })}><Plus className="h-3 w-3" /> Add grade</button>
                </div>
            </Card>

            <Card title="AI" hint="Question writing, reading messy documents, and essay-marking suggestions.">
                {!meta.ai.configured && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">The AI service is not connected on the server yet (ANTHROPIC_API_KEY). Everything else works without it.</p>}
                <Toggle on={s.aiEnabled} set={v => set({ aiEnabled: v })} label="Turn on AI for CBT" />
                <Toggle on={s.teachersCanUseAi} set={v => set({ teachersCanUseAi: v })} label="Teachers can use AI" />
                <Field t="AI requests per person per day" hint="0 means no limit."><input type="number" min={0} max={300} className={`${inputCls} !w-32`} value={s.dailyAiLimit} onChange={e => set({ dailyAiLimit: Number(e.target.value) })} /></Field>
            </Card>

            <Card title="Files, storage and sharing">
                <div><div className="mb-1 flex justify-between text-xs text-slate-500"><span>Storage used (lesson documents and CBT questions)</span><span className="font-semibold">{fmtBytes(st.usedBytes)} of {st.limitMB} MB</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full', pct > 90 ? 'bg-red-500' : 'bg-[#1E4DA6]')} style={{ width: `${Math.max(pct, st.usedBytes > 0 ? 1 : 0)}%` }} /></div></div>
                <div className="grid gap-3 sm:grid-cols-2"><Field t="Largest import file (MB)"><input type="number" min={1} max={20} className={inputCls} value={s.maxUploadMB} onChange={e => set({ maxUploadMB: Number(e.target.value) })} /></Field><Field t="Share links last (days)"><input type="number" min={1} max={90} className={inputCls} value={s.shareLinkDays} onChange={e => set({ shareLinkDays: Number(e.target.value) })} /></Field></div>
                <Toggle on={s.allowEmailShare} set={v => set({ allowEmailShare: v })} label="Allow sharing results by email" />
            </Card>

            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>
        </div>
    );
}
