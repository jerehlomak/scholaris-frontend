import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { useCBT } from '../../../context/CBTContext';
import { BookOpen, Users, Trophy, Activity, CalendarClock, Play } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function AdminCBTOverview() {
    const { exams, results } = useCBT();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Aggregate Stats
    const totalExams = exams.length;
    const activeExams = exams.filter(e => e.status === 'active').length;
    const totalSubmissions = results.length;

    // Calculate Average Score across entire school
    const avgScore = totalSubmissions > 0
        ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubmissions)
        : 0;

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-[#0036a1]/10 text-[#0036a1]';
            case 'active': return 'bg-[#6bc048]/10 text-[#6bc048]';
            case 'completed': return 'bg-[#ff9800]/10 text-[#ff9800]';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6 font-dash pb-10">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">CBT Overview Panel</h2>
                <p className="text-sm text-gray-500 mt-1">Global administrative view of all Computer Based Tests and student performances.</p>
            </div>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0036a1]/10 flex items-center justify-center text-[#0036a1]">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Exams Created</p>
                        <h4 className="text-2xl font-bold text-gray-900">{totalExams}</h4>
                    </div>
                </Card>
                <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#6bc048]/10 flex items-center justify-center text-[#6bc048]">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Right Now</p>
                        <h4 className="text-2xl font-bold text-gray-900">{activeExams}</h4>
                    </div>
                </Card>
                <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                        <h4 className="text-2xl font-bold text-gray-900">{totalSubmissions}</h4>
                    </div>
                </Card>
                <Card className="p-6 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ff9800]/10 flex items-center justify-center text-[#ff9800]">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">School Avg. Score</p>
                        <h4 className="text-2xl font-bold text-gray-900">{avgScore}%</h4>
                    </div>
                </Card>
            </div>

            {/* Main Table Area */}
            <Card className="bg-white border-none shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-[#1e2230]">All School Assessments</h3>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0036a1] bg-white cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search Title or Subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0036a1]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Title & Info</th>
                                <th className="px-6 py-4">Questions</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Completion</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredExams.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No exams matching those filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredExams.map((exam) => {
                                    // Calculate metrics for this specific row
                                    const examResults = results.filter(r => r.examId === exam.id);
                                    // Assuming ~20 students per section for mock purposes
                                    const completionRate = Math.min(Math.round((examResults.length / 20) * 100), 100);

                                    return (
                                        <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{exam.title}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">
                                                        {exam.subject} • {exam.classLevel}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {exam.questions.length || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {exam.durationMinutes} mins
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${getStatusColor(exam.status)}`}>
                                                    {exam.status === 'scheduled' && <CalendarClock className="w-3 h-3 mr-1" />}
                                                    {exam.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                                                    {exam.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${completionRate === 100 ? 'bg-[#6bc048]' : 'bg-[#0036a1]'}`}
                                                            style={{ width: `${completionRate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600">{completionRate}%</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-1">{examResults.length} Submissions</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#0036a1] hover:bg-[#0036a1]/5">
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Performance Overview (Placeholder visual for Admin) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <Card className="p-6 bg-white border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[250px]">
                    <div className="absolute right-0 bottom-0 text-gray-50 opacity-50 transform translate-x-10 translate-y-10">
                        <Activity className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-[#1e2230] mb-2">School Wide Performance Trend</h3>
                        <p className="text-sm text-gray-500 max-w-sm">Average test scores have increased by 4.2% since implementing the AI CBT Engine last week.</p>
                    </div>
                    <div className="relative z-10 space-y-3 mt-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-gray-700">Senior Secondary 3</span>
                            <span className="font-bold text-[#6bc048]">78% Avg</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="w-[78%] h-full bg-[#6bc048]" /></div>

                        <div className="flex items-center justify-between text-sm pt-2">
                            <span className="font-bold text-gray-700">Senior Secondary 1</span>
                            <span className="font-bold text-[#ff9800]">62% Avg</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="w-[62%] h-full bg-[#ff9800]" /></div>
                    </div>
                </Card>

                <Card className="bg-[#1e2230] text-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Trophy className="w-8 h-8 text-[#ff9800]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Generate Insights Report</h3>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">Ask Skooly AI to analyze all CBT records and flag topics where students are struggling.</p>
                        <Button className="bg-[#ff9800] hover:bg-[#e68a00] text-white font-bold px-8">
                            Synthesize Report
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
