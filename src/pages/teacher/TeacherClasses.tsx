/**
 * TeacherClasses.tsx — "My Classes" page for teachers
 * Redesigned with shadcn UI. All business logic, SWR hooks, and data
 * fetching are preserved exactly.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';
import {
    Users, BookOpen, ChevronDown,
    Calendar, CheckCircle2, Clock, Radio, Search, Loader2, Key
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Pagination } from '../../components/shared/Pagination';
import { AdminEditCredentialsModal } from '../../components/modals/AdminEditCredentialsModal';

const API = '/api/v1';

// ─── Data Types — kept exactly as-is ─────────────────────────────────────────
interface ClassStudent { id: string; userId: string; name: string; avatar: string; color: string; admNo: string; }
interface TeacherClass {
    id: string;
    name: string;
    level: string;
    subjects: { id: string; name: string }[];
    students: ClassStudent[];
    studentCount: number;
    nextLesson: string;
    attendanceRate: number;
    color: string;
    bgColor: string;
    borderColor: string;
}

const CLASS_THEMES = [
    { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-500' },
    { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
    { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-l-amber-500' },
    { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-l-violet-500' },
    { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-l-rose-500' },
];

export default function TeacherClasses() {
    // All state and data logic kept exactly as-is
    const [expandedClass, setExpandedClass] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [editCredTarget, setEditCredTarget] = useState<ClassStudent | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;
    const { data: classData, isLoading: loadingClasses } = useSWR(`${API}/teachers/me/classes`, fetcher);
    const loading = loadingClasses;

    const myClasses = useMemo<TeacherClass[]>(() => {
        if (!classData?.classes) return [];
        return classData.classes.map((cls: any, i: number) => {
            const theme = CLASS_THEMES[i % CLASS_THEMES.length];
            return {
                id: cls.id,
                name: cls.name,
                level: cls.level,
                subjects: cls.mySubjects || [],
                students: cls.students || [],
                studentCount: cls.studentCount || 0,
                nextLesson: 'N/A',
                attendanceRate: 100,
                color: theme.color,
                bgColor: theme.bg,
                borderColor: theme.border,
            };
        });
    }, [classData]);

    const totalStudents = myClasses.reduce((s, c) => s + c.studentCount, 0);
    const avgAttendance = myClasses.length > 0 ? Math.round(myClasses.reduce((s, c) => s + c.attendanceRate, 0) / myClasses.length) : 0;

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto w-full pb-10">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your assigned classes and student rosters</p>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search students..."
                        className="pl-9 pr-4 w-full sm:w-56 border-slate-200 focus:border-blue-400"
                    />
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { icon: BookOpen, label: 'My Classes', value: myClasses.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: Users, label: 'Total Students', value: totalStudents, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: CheckCircle2, label: 'Avg. Attendance', value: `${avgAttendance}%`, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { icon: Calendar, label: 'Next Lesson', value: 'Today 10AM', color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((k) => (
                    <Card key={k.label} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}>
                                <k.icon size={18} className={k.color} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                                <p className="text-xl font-bold text-slate-900">{k.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Class Cards ── */}
            <div className="space-y-3">
                {myClasses.length === 0 ? (
                    <Card className="p-10 text-center border border-dashed border-slate-300 bg-white">
                        <p className="text-slate-400 font-medium">You are not assigned to any classes yet.</p>
                    </Card>
                ) : myClasses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(cls => {
                    const isOpen = expandedClass === cls.id;
                    const filteredStudents = cls.students.filter(s =>
                        !search || s.name.toLowerCase().includes(search.toLowerCase())
                    );

                    return (
                        <Card key={cls.id} className={`bg-white border border-slate-200 shadow-sm overflow-hidden border-l-4 ${cls.borderColor}`}>
                            {/* Class header */}
                            <button
                                onClick={() => setExpandedClass(isOpen ? null : cls.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${cls.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                                        <span className={`font-bold text-lg ${cls.color}`}>{cls.name.slice(0, 2)}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-bold text-slate-900 text-base whitespace-nowrap">{cls.name}</h3>
                                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-[10px] font-semibold border-transparent">{cls.level}</Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-none">
                                            {cls.subjects.map(s => s.name).join(' · ') || 'No subjects assigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="hidden sm:flex gap-5 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} className="text-blue-500" />
                                            <span className="font-semibold text-slate-700">{cls.studentCount}</span>
                                            <span>students</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-amber-500" />
                                            <span>{cls.nextLesson}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 size={14} className={cls.attendanceRate >= 90 ? 'text-emerald-500' : 'text-amber-500'} />
                                            <span className="font-semibold">{cls.attendanceRate}%</span>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                        <ChevronDown size={16} className={`transition-transform text-slate-400 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                                    </div>
                                </div>
                            </button>

                            {/* Expanded roster */}
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Separator />
                                        {/* Quick actions */}
                                        <div className="px-5 py-3 bg-slate-50 flex flex-wrap gap-2">
                                            <Link to="/teacher/attendance">
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5">
                                                    <CheckCircle2 size={13} /> Mark Attendance
                                                </Button>
                                            </Link>
                                            <Link to="/teacher/live-class">
                                                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-slate-300">
                                                    <Radio size={13} /> Start Live Class
                                                </Button>
                                            </Link>
                                            <Link to="/teacher/cbt/create">
                                                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-slate-300">
                                                    <BookOpen size={13} /> Create CBT
                                                </Button>
                                            </Link>
                                        </div>
                                        <Separator />

                                        {/* Desktop Table */}
                                        <div className="hidden sm:block overflow-x-auto">
                                            <table className="w-full text-sm min-w-[500px]">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        {['#', 'Student', 'Adm. No.', 'Performance', ''].map(h => (
                                                            <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(search ? filteredStudents : cls.students).map((s, i) => (
                                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-5 py-3 text-slate-400 text-sm">{i + 1}</td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                                        {s.avatar}
                                                                    </div>
                                                                    <span className="font-semibold text-slate-800">{s.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-500">{s.admNo}</td>
                                                            <td className="px-5 py-3">
                                                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-[10px]">
                                                                    ★ Good
                                                                </Badge>
                                                            </td>
                                                            <td className="px-5 py-3 text-right">
                                                                <button
                                                                    onClick={() => setEditCredTarget(s)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit Credentials"
                                                                >
                                                                    <Key size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(search ? filteredStudents : cls.students).length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                                                                {search ? `No students match "${search}"` : 'No students in this class.'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="block sm:hidden space-y-2 p-4 bg-slate-50">
                                            {(search ? filteredStudents : cls.students).map(s => (
                                                <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 ${s.color} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                                            {s.avatar}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                                                            <p className="text-xs text-slate-500">Adm: {s.admNo}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditCredTarget(s)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Key size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {cls.students.length === 0 && (
                                                <p className="text-center text-slate-400 text-sm py-4">No students loaded.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {editCredTarget && (
                                <AdminEditCredentialsModal
                                    isOpen={!!editCredTarget}
                                    onClose={() => setEditCredTarget(null)}
                                    userToEdit={{ id: editCredTarget.userId, name: editCredTarget.name, role: 'STUDENT', loginId: editCredTarget.admNo }}
                                />
                            )}
                        </Card>
                    );
                })}
            </div>

            {myClasses.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(myClasses.length / PAGE_SIZE)}
                        totalRecords={myClasses.length}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
