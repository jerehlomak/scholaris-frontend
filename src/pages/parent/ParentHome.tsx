import {
    Users, CreditCard, MessageSquare, Loader2,
    AlertTriangle, BookOpen, ArrowRight, User, BellRing
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
                        <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 text-xs font-bold px-2 py-0.5 mt-1">
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

export function ParentHome() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashboardRes, messagesRes] = await Promise.all([
                    axios.get('/api/v1/dashboard/me', { withCredentials: true }),
                    axios.get('/api/v1/finance-v2/messages/parent', { withCredentials: true }).catch(() => ({ data: { messages: [] } }))
                ]);
                const response = dashboardRes;
                setRecentMessages(messagesRes.data.messages || []);
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

    const { profile, stats, children, recentFees } = data;
    const parentName = profile.user?.name || profile.fatherName || profile.motherName || profile.guardianName || 'Parent';
    
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
                    <div className="relative flex items-start justify-between gap-4">
                        <div>
                            <p className="text-blue-200 text-sm font-medium mb-1">{today}</p>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                                {parentName} 👋
                            </h1>
                            <p className="mt-1 text-blue-200 text-sm">{profile?.user?.email || 'Welcome to the parent portal'}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                                <p className="text-2xl font-bold">{stats?.childrenCount || 0}</p>
                                <p className="text-[11px] text-blue-200 font-medium">Children</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Stats Row ── */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div variants={itemVariants}>
                    <KpiCard
                        label="Enrolled Children"
                        value={stats?.childrenCount || 0}
                        icon={Users}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard
                        label="Outstanding Fees"
                        value={stats?.outstandingFees || "₦0.00"}
                        icon={CreditCard}
                        color="text-red-600"
                        bg="bg-red-50"
                        highlight={true}
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <KpiCard
                        label="Notifications"
                        value={stats?.notifications || "0"}
                        icon={MessageSquare}
                        color="text-amber-600"
                        bg="bg-amber-50"
                    />
                </motion.div>
            </motion.div>

            {/* ── Main Content Grid ── */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Linked Children Profiles */}
                <motion.div variants={itemVariants} className="h-full">
                    <Card className="h-full flex flex-col shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-800">
                                Linked Children Profiles
                            </CardTitle>
                            <Link to="/parent/children" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                Manage
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="divide-y divide-slate-100">
                                {children && children.length > 0 ? children.map((child: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-12 h-12 rounded-full border-2 border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                                            {child.photo ? (
                                                <img src={child.photo} alt={child.firstName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-900 truncate">{child.firstName} {child.lastName}</p>
                                            <p className="text-xs mt-0.5 text-slate-500">{child.classLevel?.name || 'Class Unassigned'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0 border ${child.isActive ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-50' : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-50'}`}>
                                                    {child.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <span className="text-[10px] font-medium text-slate-400">#{child.admissionNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center flex flex-col items-center">
                                        <Users className="w-8 h-8 mb-3 text-slate-300" />
                                        <p className="font-medium text-sm text-slate-600">No children linked to this account.</p>
                                        <p className="text-xs mt-1 text-slate-400">Contact the school administrator to verify your family profile.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Fee Transactions */}
                <motion.div variants={itemVariants} className="h-full flex flex-col">
                    <Card className="h-full flex flex-col shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-800">
                                Recent Billing Activity
                            </CardTitle>
                            <Link to="/parent/fees" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                View Ledger
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="py-2.5 px-4 font-medium text-slate-500 text-xs">Invoice Detail</th>
                                            <th className="py-2.5 px-4 font-medium text-slate-500 text-xs text-center">Status</th>
                                            <th className="py-2.5 px-4 font-medium text-slate-500 text-xs text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentFees && recentFees.length > 0 ? recentFees.map((fee: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-900">
                                                    {fee.desc}
                                                    <span className="block text-[10px] text-slate-500 mt-0.5">{fee.date}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${fee.status === 'Paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-50' : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-50'}`}>
                                                        {fee.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900 text-right">{fee.amount}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="py-10 text-center font-medium text-slate-500">
                                                    No recent fee/billing history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Action Footer */}
                            {recentFees && recentFees.length > 0 && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-right rounded-b-xl">
                                    <Link to="/parent/fees">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm text-xs">
                                            Pay Outstanding Balance <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
                
            </motion.div>
        

            {recentMessages.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="bg-white border-blue-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100 flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BellRing className="text-blue-500 w-5 h-5" />
                                Recent Reminders & Messages
                            </CardTitle>
                            <Link to="/parent/finance-messages" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {recentMessages.slice(0, 3).map((msg, idx) => (
                                    <div key={idx} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                            <MessageSquare className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{msg.subject}</h4>
                                            <p className="text-slate-600 text-sm mt-1">{msg.body}</p>
                                            <span className="text-xs text-slate-400 mt-2 block">
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

        </motion.div>
    );
}
