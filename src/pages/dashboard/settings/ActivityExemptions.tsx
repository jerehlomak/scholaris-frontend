import { useState, useEffect, useCallback } from 'react';
import { ShieldOff, Plus, Loader2, X, Trash2, Calendar, User as UserIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

interface Exemption {
    id: string;
    activity: string;
    expiresAt: string;
    term: { name: string; session: { name: string } };
    user: { name: string; email: string };
    class?: { name: string; level: string };
    subject?: { name: string };
}

interface TermOption { id: string; name: string; session: { name: string }; }
interface TeacherOption { id: string; userId: string; user: { name: string; email: string } }
interface ClassOption { id: string; name: string; }
interface SubjectOption { id: string; name: string; }

export function ActivityExemptions() {
    const [exemptions, setExemptions] = useState<Exemption[]>([]);
    const [terms, setTerms] = useState<TermOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form State
    const [fTermId, setFTermId] = useState('');
    const [fUserId, setFUserId] = useState('');
    const [fActivity, setFActivity] = useState('ALL');
    const [fClassId, setFClassId] = useState('');
    const [fSubjectId, setFSubjectId] = useState('');
    const [fExpiresAt, setFExpiresAt] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [exRes, termRes, teacherRes, classRes, subjectRes] = await Promise.all([
                axios.get('/api/v1/exemptions', { withCredentials: true }),
                axios.get('/api/v1/terms', { withCredentials: true }),
                axios.get('/api/v1/teachers/all', { withCredentials: true }).catch(() => ({ data: { teachers: [] } })),
                axios.get('/api/v1/classes/all', { withCredentials: true }).catch(() => ({ data: { classes: [] } })),
                axios.get('/api/v1/subjects', { withCredentials: true }).catch(() => ({ data: { subjects: [] } }))
            ]);
            setExemptions(exRes.data.exemptions || []);
            setTerms(termRes.data.terms || []);
            setTeachers(teacherRes.data.teachers || []);
            setClasses(classRes.data.classes || []);
            setSubjects(subjectRes.data.subjects || []);
            
            if (termRes.data.terms?.length > 0 && !fTermId) {
                const active = termRes.data.terms.find((t: any) => t.isActive);
                setFTermId(active?.id || termRes.data.terms[0].id);
            }
        } catch (err) {
            toast.error('Failed to load exemptions data');
        } finally {
            setIsLoading(false);
        }
    }, [fTermId]);

    useEffect(() => { fetchData(); }, []);

    // Set default expiration to +24 hours when opening the form
    useEffect(() => {
        if (isAdding && !fExpiresAt) {
            const date = new Date();
            date.setHours(date.getHours() + 24);
            // Format to YYYY-MM-DDTHH:mm
            const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
            setFExpiresAt(localISOTime);
        }
    }, [isAdding, fExpiresAt]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fTermId || !fUserId || !fExpiresAt) { toast.error('Term, Teacher, and Expiration Date are required'); return; }
        setIsSaving(true);
        try {
            await axios.post('/api/v1/exemptions', {
                termId: fTermId,
                userId: fUserId,
                activity: fActivity,
                classId: fClassId || null,
                subjectId: fSubjectId || null,
                expiresAt: new Date(fExpiresAt).toISOString()
            }, { withCredentials: true });
            
            toast.success('Exemption granted successfully');
            setIsAdding(false);
            setFUserId('');
            setFClassId('');
            setFSubjectId('');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to grant exemption');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Revoke this exemption immediately?')) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/exemptions/${id}`, { withCredentials: true });
            toast.success('Exemption revoked');
            setExemptions(prev => prev.filter(e => e.id !== id));
        } catch { toast.error('Failed to revoke exemption'); }
        finally { setDeletingId(null); }
    };

    if (isLoading) {
        return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ShieldOff className="h-5 w-5 text-purple-600" />
                        Staff Exemptions & Grace Periods
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Temporarily bypass global deadlines and term locks for specific teachers.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn('flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all whitespace-nowrap',
                        isAdding ? 'border-red-200 bg-red-50 text-red-600' : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100')}
                >
                    {isAdding ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Grant Exemption</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="mb-8 rounded-2xl border border-purple-100 bg-purple-50/30 p-6 space-y-5 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Teacher <span className="text-red-500">*</span></label>
                            <select required value={fUserId} onChange={e => setFUserId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400">
                                <option value="">Select Teacher...</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.userId}>{t.user?.name} ({t.user?.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Term <span className="text-red-500">*</span></label>
                            <select required value={fTermId} onChange={e => setFTermId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400">
                                {terms.map(t => (
                                    <option key={t.id} value={t.id}>{t.session?.name} — {t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Activity to Unlock <span className="text-red-500">*</span></label>
                            <select required value={fActivity} onChange={e => setFActivity(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400">
                                <option value="ALL">Unlock Everything</option>
                                <option value="SCORE_ENTRY">Score Entry Only</option>
                                <option value="ATTENDANCE">Attendance Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Restrict to Class (Optional)</label>
                            <select value={fClassId} onChange={e => setFClassId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400">
                                <option value="">No restriction (All Classes)</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Restrict to Subject (Optional)</label>
                            <select value={fSubjectId} onChange={e => setFSubjectId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400">
                                <option value="">No restriction (All Subjects)</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Expiration Date & Time <span className="text-red-500">*</span></label>
                            <input required type="datetime-local" value={fExpiresAt} onChange={e => setFExpiresAt(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isSaving}
                            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-70 flex items-center gap-2">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSaving ? 'Granting...' : 'Grant Exemption'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {exemptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed rounded-2xl">
                        <ShieldOff className="h-8 w-8 mb-2 opacity-30" />
                        <p className="font-bold text-slate-500">No active exemptions</p>
                        <p className="text-sm mt-1">Deadlines and locks are currently enforced for all staff.</p>
                    </div>
                ) : (
                    exemptions.map(ex => {
                        const now = new Date();
                        const expires = new Date(ex.expiresAt);
                        const isExpired = now > expires;
                        
                        return (
                            <div key={ex.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border p-4 shadow-sm", 
                                isExpired ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-purple-200 bg-white')}>
                                <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", 
                                        isExpired ? 'bg-slate-200 text-slate-500' : 'bg-purple-100 text-purple-600')}>
                                        <UserIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-slate-800">{ex.user?.name}</h4>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border whitespace-nowrap">
                                                {ex.activity === 'ALL' ? 'Full Unlock' : ex.activity.replace('_', ' ')}
                                            </span>
                                            {ex.class && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">{ex.class.name}</span>}
                                            {ex.subject && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 whitespace-nowrap">{ex.subject.name}</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                                            <span className="whitespace-nowrap">{ex.term?.session?.name} — {ex.term?.name}</span>
                                            <span className="hidden sm:inline text-slate-300">•</span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                {isExpired ? 'Expired: ' : 'Expires: '}
                                                <span className={cn("font-semibold", isExpired ? "text-slate-500" : "text-purple-700")}>
                                                    {expires.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100/60">
                                    <button onClick={() => handleDelete(ex.id)} disabled={deletingId === ex.id} title="Revoke Exemption"
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                                        {deletingId === ex.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        <span className="sm:hidden text-xs font-semibold">Revoke</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
