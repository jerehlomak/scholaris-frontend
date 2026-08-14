import { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import {
    Building2, Users, GraduationCap, UserCheck,
    TrendingUp, Activity, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
    id: string;
    name: string;
    schoolCode: string | null;
    status: string;
    students: number;
    teachers: number;
    parents: number;
}

interface OverviewData {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalRevenue: number;
    groupName: string;
    branches: Branch[];
}

const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
        ACTIVE: { label: 'Active', color: 'rgba(34,197,94,0.15)', icon: CheckCircle },
        SUSPENDED: { label: 'Suspended', color: 'rgba(239,68,68,0.15)', icon: AlertCircle },
        PENDING: { label: 'Pending', color: 'rgba(234,179,8,0.15)', icon: Clock },
    };
    const s = map[status] || map.PENDING;
    const Icon = s.icon;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: s.color, color: status === 'ACTIVE' ? '#4ade80' : status === 'SUSPENDED' ? '#f87171' : '#fbbf24' }}>
            <Icon className="w-3 h-3" />
            {s.label}
        </span>
    );
};

export default function GroupDashboard() {
    const { T } = useOutletContext<any>();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get('/api/v1/group-admin/overview', { withCredentials: true });
                setData(res.data.overview);
            } catch {
                toast.error('Failed to load group overview');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const cardStyle = {
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: '1rem',
    };

    const glowCardStyle = (color: string) => ({
        ...cardStyle,
        boxShadow: `0 0 20px -8px ${color}`,
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-[#1E4DA6]/30 border-t-[#1E4DA6] animate-spin" />
            </div>
        );
    }

    const topStats = [
        {
            label: 'Total Branches',
            value: data?.totalSchools ?? 0,
            icon: Building2,
            color: '#3b82f6',
            glow: 'rgba(59,130,246,0.3)',
        },
        {
            label: 'Total Students',
            value: data?.totalStudents ?? 0,
            icon: GraduationCap,
            color: '#10b981',
            glow: 'rgba(16,185,129,0.3)',
        },
        {
            label: 'Total Teachers',
            value: data?.totalTeachers ?? 0,
            icon: UserCheck,
            color: '#8b5cf6',
            glow: 'rgba(139,92,246,0.3)',
        },
        {
            label: 'Total Parents',
            value: data?.totalParents ?? 0,
            icon: Users,
            color: '#f59e0b',
            glow: 'rgba(245,158,11,0.3)',
        },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: T.textPrimary }}>{data?.groupName ?? 'Group'} — Overview</h1>
                <p className="text-sm mt-1" style={{ color: T.textMuted }}>Real-time analytics across all your school branches</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {topStats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} style={glowCardStyle(s.glow)} className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{s.label}</p>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: `${s.color}20` }}>
                                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold" style={{ color: T.textPrimary }}>{s.value.toLocaleString()}</p>
                            <div className="mt-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" style={{ color: s.color }} />
                                <span className="text-xs" style={{ color: s.color }}>Across {data?.totalSchools} branches</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Branch Breakdown Table */}
            <div style={cardStyle} className="overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#1E4DA6]/60" />
                        <h2 className="text-sm font-semibold" style={{ color: T.textPrimary }}>Branch Analytics</h2>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Students, teachers & parents per branch</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                {['Branch', 'School ID', 'Status', 'Students', 'Teachers', 'Parents', 'Total'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: T.textMuted }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.branches ?? []).map((branch, idx) => (
                                <tr key={branch.id}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                                {branch.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: T.textPrimary }}>{branch.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs font-mono text-[#1E4DA6]/60 bg-[#1E4DA6]/10 px-2 py-1 rounded">
                                            {branch.schoolCode ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">{statusBadge(branch.status)}</td>
                                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: T.textPrimary }}>{branch.students}</td>
                                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: T.textPrimary }}>{branch.teachers}</td>
                                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: T.textPrimary }}>{branch.parents}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-sm font-bold text-[#1E4DA6]/60">
                                            {branch.students + branch.teachers + branch.parents}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(data?.branches ?? []).length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: '#64748b' }}>
                                        No branches found for this group.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {/* Totals row */}
                        {(data?.branches ?? []).length > 0 && (
                            <tfoot>
                                <tr style={{ borderTop: `1px solid ${T.border}`, background: 'rgba(59,130,246,0.05)' }}>
                                    <td className="px-5 py-3 text-xs font-bold text-[#1E4DA6]/60 uppercase" colSpan={3}>Group Totals</td>
                                    <td className="px-5 py-3 text-sm font-bold" style={{ color: T.textPrimary }}>{data?.totalStudents}</td>
                                    <td className="px-5 py-3 text-sm font-bold" style={{ color: T.textPrimary }}>{data?.totalTeachers}</td>
                                    <td className="px-5 py-3 text-sm font-bold" style={{ color: T.textPrimary }}>{data?.totalParents}</td>
                                    <td className="px-5 py-3 text-sm font-bold text-[#1E4DA6]/60">
                                        {(data?.totalStudents ?? 0) + (data?.totalTeachers ?? 0) + (data?.totalParents ?? 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
