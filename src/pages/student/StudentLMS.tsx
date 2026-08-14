import useSWR from 'swr';
import axios from 'axios';
import { useState } from 'react';
import { BookOpen, Upload, Clock, CheckCircle2, ChevronRight, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '/api/v1';
const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);

type Tab = 'assignments' | 'resources';

export default function StudentLMS() {
    const [tab, setTab] = useState<Tab>('assignments');
    const [submitting, setSubmitting] = useState<string>('');

    const { data: assignData, mutate: mutateAssign } = useSWR(`${API}/lms/assignments`, fetcher);
    const { data: lessonData } = useSWR(`${API}/lms/lessons`, fetcher);

    const assignments: any[] = assignData?.assignments || [];
    const lessons: any[] = lessonData?.lessons || [];

    const isOverdue = (d: string) => d && new Date() > new Date(d);
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline';

    const handleSubmit = async (assignmentId: string) => {
        setSubmitting(assignmentId);
        try {
            // In a real app this would attach a file. For now, submit a placeholder.
            await axios.post(`${API}/lms/assignments/${assignmentId}/submit`,
                { attachedFiles: [{ name: 'submission.pdf', note: 'Submitted from portal' }] },
                { withCredentials: true }
            );
            toast.success('Assignment submitted!');
            mutateAssign();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Submission failed');
        } finally {
            setSubmitting('');
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Learning Hub (LMS)</h1>
                <div className="flex items-center text-xs text-slate-400 gap-1 mt-1">
                    <Link to="/student" className="hover:text-[#1E4DA6] transition-colors">Home</Link>
                    <ChevronRight size={12} className="opacity-50" />
                    <span>LMS</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { icon: <BookOpen className="w-5 h-5" />, label: 'Assignments', value: assignments.length, color: 'bg-[#1E4DA6]/5 text-[#1E4DA6]' },
                    { icon: <AlertTriangle className="w-5 h-5" />, label: 'Overdue', value: assignments.filter((a: any) => isOverdue(a.dueDate)).length, color: 'bg-red-100 text-red-600' },
                    { icon: <Clock className="w-5 h-5" />, label: 'Due Soon', value: assignments.filter((a: any) => a.dueDate && !isOverdue(a.dueDate)).length, color: 'bg-yellow-100 text-yellow-600' },
                    { icon: <Upload className="w-5 h-5" />, label: 'Resources', value: lessons.length, color: 'bg-[#1E4DA6]/10 text-[#1E4DA6]' },
                ].map((k, i) => (
                    <Card key={i} className="p-4 bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>{k.icon}</div>
                        <div>
                            <p className="text-xs text-slate-500">{k.label}</p>
                            <p className="text-xl font-bold text-slate-900">{k.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
                {([['assignments', 'Assignments'], ['resources', 'Study Materials']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-[#1E4DA6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Assignments */}
            {tab === 'assignments' && (
                <div className="space-y-3">
                    {assignments.length === 0 ? (
                        <Card className="p-20 border border-dashed border-slate-200 text-center">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400">No assignments posted yet.</p>
                        </Card>
                    ) : assignments.map((a: any) => (
                        <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className={`p-5 bg-white border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isOverdue(a.dueDate) ? 'border-red-100' : 'border-slate-100'}`}>
                                <div className="flex gap-4 items-start">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue(a.dueDate) ? 'bg-red-100 text-red-600' : 'bg-[#1E4DA6]/5 text-[#1E4DA6]'}`}>
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{a.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{a.class?.name} · {a.subject?.name}</p>
                                        {a.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.description}</p>}
                                        <div className="flex gap-2 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isOverdue(a.dueDate) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {isOverdue(a.dueDate) ? '⚠ Overdue' : '✓ Active'}
                                            </span>
                                            <span className="text-xs text-slate-400 py-0.5">Due: {formatDate(a.dueDate)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <Button
                                        size="sm"
                                        onClick={() => handleSubmit(a.id)}
                                        disabled={submitting === a.id || !!isOverdue(a.dueDate)}
                                        className={`gap-1 text-xs ${isOverdue(a.dueDate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#1E4DA6] text-white'}`}
                                    >
                                        {submitting === a.id ? (
                                            <span className="animate-pulse">Submitting...</span>
                                        ) : (
                                            <><CheckCircle2 className="w-3 h-3" /> Submit Work</>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Resources */}
            {tab === 'resources' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lessons.length === 0 ? (
                        <div className="col-span-3">
                            <Card className="p-20 border border-dashed border-slate-200 text-center">
                                <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400">No study materials uploaded yet.</p>
                            </Card>
                        </div>
                    ) : lessons.map((l: any) => (
                        <Card key={l.id} className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#1E4DA6]/10 text-[#1E4DA6] flex items-center justify-center shrink-0">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{l.title}</p>
                                    <p className="text-xs text-slate-500">{l.subject?.name} · <span className="uppercase font-mono text-[10px]">{l.type}</span></p>
                                </div>
                            </div>
                            {l.description && <p className="text-xs text-slate-500 line-clamp-2">{l.description}</p>}
                            {l.fileUrl && (
                                <a href={l.fileUrl} target="_blank" rel="noreferrer" className="block">
                                    <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                                        <Eye className="w-3 h-3" /> Open Material
                                    </Button>
                                </a>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
