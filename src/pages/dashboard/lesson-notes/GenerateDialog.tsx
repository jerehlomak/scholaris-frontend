import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { KINDS, LD_API, emptyMeta, inputCls, streamAi, type DocMeta, type Kind, type Meta } from './api';

const Label = ({ t, children, className }: { t: string; children: React.ReactNode; className?: string }) => (
    <label className={cn('block space-y-1', className)}><span className="text-xs font-semibold text-slate-600">{t}</span>{children}</label>
);

const OTHER = '__other__';

/** Collects what the teacher wants, streams the document from the server and hands the finished HTML back. */
export function GenerateDialog({ meta, initialKind = 'LESSON_NOTE', onClose, onGenerated }: {
    meta: Meta; initialKind?: Kind; onClose: () => void; onGenerated: (html: string, docMeta: DocMeta) => void;
}) {
    const s = meta.settings;
    const [m, setM] = useState<DocMeta>({ ...emptyMeta(meta), kind: initialKind });
    const [subtopic, setSubtopic] = useState('');
    const [duration, setDuration] = useState(s.defaultDuration);
    const [detail, setDetail] = useState<'brief' | 'standard' | 'comprehensive'>('standard');
    const [diagrams, setDiagrams] = useState(s.includeDiagrams);
    const [language, setLanguage] = useState(s.defaultLanguage);
    const [instructions, setInstructions] = useState('');
    const [curriculumPick, setCurriculumPick] = useState(s.curricula.includes(m.curriculum) ? m.curriculum : OTHER);
    const [busy, setBusy] = useState(false);
    const [chars, setChars] = useState(0);
    const abort = useRef<AbortController | null>(null);

    const set = (p: Partial<DocMeta>) => setM(x => ({ ...x, ...p }));
    const isNote = m.kind === 'LESSON_NOTE';
    const words = Math.round(chars / 6);

    const go = async () => {
        if (!meta.ai.enabled) return toast.error(meta.ai.reason || 'AI generation is not available.');
        if (!m.title.trim() && !m.topic.trim() && !instructions.trim()) return toast.error('Tell the AI what you need: a topic, a title or some instructions.');
        setBusy(true); setChars(0);
        abort.current = new AbortController();
        try {
            const { html, truncated } = await streamAi(`${LD_API}/generate`, {
                ...m, subtopic, duration, detail, includeDiagrams: diagrams, language, instructions,
            }, setChars, abort.current.signal);
            if (truncated) toast.warning('The document was very long and may be cut off at the end. Check the last section.');
            onGenerated(html, { ...m, title: m.title.trim() || m.topic.trim() || KINDS.find(k => k.value === m.kind)!.label });
        } catch (err: any) {
            if (err?.name !== 'AbortError') toast.error(err?.message || 'The AI could not complete this request.');
            setBusy(false);
        }
    };
    const cancel = () => { abort.current?.abort(); setBusy(false); };

    return (
        <Dialog open onOpenChange={o => { if (!o && !busy) onClose(); }}>
            <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#1E4DA6]" /> Generate with AI</DialogTitle>
                    <DialogDescription>
                        Describe what you need. You can edit everything afterwards.
                        {meta.ai.remaining !== null && <span className="ml-1 font-semibold">{meta.ai.remaining} generation{meta.ai.remaining === 1 ? '' : 's'} left today.</span>}
                    </DialogDescription>
                </DialogHeader>

                {busy ? (
                    <div className="space-y-4 py-10 text-center">
                        <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#1E4DA6]" />
                        <p className="font-semibold text-slate-700">Writing your document…</p>
                        <p className="text-xs text-slate-500">{words > 0 ? `About ${words.toLocaleString()} words so far` : 'Planning the structure'}. Longer documents with diagrams can take a minute or two.</p>
                        <Button variant="outline" onClick={cancel}><X /> Cancel</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {KINDS.map(k => (
                                <button key={k.value} type="button" onClick={() => set({ kind: k.value })} title={k.hint}
                                    className={cn('rounded-xl border-2 px-2 py-2 text-xs font-bold', m.kind === k.value ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>{k.label}</button>
                            ))}
                        </div>

                        <Label t={m.kind === 'OTHER' ? 'What do you need?' : 'Title (optional)'}>
                            <input className={inputCls} value={m.title} onChange={e => set({ title: e.target.value })} maxLength={200}
                                placeholder={m.kind === 'OTHER' ? 'e.g. Marking guide for JSS2 English essays' : 'e.g. Photosynthesis'} />
                        </Label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Label t="Subject"><input list="ln-subjects" className={inputCls} value={m.subject} onChange={e => set({ subject: e.target.value })} /><datalist id="ln-subjects">{meta.subjects.map(x => <option key={x} value={x} />)}</datalist></Label>
                            <Label t="Class / level"><input list="ln-classes" className={inputCls} value={m.classLevel} onChange={e => set({ classLevel: e.target.value })} placeholder="e.g. JSS 2, Year 7, Grade 5" /><datalist id="ln-classes">{meta.classes.map(x => <option key={x} value={x} />)}</datalist></Label>
                            {m.kind !== 'SCHEME_OF_WORK' && m.kind !== 'CURRICULUM' && <Label t="Topic"><input className={inputCls} value={m.topic} onChange={e => set({ topic: e.target.value })} maxLength={200} /></Label>}
                            {isNote && <Label t="Sub-topic"><input className={inputCls} value={subtopic} onChange={e => setSubtopic(e.target.value)} maxLength={200} /></Label>}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Label t="Curriculum">
                                <select className={inputCls} value={curriculumPick} onChange={e => { setCurriculumPick(e.target.value); if (e.target.value !== OTHER) set({ curriculum: e.target.value }); else set({ curriculum: '' }); }}>
                                    {s.curricula.map(c => <option key={c}>{c}</option>)}<option value={OTHER}>Other (type below)…</option>
                                </select>
                            </Label>
                            {curriculumPick === OTHER && <Label t="Your curriculum"><input className={inputCls} value={m.curriculum} onChange={e => set({ curriculum: e.target.value })} placeholder="e.g. Singapore MOE, Indian CBSE, French Baccalauréat" /></Label>}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Label t="Term"><input list="ln-terms" className={inputCls} value={m.term} onChange={e => set({ term: e.target.value })} /><datalist id="ln-terms">{meta.terms.map(x => <option key={x} value={x} />)}</datalist></Label>
                            <Label t="Session"><input list="ln-sessions" className={inputCls} value={m.academicYear} onChange={e => set({ academicYear: e.target.value })} /><datalist id="ln-sessions">{meta.sessions.map(x => <option key={x} value={x} />)}</datalist></Label>
                            {m.kind !== 'SCHEME_OF_WORK' && m.kind !== 'CURRICULUM' && (
                                <Label t="Week"><select className={inputCls} value={m.week} onChange={e => set({ week: e.target.value })}><option value="">—</option>{Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}</select></Label>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {isNote && <Label t="Lesson length (minutes)"><input type="number" min={5} max={300} className={inputCls} value={duration} onChange={e => setDuration(Number(e.target.value))} /></Label>}
                            <Label t="Detail"><select className={inputCls} value={detail} onChange={e => setDetail(e.target.value as any)}><option value="brief">Brief</option><option value="standard">Standard</option><option value="comprehensive">Comprehensive</option></select></Label>
                            <Label t="Language"><input className={inputCls} value={language} onChange={e => setLanguage(e.target.value)} /></Label>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="h-4 w-4 accent-[#1E4DA6]" checked={diagrams} onChange={e => setDiagrams(e.target.checked)} /> Include diagrams and drawings where they help</label>

                        <Label t="Anything else? (optional)">
                            <textarea className={`${inputCls} !h-24 py-2`} value={instructions} onChange={e => setInstructions(e.target.value)} maxLength={2000}
                                placeholder="e.g. Use local examples, include a group activity, focus on practical work, align with WAEC syllabus…" />
                        </Label>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={go} disabled={!meta.ai.enabled}><Sparkles /> Generate</Button>
                        </div>
                        {!meta.ai.enabled && <p className="text-right text-xs text-amber-600">{meta.ai.reason}</p>}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
