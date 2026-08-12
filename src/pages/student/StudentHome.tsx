import { Search, Loader2, BookOpen, ChevronRight, BarChart2, Wallet, CreditCard, ClipboardList, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 24 } }
};

function KpiCard({ label, value, icon: Icon, color, bg, highlight = false }: {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    color: string;
    bg: string;
    highlight?: boolean;
}) {
    return (
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon size={20} className={color} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                    {highlight ? (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 text-xs font-bold px-2 py-0.5 mt-1">
                            {value as string}
                        </Badge>
                    ) : (
                        <p className="text-2xl font-bold text-slate-900">{value}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function StudentHome() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const swrFetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);
    const { data: resultData } = useSWR('/api/v1/results/report-card', swrFetcher, { revalidateOnFocus: false });
    const { data: subjectData } = useSWR('/api/v1/subjects/my-subjects', swrFetcher, { revalidateOnFocus: false });

    const subjects: any[] = subjectData?.subjects || [];
    const resultEntries: any[] = resultData?.results || resultData?.scores || [];
    const scoreMap: Record<string, number> = {};
    resultEntries.forEach((r: any) => {
        const key = (r.subjectName || r.subject?.name || '').toLowerCase().trim();
        const score = r.total ?? r.score ?? r.totalScore ?? null;
        if (key && score != null) scoreMap[key] = score;
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await axios.get('/api/v1/dashboard/me', { withCredentials: true });
                setData(response.data);
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
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) return null;

    const { profile, stats } = data;
    const { classLevel, classArm } = profile;
    const studentName = profile.user?.name || profile.name || 'Student';

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
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6 text-white shadow-lg">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
                                Welcome back, {studentName} 👋
                            </h1>
                            <p className="text-blue-100/80 text-sm">{today}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 font-semibold h-9 rounded-xl transition-all">
                                <Link to="/student/course">My Courses</Link>
                            </Button>
                            <Button asChild variant="secondary" className="bg-white text-blue-900 hover:bg-slate-50 border-0 font-bold h-9 rounded-xl transition-all shadow-sm">
                                <Link to="/student/cbt">CBT Portal</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    label="Outstanding Courses"
                    value={stats.outstandingCourses || "0"}
                    icon={BookOpen}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <KpiCard
                    label="Credit Units"
                    value={stats.creditUnits || "0"}
                    icon={ClipboardList}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <KpiCard
                    label="Wallet Balance"
                    value={stats.walletBalance || "₦0.00"}
                    icon={Wallet}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    highlight
                />
            </motion.div>

            {/* Main Content Grid */}
            <motion.div variants={itemVariants} className="space-y-6">
                
                {/* Academic Profile Container */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-sm font-semibold text-slate-800">Academic Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
                            <div className="col-span-2 lg:col-span-4 mb-2">
                                <p className="text-xs text-slate-500 mb-1.5">Admission Number (required for portal login)</p>
                                <div className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                                    <span className="text-sm font-mono font-bold text-slate-700 tracking-wider">
                                        {profile.admissionNumber || '—'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Class ID</p>
                                <p className="text-sm font-medium text-slate-900">{`${classLevel?.name || 'Unassigned'} ${classArm?.name || ''}`}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Student Status</p>
                                <Badge className={profile.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                                    {profile.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Stream / Category</p>
                                <p className="text-sm font-medium text-slate-900">{profile.studentCategory || 'General Stream'}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-5 border-t border-slate-100">
                            <Link to="/student/result" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                                View Full Transcript <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Student Ledger Details */}
                    <Card className="shadow-sm border-slate-200 h-full">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-semibold text-slate-800">Ledger Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            {[
                                { label: 'Admission Date', value: profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString() : new Date(profile.createdAt).toLocaleDateString() },
                                { label: 'Gender', value: profile.gender || 'N/A' },
                                { label: 'Date of Birth', value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A' },
                                { label: 'Blood Group', value: profile.bloodGroup || 'N/A' },
                                { label: 'Health Status', value: profile.healthConditions || 'Healthy' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="font-medium text-slate-900">{item.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Notice Board / Upcoming */}
                    <Card className="shadow-sm border-slate-200 h-full flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold text-slate-800">Upcoming Classes & Tasks</CardTitle>
                            <Link to="/student/course" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                Full Schedule
                            </Link>
                        </CardHeader>
                        <CardContent className="pt-5 flex-1 flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-50 border border-slate-100">
                                    <Clock className="w-5 h-5 text-slate-400" />
                                </div>
                                <p className="font-semibold text-sm text-slate-800">You're all caught up!</p>
                                <p className="text-xs mt-1 text-slate-500 max-w-[250px] mx-auto">There are no pending assignments or upcoming schedules for today.</p>
                            </div>

                            {/* CBT Quick Link */}
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CBT Portal</p>
                                            <p className="text-sm font-semibold text-slate-800">Online Assessments</p>
                                        </div>
                                    </div>
                                    <Link to="/student/cbt" className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100">
                                        Launch Center
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Subject Performance Section */}
                {subjects.length > 0 && (
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-slate-400" /> Subject Performance
                            </CardTitle>
                            <Link to="/student/course" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                All Subjects →
                            </Link>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="space-y-4">
                                {subjects.map((sub: any, i: number) => {
                                    const score = scoreMap[sub.name.toLowerCase().trim()];
                                    const pct = score != null ? Math.min(100, Math.max(0, score)) : null;
                                    const barColor = pct == null ? 'bg-slate-200' : pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
                                    const textColor = pct == null ? 'text-slate-400' : pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
                                    return (
                                        <div key={sub.id} className="flex items-center gap-4">
                                            <span className="text-sm font-medium w-40 shrink-0 truncate text-slate-700">
                                                {sub.name}
                                            </span>
                                            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full ${barColor}`}
                                                    style={{ width: pct != null ? `${pct}%` : '0%', transition: 'width 0.6s ease' }}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold w-12 text-right shrink-0 ${textColor}`}>
                                                {pct != null ? `${pct}%` : '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </motion.div>
    );
}
