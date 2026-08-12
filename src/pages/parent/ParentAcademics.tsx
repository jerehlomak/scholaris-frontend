/**
 * ParentAcademics.tsx — Parent view of child's subjects, timetable & progress
 */
import { useState, useEffect } from 'react';
import { Home as HomeIcon, ChevronRight, BookOpen, Loader2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

interface Subject {
    id: string;
    name: string;
    teacher: string;
    code: string;
    category: string;
    progress: number;
}

interface Student {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    subjects: Subject[];
    progress: number;
}

const TIMETABLE: Record<string, { subject: string; time: string }[]> = {
    Monday: [{ subject: 'Mathematics', time: '8–9 AM' }, { subject: 'English Language', time: '10–11 AM' }, { subject: 'Biology', time: '12–1 PM' }],
    Tuesday: [{ subject: 'Physics', time: '8–9 AM' }, { subject: 'Chemistry', time: '10–11 AM' }],
    Wednesday: [{ subject: 'Mathematics', time: '8–9 AM' }, { subject: 'English Language', time: '11–12 PM' }],
    Thursday: [{ subject: 'Biology', time: '9–10 AM' }, { subject: 'Physics', time: '11–12 PM' }],
    Friday: [{ subject: 'Chemistry', time: '8–9 AM' }],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ParentAcademics() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/v1/parents/my-children/academics');
                setStudents(res.data.students || []);
                if (res.data.students?.length > 0) {
                    setSelectedStudentId(res.data.students[0].id);
                }
            } catch (error) {
                console.error('Error fetching academic data:', error);
                toast.error('Failed to load academic information');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedChild = students.find(s => s.id === selectedStudentId);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500 font-dash">Loading academic records...</p>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-slate-900">No children linked</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">We couldn't find any children linked to your account. Please contact the school admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Academics</h1>
                    <p className="text-slate-500 text-sm mt-1">View academic records and timetable</p>
                </div>
                <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 min-w-[200px]"
                >
                    {students.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.class})
                        </option>
                    ))}
                </select>
            </div>

            {/* Overall Student Progress bar */}
            {selectedChild && (
                <Card className="p-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white border-none shadow-lg overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-lg font-bold text-white">{selectedChild.name}'s Term Progress</h2>
                                <p className="text-xs text-white">Overall academic milestone completion</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black">{selectedChild.progress}%</span>
                            </div>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                style={{ width: `${selectedChild.progress}%` }}
                            />
                        </div>
                    </div>
                    {/* Decorative background circle */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Subjects */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Registered Subjects</h3>
                        <span className="text-xs text-gray-400">{selectedChild?.subjects.length} Subjects Total</span>
                    </div>

                    {selectedChild?.subjects.length === 0 ? (
                        <Card className="p-8 text-center border-dashed border-2 border-gray-100 bg-gray-50/30">
                            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">No subjects found for {selectedChild?.name.split(' ')[0]}</p>
                            <p className="text-[11px] text-gray-400 mt-1">Please ensure the student is enrolled in a class with subjects.</p>
                        </Card>
                    ) : selectedChild?.subjects.map((sub, idx) => {
                        // Generate a consistent color/bg based on index or subject name
                        const colors = [
                            { text: 'text-blue-700', bg: 'bg-blue-100', icon: '📐' },
                            { text: 'text-emerald-700', bg: 'bg-emerald-100', icon: '📝' },
                            { text: 'text-purple-700', bg: 'bg-purple-100', icon: '⚡' },
                            { text: 'text-amber-700', bg: 'bg-amber-100', icon: '🧪' },
                            { text: 'text-teal-700', bg: 'bg-teal-100', icon: '🔬' },
                        ];
                        const style = colors[idx % colors.length];

                        return (
                            <Card key={sub.id || idx} className="p-4 bg-white border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:border-[#0036a1]/30">
                                <div className={`w-11 h-11 ${style.bg} rounded-xl flex items-center justify-center text-xl shrink-0`}>{style.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <p className="font-bold text-gray-900 text-sm">{sub.name}</p>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{sub.category || 'CORE'}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                        <User className="w-3 h-3" />
                                        <span className="text-gray-500 font-medium">Teacher:</span> {sub.teacher}
                                    </p>
                                    {/* Subject mini progress bar */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${sub.progress >= 80 ? 'bg-emerald-500' : sub.progress >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${sub.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">{sub.progress}%</span>
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Status</p>
                                        <p className="text-emerald-600 text-xs font-bold leading-none">In Sync</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Timetable */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-4">Weekly Timetable</h3>
                    <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                        {DAYS.map((day, i) => (
                            <div key={day} className={`p-3 ${i < DAYS.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">{day}</p>
                                <div className="space-y-1">
                                    {(TIMETABLE[day] || []).map((cls: { subject: string, time: string }) => (
                                        <div key={cls.subject} className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5">
                                            <span className="font-semibold">{cls.subject}</span>
                                            <span className="text-slate-500">{cls.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>
            </div>
        </div>
    );
}
