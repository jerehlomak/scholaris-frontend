import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarClock, Trophy, CheckCircle2, Play, Search } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useCBT } from '../../../context/CBTContext';

export default function StudentExams() {
    const { getExamsForStudent, getResultsByStudent } = useCBT();
    const navigate = useNavigate();

    // In a real app we'd get this from an AuthContext
    const currentStudentId = 'student-1';
    const currentClassLevel = 'SS 1'; // E.g. Senior Secondary 1

    const availableExams = getExamsForStudent(currentClassLevel);
    const myResults = getResultsByStudent(currentStudentId);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredExams = availableExams.filter(exam =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helpers
    const hasTakenExam = (examId: string) => myResults.some(r => r.examId === examId);
    const getResultForExam = (examId: string) => myResults.find(r => r.examId === examId);

    const activeExamsCount = availableExams.filter(e => e.status === 'active' && !hasTakenExam(e.id)).length;
    const scheduledExamsCount = availableExams.filter(e => e.status === 'scheduled').length;

    return (
        <div className="space-y-6 font-dash pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">CBT Assessments</h2>
                    <p className="text-sm text-gray-500 mt-1">Take scheduled tests and review your performance history.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-[#6bc048]/10 flex items-center justify-center text-[#6bc048] transition-transform hover:scale-110">
                        <Play className="w-6 h-6 ml-1" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Available Now</p>
                        <h4 className="text-2xl font-bold text-gray-900">{activeExamsCount}</h4>
                    </div>
                </Card>
                <Card className="p-6 bg-white border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-[#ff9800]/10 flex items-center justify-center text-[#ff9800] transition-transform hover:scale-110">
                        <CalendarClock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Upcoming Tests</p>
                        <h4 className="text-2xl font-bold text-gray-900">{scheduledExamsCount}</h4>
                    </div>
                </Card>
                <Card className="p-6 bg-white border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-[#0036a1]/10 flex items-center justify-center text-[#0036a1] transition-transform hover:scale-110">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Completed</p>
                        <h4 className="text-2xl font-bold text-gray-900">{myResults.length}</h4>
                    </div>
                </Card>
            </div>

            {/* Assessment Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-none">

                {/* Left Col: Available / Pending Exams */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#1e2230]">My Assessments</h3>
                        <div className="relative w-48">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0036a1]/20 focus:border-[#0036a1] bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {filteredExams.length === 0 ? (
                        <Card className="p-12 text-center text-gray-500 bg-white border border-gray-100 border-dashed">
                            No assessments found for {currentClassLevel}.
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredExams.map(exam => {
                                const taken = hasTakenExam(exam.id);
                                const result = getResultForExam(exam.id);
                                const isReady = exam.status === 'active';

                                return (
                                    <Card key={exam.id} className="p-5 bg-white border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                        {/* Status Accent Left Border */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${taken ? 'bg-[#ff9800]' : isReady ? 'bg-[#6bc048]' : 'bg-[#0036a1]'}`} />

                                        <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-4 pl-2">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${taken ? 'bg-[#ff9800]/10 text-[#ff9800]' : isReady ? 'bg-[#6bc048]/10 text-[#6bc048]' : 'bg-[#0036a1]/10 text-[#0036a1]'}`}>
                                                    {taken ? <CheckCircle2 className="w-6 h-6" /> : isReady ? <Play className="w-6 h-6 ml-1" /> : <CalendarClock className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${taken ? 'bg-[#ff9800]/10 text-[#ff9800]' : isReady ? 'bg-[#6bc048]/10 text-[#6bc048]' : 'bg-[#0036a1]/10 text-[#0036a1]'}`}>
                                                            {taken ? 'Completed' : isReady ? 'Active Now' : 'Scheduled'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-500">{exam.subject}</span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900">{exam.title}</h4>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {exam.questions.length || 0} Questions</span>
                                                        <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> {exam.durationMinutes} Minutes</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center sm:justify-end shrink-0">
                                                {taken ? (
                                                    <div className="text-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your Score</p>
                                                        <p className={`text-xl font-bold ${(result?.percentage || 0) >= 50 ? 'text-[#6bc048]' : 'text-red-500'}`}>
                                                            {result?.percentage}%
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        disabled={!isReady}
                                                        onClick={() => navigate(`/student/cbt/take/${exam.id}`)}
                                                        className={`w-full sm:w-auto shadow-sm ${isReady ? 'bg-[#6bc048] hover:bg-[#5aa33c] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        {isReady ? 'Start Examination' : 'Waiting for Teacher...'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Right Col: Leaderboard / Instructions */}
                <div className="space-y-6">
                    <Card className="p-6 bg-[#0036a1] text-white overflow-hidden relative">
                        {/* Decorative circle */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                        <h3 className="font-bold text-lg mb-4 justify-between flex items-center gap-2 relative z-10">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[#ff9800]" /> Testing Rules
                            </div>
                        </h3>
                        <ul className="space-y-3 text-sm text-blue-100 relative z-10">
                            <li className="flex gap-2">
                                <span className="font-bold text-[#ff9800]">•</span>
                                Exams must be completed in one sitting.
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-[#ff9800]">•</span>
                                Do not refresh the page during an active test.
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-[#ff9800]">•</span>
                                Submissions are automatic when the timer expires.
                            </li>
                        </ul>
                    </Card>

                    <Card className="p-5 bg-white border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4 text-[#ff9800]" /> Recent Scores
                        </h3>
                        {myResults.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No exams completed yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {myResults.slice(0, 4).map(res => {
                                    // Find exam title safely from memory
                                    const exam = getExamsForStudent(currentClassLevel).find(e => e.id === res.examId);
                                    return (
                                        <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                            <div className="truncate pr-4">
                                                <p className="text-sm font-bold text-gray-900 truncate">{exam?.title || 'Unknown Exam'}</p>
                                                <p className="text-xs text-gray-500">{new Date(res.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${res.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {res.percentage}%
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
}
