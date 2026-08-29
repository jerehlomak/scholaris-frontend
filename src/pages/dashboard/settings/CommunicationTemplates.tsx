import { useState } from 'react';
import { MessageSquare, Settings2 } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';

interface SMSTemplate {
    id: string;
    trigger: string;
    description: string;
    content: string;
    isActive: boolean;
}

const DEFAULT_TEMPLATES: SMSTemplate[] = [
    { id: 't1', trigger: 'Fee Payment Overdue', description: 'Sent automatically when a student misses a payment deadline.', content: 'Dear [PARENT_NAME], this is a reminder that the [FEE_TYPE] of [OUTSTANDING_AMOUNT] for [STUDENT_NAME] is overdue. Kindly pay to avoid penalties. Thanks.', isActive: true },
    { id: 't2', trigger: 'Results Published', description: 'Sent when the terms final results are officially released.', content: 'Dear [PARENT_NAME], the [CURRENT_TERM] results for [STUDENT_NAME] are now available. Please log in to the portal to view the report card.', isActive: true },
    { id: 't3', trigger: 'Student Absent Without Notice', description: 'Triggered if a student is marked Absent and no excuse was provided.', content: 'URGENT: Dear [PARENT_NAME], [STUDENT_NAME] was marked absent today, [CURRENT_DATE], without prior notice. Please contact the school immediately.', isActive: false },
    { id: 't4', trigger: 'Happy Birthday (Student)', description: "Sent automatically on the student's birthday.", content: 'Happy Birthday [STUDENT_NAME]! We wish you a wonderful day and a successful academic year ahead, from all of us at [SCHOOL_NAME].', isActive: true },
];

const VARIABLES = ['[STUDENT_NAME]', '[PARENT_NAME]', '[CURRENT_TERM]', '[FEE_TYPE]', '[OUTSTANDING_AMOUNT]', '[CURRENT_DATE]', '[SCHOOL_NAME]'];

export function CommunicationTemplates() {
    const [templates, setTemplates] = useState<SMSTemplate[]>(DEFAULT_TEMPLATES);
    const [saved, setSaved] = useState(false);
    const [activeId, setActiveId] = useState<string>(DEFAULT_TEMPLATES[0].id);

    const active = templates.find(t => t.id === activeId);

    const handleUpdate = (field: keyof SMSTemplate, value: string | boolean) => {
        setSaved(false);
        setTemplates(prev => prev.map(t => t.id === activeId ? { ...t, [field]: value } : t));
    };

    const insertVar = (v: string) => {
        if (!active) return;
        handleUpdate('content', active.content + ' ' + v);
    };

    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

    const preview = (content: string) =>
        content
            .replace(/\[STUDENT_NAME\]/g, 'John Doe')
            .replace(/\[PARENT_NAME\]/g, 'Mr. Doe')
            .replace(/\[CURRENT_TERM\]/g, 'First Term 2025')
            .replace(/\[FEE_TYPE\]/g, 'Tuition Fee')
            .replace(/\[OUTSTANDING_AMOUNT\]/g, '₦45,000')
            .replace(/\[CURRENT_DATE\]/g, new Date().toLocaleDateString())
            .replace(/\[SCHOOL_NAME\]/g, 'Skooly High');

    return (
        <SettingsShell breadcrumbParent="Messaging" breadcrumbCurrent="Communication" tabLabel="SMS Templates" tabIcon={<MessageSquare className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<MessageSquare className="h-7 w-7" />}
                title="Auto-Message Templates"
                subtitle="Customize the SMS and notification messages sent automatically to parents based on school events and triggers."
            />

            <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
                {/* Template list */}
                <div className="w-full md:w-64 shrink-0 space-y-2">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Auto-Messages</h3>
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveId(t.id)}
                            className={cn(
                                'w-full rounded-xl border-2 p-3.5 text-left transition-all',
                                activeId === t.id ? 'border-[#1E4DA6]/20 bg-[#1E4DA6]/8 shadow-sm' : 'border-transparent bg-slate-50/60 hover:bg-slate-100/60'
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className={cn('font-bold text-sm leading-snug', activeId === t.id ? 'text-[#173F8C]' : 'text-slate-700')}>{t.trigger}</span>
                                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', t.isActive ? 'bg-emerald-400' : 'bg-slate-300')} />
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 leading-tight line-clamp-2">{t.description}</p>
                        </button>
                    ))}
                </div>

                {/* Editor */}
                {active && (
                    <div className="flex-1 space-y-5">
                        <div className="w-full flex flex-col md:flex-row items-start justify-center md:justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="flex items-center gap-2 font-black text-slate-800"><Settings2 className="h-4 w-4 text-[#1E4DA6]" />{active.trigger}</h2>
                                <p className="mt-1 text-xs text-slate-500">{active.description}</p>
                            </div>
                            <button
                                onClick={() => handleUpdate('isActive', !active.isActive)}
                                className={cn('shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors', active.isActive ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}
                            >
                                {active.isActive ? 'Active (Will Send)' : 'Disabled (Paused)'}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Content</label>
                                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', active.content.length > 160 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500')}>
                                    {active.content.length} / 160 chars
                                </span>
                            </div>
                            <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white focus-within:border-[#1E4DA6]/60 transition-colors">
                                <textarea
                                    value={active.content}
                                    onChange={e => handleUpdate('content', e.target.value)}
                                    disabled={!active.isActive}
                                    className="h-36 w-full resize-none bg-white px-5 py-4 text-sm leading-relaxed text-slate-800 outline-none disabled:opacity-60"
                                />
                                <div className="border-t border-slate-100 bg-slate-50 p-3">
                                    <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Insert Variables</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {VARIABLES.map(v => (
                                            <button key={v} onClick={() => insertVar(v)} disabled={!active.isActive}
                                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#1E4DA6] hover:border-[#1E4DA6]/35 hover:bg-[#1E4DA6]/5 disabled:opacity-40 transition-colors">
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-4">
                            <p className="mb-2 flex items-center gap-2 font-bold text-[#173F8C] text-sm"><MessageSquare className="h-4 w-4" />Live Preview</p>
                            <p className="text-sm italic text-slate-600">"{preview(active.content)}"</p>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            <SaveButton onClick={handleSave} saved={saved} saveLabel="Save Template" savedLabel="Template Saved!" />
                        </div>
                    </div>
                )}
            </div>
        </SettingsShell>
    );
}

