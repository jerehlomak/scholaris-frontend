/**
 * TeacherSubjects.tsx - Teacher's assigned subjects with class mapping
 * Redesigned with shadcn UI. All business logic preserved exactly.
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Users, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '../../components/shared/Pagination';

const API = '/api/v1';

// Kept exactly as-is
interface ClassAssignment { classLevel: string; classArm: string; students: number; nextClass: string; }
interface Subject {
    id: string; name: string; code: string; color: string; bg: string; border: string; icon: string;
    classes: ClassAssignment[];
    totalStudents: number; periodsPerWeek: number;
}

const SUBJECT_THEMES = [
    { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-500' },
    { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-l-violet-500' },
    { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
    { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-l-amber-500' },
];

export default function TeacherSubjects() {
    // All state and data logic kept exactly as-is
    const [expanded, setExpanded] = useState<string | null>(null);
    const [mySubjects, setMySubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await axios.get(`${API}/teachers/me/subjects`, { withCredentials: true });
                const fetched = res.data.subjects || [];

                const mapped = fetched.map((sub: any, i: number) => {
                    const theme = SUBJECT_THEMES[i % SUBJECT_THEMES.length];
                    return {
                        id: sub.id,
                        name: sub.name,
                        code: sub.name.substring(0, 3).toUpperCase(),
                        color: theme.color,
                        bg: theme.bg,
                        border: theme.border,
                        icon: '📚',
                        periodsPerWeek: 0,
                        totalStudents: sub.totalStudents || 0,
                        classes: (sub.assignedClasses || []).map((c: any) => ({
                            classLevel: c.classLevel,
                            classArm: c.classArm,
                            students: c.students,
                            nextClass: 'N/A'
                        }))
                    };
                });

                setMySubjects(mapped);
            } catch (err) {
                console.error('Failed to load subjects', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

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
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Subjects</h1>
                    <p className="text-sm text-slate-500 mt-0.5">All subjects you are currently assigned to teach</p>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                {[
                    { icon: BookOpen, label: 'Subjects', value: mySubjects.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: Users, label: 'Total Students', value: mySubjects.reduce((s, sub) => s + sub.totalStudents, 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: Clock, label: 'Periods / Week', value: mySubjects.reduce((s, sub) => s + sub.periodsPerWeek, 0), color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((k) => (
                    <Card key={k.label} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}>
                                <k.icon size={18} className={k.color} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Subject Accordion ── */}
            <div className="space-y-3">
                {mySubjects.length === 0 ? (
                    <Card className="p-10 text-center border border-dashed border-slate-300 bg-white">
                        <p className="text-slate-400 font-medium">You are not assigned to any subjects yet.</p>
                    </Card>
                ) : mySubjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(sub => (
                    <Card key={sub.id} className={`bg-white border border-slate-200 shadow-sm overflow-hidden border-l-4 ${sub.border}`}>
                        <button
                            onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left gap-3"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-12 h-12 ${sub.bg} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                                    {sub.icon}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-bold text-slate-900 text-base truncate">{sub.name}</h3>
                                        <Badge className={`text-[10px] font-bold font-mono px-1.5 ${sub.bg} ${sub.color} border-0 hover:${sub.bg}`}>
                                            {sub.code}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {sub.classes.length} class{sub.classes.length !== 1 ? 'es' : ''} · {sub.totalStudents} students · {sub.periodsPerWeek} periods/week
                                    </p>
                                </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${expanded === sub.id ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                <ChevronDown size={16} className={`transition-transform text-slate-400 ${expanded === sub.id ? 'rotate-180 text-blue-600' : ''}`} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {expanded === sub.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Separator />
                                    {/* Desktop View */}
                                    <div className="overflow-x-auto hidden sm:block">
                                        <table className="w-full text-sm min-w-[400px]">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    {['Class', 'Students', 'Next Class'].map(h => (
                                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {sub.classes.map((cls, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <div className={`inline-flex items-center gap-2 font-semibold ${sub.color}`}>
                                                                <span className={`w-2 h-2 rounded-full ${sub.bg.replace('50', '500')}`} />
                                                                {cls.classArm}
                                                                <span className="text-slate-400 font-normal text-xs">({cls.classLevel})</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-semibold border-transparent">
                                                                {cls.students} students
                                                            </Badge>
                                                        </td>
                                                        <td className="px-5 py-3 flex items-center gap-1.5 text-slate-600 text-sm">
                                                            <Clock size={13} className="text-amber-500" />
                                                            {cls.nextClass}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {sub.classes.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-5 py-6 text-center text-slate-400 text-sm">
                                                            No classes assigned.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="block sm:hidden space-y-2 p-4 bg-slate-50">
                                        {sub.classes.map((cls, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`inline-flex items-center gap-2 font-bold text-sm ${sub.color}`}>
                                                        <span className="w-2 h-2 rounded-full bg-current" />
                                                        {cls.classArm}
                                                    </div>
                                                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-xs border-transparent">{cls.classLevel}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                                                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                        <Users size={13} className="text-emerald-500" />
                                                        {cls.students} Students
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                        <Clock size={13} className="text-amber-500" />
                                                        {cls.nextClass}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                ))}
            </div>

            {mySubjects.length > 0 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(mySubjects.length / PAGE_SIZE)}
                        totalRecords={mySubjects.length}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
