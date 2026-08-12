/**
 * Course.tsx — "My Subjects" — Dynamic Student Subject Overview
 * Fetches subjects assigned to the student's class arm from the backend.
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Home as HomeIcon, ChevronRight, BookOpen, User, Clock,
    ChevronDown, Award, BarChart2, Calendar, FileText,
    Loader2, AlertTriangle, GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import useSWR from 'swr';
import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────
interface TeacherProfile {
    id: string;
    user: { name: string };
}
interface Subject {
    id: string;
    name: string;
    code: string | null;
    category: string;
    stream: string;
    description: string | null;
    teacher: TeacherProfile | null;
}

// ─── SWR Fetcher ────────────────────────────────────────────────────────────
const fetcher = (url: string) =>
    axios.get(url, { withCredentials: true }).then(r => r.data);

// ─── Color palette — assigned deterministically by subject index ─────────────
const PALETTE = [
    { icon: '📐', color: 'text-blue-600',   bg: 'bg-blue-50',   bar: 'bg-blue-500',   teacher: 'bg-blue-600' },
    { icon: '📝', color: 'text-green-600',  bg: 'bg-green-50',  bar: 'bg-green-500',  teacher: 'bg-green-600' },
    { icon: '⚡', color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500', teacher: 'bg-purple-600' },
    { icon: '🧪', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500', teacher: 'bg-orange-600' },
    { icon: '🔬', color: 'text-teal-600',   bg: 'bg-teal-50',   bar: 'bg-teal-500',   teacher: 'bg-teal-600' },
    { icon: '🌍', color: 'text-rose-600',   bg: 'bg-rose-50',   bar: 'bg-rose-500',   teacher: 'bg-rose-600' },
    { icon: '📊', color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-500', teacher: 'bg-indigo-600' },
    { icon: '🎨', color: 'text-pink-600',   bg: 'bg-pink-50',   bar: 'bg-pink-500',   teacher: 'bg-pink-600' },
];

function pick(index: number) { return PALETTE[index % PALETTE.length]; }

// Derive initials from a full name
function initials(name: string) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <Card className="p-4 bg-white border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
            <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
        </Card>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Course() {
    const [expanded, setExpanded] = useState<string | null>(null);

    const { data, isLoading, error } = useSWR(
        '/api/v1/subjects/my-subjects',
        fetcher,
        { revalidateOnFocus: false }
    );

    // Fetch latest results to show per-subject scores
    const { data: resultData } = useSWR(
        '/api/v1/results/report-card',
        fetcher,
        { revalidateOnFocus: false }
    );

    // Build a map of subjectName -> score from the result data
    const scoreMap = React.useMemo(() => {
        const map: Record<string, number> = {};
        const entries: any[] = resultData?.results || resultData?.scores || [];
        entries.forEach((r: any) => {
            const key = (r.subjectName || r.subject?.name || '').toLowerCase().trim();
            const score = r.total ?? r.score ?? r.totalScore ?? null;
            if (key && score != null) map[key] = score;
        });
        return map;
    }, [resultData]);

    const subjects: Subject[] = data?.subjects || [];
    const count = subjects.length;

    // ── Loading ─────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">Loading your subjects…</p>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                <AlertTriangle className="w-10 h-10 text-red-400" />
                <p className="text-gray-700 font-semibold">Failed to load subjects</p>
                <p className="text-gray-400 text-sm">{error?.response?.data?.msg || 'Please check your connection and try again.'}</p>
            </div>
        );
    }

    // ── Empty ────────────────────────────────────────────────────────────────
    if (count === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                <GraduationCap className="w-14 h-14 text-gray-300" />
                <h2 className="text-gray-700 font-bold text-lg">No subjects assigned yet</h2>
                <p className="text-gray-400 text-sm max-w-sm">
                    Your class hasn't been linked to any subjects yet. Contact your school administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Subjects</h1>
                    <div className="flex items-center text-xs text-slate-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/student" className="hover:text-blue-600 transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>My Subjects</span>
                    </div>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard icon={<BookOpen className="w-5 h-5" />} label="Total Subjects" value={count} color="bg-blue-50 text-blue-600" />
                <KpiCard icon={<BarChart2 className="w-5 h-5" />} label="Core Subjects" value={subjects.filter(s => s.category === 'CORE').length} color="bg-emerald-50 text-emerald-600" />
                <KpiCard icon={<Award className="w-5 h-5" />} label="Electives" value={subjects.filter(s => s.category !== 'CORE').length} color="bg-amber-50 text-amber-600" />
                <KpiCard icon={<Calendar className="w-5 h-5" />} label="With Teacher" value={subjects.filter(s => s.teacher).length} color="bg-purple-100 text-purple-600" />
            </div>

            {/* Subject Cards */}
            <div className="space-y-3">
                {subjects.map((sub, idx) => {
                    const style = pick(idx);
                    const isOpen = expanded === sub.id;
                    const teacherName = sub.teacher?.user?.name || 'Not Assigned';

                    return (
                        <Card key={sub.id} className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                            {/* Card header (clickable) */}
                            <button
                                onClick={() => setExpanded(isOpen ? null : sub.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-gray-50/60 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                                        {style.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-gray-900 truncate">{sub.name}</h3>
                                            {sub.code && (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
                                                    {sub.code}
                                                </span>
                                            )}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sub.category === 'CORE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {sub.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {teacherName}
                                            </span>
                                            {sub.stream && sub.stream !== 'ALL' && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {sub.stream}
                                                </span>
                                            )}
                                        </div>
                                        {/* Performance progress bar */}
                                        {(() => {
                                            const score = scoreMap[sub.name.toLowerCase().trim()];
                                            if (score == null) return null;
                                            const pct = Math.min(100, Math.max(0, score));
                                            const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
                                            const textColor = pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
                                            return (
                                                <div className="mt-2 flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
                                                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
                                                    </div>
                                                    <span className={`text-[11px] font-bold ${textColor}`}>{pct}%</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Expanded details */}
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22 }}
                                    >
                                        <div className="border-t border-gray-100 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Description */}
                                            <div>
                                                <h4 className="font-bold text-gray-700 text-sm mb-2">About this Subject</h4>
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    {sub.description || 'No description has been added for this subject yet.'}
                                                </p>

                                                <div className="mt-4 space-y-2">
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Category</span>
                                                        <span className="font-semibold text-gray-700">{sub.category}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Stream</span>
                                                        <span className="font-semibold text-gray-700">{sub.stream || 'All'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions + Teacher */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-700 text-sm mb-2">Quick Actions</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Link to="/student/cbt">
                                                            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 text-xs flex items-center gap-1.5">
                                                                <BookOpen className="w-3.5 h-3.5" /> Take CBT
                                                            </Button>
                                                        </Link>
                                                        <Link to="/student/live-class">
                                                            <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" /> Live Class
                                                            </Button>
                                                        </Link>
                                                        <Link to="/student/lms">
                                                            <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5" /> Study Notes
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Teacher card */}
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className={`w-10 h-10 ${style.teacher} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                        {sub.teacher ? initials(teacherName) : '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm truncate">{teacherName}</p>
                                                        <p className="text-xs text-gray-500">Subject Teacher</p>
                                                    </div>
                                                    {sub.teacher && (
                                                        <Link to="/student/messaging" className="shrink-0">
                                                            <Button size="sm" variant="outline" className="text-xs">Message</Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
