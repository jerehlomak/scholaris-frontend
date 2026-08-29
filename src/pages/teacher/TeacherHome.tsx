import {
    Users, ClipboardCheck, MessageSquare, Loader2,
    AlertTriangle, TrendingUp, BookOpen, Activity, ArrowRight,
    Wallet, Banknote, PiggyBank, Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

// Kept exactly as-is — animation config untouched
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 24 } }
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, bg }: {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    color: string;
    bg: string;
}) {
    return (
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon size={20} className={color} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                    {typeof value === 'string' && value === 'ACTIVE' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-xs font-semibold px-2 py-0.5">
                            ● Active
                        </Badge>
                    ) : (
                        <p className="text-2xl font-bold text-slate-900">{value}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TeacherHome() {
    // Kept exactly as-is — all data fetching logic untouched
    const [data, setData] = useState<any>(null);
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashRes, deadlineRes] = await Promise.all([
                    axios.get('/api/v1/dashboard/me', { withCredentials: true }),
                    axios.get('/api/v1/deadlines/active', { withCredentials: true }).catch(() => ({ data: { deadlines: [] } }))
                ]);
                setData(dashRes.data);
                setDeadlines(deadlineRes.data.deadlines || []);
            } catch (error) {
                toast.error('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" />
            </div>
        );
    }

    if (!data) return null;

    const { profile, stats, schedule, recentStudents } = data;

    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <motion.div
            className="w-full max-w-6xl mx-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* ── Welcome Hero ── */}
            <motion.div variants={itemVariants}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173F8C] via-[#122F69] to-indigo-900 p-6 text-white shadow-lg">
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                    <div className="relative flex items-start justify-between gap-4">
                        <div>
                            <p className="text-white/70 text-sm font-medium mb-1">{today}</p>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                                {profile?.user?.name || profile?.name || 'Teacher'} 👋
                            </h1>
                            <p className="mt-1 text-white/70 text-sm">{profile?.user?.email}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                                <p className="text-2xl font-bold">{stats?.classesAssigned ?? 0}</p>
                                <p className="text-[11px] text-white/70 font-medium">Classes</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                                <p className="text-2xl font-bold">{stats?.totalStudents ?? 0}</p>
                                <p className="text-[11px] text-white/70 font-medium">Students</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Deadline Warnings ── */}
            {deadlines.filter(d => d.showWarning).map(dl => (
                <motion.div key={dl.id} variants={itemVariants}>
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 flex-wrap">
                                Action Required: {dl.label || dl.activity.replace('_', ' ')}
                                <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[10px] font-bold px-2">
                                    {dl.hoursUntilDeadline}h REMAINING
                                </Badge>
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                                The deadline for <strong>{dl.term.name}</strong> closes at{' '}
                                {new Date(dl.deadline).toLocaleString()}. Please ensure your records are up to date.
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* ── KPI Stats ── */}
            <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Classes Assigned', value: stats.classesAssigned, icon: BookOpen, color: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5' },
                    { label: 'Subjects Teaching', value: stats.subjectsTeaching, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Status', value: 'ACTIVE', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(c => (
                    <motion.div key={c.label} variants={itemVariants}>
                        <KpiCard {...c} />
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Main Content ── */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Left column: Teacher Info + Payroll */}
                <motion.div variants={itemVariants} className="lg:col-span-1 flex flex-col gap-5">
                    <Card className="bg-white border border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-700">Teacher Profile</CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4 space-y-3">
                            {/* Staff ID */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Staff ID</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E4DA6]/20 bg-[#1E4DA6]/5">
                                    <span className="text-sm font-mono font-bold text-[#173F8C] tracking-wider">
                                        {profile.employeeId || '—'}
                                    </span>
                                </div>
                            </div>
                            <Separator />
                            {[
                                { label: 'Full Name', value: profile?.user?.name || profile?.name || '—' },
                                { label: 'Section', value: profile.department || 'General' },
                                { label: 'Phone', value: profile.phone || '—' },
                                { label: 'Position', value: profile.position || 'Class Teacher' },
                            ].map(f => (
                                <div key={f.label}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</p>
                                    <p className="text-sm font-medium text-slate-800">{f.value}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Payroll & Finance Summary */}
                    <Card className="bg-white border border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                                Payroll & Payslips
                            </CardTitle>
                            <Link to="/teacher/payroll">
                                <Button variant="ghost" size="sm" className="text-xs text-[#1E4DA6] hover:text-[#173F8C] hover:bg-[#1E4DA6]/5 -mr-2 h-7 px-2 gap-1">
                                    Full Portal <ArrowRight size={12} />
                                </Button>
                            </Link>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4 space-y-4">
                            {/* Last Payslip */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Payslip</p>
                                {data.payroll?.recentSlip ? (
                                    <Link to="/teacher/payroll" className="block group">
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 group-hover:border-[#1E4DA6]/20 group-hover:bg-[#1E4DA6]/8 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#1E4DA6] transition-colors">
                                                        {new Date(0, data.payroll.recentSlip.payrollRun.month - 1).toLocaleString('en', { month: 'long' })} {data.payroll.recentSlip.payrollRun.year}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest mt-0.5">
                                                        {data.payroll.recentSlip.payrollRun.status === 'confirmed' ? 'Paid' : 'Processing'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-800">
                                                    ₦{data.payroll.recentSlip.net?.toLocaleString()}
                                                </p>
                                                <span className="text-[10px] text-[#1E4DA6] font-semibold group-hover:underline">View & Print →</span>
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                                        <p className="text-xs text-slate-500">No payslips issued yet.</p>
                                        <Link to="/teacher/payroll" className="text-xs text-[#1E4DA6] font-semibold hover:underline mt-1 inline-block">
                                            Open Payroll Dashboard →
                                        </Link>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* Total Pension */}
                                <div className="p-3 rounded-lg border border-[#1E4DA6]/10 bg-[#1E4DA6]/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PiggyBank className="w-3.5 h-3.5 text-[#1E4DA6]" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#122F69]">Pension</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">
                                        ₦{(data.payroll?.totalPensionAccumulated || 0).toLocaleString()}
                                    </p>
                                </div>
                                {/* Active Loans */}
                                <div className="p-3 rounded-lg border border-rose-100 bg-rose-50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Banknote className="w-3.5 h-3.5 text-rose-600" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Active Loan</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">
                                        ₦{(data.payroll?.activeLoans?.reduce((sum: number, l: any) => sum + l.outstandingBalance, 0) || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Today's Schedule + Quick Actions */}
                <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-5">
                    {/* Schedule */}
                    <Card className="bg-white border border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold text-slate-700">Today's Schedule</CardTitle>
                            <Link to="/teacher/schedule">
                                <Button variant="ghost" size="sm" className="text-xs text-[#1E4DA6] hover:text-[#173F8C] hover:bg-[#1E4DA6]/5 -mr-2 h-7 px-2 gap-1">
                                    View Full <ArrowRight size={12} />
                                </Button>
                            </Link>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4">
                            {schedule && schedule.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {schedule.map((cls: any, i: number) => (
                                        <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E4DA6] mb-1">{cls.time}</p>
                                            <p className="text-sm font-bold text-slate-800 leading-tight">{cls.subject}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{cls.class} · Room {cls.room}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-400">
                                    <p className="text-sm font-medium">No scheduled classes for today</p>
                                    <p className="text-xs mt-1">Enjoy your free day!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-white border border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-700">Quick Actions</CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { to: '/teacher/assignments', icon: ClipboardCheck, label: 'Assignments', color: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5 hover:bg-[#1E4DA6]/10' },
                                    { to: '/teacher/attendance', icon: Users, label: 'Attendance', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
                                    { to: '/teacher/messaging', icon: MessageSquare, label: 'Messaging', color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100' },
                                ].map(a => (
                                    <Link
                                        key={a.to}
                                        to={a.to}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 ${a.bg} transition-colors`}
                                    >
                                        <a.icon size={20} className={a.color} />
                                        <span className="text-xs font-semibold text-slate-700">{a.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Performing Students — fills remaining right-column space */}
                    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden flex-1">
                        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold text-slate-700">Top Performing Students</CardTitle>
                            <Link to="/teacher/classes">
                                <Button variant="ghost" size="sm" className="text-xs text-[#1E4DA6] hover:text-[#173F8C] hover:bg-[#1E4DA6]/5 -mr-2 h-7 px-2 gap-1">
                                    View Roster <ArrowRight size={12} />
                                </Button>
                            </Link>
                        </CardHeader>
                        <Separator />

                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        {['Student Name', 'Class', 'Attendance', 'Grade'].map(h => (
                                            <th key={h} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${h === 'Grade' ? 'text-right' : ''}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentStudents && recentStudents.length > 0 ? recentStudents.map((s: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#1E4DA6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {s.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500">{s.class}</td>
                                            <td className="px-5 py-3">
                                                <Badge className={
                                                    parseInt(s.attendance) >= 80
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                                                        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-50'
                                                }>
                                                    {s.attendance}%
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-slate-800">{s.grade}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">
                                                No students found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="block sm:hidden divide-y divide-slate-100">
                            {recentStudents && recentStudents.length > 0 ? recentStudents.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#1E4DA6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {s.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{s.name}</p>
                                            <p className="text-xs text-slate-500">{s.class}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge className={
                                            parseInt(s.attendance) >= 80
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px]'
                                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 text-[10px]'
                                        }>
                                            {s.attendance}%
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-700">{s.grade}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-6 text-center text-slate-400 text-sm">No students found.</div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

        </motion.div>
    );
}
