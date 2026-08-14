import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Clock, BookOpen, CheckCircle2, AlertTriangle, ChevronRight, History, PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '/api/v1';
const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);

type Screen = 'list' | 'exam';
type Tab = 'available' | 'results';

export default function StudentCBT() {
    const [screen, setScreen] = useState<Screen>('list');
    const [tab, setTab] = useState<Tab>('available');
    const [activeExam, setActiveExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch Exams & Results
    const { data: examsData, mutate: mutateExams } = useSWR(`${API}/cbt/exams`, fetcher);
    const { data: resultsData, mutate: mutateResults } = useSWR(`${API}/cbt/student-results`, fetcher);

    const exams: any[] = (examsData?.exams || []).filter((e: any) => e.status === 'PUBLISHED');
    const pastResults: any[] = resultsData?.results || [];

    const isCompleted = (examId: string) => pastResults.some(r => r.examId === examId);

    const startExam = async (exam: any) => {
        if (isCompleted(exam.id)) {
            toast.error('You have already completed this exam.');
            return;
        }
        try {
            // Fetch fresh exam details (specifically questions)
            const { data } = await axios.get(`${API}/cbt/exams/${exam.id}`, { withCredentials: true });
            setActiveExam(data.exam);
            setAnswers({});
            setCurrentQ(0);
            setTimeLeft(data.exam.durationMinutes * 60);
            setScreen('exam');
        } catch {
            toast.error('Failed to load exam details');
        }
    };

    // Countdown timer
    useEffect(() => {
        if (screen !== 'exam') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { 
                    if (timerRef.current) clearInterval(timerRef.current); 
                    handleSubmit(true); 
                    return 0; 
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [screen]);

    const handleSubmit = async (auto = false) => {
        if (!activeExam) return;
        setSubmitting(true);
        try {
            const { data: res } = await axios.post(`${API}/cbt/exams/${activeExam.id}/submit`, { answers }, { withCredentials: true });
            setResult(res);
            if (timerRef.current) clearInterval(timerRef.current);
            mutateResults();
            mutateExams();
            if (auto) toast.success('Time up! Exam auto-submitted.');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const pct = activeExam ? (timeLeft / (activeExam.durationMinutes * 60)) * 100 : 100;

    // ── Result Screen ────────────────────────────────────────────────────────
    if (result) {
        const passed = result.score >= (activeExam?.passingMarks || 40);
        return (
            <div className="max-w-lg mx-auto py-20 text-center font-dash space-y-6">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-24 h-24 mx-auto rounded-xl flex items-center justify-center text-4xl shadow-xl ${passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {passed ? '🎉' : '😢'}
                </motion.div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{passed ? 'Congratulations!' : 'Better luck next time!'}</h2>
                    <p className="text-gray-500 font-medium mt-1">{activeExam?.title}</p>
                </div>
                <Card className="p-10 border border-gray-100 shadow-2xl rounded-[2.5rem] bg-white relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 ${passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <p className="text-7xl font-black text-gray-900 tracking-tighter">{result.score}<span className="text-3xl text-gray-400 font-normal ml-1">%</span></p>
                    <p className={`mt-4 text-xs font-black tracking-[0.2em] uppercase ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                        {passed ? 'Assessment Passed' : 'Assessment Failed'}
                    </p>
                </Card>
                <div className="flex flex-col gap-3 pt-6">
                    <Button onClick={() => { setScreen('list'); setResult(null); setActiveExam(null); setTab('results'); }} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white h-14 rounded-2xl font-black shadow-lg shadow-[#1E4DA6]/20 transition-all active:scale-95">
                        View Results History
                    </Button>
                    <Button variant="ghost" onClick={() => { setScreen('list'); setResult(null); setActiveExam(null); setTab('available'); }} className="text-slate-400 font-bold hover:text-slate-600">
                        Back to Exams
                    </Button>
                </div>
            </div>
        );
    }

    // ── Active Exam Screen ───────────────────────────────────────────────────
    if (screen === 'exam' && activeExam) {
        const questions = activeExam.examQuestions || [];
        const q = questions[currentQ]?.question;
        const options: string[] = q?.options || [];
        const letters = ['A', 'B', 'C', 'D'];
        const answeredCount = Object.keys(answers).length;

        return (
            <div className="max-w-4xl mx-auto font-dash pb-20 px-4">
                {/* Timer Bar */}
                <div className={`sticky top-0 z-50 bg-white/90 border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4 transition-all rounded-b-3xl shadow-sm ${timeLeft < 60 ? 'border-red-200 bg-red-50/90' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <p className="font-black text-gray-900 text-lg leading-none">{activeExam.title}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{answeredCount} of {questions.length} answered</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`flex items-center gap-2 font-mono font-black text-3xl ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#1E4DA6]'}`}>
                            <Clock className="w-7 h-7" /> {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
                
                <div className="h-2 bg-gray-50 flex mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E4DA6] transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(0,54,161,0.5)]" style={{ width: `${pct}%` }} />
                </div>

                <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Navigation Panel */}
                    <div className="lg:col-span-3 space-y-4">
                        <Card className="p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Questions Navigation</h4>
                             <div className="grid grid-cols-4 gap-2">
                                {questions.map((_: any, i: number) => (
                                    <button key={i} onClick={() => setCurrentQ(i)}
                                        className={`h-11 rounded-xl text-xs font-black transition-all transform hover:scale-110 active:scale-90 border-2 ${i === currentQ ? 'bg-[#1E4DA6] text-white border-[#1E4DA6] shadow-lg shadow-[#1E4DA6]/20' : answers[questions[i]?.question?.id] ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </Card>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                             <p className="text-[10px] text-amber-700 font-black flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" /> WARNING
                             </p>
                             <p className="text-[10px] text-amber-600 font-medium mt-1">Do not refresh or close this page. Your progress will be lost if you do.</p>
                        </div>
                    </div>

                    {/* Right: Question Area */}
                    <div className="lg:col-span-9 space-y-8">
                        {q ? (
                            <AnimatePresence mode="wait">
                                <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                                    <Card className="p-10 bg-[#173F8C] text-white rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-[#173F8C]/10">
                                         <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <BookOpen className="w-32 h-32" />
                                         </div>
                                         <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-[0.2em] text-white/90">Question {currentQ + 1} of {questions.length}</span>
                                         <h3 className="font-bold mt-8 text-2xl leading-relaxed">{q.questionText}</h3>
                                         <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                                         </div>
                                    </Card>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {options.map((opt: string, i: number) => {
                                            const selected = answers[q.id] === letters[i];
                                            return (
                                                <button key={i} onClick={() => setAnswers(a => ({ ...a, [q.id]: letters[i] }))}
                                                    className={`group w-full flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all text-left ${selected ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 ring-4 ring-[#1E4DA6]/5' : 'border-slate-50 hover:border-slate-200 bg-white shadow-sm'}`}>
                                                    <span className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0 transition-all ${selected ? 'bg-[#1E4DA6] text-white rotate-6' : 'bg-slate-100 text-slate-500 group-hover:bg-[#1E4DA6]/5 group-hover:text-[#1E4DA6]'}`}>{letters[i]}</span>
                                                    <span className={`text-lg font-bold transition-colors ${selected ? 'text-slate-900' : 'text-slate-600'}`}>{opt}</span>
                                                    {selected && <CheckCircle2 className="w-6 h-6 text-[#1E4DA6] ml-auto shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="p-24 text-center">
                                <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-200" />
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center pt-10 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-[#1E4DA6]">
                                 Back
                            </Button>
                            {currentQ < questions.length - 1
                                ? <Button onClick={() => setCurrentQ(q => q + 1)} className="bg-gray-900 hover:bg-black text-white px-12 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
                                    Next Question
                                  </Button>
                                : <Button onClick={() => handleSubmit(false)} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-3 px-12 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    {submitting ? 'Submitting...' : 'Finish Attempt'}
                                </Button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Exam List Screen ─────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <span className="text-[10px] font-black text-[#1E4DA6] bg-[#1E4DA6]/5 px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-3 inline-block">Assessment Hub</span>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">CBT Exam Center</h1>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2 mt-2">
                        <Link to="/student" className="hover:text-[#1E4DA6] transition-colors">Home</Link>
                        <ChevronRight size={10} className="opacity-50" />
                        <span>Available Assessments</span>
                    </div>
                </div>
                
                <div className="bg-slate-100 p-2 rounded-3xl flex gap-1 w-full md:w-auto">
                    <button 
                        onClick={() => setTab('available')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${tab === 'available' ? 'bg-white text-[#173F8C] shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        <PlayCircle className="w-4 h-4" /> Available
                    </button>
                    <button 
                        onClick={() => setTab('results')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${tab === 'results' ? 'bg-white text-[#173F8C] shadow-xl shadow-slate-200/50 scale-105' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        <History className="w-4 h-4" /> Results
                    </button>
                </div>
            </div>

            {tab === 'available' ? (
                <div className="space-y-8">
                    {exams.length === 0 ? (
                        <Card className="p-32 text-center border-[6px] border-dashed border-gray-50 bg-gray-50/20 rounded-[4rem]">
                            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-100">
                                <BookOpen className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-300 tracking-tight">No Active Exams</h3>
                            <p className="text-sm text-gray-400 mt-2 font-medium max-w-xs mx-auto">Your instructors haven't scheduled any online assessments for your current class yet.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {exams.map(exam => {
                                const completed = isCompleted(exam.id);
                                return (
                                    <motion.div key={exam.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="p-8 bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col rounded-[2.5rem] group relative overflow-hidden group">
                                            {completed && (
                                                <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30 z-10">
                                                    <CheckCircle2 size={12} /> Passed
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-5 mb-8">
                                                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 ${completed ? 'bg-emerald-100 text-emerald-600' : 'bg-[#1E4DA6]/5 text-[#1E4DA6] group-hover:bg-[#1E4DA6] group-hover:text-white group-hover:rotate-6'}`}>
                                                    <BookOpen className="w-7 h-7" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 text-xl leading-tight group-hover:text-[#1E4DA6] transition-colors truncate">{exam.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{exam.subject?.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-10">
                                                <div className="bg-gray-50 rounded-3xl p-4 border border-gray-50">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Time Limit</p>
                                                    <p className="text-sm font-black text-gray-900 mt-1">{exam.durationMinutes} Mins</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-3xl p-4 border border-gray-50">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Pass Mark</p>
                                                    <p className="text-sm font-black text-gray-900 mt-1">{exam.passingMarks}%</p>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <Button 
                                                    onClick={() => startExam(exam)} 
                                                    disabled={completed}
                                                    className={`w-full text-xs h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all ${completed ? 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none border border-slate-100' : 'bg-slate-900 hover:bg-[#1E4DA6] text-white hover:shadow-[#1E4DA6]/20 scale-100 active:scale-95'}`}
                                                >
                                                    {completed ? 'Assessment Complete' : 'Begin Assessment'}
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {pastResults.length === 0 ? (
                        <Card className="p-32 text-center border-[6px] border-dashed border-gray-50 bg-gray-50/20 rounded-[4rem]">
                             <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-100">
                                <History className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-300 tracking-tight">No History Found</h3>
                            <p className="text-sm text-gray-400 mt-2 font-medium max-w-xs mx-auto">Complete your first exam to see your grade analysis and performance metrics here.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {pastResults.map(res => {
                                const passed = res.totalScore >= (res.exam?.passingMarks || 40);
                                return (
                                    <motion.div key={res.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem] flex flex-col h-full group hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 transition-transform duration-700 group-hover:scale-150 ${passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            
                                            <div className="flex justify-between items-center mb-8 relative z-10">
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {passed ? 'Passed' : 'Failed'}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full uppercase tracking-tighter">{new Date(res.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <h3 className="font-black text-slate-900 text-2xl mb-1 tracking-tight group-hover:text-[#1E4DA6] transition-colors">{res.exam?.title}</h3>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-10">{res.exam?.subject?.name}</p>
                                            
                                            <div className={`mt-auto p-10 text-center rounded-[2rem] border transition-all duration-500 ${passed ? 'bg-emerald-50 border-emerald-100 group-hover:bg-emerald-500 group-hover:border-emerald-500' : 'bg-red-50 border-red-100 group-hover:bg-red-500 group-hover:border-red-500'}`}>
                                                <p className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${passed ? 'text-emerald-600 group-hover:text-white' : 'text-red-600 group-hover:text-white'}`}>
                                                    {res.totalScore}<span className="text-2xl font-normal opacity-60 ml-1">%</span>
                                                </p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 transition-colors duration-500 ${passed ? 'text-emerald-500 group-hover:text-emerald-100' : 'text-red-400 group-hover:text-red-100'}`}>Cumulative Grade</p>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
