import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Users, BookOpen, Grid3x3, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { toast } from 'sonner';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { SettingsShell } from '../settings/shared/SettingsShell';

const API = '/api/v1';

interface TeacherUser {
    name: string;
}
interface BaseTeacher {
    id: string;
    user: TeacherUser;
    employeeId: string;
}

interface SubjectDetail {
    id: string;
    name: string;
}
interface ClassSubjectRow {
    id: string;
    classId: string;
    subjectId: string;
    teacherId: string | null;
    subject: SubjectDetail;
    teacher: { user: { name: string } } | null;
}

interface ClassRow {
    id: string;
    name: string;
    level: string;
    formTeacherId: string | null;
    formTeacher: { user: { name: string } } | null;
    subjects: ClassSubjectRow[];
}

export function TeacherAssignments() {
    const [activeTab, setActiveTab] = useState<'form' | 'matrix'>('matrix');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [savingRecord, setSavingRecord] = useState<string | null>(null);

    const { data: clsRes, isLoading: loadingClasses, mutate: mutateClasses } = useSWR(`${API}/classes/all`, fetcher);
    const { data: tchRes, isLoading: loadingTeachers } = useSWR(`${API}/teachers/all`, fetcher);
    const { data: setRes, isLoading: loadingSettings } = useSWR(`${API}/school-settings`, fetcher);

    const classes: ClassRow[] = clsRes?.classes || [];
    const teachers: BaseTeacher[] = tchRes?.teachers || [];
    const formTeacherTitle = setRes?.settings?.formTeacherTitle || 'Form Teacher';
    const loading = loadingClasses || loadingTeachers || loadingSettings;

    // Initialize expanded state once classes load
    useEffect(() => {
        if (classes.length > 0 && Object.keys(expanded).length === 0) {
            const allExpanded: Record<string, boolean> = {};
            classes.forEach(c => { allExpanded[c.id] = false; });
            setExpanded(allExpanded);
        }
    }, [classes]);

    const handleAssignFormTeacher = async (classId: string, teacherId: string) => {
        setSavingRecord(classId);
        try {
            await axios.patch(`${API}/classes/${classId}/assign-form-teacher`, { teacherId }, { withCredentials: true });
            toast.success('Assigned successfully!');
            await mutateClasses();
        } catch {
            toast.error('Failed to assign form teacher.');
        } finally {
            setSavingRecord(null);
        }
    };

    const handleAssignSubjectTeacher = async (classId: string, subjectId: string, teacherId: string) => {
        setSavingRecord(`${classId}-${subjectId}`);
        try {
            await axios.patch(`${API}/classes/${classId}/subjects/${subjectId}/teacher`, { teacherId }, { withCredentials: true });
            toast.success('Assigned successfully!');
            await mutateClasses();
        } catch {
            toast.error('Failed to assign subject teacher.');
        } finally {
            setSavingRecord(null);
        }
    };

    const toggleExpand = (classId: string) =>
        setExpanded(prev => ({ ...prev, [classId]: !prev[classId] }));

    if (loading) {
        return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    return (
        <SettingsShell breadcrumbParent="Staff" breadcrumbCurrent="Teacher Assignments" tabLabel="Teacher Assignments" tabIcon={<Briefcase className="h-3.5 w-3.5" />}>
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Teacher Assignments</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Assign form teachers to classes and specific teachers to each class-subject pair.
                    </p>
                </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100/80 p-1 w-fit rounded-xl border border-gray-200/60 shadow-inner">
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'matrix'
                        ? 'bg-white text-[#1E4DA6] shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                >
                    <Grid3x3 className="w-4 h-4" /> Subject Teachers
                </button>
                <button
                    onClick={() => setActiveTab('form')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'form'
                        ? 'bg-white text-[#1E4DA6] shadow-sm ring-1 ring-gray-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                >
                    <Users className="w-4 h-4" /> {formTeacherTitle}s
                </button>
            </div>

            {/* ── Form Teacher Tab ── */}
            {activeTab === 'form' && (
                <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
                    <div className="hidden md:grid bg-[#f8fafc] px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider grid-cols-[1fr_2fr_1fr] gap-4 items-center border-b border-gray-100">
                        <span className="pl-2">Class</span>
                        <span>Assigned {formTeacherTitle}</span>
                        <span className="text-right pr-2">Status</span>
                    </div>
                    <div className="divide-y divide-gray-50 flex flex-col md:block">
                        {classes.map(c => {
                            const isAssigned = !!c.formTeacherId;
                            return (
                                <div key={c.id} className="flex flex-col md:grid md:grid-cols-[1fr_2fr_1fr] gap-3 md:gap-4 px-4 md:px-5 py-4 md:py-3 items-start md:items-center hover:bg-gray-50/50 transition-colors border border-gray-100 md:border-none mx-3 md:mx-0 mt-3 md:mt-0 rounded-xl md:rounded-none shadow-sm md:shadow-none bg-white">
                                    <div className="pl-0 md:pl-2 w-full flex justify-between items-center md:block">
                                        <div>
                                            <span className="font-semibold text-gray-900 text-base md:text-sm">{c.name}</span>
                                            <span className="ml-2 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full md:bg-transparent md:px-0 md:py-0">{c.level}</span>
                                        </div>
                                        <div className="md:hidden">
                                            {isAssigned ? (
                                                <span className="text-[11px] font-semibold bg-[#10b981]/15 text-[#4a8a2f] px-2 py-0.5 rounded-full">
                                                    Assigned
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full md:max-w-sm mt-1 md:mt-0">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 md:hidden">Assigned Teacher</label>
                                        <select
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 md:bg-white outline-none focus:border-[#1E4DA6] w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={c.formTeacherId || ''}
                                            disabled={savingRecord === c.id}
                                            onChange={(e) => handleAssignFormTeacher(c.id, e.target.value)}
                                        >
                                            <option value="">{savingRecord === c.id ? "Assigning..." : "-- Unassigned --"}</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.user.name} ({t.employeeId})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="hidden md:flex justify-end pr-2">
                                        {isAssigned ? (
                                            <span className="text-[11px] font-semibold bg-[#10b981]/15 text-[#4a8a2f] px-2 py-0.5 rounded-full">
                                                Assigned
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* ── Matrix Tab: Class × Subject → Teacher ── */}
            {activeTab === 'matrix' && (
                <div className="flex flex-col gap-4">
                    {classes.length === 0 && (
                        <Card className="bg-white border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
                            No classes found. Create classes and assign subjects first.
                        </Card>
                    )}
                    {classes.map(cls => (
                        <Card key={cls.id} className="bg-white border-gray-100 shadow-sm overflow-hidden">
                            {/* Class header row — click to collapse/expand */}
                            <button
                                onClick={() => toggleExpand(cls.id)}
                                className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0 bg-[#f8fafc] px-4 md:px-5 py-3 border-b border-gray-100 hover:bg-[#f0f4fb] transition-colors"
                            >
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                                    {expanded[cls.id]
                                        ? <ChevronDown className="w-4 h-4 text-[#1E4DA6] shrink-0" />
                                        : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                    }
                                    <span className="font-bold text-[#1E4DA6] text-base">{cls.name}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cls.level}</span>
                                    {cls.subjects.length > 0 && (
                                        <span className="text-xs text-gray-400">
                                            {cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 w-full md:w-auto pl-6 md:pl-0 justify-start md:justify-end">
                                    {cls.subjects.filter(cs => cs.teacherId).length} / {cls.subjects.length} assigned
                                </div>
                            </button>

                            {/* Subject rows */}
                            {expanded[cls.id] && (
                                <>
                                    {cls.subjects.length === 0 ? (
                                        <div className="px-8 py-4 text-sm text-gray-400 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            No subjects assigned to this class yet.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Column headers */}
                                            <div className="hidden md:grid grid-cols-[2fr_3fr_1fr] gap-4 px-8 py-2 bg-gray-50/60 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                                <span>Subject</span>
                                                <span>Assigned Teacher</span>
                                                <span className="text-right pr-2">Status</span>
                                            </div>
                                            <div className="divide-y divide-gray-50 flex flex-col md:block pb-3 md:pb-0">
                                                {cls.subjects.map(cs => {
                                                    const isAssigned = !!cs.teacherId;
                                                    return (
                                                        <div
                                                            key={cs.id}
                                                            className="flex flex-col md:grid md:grid-cols-[2fr_3fr_1fr] gap-3 md:gap-4 px-4 md:px-8 py-4 md:py-3 items-start md:items-center hover:bg-gray-50/50 transition-colors border border-gray-100 md:border-none mx-3 md:mx-0 mt-3 md:mt-0 rounded-xl md:rounded-none shadow-sm md:shadow-none bg-white"
                                                        >
                                                            <div className="w-full flex justify-between items-center md:block">
                                                                <span className="font-medium text-gray-800 text-base md:text-sm">
                                                                    {cs.subject?.name || 'Unknown Subject'}
                                                                </span>
                                                                <div className="md:hidden">
                                                                    {isAssigned ? (
                                                                        <span className="text-[11px] font-semibold bg-[#10b981]/15 text-[#4a8a2f] px-2 py-0.5 rounded-full">
                                                                            Assigned
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                                            Pending
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="w-full md:max-w-sm mt-1 md:mt-0">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 md:hidden">Assigned Teacher</label>
                                                                <select
                                                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 md:bg-white outline-none focus:border-[#1E4DA6] w-full md:max-w-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    value={cs.teacherId || ''}
                                                                    disabled={savingRecord === `${cls.id}-${cs.subjectId}`}
                                                                    onChange={(e) => handleAssignSubjectTeacher(cls.id, cs.subjectId, e.target.value)}
                                                                >
                                                                    <option value="">{savingRecord === `${cls.id}-${cs.subjectId}` ? "Assigning..." : "-- Unassigned --"}</option>
                                                                    {teachers.map(t => (
                                                                        <option key={t.id} value={t.id}>
                                                                            {t.user.name} ({t.employeeId})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="hidden md:flex justify-end pr-2">
                                                                {isAssigned ? (
                                                                    <span className="text-[11px] font-semibold bg-[#10b981]/15 text-[#4a8a2f] px-2 py-0.5 rounded-full">
                                                                        Assigned
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </Card>
                    ))}
                </div>
            )}
            </div>
        </SettingsShell>
    );
}
