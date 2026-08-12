import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { BookOpen, CheckCircle2, ChevronRight, HomeIcon, LayoutTemplate, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '/api/v1';
const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);

export default function ParentLMS() {
    const [childId, setChildId] = useState('');

    const { data: dashboardData, isLoading: loadingChildren } = useSWR(`${API}/dashboard/parent-home`, fetcher);
    const children = dashboardData?.children || [];

    useEffect(() => {
        if (children.length > 0 && !childId) {
            setChildId(children[0].studentProfileId);
        }
    }, [children, childId]);

    const { data: assignmentsData, isLoading: loadingAssign } = useSWR(
        childId ? `${API}/lms/student-assignments?studentProfileId=${childId}` : null,
        fetcher
    );

    const assignments = assignmentsData?.assignments || [];

    const isOverdue = (d: string) => d && new Date() > new Date(d);
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline';

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Learning Hub (LMS)</h1>
                    <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/parent" className="hover:text-blue-700 transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Assignments</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Select Child:</span>
                    <select 
                        value={childId} 
                        onChange={e => setChildId(e.target.value)} 
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm font-semibold text-blue-700"
                    >
                        {children.map((c: any) => <option key={c.studentProfileId} value={c.studentProfileId}>{c.user.name}</option>)}
                        {children.length === 0 && <option value="">No children found</option>}
                    </select>
                </div>
            </div>

            {loadingChildren || loadingAssign ? (
                <div className="text-center p-20 text-gray-400">Loading assignments...</div>
            ) : assignments.length === 0 ? (
                <Card className="p-20 text-center border border-dashed border-slate-200 bg-white">
                    <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No pending assignments for this child.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map((a: any) => {
                        const submitted = a.submissions?.length > 0;
                        const score = submitted ? a.submissions[0].score : null;
                        const overdue = !submitted && isOverdue(a.dueDate);

                        return (
                            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className={`p-5 bg-white border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md ${overdue ? 'border-red-100' : submitted ? 'border-emerald-100' : 'border-slate-100'}`}>
                                    <div className="flex gap-4 items-start">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${overdue ? 'bg-red-100 text-red-600' : submitted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-700'}`}>
                                            {submitted ? <CheckCircle2 className="w-5 h-5" /> : overdue ? <AlertCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{a.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{a.subject?.name}</p>
                                            {a.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.description}</p>}
                                            <div className="flex gap-2 mt-3 items-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${submitted ? 'bg-emerald-100 text-emerald-700' : overdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {submitted ? 'Submitted' : overdue ? 'Overdue' : 'Active'}
                                                </span>
                                                <span className="text-xs text-gray-400">Due: <span className="font-medium text-gray-600">{formatDate(a.dueDate)}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-3">
                                        {score !== null ? (
                                            <div className="text-center px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                <p className="text-[10px] text-emerald-700 font-bold uppercase mb-0.5">Score</p>
                                                <p className="text-xl font-black text-emerald-700">{score}<span className="text-sm font-medium text-emerald-500">/{a.maxScore}</span></p>
                                            </div>
                                        ) : submitted ? (
                                            <div className="text-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-medium text-xs">
                                                Awaiting<br/>Grading
                                            </div>
                                        ) : null}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
