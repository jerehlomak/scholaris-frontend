import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Briefcase, Activity, AlertTriangle,
    Plus, FileText, Settings, GraduationCap, ArrowUpRight,
    CalendarDays, MessageSquare
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { PermissionGate } from '../../components/auth/PermissionGate';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { menuItems } from '../../config/menu';
import { filterMenuTree, findFirstPath } from '../../utils/permissions';

const NAVY = '#15316B';
const NAVY_DEEP = '#0E2450';
const GOLD = '#F5B800';
const INK = '#1C2333';
// Brighter navy reserved for solid button fills — feedback was that the
// darker NAVY above (fine for text/icon accents) read as too dark once
// used as a filled button background.
const BTN_NAVY = '#1E4DA6';
const BTN_NAVY_HOVER = '#173F8C';

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

// ─── Section Panel (shared hairline-bordered shell) ──────────────────────────
function SectionPanel({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: delay / 1000, ease: 'easeOut' }}
        >
            <Card className={`rounded-2xl border border-slate-200 shadow-none p-6 sm:p-7 ${className}`}>
                {children}
            </Card>
        </motion.div>
    );
}

function SectionHeading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <h2 className="font-heading text-[17px] font-medium text-slate-900">{children}</h2>
            {action}
        </div>
    );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
interface KpiColumnProps {
    title: string;
    value: number | undefined;
    subtitle: string;
    icon: React.ElementType;
    accent: string;
    delay: number;
    loading: boolean;
}

function KpiColumn({ title, value, subtitle, icon: Icon, accent, delay, loading }: KpiColumnProps) {
    const displayed = useCountUp(value ?? 0, 900, delay + 300);
    const isPositive = subtitle.startsWith('+');

    return (
        <div className="p-6 sm:p-7">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400 mb-4">
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} strokeWidth={2.25} />
                {title}
            </div>
            <div className="font-heading text-[32px] sm:text-[34px] leading-none tracking-tight text-slate-900 tabular-nums mb-2.5">
                {loading ? (
                    <span className="inline-block w-20 h-8 bg-slate-100 rounded animate-pulse" />
                ) : (
                    displayed.toLocaleString()
                )}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
                {isPositive && <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />}
                {subtitle}
            </div>
        </div>
    );
}

// ─── Enrollment Chart ─────────────────────────────────────────────────────────
// Note: sample trend data (matches what this panel shipped with) — wiring
// this to a real /api/v1/dashboard/enrollment-trend endpoint is a data task,
// not a visual one; left as-is for this redesign pass. Dual Y-axis is a real
// fix though: students (~800-1300) and staff (~38-47) live on completely
// different scales, so plotting both against one axis would visually imply
// a comparison that doesn't exist.
const TREND_DATA = [
    { month: 'Jan', Students: 820, Staff: 38 },
    { month: 'Feb', Students: 940, Staff: 40 },
    { month: 'Mar', Students: 880, Staff: 41 },
    { month: 'Apr', Students: 1050, Staff: 43 },
    { month: 'May', Students: 1100, Staff: 44 },
    { month: 'Jun', Students: 1200, Staff: 45 },
    { month: 'Jul', Students: 1240, Staff: 46 },
    { month: 'Aug', Students: 1284, Staff: 47 },
];

function EnrollmentChart() {
    return (
        <div className="h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="studentsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={NAVY} stopOpacity={0.16} />
                            <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1EDE3" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A6A196', fontSize: 11, fontWeight: 600 }} dy={8} />
                    <YAxis
                        yAxisId="students" axisLine={false} tickLine={false}
                        tick={{ fill: '#A6A196', fontSize: 11 }} width={40}
                    />
                    <YAxis
                        yAxisId="staff" orientation="right" axisLine={false} tickLine={false}
                        tick={{ fill: '#A6A196', fontSize: 11 }} width={32}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #EEEAE0', boxShadow: '0 8px 24px -8px rgba(21,49,107,0.18)', fontSize: 13 }}
                        labelStyle={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}
                    />
                    <Area
                        yAxisId="students" type="monotone" dataKey="Students"
                        stroke={NAVY} strokeWidth={2.5} fill="url(#studentsFill)"
                        activeDot={{ r: 5, fill: NAVY, strokeWidth: 0 }}
                    />
                    <Area
                        yAxisId="staff" type="monotone" dataKey="Staff"
                        stroke={GOLD} strokeWidth={2.5} fill="none"
                        activeDot={{ r: 5, fill: GOLD, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-1 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: NAVY }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Students</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: GOLD }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Staff</span>
                </div>
            </div>
        </div>
    );
}

// ─── Attendance Ring ──────────────────────────────────────────────────────────
function AttendanceRing({ percent }: { percent: number }) {
    const r = 42;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return (
        <div className="relative w-[100px] h-[100px] shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#EEEAE0" strokeWidth="8" />
                <motion.circle
                    cx="50" cy="50" r={r} fill="none" stroke="#0F9D6A" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.1, delay: 0.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading text-lg font-medium text-slate-900 tabular-nums">{percent}%</span>
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
        <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 last:border-b-0">
            <div
                className="w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0"
                style={{ borderColor: isAbsent ? '#FCA5A5' : '#86EFAC' }}
            >
                {initials}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800 truncate">{name}</div>
                <div className="text-xs text-slate-500 font-medium">{meta}</div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ${isAbsent ? 'text-rose-600' : 'text-emerald-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAbsent ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {isAbsent ? 'Absent' : 'Present'}
            </div>
        </div>
    );
}

// ─── Quick Action Row ─────────────────────────────────────────────────────────
function QuickActionRow({ index, icon: Icon, label, desc, onClick, accent }: { index: string, icon: any, label: string, desc: string, onClick: () => void, accent: string }) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-3.5 w-full py-4 text-left border-b border-slate-100 last:border-b-0"
        >
            <span className="font-heading text-base text-slate-300 tabular-nums w-5 shrink-0">{index}</span>
            <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2.25} />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{label}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{desc}</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 transition-all group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
        </button>
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
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#FBF9F5]">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <h2 className="text-lg font-bold text-slate-800">No menu access configured yet</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">Your role doesn't have any menu items enabled. Contact your school administrator to set up your access.</p>
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
        <div className="flex flex-col w-full min-h-screen bg-[#FBF9F5]">
            <div className="max-w-[1360px] w-full mx-auto flex flex-col gap-8 p-4 sm:p-8 lg:p-10">

                {/* ── Header ── */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-7 border-b border-slate-200">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {dateStr}
                        </p>
                        <h1 className="font-heading text-[34px] sm:text-[42px] font-medium tracking-tight leading-none" style={{ color: INK }}>
                            Admin Dashboard
                        </h1>
                    </div>

                    <Button
                        onClick={() => navigate('/dashboard/students/add')}
                        className="gap-2 text-white font-semibold rounded-full px-5 py-2.5 h-auto shadow-none"
                        style={{ backgroundColor: BTN_NAVY }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = BTN_NAVY_HOVER)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = BTN_NAVY)}
                    >
                        <Plus className="w-4 h-4" /> Add Student
                    </Button>
                </header>

                {/* ── KPI Strip ── */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                    <Card className="rounded-2xl border border-slate-200 shadow-none py-0 gap-0 overflow-hidden">
                        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200">
                            <PermissionGate permissions={['std_view']}>
                                <KpiColumn
                                    title="Total Students" value={stats?.totalStudents} subtitle="+12% from last term"
                                    icon={GraduationCap} accent={NAVY}
                                    delay={50} loading={loading}
                                />
                            </PermissionGate>
                            <PermissionGate permissions={['adm_staff']}>
                                <KpiColumn
                                    title="Total Staff" value={stats?.totalTeachers} subtitle="Active teaching staff"
                                    icon={Briefcase} accent="#B8860B"
                                    delay={100} loading={loading}
                                />
                            </PermissionGate>
                            <PermissionGate permissions={['std_view']}>
                                <KpiColumn
                                    title="Total Parents" value={stats?.totalParents} subtitle="Registered accounts"
                                    icon={Users} accent="#0F766E"
                                    delay={150} loading={loading}
                                />
                            </PermissionGate>
                            <PermissionGate permissions={['acd_view']}>
                                <KpiColumn
                                    title="Total Classes" value={stats?.totalClasses} subtitle="Active classrooms"
                                    icon={Activity} accent="#7C3559"
                                    delay={200} loading={loading}
                                />
                            </PermissionGate>
                        </div>
                    </Card>
                </motion.div>

                {/* ── Row: Chart + Quick Actions ── */}
                <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-8">

                    <SectionPanel delay={300}>
                        <SectionHeading action={<span className="text-xs font-semibold text-slate-400">This year</span>}>
                            Enrollment Growth
                        </SectionHeading>
                        <EnrollmentChart />
                    </SectionPanel>

                    <SectionPanel delay={350}>
                        <SectionHeading>Quick Actions</SectionHeading>
                        <div className="flex flex-col">
                            <PermissionGate permissions={['std_add']}>
                                <QuickActionRow
                                    index="01" icon={Plus} label="Enroll New Student" desc="Add a single student profile"
                                    onClick={() => navigate('/dashboard/students/add')}
                                    accent={NAVY}
                                />
                            </PermissionGate>
                            <PermissionGate permissions={['acd_manage', 'cbt_grade']}>
                                <QuickActionRow
                                    index="02" icon={FileText} label="Record Scores" desc="Enter CA and Exam scores"
                                    onClick={() => navigate('/dashboard/results/record')}
                                    accent="#0F766E"
                                />
                            </PermissionGate>
                            <PermissionGate permissions={['adm_settings']}>
                                <QuickActionRow
                                    index="03" icon={Settings} label="Result Settings" desc="Configure grading & templates"
                                    onClick={() => navigate('/dashboard/results/settings')}
                                    accent="#7C3559"
                                />
                            </PermissionGate>
                            <PermissionGate permissions={['adm_sms']}>
                                <QuickActionRow
                                    index="04" icon={MessageSquare} label="Send Message" desc="Notify parents or staff"
                                    onClick={() => navigate('/dashboard/messaging/communication-templates')}
                                    accent="#B8860B"
                                />
                            </PermissionGate>
                        </div>
                    </SectionPanel>

                </div>

                {/* ── Row: Attendance Today ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <SectionPanel delay={400}>
                        <SectionHeading action={
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Today
                            </span>
                        }>
                            Absent Students
                        </SectionHeading>
                        <div className="flex flex-col">
                            {absentStudents.map(s => (
                                <AttendeeRow key={s.name} name={s.name} meta={s.meta} variant="absent" />
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors">
                            View Full Report
                        </button>
                    </SectionPanel>

                    <SectionPanel delay={450}>
                        <SectionHeading action={<span className="text-xs font-semibold text-slate-400 tabular-nums">24 / 27</span>}>
                            Present Staff
                        </SectionHeading>
                        <div className="flex items-center gap-5 pb-4 mb-1 border-b border-slate-100">
                            <AttendanceRing percent={88.9} />
                            <div>
                                <div className="text-sm font-semibold text-slate-800">Attendance rate today</div>
                                <div className="text-xs text-slate-500 mt-1">3 staff currently absent</div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            {presentStaff.map(s => (
                                <AttendeeRow key={s.name} name={s.name} meta={s.meta} variant="present" />
                            ))}
                        </div>
                    </SectionPanel>

                </div>
            </div>
        </div>
    );
}
