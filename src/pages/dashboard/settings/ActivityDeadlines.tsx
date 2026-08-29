import { useState, useEffect, useCallback } from 'react';
import {
    Clock, Plus, Trash2, Loader2, AlertTriangle, CheckCircle, Calendar,
    ShieldOff, X, Info
} from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { ActivityExemptions } from './ActivityExemptions';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

interface TermOption { id: string; name: string; session: { name: string }; }
interface Deadline {
    id: string; activity: string; label: string | null; deadline: string;
    warningLeadHours: number; isActive: boolean; term: { name: string; session: { name: string }; };
}

const ACTIVITIES = [
    { value: 'SCORE_ENTRY', label: 'Score Entry', icon: '📝', desc: 'Teachers cannot submit scores after this time.' },
    { value: 'FEE_ENTRY', label: 'Fee Entry', icon: '💳', desc: 'Fee records cannot be modified after this time.' },
    { value: 'ATTENDANCE', label: 'Attendance Entry', icon: '📋', desc: 'Attendance records cannot be changed after this time.' },
    { value: 'CBT', label: 'CBT / Exams', icon: '📱', desc: 'Online exams will be inaccessible after this time.' },
];

const ACTIVITY_COLORS: Record<string, string> = {
    SCORE_ENTRY: 'border-[#1E4DA6]/20 bg-[#1E4DA6]/5 text-[#173F8C]',
    FEE_ENTRY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ATTENDANCE: 'border-[#1E4DA6]/20 bg-[#1E4DA6]/5 text-[#173F8C]',
    CBT: 'border-orange-200 bg-orange-50 text-orange-700',
};

function formatDeadline(dt: string) {
    const d = new Date(dt);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatus(deadline: string) {
    const now = new Date();
    const dl = new Date(deadline);
    const diffHrs = (dl.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHrs < 0) return { label: 'EXPIRED', color: 'bg-red-100 text-red-700' };
    if (diffHrs < 24) return { label: 'EXPIRING SOON', color: 'bg-amber-100 text-amber-700' };
    return { label: 'ACTIVE', color: 'bg-emerald-100 text-emerald-700' };
}

export function ActivityDeadlines() {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [terms, setTerms] = useState<TermOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [fTermId, setFTermId] = useState('');
    const [fActivity, setFActivity] = useState('SCORE_ENTRY');
    const [fDeadline, setFDeadline] = useState('');
    const [fLabel, setFLabel] = useState('');
    const [fWarningHours, setFWarningHours] = useState(48);

    const fetchData = useCallback(async () => {
        try {
            const [dlRes, termRes] = await Promise.all([
                axios.get('/api/v1/deadlines', { withCredentials: true }),
                axios.get('/api/v1/terms', { withCredentials: true }),
            ]);
            setDeadlines(dlRes.data.deadlines);
            setTerms(termRes.data.terms);
            if (termRes.data.terms.length > 0 && !fTermId) {
                const active = termRes.data.terms.find((t: TermOption & { isActive: boolean }) => t.isActive);
                setFTermId(active?.id || termRes.data.terms[0].id);
            }
        } catch {
            toast.error('Failed to load deadline data');
        } finally {
            setIsLoading(false);
        }
    }, [fTermId]);

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fTermId || !fDeadline) { toast.error('Term and Deadline date/time are required'); return; }
        setIsSaving(true);
        try {
            await axios.post('/api/v1/deadlines', {
                termId: fTermId, activity: fActivity, deadline: new Date(fDeadline).toISOString(),
                label: fLabel || null, warningLeadHours: fWarningHours
            }, { withCredentials: true });
            toast.success('Deadline saved successfully');
            setIsAdding(false);
            setFLabel(''); setFDeadline('');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to save deadline');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this deadline? The activity will become unlocked.')) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/deadlines/${id}`, { withCredentials: true });
            toast.success('Deadline removed');
            setDeadlines(prev => prev.filter(d => d.id !== id));
        } catch { toast.error('Failed to remove deadline'); }
        finally { setDeletingId(null); }
    };

    if (isLoading) {
        return (
            <SettingsShell breadcrumbCurrent="Activity Deadlines" tabLabel="Activity Deadlines" tabIcon={<Clock className="h-3.5 w-3.5" />}>
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>
            </SettingsShell>
        );
    }

    const activityInfo = (act: string) => ACTIVITIES.find(a => a.value === act);

    return (
        <SettingsShell breadcrumbParent="Settings" breadcrumbCurrent="Activity Deadlines" tabLabel="Activity Deadlines" tabIcon={<Clock className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Clock className="h-7 w-7" />}
                title="Activity Deadlines"
                subtitle="Set exact date and time cutoffs for score entry, fee entry, attendance, and more. Teachers and staff will see countdown warnings before the deadline."
            />

            {/* Info banner */}
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/5 p-4">
                <Info className="h-5 w-5 text-[#1E4DA6] shrink-0 mt-0.5" />
                <div className="text-sm text-[#173F8C]">
                    <span className="font-bold">How it works:</span> When a deadline is set, the system automatically locks the activity at the exact minute. Staff see a warning banner on their dashboard within your specified lead time (e.g. 48 hours before). The admin is never locked out.
                </div>
            </div>

            {/* Add button */}
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn('flex items-center gap-2 rounded-xl border-2 border-dashed px-5 py-2.5 text-sm font-semibold transition-all',
                        isAdding ? 'border-red-200 bg-red-50 text-red-600' : 'border-[#1E4DA6]/20 bg-[#1E4DA6]/5 text-[#1E4DA6] hover:bg-[#1E4DA6]/10')}
                >
                    {isAdding ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Set New Deadline</>}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={handleSave} className="mb-8 rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-6 space-y-5">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Configure Deadline</h3>

                    {/* Activity Type */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">Activity Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {ACTIVITIES.map(act => (
                                <button key={act.value} type="button" onClick={() => setFActivity(act.value)}
                                    className={cn('flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all text-xs font-bold',
                                        fActivity === act.value ? 'border-[#1E4DA6] bg-[#1E4DA6]/10 text-[#173F8C]' : 'border-slate-200 bg-white text-slate-600 hover:border-[#1E4DA6]/20')}>
                                    <span className="text-xl">{act.icon}</span>
                                    {act.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 italic">{activityInfo(fActivity)?.desc}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Term */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Academic Term <span className="text-red-500">*</span></label>
                            <select required value={fTermId} onChange={e => setFTermId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4DA6]/60">
                                <option value="">Select a Term...</option>
                                {terms.map(t => (
                                    <option key={t.id} value={t.id}>{t.session?.name} — {t.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Deadline Date+Time */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Deadline Date & Time <span className="text-red-500">*</span></label>
                            <input required type="datetime-local" value={fDeadline} onChange={e => setFDeadline(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4DA6]/60" />
                        </div>
                        {/* Optional label */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Label (optional)</label>
                            <input type="text" value={fLabel} onChange={e => setFLabel(e.target.value)}
                                placeholder="e.g. First Term Score Deadline"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4DA6]/60" />
                        </div>
                        {/* Warning lead time */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Warning Lead Time (hours)</label>
                            <input type="number" min={1} max={168} value={fWarningHours} onChange={e => setFWarningHours(parseInt(e.target.value) || 48)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1E4DA6]/60" />
                            <p className="text-xs text-slate-400 mt-1">Staff will see a warning banner {fWarningHours} hour(s) before the deadline.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isSaving}
                            className="rounded-xl bg-[#173F8C] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#122F69] disabled:opacity-70 flex items-center gap-2">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Set Deadline'}
                        </button>
                    </div>
                </form>
            )}

            {/* Deadlines List */}
            <div className="space-y-3">
                {deadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Clock className="h-12 w-12 mb-3 opacity-30" />
                        <p className="font-bold text-slate-500">No deadlines configured</p>
                        <p className="text-sm mt-1">Set a deadline above to begin controlling activity access.</p>
                    </div>
                ) : (
                    deadlines.map(dl => {
                        const info = activityInfo(dl.activity);
                        const status = getStatus(dl.deadline);
                        const colorClass = ACTIVITY_COLORS[dl.activity] || 'border-slate-200 bg-slate-50 text-slate-700';

                        return (
                            <div key={dl.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg', colorClass)}>
                                        {info?.icon || '⏰'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-slate-800">{dl.label || info?.label || dl.activity}</h4>
                                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', status.color)}>{status.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {dl.term?.session?.name} — {dl.term?.name} &nbsp;•&nbsp;
                                            <span className="font-semibold text-slate-700">{formatDeadline(dl.deadline)}</span>
                                            &nbsp;•&nbsp; ⏰ {dl.warningLeadHours}h warning
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {status.label !== 'EXPIRED' ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <ShieldOff className="h-4 w-4 text-red-400" />
                                    )}
                                    <button onClick={() => handleDelete(dl.id)} disabled={deletingId === dl.id}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        {deletingId === dl.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Mount Exemptions below Deadlines */}
            <ActivityExemptions />
        </SettingsShell>
    );
}
