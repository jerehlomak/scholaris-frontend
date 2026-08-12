import { useState, useEffect } from 'react';
import { CalendarRange, Plus, CheckCircle, Clock, X, Trash2, Pencil, Loader2, Check, ChevronDown, ChevronRight, Lock, Unlock, Users } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

interface SessionData {
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
}

interface TermData {
    id: string;
    name: string;
    sessionId: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
    isLocked: boolean;
}

export function AcademicSessions() {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [terms, setTerms] = useState<TermData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [isAddingTerm, setIsAddingTerm] = useState<string | null>(null);
    
    // Form states
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [termName, setTermName] = useState('');
    const [termStartDate, setTermStartDate] = useState('');
    const [termEndDate, setTermEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isOpeningTerm, setIsOpeningTerm] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [sessRes, termRes] = await Promise.all([
                axios.get('/api/v1/sessions', { withCredentials: true }),
                axios.get('/api/v1/terms', { withCredentials: true })
            ]);
            setSessions(sessRes.data.sessions);
            setTerms(termRes.data.terms);
            
            // Expand active session by default
            const currSess = sessRes.data.sessions.find((s: any) => s.isCurrent);
            if (currSess && !expandedSession) setExpandedSession(currSess.id);
        } catch {
            toast.error('Failed to load academic data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setIsSaving(true);
        try {
            const res = await axios.post('/api/v1/sessions', { name, startDate: startDate || null, endDate: endDate || null }, { withCredentials: true });
            toast.success('Session created successfully');
            setSessions(prev => [res.data.session, ...prev]);
            setIsAdding(false);
            setName(''); setStartDate(''); setEndDate('');
            setExpandedSession(res.data.session.id);
        } catch (err: any) { toast.error(err.response?.data?.msg || 'Failed to create session'); }
        finally { setIsSaving(false); }
    };

    const handleAddTerm = async (sessionId: string) => {
        if (!termName) return;
        setIsSaving(true);
        try {
            const res = await axios.post('/api/v1/terms', { name: termName, sessionId, startDate: termStartDate || null, endDate: termEndDate || null }, { withCredentials: true });
            toast.success('Term added to session');
            setTerms(prev => [res.data.term, ...prev]);
            setIsAddingTerm(null);
            setTermName(''); setTermStartDate(''); setTermEndDate('');
        } catch (err: any) { toast.error(err.response?.data?.msg || 'Failed to add term'); }
        finally { setIsSaving(false); }
    };

    const handleOpenTerm = async (termId: string) => {
        if (!confirm('This will activate the term and rollover all active students. Continue?')) return;
        setIsOpeningTerm(termId);
        try {
            const res = await axios.post(`/api/v1/terms/${termId}/open`, {}, { withCredentials: true });
            toast.success(res.data.msg);
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.msg || 'Failed to open term'); }
        finally { setIsOpeningTerm(null); }
    };

    const handleSetCurrentSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to set this as the current session?')) return;
        try {
            await axios.post(`/api/v1/sessions/${sessionId}/current`, {}, { withCredentials: true });
            toast.success('Current session updated');
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.msg || 'Failed to update session'); }
    };
    
    const handleToggleLock = async (termId: string, isLocked: boolean) => {
        try {
            await axios.patch(`/api/v1/terms/${termId}/lock`, { isLocked: !isLocked }, { withCredentials: true });
            toast.success(`Term ${!isLocked ? 'locked' : 'unlocked'}`);
            setTerms(prev => prev.map(t => t.id === termId ? { ...t, isLocked: !isLocked } : t));
        } catch { toast.error('Failed to toggle lock'); }
    };

    const handleDeleteTerm = async (termId: string) => {
        if (!confirm('Are you sure you want to delete this term?')) return;
        try {
            await axios.delete(`/api/v1/terms/${termId}`, { withCredentials: true });
            toast.success('Term deleted');
            setTerms(prev => prev.filter(t => t.id !== termId));
        } catch { toast.error('Failed to delete term'); }
    };

    if (isLoading) {
        return (
            <SettingsShell breadcrumbCurrent="Academic Sessions" tabLabel="Academic Sessions" tabIcon={<CalendarRange className="h-3.5 w-3.5" />}>
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            </SettingsShell>
        );
    }

    return (
        <SettingsShell breadcrumbParent="Settings" breadcrumbCurrent="Academic Sessions" tabLabel="Academic Sessions" tabIcon={<CalendarRange className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<CalendarRange className="h-7 w-7" />}
                title="Sessions & Terms"
                subtitle="Manage academic sessions (e.g. 2024/2025) and define custom terms (First Term, Summer Term, etc)."
            />

            <div className="mb-6 flex justify-end">
                <button onClick={() => setIsAdding(!isAdding)} className={cn('flex items-center gap-2 rounded-xl border-2 border-dashed px-5 py-2.5 text-sm font-semibold transition-all', isAdding ? 'border-red-200 bg-red-50 text-red-600' : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100')}>
                    {isAdding ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add New Session</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddSession} className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Create Academic Session</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Session Name <span className="text-red-500">*</span></label>
                            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2024/2025" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isSaving} className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-70 flex items-center gap-2">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Create Session'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {sessions.map(session => {
                    const sessionTerms = terms.filter(t => t.sessionId === session.id);
                    const isExpanded = expandedSession === session.id;
                    const hasActiveTerm = sessionTerms.some(t => t.isActive);

                    return (
                        <div key={session.id} className={cn('rounded-2xl border transition-all overflow-hidden bg-white', isExpanded ? 'border-blue-200 shadow-md' : 'border-slate-200 hover:border-blue-300')}>
                            <div 
                                className={cn("px-5 py-4 flex flex-wrap gap-4 items-center justify-between cursor-pointer", isExpanded ? "bg-blue-50/30" : "")}
                                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", isExpanded ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400")}>
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{session.name}</h3>
                                        <p className="text-xs text-slate-400 font-mono">
                                            {sessionTerms.length} Terms
                                            {session.startDate && ` • Starts: ${new Date(session.startDate).toLocaleDateString()}`}
                                            {session.endDate && ` • Ends: ${new Date(session.endDate).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                {hasActiveTerm && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle className="h-3.5 w-3.5" /> Current Session
                                    </span>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                                    <div className="space-y-3 mb-4">
                                        {sessionTerms.length === 0 ? (
                                            <div className="text-center py-6 text-sm text-slate-400">No terms defined for this session yet.</div>
                                        ) : (
                                            sessionTerms.map(term => (
                                                <div key={term.id} className={cn("flex flex-col md:flex-row gap-4 justify-between p-4 rounded-xl border bg-white", term.isActive ? "border-emerald-200 shadow-sm" : "border-slate-200")}>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-700">{term.name}</h4>
                                                            {term.isActive && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE CURRENT</span>}
                                                            {term.isLocked && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3" /> LOCKED</span>}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {term.startDate && `Starts: ${new Date(term.startDate).toLocaleDateString()} `}
                                                            {term.endDate && `| Ends: ${new Date(term.endDate).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {!term.isActive ? (
                                                            <button disabled={isOpeningTerm === term.id} onClick={() => handleOpenTerm(term.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed">
                                                                {isOpeningTerm === term.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</> : <><Users className="h-3.5 w-3.5" /> Set as Current Term & Open</>}
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleToggleLock(term.id, term.isLocked)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors", term.isLocked ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100")}>
                                                                {term.isLocked ? <><Unlock className="h-3.5 w-3.5" /> Unlock for Teachers</> : <><Lock className="h-3.5 w-3.5" /> Lock Term</>}
                                                            </button>
                                                        )}
                                                        {!term.isActive && (
                                                            <button onClick={() => handleDeleteTerm(term.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {isAddingTerm === session.id ? (
                                        <div className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl mt-2">
                                            <h4 className="text-xs font-bold uppercase text-slate-500">New Term Details</h4>
                                            <div className="flex flex-col md:flex-row gap-3">
                                                <input autoFocus value={termName} onChange={e => setTermName(e.target.value)} placeholder="Term Name (e.g. First Term)" className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400" />
                                                <div className="flex flex-wrap gap-2">
                                                    <input type="date" value={termStartDate} onChange={e => setTermStartDate(e.target.value)} title="Start Date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-36" />
                                                    <input type="date" value={termEndDate} onChange={e => setTermEndDate(e.target.value)} title="End Date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-36" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setIsAddingTerm(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
                                                <button onClick={() => handleAddTerm(session.id)} disabled={isSaving || !termName} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                                                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                                                    {isSaving ? 'Saving...' : 'Save Term'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsAddingTerm(session.id)} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
                                            <Plus className="h-4 w-4" /> Add Term to Session
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SettingsShell>
    );
}
