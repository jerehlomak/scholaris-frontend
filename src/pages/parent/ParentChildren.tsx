import { useState, useEffect } from 'react';
import { Home as HomeIcon, ChevronRight, BookOpen, Users, Award, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

interface Child {
    id: string; 
    name: string; 
    avatar: string; 
    avatarColor: string;
    class: string; 
    admNo: string; 
    dob: string; 
    gender: string;
    avg: number; 
    position: number; 
    totalStudents: number;
    attendance: number; 
    subjects: number;
    housemaster: string; 
    classTeacher: string;
}

const AVATAR_COLORS = ['bg-[#1E4DA6]', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500', 'bg-[#1E4DA6]'];

export default function ParentChildren() {
    const [children, setChildren] = useState<Child[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await axios.get('/api/v1/dashboard/me', { withCredentials: true });
                const rawChildren = res.data.children || [];
                
                const mapped: Child[] = rawChildren.map((c: any, i: number) => ({
                    id: c.id,
                    name: c.name,
                    avatar: c.name.charAt(0),
                    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    class: c.classLevel?.name || 'Unassigned',
                    admNo: c.admissionNumber,
                    // These fields are coming as null/empty from basic dashboard, 
                    // in a real app we might fetch more details or use fallbacks
                    dob: c.dateOfBirth || 'N/A',
                    gender: c.gender || 'N/A',
                    avg: 0, 
                    position: 0, 
                    totalStudents: 0,
                    attendance: 0, 
                    subjects: c.subjects || 0,
                    housemaster: 'N/A', 
                    classTeacher: 'N/A',
                }));

                setChildren(mapped);
                if (mapped.length > 0) setSelected(mapped[0].id);
            } catch (error) {
                toast.error("Failed to load children profiles");
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, []);

    const child = children.find(c => c.id === selected);

    if (loading) return (
        <div className="flex items-center justify-center p-20 w-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" />
        </div>
    );

    if (children.length === 0) return (
        <div className="max-w-[1200px] mx-auto w-full font-dash pb-10">
            <div className="p-20 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No children linked</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">Could not find any students linked to your parent profile in the database.</p>
                <Link to="/parent" className="mt-6 inline-block text-[#1E4DA6] font-bold underline">Go Back Home</Link>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Children</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and view your children's profiles</p>
                </div>
            </div>

            {/* Child tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
                {children.map(c => (
                    <button key={c.id} onClick={() => setSelected(c.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selected === c.id ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 ring-1 ring-[#1E4DA6]/20' : 'border-slate-200 bg-white hover:bg-slate-50'} shadow-sm`}>
                        <div className={`w-9 h-9 ${c.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{c.avatar}</div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.class}</p>
                        </div>
                    </button>
                ))}
            </div>

            {child && (
                <motion.div key={child.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Profile banner */}
                    <Card className="p-6 bg-gradient-to-r from-[#173F8C] via-[#122F69] to-indigo-900 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                        />
                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 ${child.avatarColor} border-4 border-white/30 rounded-2xl flex items-center justify-center text-white text-2xl font-black`}>{child.avatar}</div>
                                <div>
                                    <p className="font-black text-xl mb-0.5">{child.name}</p>
                                    <p className="text-white/70 text-sm">{child.admNo} · {child.class}</p>
                                    <p className="text-white/70 text-sm">Gender: {child.gender}</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                {[
                                    { label: 'Average', value: `${child.avg}%` },
                                    { label: 'Position', value: `${child.position}/${child.totalStudents}` },
                                    { label: 'Attendance', value: `${child.attendance}%` },
                                ].map(k => (
                                    <div key={k.label} className="text-center">
                                        <p className="text-2xl font-black">{k.value}</p>
                                        <p className="text-white/70 text-xs uppercase tracking-wider">{k.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: <BookOpen className="w-5 h-5" />, color: 'bg-[#1E4DA6]/10 text-[#173F8C]', label: 'Subjects Enrolled', value: child.subjects },
                            { icon: <Users className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-700', label: 'Class Teacher', value: child.classTeacher },
                            { icon: <Award className="w-5 h-5" />, color: 'bg-amber-100 text-amber-700', label: 'Housemaster', value: child.housemaster },
                        ].map((k, i) => (
                            <Card key={i} className="p-4 bg-white border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>{k.icon}</div>
                                <div>
                                    <p className="text-xs text-gray-500">{k.label}</p>
                                    <p className="font-bold text-gray-900">{k.value}</p>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Performance mini summary */}
                    <Card className="p-5 bg-white border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Academic Performance</h3>
                            <Link to="/parent/results" className="text-xs text-[#1E4DA6] font-semibold hover:underline flex items-center gap-1">
                                View Full Report <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-[#1E4DA6] h-full rounded-full transition-all duration-500" style={{ width: `${child.avg}%` }} />
                            </div>
                            <span className="font-bold text-[#173F8C] text-lg">{child.avg}%</span>
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Overall average · Position {child.position} of {child.totalStudents} students</p>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
