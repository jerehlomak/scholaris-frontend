import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    Users, Briefcase, Activity, AlertTriangle,
    Plus, FileText, Settings, BookOpen, GraduationCap, ChevronRight,
    CalendarDays, MessageSquare
} from 'lucide-react';
import { PermissionGate } from '../../components/auth/PermissionGate';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { menuItems } from '../../config/menu';
import { filterMenuTree, findFirstPath } from '../../utils/permissions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminStats {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, delay = 0) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        const timer = setTimeout(() => {
            const start = performance.now();
            const tick = (now: number) => {
                const p = Math.min((now - start) / duration, 1);
                setVal(Math.round(p * target));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timer);
    }, [target, duration, delay]);
    return val;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    value: number | undefined;
    subtitle: string;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    delay: number;
    loading: boolean;
}

function StatCard({
    title, value, subtitle, icon: Icon, colorClass, bgClass, delay, loading
}: StatCardProps) {
    const displayed = useCountUp(value ?? 0, 900, delay + 300);

    return (
        <div 
            className="relative bg-white rounded-2xl p-5 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            style={{ animation: `dashRise 0.5s ease ${delay}ms both` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2} />
                </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 tracking-tight leading-none mb-1.5">
                {loading ? (
                    <span className="inline-block w-24 h-8 bg-gray-100 rounded animate-pulse" />
                ) : (
                    displayed.toLocaleString()
                )}
            </div>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className={`text-xs mt-3 font-semibold ${colorClass}`}>{subtitle}</div>
        </div>
    );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const S_DATA = [820, 940, 880, 1050, 1100, 1200, 1240, 1284];
const T_DATA = [38, 40, 41, 43, 44, 45, 46, 47];

function StatisticsChartInner() {
    const [ready, setReady] = useState(false);
    useEffect(() => { const t = setTimeout(() => setReady(true), 400); return () => clearTimeout(t); }, []);
    const maxS = Math.max(...S_DATA);

    return (
        <div>
            <div className="flex items-end gap-2 h-48 mt-4 border-b border-gray-100 pb-2">
                {MONTHS.map((m, i) => {
                    const sh = Math.round((S_DATA[i] / maxS) * 160);
                    const th = Math.round((T_DATA[i] / 50) * 160);
                    return (
                        <div key={m} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="flex gap-1 items-end w-full px-1">
                                <div
                                    className="flex-1 rounded-t bg-blue-500 transition-all duration-700 ease-out group-hover:bg-blue-600"
                                    style={{
                                        height: ready ? sh : 0,
                                        transitionDelay: `${i * 60}ms`,
                                    }}
                                />
                                <div
                                    className="flex-1 rounded-t bg-emerald-400 opacity-80 transition-all duration-700 ease-out group-hover:bg-emerald-500 group-hover:opacity-100"
                                    style={{
                                        height: ready ? th : 0,
                                        transitionDelay: `${i * 60 + 30}ms`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-400">{m}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-6 mt-4 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Students</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                    <span className="text-sm font-medium text-gray-600">Staff</span>
                </div>
            </div>
        </div>
    );
}

// ─── Attendance Row ───────────────────────────────────────────────────────────
interface AttendeeRowProps {
    name: string;
    meta: string;
    variant: 'absent' | 'present';
}

function AttendeeRow({ name, meta, variant }: AttendeeRowProps) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
    const isAbsent = variant === 'absent';
    
    return (
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isAbsent ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {initials}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800 truncate">{name}</div>
                <div className="text-xs text-gray-500 font-medium">{meta}</div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-md font-semibold flex-shrink-0 ${isAbsent ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {isAbsent ? 'Absent' : 'Present'}
            </span>
        </div>
    );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickActionBtn({ icon: Icon, label, desc, onClick, colorClass, bgClass }: { icon: any, label: string, desc: string, onClick: () => void, colorClass: string, bgClass: string }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all text-left w-full group"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${bgClass} ${colorClass}`}>
                <Icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{desc}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </button>
    );
}

// ─── Panel Card ───────────────────────────────────────────────────────────────
function PanelCard({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number, className?: string }) {
    return (
        <div
            className={`bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm ${className}`}
            style={{ animation: `dashRise 0.5s ease ${delay}ms both` }}
        >
            {children}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardHome() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isUnrestrictedAdmin, hasPermission } = usePermissions();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Only fetch admin stats when we're actually going to render the admin
    // dashboard below — harmless to skip for a restricted user being redirected.
    useEffect(() => {
        if (!isUnrestrictedAdmin) return;
        axios.get('/api/v1/dashboard/me', { withCredentials: true })
            .then(res => { if (res.data?.stats) setStats(res.data.stats); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [isUnrestrictedAdmin]);

    // This page is the full "Admin Dashboard" — only truly unrestricted admins
    // (no custom role assigned) should land here. A staff member with a custom
    // role, however their staffType is set, gets redirected to the first menu
    // item their role actually grants — "Dashboard" itself is excluded from
    // that search so a role that happens to include it can't loop back here.
    if (!isUnrestrictedAdmin) {
        const filtered = filterMenuTree(menuItems.filter(item => item.path !== '/dashboard'), {
            role: user?.role || '',
            isFormTeacher: user?.teacherProfile?.isFormTeacher === true,
            hasPermission,
        });
        const firstPath = findFirstPath(filtered);
        if (firstPath) {
            return <Navigate to={firstPath} replace />;
        }
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-50">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <h2 className="text-lg font-bold text-gray-800">No menu access configured yet</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">Your role doesn't have any menu items enabled. Contact your school administrator to set up your access.</p>
            </div>
        );
    }

    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    const absentStudents = [
        { name: 'Aisha Bello', meta: 'JSS 3A', variant: 'absent' as const },
        { name: 'David Okafor', meta: 'SS 2B', variant: 'absent' as const },
        { name: 'Chioma Eze', meta: 'JSS 1C', variant: 'absent' as const },
    ];

    const presentStaff = [
        { name: 'Mr. Ibrahim', meta: 'Mathematics', variant: 'present' as const },
        { name: 'Mrs. Adeyemi', meta: 'English Language', variant: 'present' as const },
        { name: 'Dr. Okonkwo', meta: 'Sciences', variant: 'present' as const },
    ];

    return (
        <>
            <style>{`
                @keyframes dashRise {
                  from { opacity: 0; transform: translateY(12px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="flex flex-col gap-6 w-full min-h-screen p-4 sm:p-8 bg-slate-50 font-sans">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" />
                            {dateStr}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard/students/add')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                            <Plus className="w-4 h-4" /> Add Student
                        </button>
                    </div>
                </div>

                {/* ── Alert Banner ── */}
                {/* <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-xl px-4 py-3 shadow-sm animate-[dashRise_0.5s_ease_100ms_both]">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-amber-900">
                        <span className="font-bold">Attention: </span>
                        3 unresolved student attendance flags need review before the end of the week.
                    </p>
                </div> */}

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <PermissionGate permissions={['std_view']}>
                        <StatCard
                            title="Total Students" value={stats?.totalStudents} subtitle="+12% from last term"
                            icon={GraduationCap} colorClass="text-blue-600" bgClass="bg-blue-50"
                            delay={50} loading={loading}
                        />
                    </PermissionGate>
                    <PermissionGate permissions={['adm_staff']}>
                        <StatCard
                            title="Total Staff" value={stats?.totalTeachers} subtitle="Active teaching staff"
                            icon={Briefcase} colorClass="text-indigo-600" bgClass="bg-indigo-50"
                            delay={100} loading={loading}
                        />
                    </PermissionGate>
                    <PermissionGate permissions={['std_view']}>
                        <StatCard
                            title="Total Parents" value={stats?.totalParents} subtitle="Registered accounts"
                            icon={Users} colorClass="text-emerald-600" bgClass="bg-emerald-50"
                            delay={150} loading={loading}
                        />
                    </PermissionGate>
                    <PermissionGate permissions={['acd_view']}>
                        <StatCard
                            title="Total Classes" value={stats?.totalClasses} subtitle="Active classrooms"
                            icon={Activity} colorClass="text-violet-600" bgClass="bg-violet-50"
                            delay={200} loading={loading}
                        />
                    </PermissionGate>
                </div>

                {/* ── Main Layout ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Left Column (Wider) */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        
                        {/* Quick Actions Panel */}
                        <PanelCard delay={300}>
                            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <PermissionGate permissions={['std_add']}>
                                    <QuickActionBtn 
                                        icon={Plus} label="Enroll New Student" desc="Add a single student profile" 
                                        onClick={() => navigate('/dashboard/students/add')}
                                        colorClass="text-blue-600" bgClass="bg-blue-50 border-blue-100"
                                    />
                                </PermissionGate>
                                <PermissionGate permissions={['acd_manage', 'cbt_grade']}>
                                    <QuickActionBtn 
                                        icon={FileText} label="Record Scores" desc="Enter CA and Exam scores" 
                                        onClick={() => navigate('/dashboard/results/record')}
                                        colorClass="text-emerald-600" bgClass="bg-emerald-50 border-emerald-100"
                                    />
                                </PermissionGate>
                                <PermissionGate permissions={['adm_settings']}>
                                    <QuickActionBtn 
                                        icon={Settings} label="Result Settings" desc="Configure grading & templates" 
                                        onClick={() => navigate('/dashboard/results/settings')}
                                        colorClass="text-violet-600" bgClass="bg-violet-50 border-violet-100"
                                    />
                                </PermissionGate>
                                <PermissionGate permissions={['adm_sms']}>
                                    <QuickActionBtn 
                                        icon={MessageSquare} label="Send Message" desc="Notify parents or staff" 
                                        onClick={() => navigate('/dashboard/messaging/communication-templates')}
                                        colorClass="text-indigo-600" bgClass="bg-indigo-50 border-indigo-100"
                                    />
                                </PermissionGate>
                            </div>
                        </PanelCard>

                        {/* Chart Panel */}
                        <PanelCard delay={400}>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-base font-bold text-gray-900">Enrollment Growth</h2>
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                                    Current Year
                                </span>
                            </div>
                            <StatisticsChartInner />
                        </PanelCard>
                        
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">

                        <PanelCard delay={450}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-gray-900">Absent Students</h2>
                                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md border border-red-100">Today</span>
                            </div>
                            <div className="flex flex-col">
                                {absentStudents.map(s => (
                                    <AttendeeRow key={s.name} name={s.name} meta={s.meta} variant="absent" />
                                ))}
                            </div>
                            <button className="w-full mt-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-colors">
                                View Full Report
                            </button>
                        </PanelCard>

                        <PanelCard delay={500}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold text-gray-900">Present Staff</h2>
                                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-md border border-emerald-100">24 / 27</span>
                            </div>
                            <div className="flex flex-col">
                                {presentStaff.map(s => (
                                    <AttendeeRow key={s.name} name={s.name} meta={s.meta} variant="present" />
                                ))}
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-500">Attendance Rate</span>
                                    <span className="font-bold text-emerald-600">88.9%</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full w-[88.9%] transition-all duration-1000 ease-out" />
                                </div>
                            </div>
                        </PanelCard>

                    </div>
                </div>
            </div>
        </>
    );
}