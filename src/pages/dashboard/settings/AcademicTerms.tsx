import { useState, useEffect } from 'react';
import { CalendarRange, Plus, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { useTerm } from '../../../context/TermContext';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';
import axios from 'axios';

export function AcademicTerms() {
    const { terms, activateTerm, addTerm, isLoading } = useTerm();
    const [isAdding, setIsAdding] = useState(false);
    const [newTermName, setNewTermName] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newSessionId, setNewSessionId] = useState('');
    const [makeActive, setMakeActive] = useState(false);
    const [saved, setSaved] = useState(false);
    const [sessions, setSessions] = useState<{id: string, year: string, isActive: boolean}[]>([]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await axios.get('/api/v1/sessions', { withCredentials: true });
                setSessions(res.data.sessions);
                const active = res.data.sessions.find((s: any) => s.isActive);
                if (active) setNewSessionId(active.id);
            } catch (error) {
                console.error("Failed to fetch sessions");
            }
        };
        fetchSessions();
    }, []);

    const handleAddTerm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTermName || !newSessionId) return;
        addTerm({ name: newTermName, sessionId: newSessionId, startDate: newStartDate, endDate: newEndDate, isActive: makeActive });
        setNewTermName(''); setNewStartDate(''); setNewEndDate(''); setMakeActive(false); setIsAdding(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    return (
        <SettingsShell breadcrumbParent="Results & Reports"
            breadcrumbCurrent="Academic Terms"
            tabLabel="Academic Terms"
            tabIcon={<CalendarRange className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<CalendarRange className="h-7 w-7" />}
                title="Academic Terms"
                subtitle="Manage academic sessions and control which term is currently active across the system."
            />

            {/* Add term toggle */}
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        'flex items-center gap-2 rounded-xl border-2 border-dashed px-5 py-2.5 text-sm font-semibold transition-all',
                        isAdding
                            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border-[#1E4DA6]/20 bg-[#1E4DA6]/5 text-[#1E4DA6] hover:bg-[#1E4DA6]/10'
                    )}
                >
                    {isAdding ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add New Term</>}
                </button>
            </div>

            {/* Add term form */}
            {isAdding && (
                <form
                    onSubmit={handleAddTerm}
                    className="mb-8 rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-6 space-y-4"
                >
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                        Create Academic Term
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Academic Session <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={newSessionId}
                                onChange={e => setNewSessionId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            >
                                <option value="" disabled>Select a session</option>
                                {sessions.map(s => (
                                    <option key={s.id} value={s.id}>{s.year} {s.isActive ? '(Active)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Term Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={newTermName}
                                onChange={e => setNewTermName(e.target.value)}
                                placeholder="e.g. First Term"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Start Date</label>
                            <input
                                type="date"
                                value={newStartDate}
                                onChange={e => setNewStartDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">End Date</label>
                            <input
                                type="date"
                                value={newEndDate}
                                onChange={e => setNewEndDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="makeActive"
                                checked={makeActive}
                                onChange={e => setMakeActive(e.target.checked)}
                                className="h-4 w-4 accent-[#1E4DA6]"
                            />
                            <label htmlFor="makeActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                Set as active term immediately
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="rounded-xl bg-[#173F8C] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#122F69] transition-colors"
                        >
                            Create Term
                        </button>
                    </div>
                </form>
            )}

            {/* Terms table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Term History</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Term Name</th>
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Session</th>
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Timeline</th>
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[...terms].reverse().map(term => {
                                const session = sessions.find(s => s.id === term.sessionId);
                                return (
                                <tr key={term.id} className={cn('transition-colors', term.isActive ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50')}>
                                    <td className="px-5 py-4 font-semibold text-slate-800">{term.name}</td>
                                    <td className="px-5 py-4 text-slate-600">{session?.year || 'Unknown'}</td>
                                    <td className="px-5 py-4">
                                        {term.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                                <CheckCircle className="h-3.5 w-3.5" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                                                <Clock className="h-3.5 w-3.5" /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">
                                        {term.startDate ? new Date(term.startDate).toLocaleDateString() : 'N/A'} → {term.endDate ? new Date(term.endDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => activateTerm(term.id)}
                                            disabled={term.isActive}
                                            className={cn(
                                                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                                                term.isActive
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-[#1E4DA6]/5 text-[#173F8C] hover:bg-[#1E4DA6]/10'
                                            )}
                                        >
                                            {term.isActive ? 'Activated' : 'Make Active'}
                                        </button>
                                    </td>
                                </tr>
                            )})}
                            {terms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No academic terms found. Create one above.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SettingsShell>
    );
}

