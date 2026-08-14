import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CalendarDays, Users, GraduationCap, Briefcase, ArrowUpRight,
    CheckCircle2, XCircle, Clock, FileCheck, Settings, QrCode, ListChecks, BarChart3,
} from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { Card } from '../../../components/ui/card';
import { useAuth } from '../../../context/AuthContext';

const NAVY = '#15316B';

interface StudentStats { date: string; totalStudents: number; present: number; absent: number; late: number; excused: number; markedCount: number; }
interface StaffStats { date: string; totalStaff: number; present: number; late: number; halfDay: number; absent: number; }

function SectionPanel({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: delay / 1000, ease: 'easeOut' }}>
            <Card className={`rounded-2xl border border-slate-200 shadow-none p-6 sm:p-7 ${className}`}>{children}</Card>
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

function StatColumn({ label, value, accent, icon: Icon, loading }: { label: string; value: number | undefined; accent: string; icon: React.ElementType; loading: boolean }) {
    return (
        <div className="p-6 sm:p-7">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400 mb-4">
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} strokeWidth={2.25} />
                {label}
            </div>
            <div className="font-heading text-[32px] leading-none tracking-tight text-slate-900 tabular-nums">
                {loading ? <span className="inline-block w-14 h-8 bg-slate-100 rounded animate-pulse" /> : (value ?? 0).toLocaleString()}
            </div>
        </div>
    );
}

function QuickActionRow({ index, icon: Icon, label, desc, onClick, accent }: { index: string; icon: any; label: string; desc: string; onClick: () => void; accent: string }) {
    return (
        <button onClick={onClick} className="group flex items-center gap-3.5 w-full py-4 text-left border-b border-slate-100 last:border-b-0">
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

export default function AttendanceDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '');

    const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
    const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/attendance/stats', { withCredentials: true }).then(r => setStudentStats(r.data)).catch(() => {}),
            isAdmin
                ? axios.get('/api/v1/attendance/staff/stats', { withCredentials: true }).then(r => setStaffStats(r.data)).catch(() => {})
                : Promise.resolve(),
        ]).finally(() => setLoading(false));
    }, [isAdmin]);

    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const studentRate = studentStats && studentStats.markedCount > 0
        ? Math.round((studentStats.present / studentStats.markedCount) * 100)
        : null;
    const unmarked = studentStats ? Math.max(0, studentStats.totalStudents - studentStats.markedCount) : 0;

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="Dashboard" tabLabel="Dashboard" tabIcon={<CalendarDays className="h-3.5 w-3.5" />}>
            <div className="flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-slate-200">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 mb-2.5">
                            <CalendarDays className="w-3.5 h-3.5" /> {dateStr}
                        </p>
                        <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#1C2333]">Attendance Overview</h1>
                    </div>
                    {studentRate !== null && (
                        <div className="text-right">
                            <div className="font-heading text-[32px] leading-none tracking-tight tabular-nums" style={{ color: studentRate >= 80 ? '#0F9D6A' : studentRate >= 50 ? '#B8860B' : '#DC2626' }}>
                                {studentRate}%
                            </div>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Student attendance today</p>
                        </div>
                    )}
                </div>

                {/* Student attendance strip */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
                    <Card className="rounded-2xl border border-slate-200 shadow-none py-0 gap-0 overflow-hidden">
                        <div className="px-6 sm:px-7 pt-5 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">Students</div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-slate-200">
                            <StatColumn label="Total Active" value={studentStats?.totalStudents} accent={NAVY} icon={GraduationCap} loading={loading} />
                            <StatColumn label="Present" value={studentStats?.present} accent="#0F9D6A" icon={CheckCircle2} loading={loading} />
                            <StatColumn label="Absent" value={studentStats?.absent} accent="#DC2626" icon={XCircle} loading={loading} />
                            <StatColumn label="Late" value={studentStats?.late} accent="#B8860B" icon={Clock} loading={loading} />
                            <StatColumn label="Unmarked" value={unmarked} accent="#94A3B8" icon={FileCheck} loading={loading} />
                        </div>
                    </Card>
                </motion.div>

                {/* Staff attendance strip — admin only */}
                {isAdmin && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}>
                        <Card className="rounded-2xl border border-slate-200 shadow-none py-0 gap-0 overflow-hidden">
                            <div className="px-6 sm:px-7 pt-5 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">Staff</div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200">
                                <StatColumn label="Total Active" value={staffStats?.totalStaff} accent={NAVY} icon={Briefcase} loading={loading} />
                                <StatColumn label="Present" value={staffStats?.present} accent="#0F9D6A" icon={CheckCircle2} loading={loading} />
                                <StatColumn label="Late" value={staffStats?.late} accent="#B8860B" icon={Clock} loading={loading} />
                                <StatColumn label="Absent" value={staffStats?.absent} accent="#DC2626" icon={XCircle} loading={loading} />
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <SectionPanel delay={100}>
                    <SectionHeading>Quick Actions</SectionHeading>
                    <div className="flex flex-col">
                        <QuickActionRow index="01" icon={ListChecks} label="Mark Student Attendance" desc="Take today's class roster" onClick={() => navigate('/dashboard/attendance/students')} accent={NAVY} />
                        {isAdmin && (
                            <QuickActionRow index="02" icon={Users} label="Staff Attendance" desc="Review or mark staff records" onClick={() => navigate('/dashboard/attendance/staff')} accent="#0F766E" />
                        )}
                        <QuickActionRow index="03" icon={BarChart3} label="Reports" desc="Attendance history and trends" onClick={() => navigate('/dashboard/attendance/reports')} accent="#7C3559" />
                        {isAdmin && (
                            <>
                                <QuickActionRow index="04" icon={QrCode} label="QR Management" desc="Generate check-in codes" onClick={() => navigate('/dashboard/attendance/qr')} accent="#B8860B" />
                                <QuickActionRow index="05" icon={Settings} label="Settings" desc="Custom codes and configuration" onClick={() => navigate('/dashboard/attendance/settings')} accent="#64748b" />
                            </>
                        )}
                    </div>
                </SectionPanel>
            </div>
        </SettingsShell>
    );
}
