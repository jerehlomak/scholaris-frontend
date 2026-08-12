import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { BookOpen, Plus, CalendarClock, Activity, Eye, Search, ChevronRight, Edit, Trash, Globe, Lock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api/v1';
const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);

export default function CBTManager() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, mutate } = useSWR(`${API}/cbt/exams`, fetcher);
    const exams: any[] = data?.exams || [];

    const filtered = exams.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        if (status === 'PUBLISHED') return 'bg-green-100 text-green-700';
        if (status === 'DRAFT') return 'bg-yellow-100 text-yellow-700';
        if (status === 'CONCLUDED') return 'bg-gray-100 text-gray-600';
        return 'bg-blue-100 text-blue-700';
    };

    const handleAction = async (examId: string, action: 'publish' | 'delete' | 'unpublish') => {
        try {
            if (action === 'delete') {
                if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
                await axios.delete(`${API}/cbt/exams/${examId}`, { withCredentials: true });
                toast.success('Exam deleted');
            } else {
                const status = action === 'publish' ? 'PUBLISHED' : 'DRAFT';
                await axios.patch(`${API}/cbt/exams/${examId}`, { status }, { withCredentials: true });
                toast.success(action === 'publish' ? 'Exam published' : 'Exam moved to draft');
            }
            mutate();
        } catch (error: any) {
            toast.error(error.response?.data?.msg || `Failed to ${action} exam`);
        }
    };

    return (
        <div className="space-y-6 font-dash pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">CBT Manager</h2>
                    <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                        <Link to="/teacher" className="hover:text-[#0036a1] transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>CBT Manager</span>
                    </div>
                </div>
                <Button
                    onClick={() => navigate('/teacher/cbt/create')}
                    className="flex items-center gap-2 bg-[#0036a1] hover:bg-[#001761] text-white shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Create New Exam
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: <BookOpen className="w-5 h-5" />, label: 'Total Exams', value: exams.length, color: 'bg-[#0036a1]/10 text-[#0036a1]' },
                    { icon: <Activity className="w-5 h-5" />, label: 'Published', value: exams.filter(e => e.status === 'PUBLISHED').length, color: 'bg-green-100 text-green-700' },
                    { icon: <CalendarClock className="w-5 h-5" />, label: 'Drafts', value: exams.filter(e => e.status === 'DRAFT').length, color: 'bg-yellow-100 text-yellow-700' },
                ].map((k, i) => (
                    <Card key={i} className="p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>{k.icon}</div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Exam Table */}
            <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900">My Exams</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0036a1]"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">Loading exams...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3">Title</th>
                                    <th className="px-5 py-3">Class</th>
                                    <th className="px-5 py-3">Subject</th>
                                    <th className="px-5 py-3">Questions</th>
                                    <th className="px-5 py-3">Duration</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                                            No exams found. Click "Create New Exam" to get started.
                                        </td>
                                    </tr>
                                ) : filtered.map(exam => (
                                    <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 font-semibold text-gray-900">{exam.title}</td>
                                        <td className="px-5 py-3 text-gray-600">{exam.class?.name}</td>
                                        <td className="px-5 py-3 text-gray-600">{exam.subject?.name}</td>
                                        <td className="px-5 py-3 text-center">{exam._count?.examQuestions ?? 0}</td>
                                        <td className="px-5 py-3 text-gray-600">{exam.durationMinutes} min</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(exam.status)}`}>
                                                {exam.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="ghost" title="View Results" onClick={() => navigate(`/teacher/cbt/results/${exam.id}`)} className="h-8 w-8 p-0 text-gray-500 hover:text-[#0036a1]">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" title="Edit Exam" onClick={() => navigate(`/teacher/cbt/edit/${exam.id}`)} className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {exam.status === 'DRAFT' ? (
                                                    <Button size="sm" variant="ghost" title="Publish" onClick={() => handleAction(exam.id, 'publish')} className="h-8 w-8 p-0 text-gray-500 hover:text-green-600">
                                                        <Globe className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="ghost" title="Unpublish (Save as Draft)" onClick={() => handleAction(exam.id, 'unpublish')} className="h-8 w-8 p-0 text-gray-500 hover:text-yellow-600">
                                                        <Lock className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" title="Delete" onClick={() => handleAction(exam.id, 'delete')} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600">
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
