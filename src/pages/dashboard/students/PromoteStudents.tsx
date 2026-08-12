import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Check, Search, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import React from 'react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

interface StudentRow { id: string; user: { name: string }; classArm: { name: string } | null; }
interface ClassObj { id: string; name: string; }
interface SessionObj { id: string; name: string; isCurrent: boolean; }
import { useSchoolType } from '../../../context/SchoolTypeContext';

export function PromoteStudents() {
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [classes, setClasses] = useState<ClassObj[]>([]);
    const [sessions, setSessions] = useState<SessionObj[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [filterClass, setFilterClass] = useState<string>('all');
    
    // Target inputs
    const [targetSessionId, setTargetSessionId] = useState('');
    const [targetClass, setTargetClass] = useState('');
    const [targetStatus, setTargetStatus] = useState('PROMOTED');
    
    const [searchStudent, setSearchStudent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const { activeSchoolType } = useSchoolType();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const classesParams: any = {};
            if (activeSchoolType) classesParams.schoolType = activeSchoolType;
            
            const [classesRes, sessionsRes] = await Promise.all([
                axios.get('/api/v1/classes/all', { params: classesParams, withCredentials: true }),
                axios.get('/api/v1/sessions', { withCredentials: true })
            ]);
            setClasses(classesRes.data.classes || []);
            setSessions(sessionsRes.data.sessions || []);
            
            const activeSession = sessionsRes.data.sessions?.find((s: any) => s.isCurrent);
            if (activeSession) setTargetSessionId(activeSession.id);
        } catch (error) {
            toast.error('Failed to load initial data');
        }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (activeSchoolType) params.schoolType = activeSchoolType;
            const res = await axios.get('/api/v1/students/all', { params, withCredentials: true });
            let allStudents = res.data.students || [];
            if (filterClass !== 'all') {
                allStudents = allStudents.filter((s: any) => (s.classArm?.id || s.classId) === filterClass);
            }
            setStudents(allStudents);
            setSelectedStudents([]);
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchInitialData();
    }, [filterClass, activeSchoolType]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filteredStudents = students.filter(s => {
            const name = s.user?.name || 'Unknown';
            return !searchStudent || name.toLowerCase().includes(searchStudent.toLowerCase());
        });
        setSelectedStudents(e.target.checked ? filteredStudents.map(s => s.id) : []);
    };

    const handleSelect = (id: string) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handlePromote = async () => {
        if (selectedStudents.length === 0) return;
        if (!targetSessionId) { toast.error("Please select a target session"); return; }
        if (targetStatus !== 'GRADUATED' && !targetClass) { toast.error("Please select a target class"); return; }

        setIsSaving(true);
        try {
            await axios.post('/api/v1/students/promote', {
                studentIds: selectedStudents,
                targetClassId: targetStatus === 'GRADUATED' ? null : targetClass,
                sessionId: targetSessionId,
                status: targetStatus
            }, { withCredentials: true });

            toast.success(`Successfully updated ${selectedStudents.length} students`);
            fetchStudents(); // Refresh
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to promote students');
        } finally {
            setIsSaving(false);
        }
    };

    const displayedStudents = students.filter(s => {
        const name = s.user?.name || 'Unknown';
        return !searchStudent || name.toLowerCase().includes(searchStudent.toLowerCase());
    });

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent="Promote Students" tabLabel="Promote Students" tabIcon={<TrendingUp className="h-3.5 w-3.5" />}>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1"><span>Dashboard</span><span>/</span><span>Students</span><span>/</span><span>Promote Students</span></div>
                <h1 className="text-3xl font-black text-slate-800">Promote Students</h1>
                <p className="text-sm text-slate-500 mt-1">Advance students to the next section at the end of a session.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Search Filter */}
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Search className="h-4 w-4" /></div>
                        <h2 className="text-base font-black text-slate-800">Search</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Search Student</label>
                            <input value={searchStudent} onChange={e => setSearchStudent(e.target.value)} placeholder="Search Student" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter By Class</label>
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-12 bg-white text-slate-700 font-semibold"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <button onClick={fetchStudents} className="w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mt-2">Reload Students</button>
                    </div>
                </div>

                {/* Student Table */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                        <h2 className="font-bold text-slate-800">Students</h2>
                        <p className="text-xs text-slate-400">{selectedStudents.length} student(s) selected for promotion</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">Name</th>
                                    <th className="px-5 py-3 text-left">Current Class</th>
                                    <th className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                                                onChange={handleSelectAll} checked={selectedStudents.length === displayedStudents.length && displayedStudents.length > 0} />
                                            <span className="text-[10px]">Select All</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500"><Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" /></td></tr>
                                ) : displayedStudents.length === 0 ? (
                                    <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">No students found.</td></tr>
                                ) : displayedStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-800">{student.user?.name}</td>
                                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{student.classArm?.name || 'None'}</span></td>
                                        <td className="px-5 py-4 text-right"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" checked={selectedStudents.includes(student.id)} onChange={() => handleSelect(student.id)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-400">Showing {displayedStudents.length} entries</div>
                </div>

                {/* Promote Action */}
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><TrendingUp className="h-4 w-4" /></div>
                        <h2 className="text-base font-black text-slate-800">Promote to</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Session <span className="text-blue-600">*</span></label>
                            <Select value={targetSessionId} onValueChange={setTargetSessionId}>
                                <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-12 bg-white text-slate-700 font-semibold"><SelectValue placeholder="Select Session" /></SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Active)' : ''}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Status <span className="text-blue-600">*</span></label>
                            <Select value={targetStatus} onValueChange={setTargetStatus}>
                                <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-12 bg-white text-slate-700 font-semibold"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PROMOTED">Promoted</SelectItem>
                                    <SelectItem value="HELD_BACK">Held Back</SelectItem>
                                    <SelectItem value="GRADUATED">Graduated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {targetStatus !== 'GRADUATED' && (
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Class <span className="text-blue-600">*</span></label>
                                <Select value={targetClass} onValueChange={setTargetClass}>
                                    <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-12 bg-white text-slate-700 font-semibold"><SelectValue placeholder="Select target class" /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <button 
                            onClick={handlePromote}
                            disabled={selectedStudents.length === 0 || !targetSessionId || isSaving}
                            className={cn('w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-colors', selectedStudents.length > 0 && targetSessionId ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-300 cursor-not-allowed')}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} 
                            {isSaving ? 'Processing...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
}
