import { FileDigit, MonitorPlay, ShieldAlert, Camera, RefreshCcw, EyeOff, Clock } from 'lucide-react';
import { useState } from 'react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';

interface CBTPolicy {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
    category: 'security' | 'experience' | 'grading';
}

const INITIAL_POLICIES: CBTPolicy[] = [
    { id: 'p1', title: 'Strict Full-Screen Lockdown', description: 'Forces the exam to run in full-screen mode. Automatically submits if the student switches tabs or minimizes the browser.', icon: <MonitorPlay className="h-5 w-5 text-indigo-500" />, enabled: true, category: 'security' },
    { id: 'p2', title: 'Disable Copy & Paste', description: 'Prevents students from copying text from the exam or pasting external answers into essay boxes.', icon: <ShieldAlert className="h-5 w-5 text-red-500" />, enabled: true, category: 'security' },
    { id: 'p3', title: 'Webcam Proctor Snapshot', description: 'Periodically takes silent webcam photos during the exam to verify the identity of the person taking it.', icon: <Camera className="h-5 w-5 text-emerald-500" />, enabled: false, category: 'security' },
    { id: 'p4', title: 'Randomize/Shuffle Questions', description: 'Questions and multi-choice options appear in a different order for every student to deter side-by-side cheating.', icon: <RefreshCcw className="h-5 w-5 text-[#1E4DA6]" />, enabled: true, category: 'experience' },
    { id: 'p5', title: 'Hide Overall Result Until Published', description: "Prevents students from seeing their final score immediately after submission until a teacher officially releases it.", icon: <EyeOff className="h-5 w-5 text-slate-500" />, enabled: true, category: 'grading' },
    { id: 'p6', title: 'Auto-Submit on Timer Expiration', description: 'Instantly collects whatever answers have been selected the moment the countdown timer hits zero.', icon: <Clock className="h-5 w-5 text-orange-500" />, enabled: true, category: 'experience' },
];

function PolicyCard({ policy, onToggle }: { policy: CBTPolicy; onToggle: () => void }) {
    return (
        <div className={cn(
            'group relative flex flex-col md:flex-row gap-4 rounded-2xl border-2 bg-white p-5 transition-all duration-200',
            policy.enabled ? 'border-[#1E4DA6]/10 shadow-sm hover:border-[#1E4DA6]/20 hover:shadow-md' : 'border-slate-100 opacity-70'
        )}>
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm', policy.enabled ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100')}>
                {policy.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{policy.title}</h4>
                    {/* Toggle */}
                    <button
                        onClick={onToggle}
                        className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                            policy.enabled ? 'bg-[#1E4DA6]' : 'bg-slate-200'
                        )}
                    >
                        <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform', policy.enabled ? 'translate-x-4' : 'translate-x-0')} />
                    </button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 pr-4">{policy.description}</p>
            </div>
        </div>
    );
}

function PolicyGroup({ title, policies, onToggle }: { title: string; policies: CBTPolicy[]; onToggle: (id: string) => void }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {policies.map(p => <PolicyCard key={p.id} policy={p} onToggle={() => onToggle(p.id)} />)}
            </div>
        </div>
    );
}

export function CBTSettings() {
    const [policies, setPolicies] = useState<CBTPolicy[]>(INITIAL_POLICIES);
    const [saved, setSaved] = useState(false);

    const toggle = (id: string) => {
        setSaved(false);
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    };

    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

    return (
        <SettingsShell breadcrumbCurrent="CBT & Exam Policies" tabLabel="Global Exam Rules" tabIcon={<FileDigit className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<FileDigit className="h-7 w-7" />}
                title="Computer-Based Test Policies"
                subtitle="Configure the default strictness and behavior for all online examinations. These settings apply globally across all subjects."
            />
            <div className="space-y-8 mb-8">
                <PolicyGroup title="Anti-Cheating & Security" policies={policies.filter(p => p.category === 'security')} onToggle={toggle} />
                <PolicyGroup title="Student Experience" policies={policies.filter(p => p.category === 'experience')} onToggle={toggle} />
                <PolicyGroup title="Grading & Visibility" policies={policies.filter(p => p.category === 'grading')} onToggle={toggle} />
            </div>
            <div className="border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} saveLabel="Save Global Policies" savedLabel="Policies Applied!" />
            </div>
        </SettingsShell>
    );
}
