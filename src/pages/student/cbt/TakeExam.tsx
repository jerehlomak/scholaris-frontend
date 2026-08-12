import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useCBT } from '../../../context/CBTContext';
import type { StudentResult } from '../../../types/cbt';

export default function TakeExam() {
    const { id: examId } = useParams();
    const navigate = useNavigate();
    const { exams, submitResult } = useCBT();

    // Mock Student Auth
    const currentStudentId = 'student-1';
    const currentStudentName = 'Ayomide Balogun';

    const exam = exams.find(e => e.id === examId);

    // State
    const [started, setStarted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize Timer
    useEffect(() => {
        if (exam && !started) {
            setTimeLeftSeconds(exam.durationMinutes * 60);
        }
    }, [exam, started]);

    // Timer Countdown Logic
    useEffect(() => {
        let interval: any;
        if (started && timeLeftSeconds > 0) {
            interval = setInterval(() => {
                setTimeLeftSeconds((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [started, timeLeftSeconds]);

    // Format Time (MM:SS)
    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (questionId: string, selectedOption: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    // Grade and Submit Logic
    const calculateScoreAndSubmit = () => {
        if (!exam) return;
        setIsSubmitting(true);

        let correctCount = 0;
        exam.questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        const percentage = Math.round((correctCount / exam.questions.length) * 100);

        const result: StudentResult = {
            id: crypto.randomUUID(),
            examId: exam.id,
            studentId: currentStudentId,
            studentName: currentStudentName,
            score: correctCount,
            percentage,
            submittedAt: new Date().toISOString(),
            answers
        };

        // Complete the loop
        submitResult(result);

        setTimeout(() => {
            navigate('/student/cbt');
        }, 1500);
    };

    const handleAutoSubmit = () => {
        alert("Time is up! Submitting your answers automatically.");
        calculateScoreAndSubmit();
    };

    const handleManualSubmit = () => {
        const unanswered = exam?.questions.length! - Object.keys(answers).length;
        if (unanswered > 0) {
            const confirm = window.confirm(`You still have ${unanswered} unanswered questions. Are you sure you want to submit?`);
            if (!confirm) return;
        }
        calculateScoreAndSubmit();
    };

    // --- Loading / Invalid States ---
    if (!exam) {
        return <div className="p-10 text-center">Exam not found or has been deleted.</div>;
    }
    if (exam.status !== 'active') {
        return <div className="p-10 text-center text-red-500">This assessment is currently locked by the teacher.</div>;
    }

    // --- Pre-Start Screen ---
    if (!started) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pt-10 font-dash">
                <Card className="p-8 bg-white border border-gray-100 text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#0036a1]" />
                    <div className="w-20 h-20 bg-[#0036a1]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-10 h-10 text-[#0036a1]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{exam.title}</h2>
                        <p className="text-sm text-gray-500 mt-2 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">
                            {exam.subject} • {exam.classLevel}
                        </p>
                    </div>

                    <div className="flex justify-center gap-8 py-6 border-y border-gray-50">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Time Limit</p>
                            <p className="text-xl font-bold text-gray-900">{exam.durationMinutes} Minutes</p>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Questions</p>
                            <p className="text-xl font-bold text-gray-900">{exam.questions.length}</p>
                        </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                            <p className="font-bold mb-1">Testing Rules:</p>
                            <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                                <li>The timer cannot be paused once started.</li>
                                <li>Do not refresh or leave this page, or answers may be lost.</li>
                                <li>The test will automatically submit when time expires.</li>
                            </ul>
                        </div>
                    </div>

                    <Button
                        onClick={() => setStarted(true)}
                        className="w-full h-12 text-lg font-bold bg-[#6bc048] hover:bg-[#5aa33c] text-white shadow-md shadow-[#6bc048]/20"
                    >
                        I am ready, Start Exam
                    </Button>
                </Card>
            </div>
        );
    }

    // --- Active Testing View ---
    const currentQ = exam.questions[currentQuestionIdx];
    const isWarningTime = timeLeftSeconds <= 60; // Under 1 minute

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-4 font-dash pb-20">
            {/* Strict Exam Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between sticky top-[72px] z-30">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg border ${isWarningTime ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-[#0036a1] border-blue-100'}`}>
                        <Timer className="w-5 h-5" />
                        <span className="font-mono tracking-wider">{formatTime(timeLeftSeconds)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500">
                        {Object.keys(answers).length} / {exam.questions.length} Answered
                    </span>
                    <Button
                        onClick={handleManualSubmit}
                        disabled={isSubmitting}
                        className="bg-[#0036a1] hover:bg-[#001761] text-white"
                    >
                        {isSubmitting ? 'Grading...' : 'Submit Test'}
                    </Button>
                </div>
            </div>

            {/* Question Card */}
            <Card className="bg-white border-2 border-gray-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0036a1]" />

                <div className="p-8 sm:p-10 pl-12">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Question {currentQuestionIdx + 1} of {exam.questions.length}
                    </h3>

                    <p className="text-xl sm:text-2xl font-medium text-[#1e2230] leading-snug mb-10">
                        {currentQ.text}
                    </p>

                    <div className="space-y-3">
                        {currentQ.options.map((option, idx) => {
                            const isSelected = answers[currentQ.id] === option;
                            // Map index to letter A, B, C, D
                            const letter = String.fromCharCode(65 + idx);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(currentQ.id, option)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all group ${isSelected
                                        ? 'border-[#0036a1] bg-blue-50/50'
                                        : 'border-gray-100 bg-white hover:border-[#0036a1]/30 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold transition-colors ${isSelected ? 'bg-[#0036a1] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                        }`}>
                                        {letter}
                                    </div>
                                    <span className={`text-base font-medium ${isSelected ? 'text-[#0036a1]' : 'text-gray-700'}`}>
                                        {option}
                                    </span>
                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-[#0036a1] ml-auto" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Question Navigation */}
                <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-100">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIdx(p => Math.max(0, p - 1))}
                        disabled={currentQuestionIdx === 0}
                        className="text-gray-600 bg-white"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>

                    <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto px-4 max-w-sm">
                        {exam.questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIdx(idx)}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center shrink-0 ${currentQuestionIdx === idx
                                    ? 'ring-2 ring-offset-2 ring-[#0036a1] bg-[#0036a1] text-white'
                                    : answers[q.id]
                                        ? 'bg-blue-100 text-[#0036a1] hover:bg-blue-200'
                                        : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIdx(p => Math.min(exam.questions.length - 1, p + 1))}
                        disabled={currentQuestionIdx === exam.questions.length - 1}
                        className="text-gray-600 bg-white"
                    >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
