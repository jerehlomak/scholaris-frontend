import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { BookOpen, AlertTriangle, Clock, CheckCircle2, ChevronRight, HomeIcon } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '/api/v1';
const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);

export default function ParentCBT() {
    const [childId, setChildId] = useState('');

    const { data: dashboardData, isLoading: loadingChildren } = useSWR(`${API}/dashboard/parent-home`, fetcher);
    const children = dashboardData?.children || [];

    useEffect(() => {
        if (children.length > 0 && !childId) {
            setChildId(children[0].studentProfileId);
        }
    }, [children, childId]);

    const { data: resultsData, isLoading: loadingResults } = useSWR(
        childId ? `${API}/cbt/student-results?studentProfileId=${childId}` : null,
        fetcher
    );

    const results = resultsData?.results || [];

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CBT Assessments</h1>
                    <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/parent" className="hover:text-blue-700 transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>CBT Results</span>
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

            {loadingChildren || loadingResults ? (
                <div className="text-center p-20 text-gray-400">Loading records...</div>
            ) : results.length === 0 ? (
                <Card className="p-20 text-center border border-dashed border-slate-200 bg-white">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No CBT assessment results found for this child.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((r: any) => {
                        const passed = r.totalScore >= (r.exam.passingMarks || 40);
                        return (
                            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="bg-white border text-center p-6 border-slate-100 shadow-sm transition-all hover:shadow-md">
                                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {passed ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                    </span>
                                    <h3 className="font-bold text-slate-900 line-clamp-1">{r.exam.title}</h3>
                                    <p className="text-xs text-slate-500 mb-4">{r.exam.subject?.name}</p>
                                    
                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                                        <div className="text-3xl font-black text-slate-900">
                                            {r.totalScore}
                                            <span className="text-lg font-normal text-slate-400 ml-1">/ 100</span>
                                        </div>
                                        <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {passed ? 'PASSED' : 'FAILED'}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium px-2">
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.exam.durationMinutes}m test</span>
                                        <span>Taken: {new Date(r.createdAt).toLocaleDateString()}</span>
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
