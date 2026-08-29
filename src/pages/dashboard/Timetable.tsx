/**
 * Timetable.tsx — Full-stack Weekly Timetable Manager
 * Redesigned: Tailwind CSS + shadcn/ui, animated, fully mobile responsive
 * All API calls, state logic, and business logic unchanged.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, BookOpen, Clock, Edit2, Trash2, Wand2, Sparkles, Calendar,
    CheckCircle2, Settings2, Loader2, RefreshCw, Download, X, ChevronRight
} from 'lucide-react';
import { Button } from './../../components/ui/button';
import { Label } from './../../components/ui/label';
import { Separator } from './../../components/ui/separator';
import axios from 'axios';
import { cn } from './../../lib/utils';

const API = '/api/v1/school';

// ─── Constants & Types ──────────────────────────────────────────────────────
const SLOT_COLORS = [
    'bg-[#1E4DA6]/10 text-[#173F8C] border-[#1E4DA6]/20',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-[#1E4DA6]/10 text-[#173F8C] border-[#1E4DA6]/20',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-red-100 text-red-700 border-red-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
];

const FALLBACK_SUBJECTS = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Geography', 'Civic Education', 'Economics', 'Further Maths'];

interface TimetableEntry {
    id: string; classId: string; day: string; period: string;
    subject: string; teacherName: string; teacherId?: string; color: string;
}
type SlotMap = Record<string, Record<string, TimetableEntry>>;
interface AddForm { subject: string; teacherName: string; teacherId: string; color: string; }
interface TimetableSetup {
    classId: string; numOfPeriods: number; periodDuration: number; startTime: string;
    shortBreakStart: string | null; shortBreakEnd: string | null;
    longBreakStart: string | null; longBreakEnd: string | null;
}

const parseTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    const d = new Date(); d.setHours(hours, minutes, 0, 0); return d;
};
const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '');

// ─── Field style ────────────────────────────────────────────────────────────
const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 placeholder:text-slate-400';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg, iconText, delay }: {
    icon: React.ReactNode; label: string; value: number;
    iconBg: string; iconText: string; delay: number;
}) {
    const [vis, setVis] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
    return (
        <div className={cn(
            'flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-500',
            'hover:shadow-md hover:-translate-y-0.5',
            vis ? 'opacity-100' : 'translate-y-3 opacity-0'
        )}>
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg, iconText)}>{icon}</div>
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="font-mono text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div
            key="modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                key="modal"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <div>
                <p className="font-bold text-slate-900">{title}</p>
                {subtitle && <p className="mt-0.5 font-mono text-[10px] text-slate-400">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Timetable() {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [periods, setPeriods] = useState<{ id: string; label: string; isBreak: boolean; type?: string }[]>([]);
    const [slotMap, setSlotMap] = useState<SlotMap>({});
    const [loading, setLoading] = useState(false);
    const [dbTeachers, setDbTeachers] = useState<{ id: string; name: string; department?: string }[]>([]);
    const [dbSubjects, setDbSubjects] = useState<string[]>([]);
    const [adding, setAdding] = useState<{ day: string; period: string } | null>(null);
    const [addForm, setAddForm] = useState<AddForm>({ subject: '', teacherName: '', teacherId: '', color: SLOT_COLORS[0] });
    const [saving, setSaving] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [setupForm, setSetupForm] = useState<TimetableSetup>({
        classId: '', numOfPeriods: 8, periodDuration: 45, startTime: '08:00 AM',
        shortBreakStart: '10:15 AM', shortBreakEnd: '10:30 AM',
        longBreakStart: '12:00 PM', longBreakEnd: '12:30 PM',
    });
    const [error, setError] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genStep, setGenStep] = useState(0);
    const [pageVisible, setPageVisible] = useState(false);
    // mobile: which day tab is active
    const [mobileDay, setMobileDay] = useState(0);

    useEffect(() => { const t = setTimeout(() => setPageVisible(true), 60); return () => clearTimeout(t); }, []);

    const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 5000); };

    // ── Load classes ──────────────────────────────────────────────────────────
    useEffect(() => {
        axios.get('/api/v1/classes/all', { withCredentials: true })
            .then(res => {
                const dbClasses = (res.data.classes || []).map((c: any) => ({ id: c.id, name: c.name }));
                if (dbClasses.length > 0) {
                    setClasses(dbClasses); setSelectedClass(dbClasses[0].name);
                } else {
                    Promise.allSettled([
                        axios.get(`${API}/timetable/classes`, { withCredentials: true }),
                        axios.get(`${API}/attendance/class-levels`, { withCredentials: true }),
                    ]).then(([ttRes, attRes]) => {
                        const fromTT: string[] = ttRes.status === 'fulfilled' ? ttRes.value.data.classIds : [];
                        const fromAtt: string[] = attRes.status === 'fulfilled' ? attRes.value.data.classLevels : [];
                        const merged = Array.from(new Set([...fromAtt, ...fromTT])).sort();
                        const fallback = merged.length > 0 ? merged : ['JSS1A', 'JSS1B', 'JSS2A', 'SS1A', 'SS1B'];
                        const nameOnly = fallback.map(n => ({ id: n, name: n }));
                        setClasses(nameOnly); setSelectedClass(nameOnly[0].name);
                    });
                }
            })
            .catch(() => {
                const fb = ['JSS1A', 'JSS1B', 'JSS2A', 'JSS2B', 'SS1A', 'SS1B'].map(n => ({ id: n, name: n }));
                setClasses(fb); setSelectedClass(fb[0].name);
            });
        axios.get(`${API}/timetable/teachers`, { withCredentials: true }).then(r => setDbTeachers(r.data.teachers)).catch(() => { });
        axios.get(`${API}/timetable/subjects`, { withCredentials: true }).then(r => setDbSubjects(r.data.subjects)).catch(() => { });
    }, []);

    // ── Fetch timetable ───────────────────────────────────────────────────────
    const fetchTimetable = useCallback(async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const [setupRes, ttRes] = await Promise.all([
                axios.get(`${API}/timetable/setup?classId=${encodeURIComponent(selectedClass)}`, { withCredentials: true }),
                axios.get(`${API}/timetable?classId=${encodeURIComponent(selectedClass)}`, { withCredentials: true })
            ]);
            const fetchedSetup: TimetableSetup = setupRes.data.setup;
            setSetupForm(fetchedSetup);
            const gen: typeof periods = [];
            let cur = parseTime(fetchedSetup.startTime); let cnt = 1;
            const sbS = fetchedSetup.shortBreakStart ? parseTime(fetchedSetup.shortBreakStart) : null;
            const sbE = fetchedSetup.shortBreakEnd ? parseTime(fetchedSetup.shortBreakEnd) : null;
            const lbS = fetchedSetup.longBreakStart ? parseTime(fetchedSetup.longBreakStart) : null;
            const lbE = fetchedSetup.longBreakEnd ? parseTime(fetchedSetup.longBreakEnd) : null;
            for (let i = 0; i < 20; i++) {
                if (cnt > fetchedSetup.numOfPeriods) break;
                const ts = formatTime(cur);
                if (fetchedSetup.shortBreakStart && ts === formatTime(sbS!)) {
                    gen.push({ id: `sb-${ts}`, label: `${ts} - ${fetchedSetup.shortBreakEnd}`, isBreak: true, type: 'Short Break' });
                    cur = new Date(sbE!.getTime()); continue;
                }
                if (fetchedSetup.longBreakStart && ts === formatTime(lbS!)) {
                    gen.push({ id: `lb-${ts}`, label: `${ts} - ${fetchedSetup.longBreakEnd}`, isBreak: true, type: 'Long Break' });
                    cur = new Date(lbE!.getTime()); continue;
                }
                const end = new Date(cur.getTime() + fetchedSetup.periodDuration * 60000);
                gen.push({ id: formatTime(cur), label: `${formatTime(cur)} – ${formatTime(end)}`, isBreak: false });
                cur = end; cnt++;
            }
            setPeriods(gen);
            const map: SlotMap = {};
            for (const e of ttRes.data.entries as TimetableEntry[]) {
                if (!map[e.day]) map[e.day] = {};
                map[e.day][e.period] = e;
            }
            setSlotMap(map);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [selectedClass]);

    useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

    // ── Add slot ──────────────────────────────────────────────────────────────
    const handleAddSlot = async () => {
        if (!adding || !addForm.subject || !addForm.teacherName) return;
        setSaving(true);
        try {
            const res = await axios.post(`${API}/timetable/slot`, {
                classId: selectedClass, day: adding.day, period: adding.period,
                subject: addForm.subject, teacherName: addForm.teacherName,
                teacherId: addForm.teacherId || undefined, color: addForm.color,
            }, { withCredentials: true });
            const entry: TimetableEntry = res.data.entry;
            setSlotMap(prev => ({ ...prev, [entry.day]: { ...(prev[entry.day] || {}), [entry.period]: entry } }));
            setAdding(null); setAddForm({ subject: '', teacherName: '', teacherId: '', color: SLOT_COLORS[0] });
        } catch (err: any) { showError(`Failed to save slot: ${err?.response?.data?.msg || err?.message}`); }
        finally { setSaving(false); }
    };

    // ── Delete slot ───────────────────────────────────────────────────────────
    const handleDelete = async (day: string, period: string) => {
        try {
            await axios.delete(`${API}/timetable/slot`, { data: { classId: selectedClass, day, period }, withCredentials: true });
            setSlotMap(prev => { const u = { ...prev }; if (u[day]) delete u[day][period]; return { ...u }; });
        } catch (err: any) { showError(`Failed to delete slot: ${err?.response?.data?.msg || err?.message}`); }
    };

    // ── Save setup ────────────────────────────────────────────────────────────
    const handleSaveSetup = async (applyToAll: boolean) => {
        setSaving(true);
        try {
            await axios.patch(`${API}/timetable/setup`, {
                classId: selectedClass, setupData: { ...setupForm, classId: selectedClass }, applyToAll
            }, { withCredentials: true });
            await fetchTimetable(); setShowSetup(false);
        } catch (err: any) { showError(`Failed to save setup: ${err?.response?.data?.msg || err?.message}`); }
        finally { setSaving(false); }
    };

    // ── AI Generation ─────────────────────────────────────────────────────────
    const runGeneration = () => {
        setIsGenerating(true); setGenStep(1);
        const teacherList = dbTeachers.length > 0 ? dbTeachers : [
            { id: undefined, name: 'Teacher A' }, { id: undefined, name: 'Teacher B' },
            { id: undefined, name: 'Teacher C' }, { id: undefined, name: 'Teacher D' }, { id: undefined, name: 'Teacher E' }
        ];
        const subjectList = dbSubjects.length > 0 ? dbSubjects : FALLBACK_SUBJECTS;
        let cur = 1;
        const interval = setInterval(async () => {
            cur++; setGenStep(cur);
            if (cur >= 5) {
                clearInterval(interval);
                const allSlots: { classId: string; slots: Omit<TimetableEntry, 'id' | 'classId'>[] }[] = [];
                for (const cls of classNames) {
                    const slots: Omit<TimetableEntry, 'id' | 'classId'>[] = [];
                    let tCur = 0, sCur = Math.floor(Math.random() * subjectList.length);
                    for (const day of DAYS) {
                        for (const p of periods) {
                            if (p.isBreak || Math.random() < 0.12) continue;
                            const t = teacherList[tCur % teacherList.length];
                            slots.push({ day, period: p.id, subject: subjectList[sCur % subjectList.length], teacherName: t.name, teacherId: t.id as string, color: SLOT_COLORS[sCur % SLOT_COLORS.length] });
                            sCur++; tCur++;
                        }
                    }
                    allSlots.push({ classId: cls, slots });
                }
                await new Promise(r => setTimeout(r, 600));
                try {
                    await Promise.all(allSlots.map(({ classId, slots }) => axios.post(`${API}/timetable/save`, { classId, slots }, { withCredentials: true })));
                    await fetchTimetable();
                } catch (err: any) { showError(`Auto-generate failed: ${err?.response?.data?.msg || err?.message}`); }
                finally { setIsGenerating(false); setShowAIModal(false); }
            }
        }, 1200);
    };

    const totalScheduled = Object.values(slotMap).reduce((t, d) => t + Object.keys(d).length, 0);
    const subjects = dbSubjects.length > 0 ? dbSubjects : FALLBACK_SUBJECTS;
    const teachers = dbTeachers.length > 0 ? dbTeachers.map(t => t.name) : [];
    const classNames = classes.map(c => c.name);
    const genSteps = [
        'Analysing class constraints and available teachers…',
        'Distributing core subjects evenly across the week…',
        'Resolving teacher scheduling conflicts…',
        'Optimising period allocations…',
        'Finalising timetable structure…',
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .tt-root .font-mono  { font-family: 'DM Mono', monospace !important; }
                @keyframes tt-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes tt-pulse { 0%{transform:scale(0.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }
                .tt-float { animation: tt-float 3.5s ease-in-out infinite; }
                .tt-pulse { animation: tt-pulse 2.4s ease-out infinite; }
                @media print {
                    .tt-no-print { display: none !important; }
                    .tt-print-header { display: block !important; }
                }
                .tt-print-header { display: none; }
            `}</style>

            <div className="tt-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">

                {/* Dot grid */}

                {/* Error toast */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="fixed top-5 left-1/2 z-[99] -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
                        >
                            <span>⚠️ {error}</span>
                            <button onClick={() => setError(null)} className="ml-1 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative z-10 mx-auto max-w-[1400px]">

                    {/* Breadcrumb */}
                    <div className={cn('tt-no-print mb-6 flex items-center gap-1.5 transition-all duration-500',
                        pageVisible ? 'opacity-100' : '-translate-y-2 opacity-0')}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Academics</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Timetable Manager</span>
                    </div>

                    {/* Print header */}
                    <div className="tt-print-header text-center pb-4 border-b mb-4">
                        <h2 className="text-xl font-bold">{selectedClass} — Weekly Timetable</h2>
                    </div>

                    {/* Main panel */}
                    <div className={cn(
                        'tt-no-print overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-500',
                        pageVisible ? 'opacity-100' : 'translate-y-3 opacity-0'
                    )}>
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6">
                            <div className="inline-flex items-center gap-2 border-b-2 border-[#1E4DA6] pb-3 pt-3.5">
                                <Calendar className="h-3.5 w-3.5 text-[#1E4DA6]" />
                                <span className="text-xs font-bold tracking-tight text-[#1E4DA6]">Weekly Schedule</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* Hero + actions */}
                            <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="tt-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="tt-pulse absolute inset-0 rounded-2xl bg-[#1E4DA6]/8" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] shadow-lg shadow-[#1E4DA6]/20">
                                        <Calendar className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Timetable Manager</h2>
                                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">Create, edit, and auto-generate weekly class schedules.</p>
                                </div>

                                {/* Toolbar */}
                                <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0 sm:self-start">
                                    {/* Class selector */}
                                    <select
                                        value={selectedClass}
                                        onChange={e => setSelectedClass(e.target.value)}
                                        className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-[#1E4DA6]/60 focus:outline-none focus:ring-2 focus:ring-[#1E4DA6]/10"
                                    >
                                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>

                                    {/* Icon buttons */}
                                    {[
                                        { icon: <RefreshCw className="h-4 w-4" />, onClick: fetchTimetable, title: 'Refresh' },
                                        { icon: <Download className="h-4 w-4" />, onClick: () => window.print(), title: 'Print' },
                                        { icon: <Settings2 className="h-4 w-4" />, onClick: () => setShowSetup(true), title: 'Setup' },
                                    ].map(({ icon, onClick, title }) => (
                                        <button key={title} onClick={onClick} title={title}
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-[#1E4DA6] hover:shadow-md">
                                            {icon}
                                        </button>
                                    ))}

                                    {/* Create dropdown */}
                                    <div className="relative">
                                        <Button
                                            onClick={() => setShowOptions(v => !v)}
                                            className="h-9 gap-2 rounded-xl bg-[#173F8C] px-4 text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 transition-all hover:scale-[1.02] hover:bg-[#122F69]"
                                        >
                                            <Wand2 className="h-3.5 w-3.5" /> Create Timetable
                                        </Button>

                                        <AnimatePresence>
                                            {showOptions && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.96 }}
                                                        className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                                                    >
                                                        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                                                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Choose Method</p>
                                                        </div>
                                                        <div className="space-y-0.5 p-2">
                                                            <button
                                                                onClick={() => { setShowOptions(false); setAdding({ day: DAYS[0], period: periods.find(p => !p.isBreak)?.id || '' }); }}
                                                                className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all hover:bg-slate-50"
                                                            >
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Edit2 className="h-4 w-4" /></div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">Manual Creation</p>
                                                                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">Click empty slots to add periods</p>
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={() => { setShowOptions(false); setShowAIModal(true); setGenStep(0); }}
                                                                className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all hover:bg-[#1E4DA6]/8"
                                                            >
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1E4DA6]/5 text-[#1E4DA6]"><Sparkles className="h-4 w-4" /></div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-[#173F8C]">Auto-Generate</p>
                                                                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">Fill all classes & save to DB</p>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Stat cards */}
                            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { icon: <BookOpen className="h-5 w-5" />, label: 'Classes', value: classNames.length, iconBg: 'bg-[#1E4DA6]/5', iconText: 'text-[#1E4DA6]' },
                                    { icon: <Clock className="h-5 w-5" />, label: 'Periods / Day', value: periods.filter(p => !p.isBreak).length, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
                                    { icon: <Edit2 className="h-5 w-5" />, label: 'Scheduled', value: totalScheduled, iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
                                    { icon: <Calendar className="h-5 w-5" />, label: 'Free Periods', value: (DAYS.length * periods.filter(p => !p.isBreak).length) - totalScheduled, iconBg: 'bg-[#1E4DA6]/5', iconText: 'text-[#1E4DA6]' },
                                ].map((s, i) => <StatCard key={s.label} {...s} delay={80 + i * 60} />)}
                            </div>

                            <Separator className="mb-6 bg-slate-100" />

                            {/* ── DESKTOP TABLE ────────────────────── */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-7 w-7 animate-spin text-[#1E4DA6]" />
                                </div>
                            ) : (
                                <>
                                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm md:block">
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-sm" style={{ minWidth: 800 }}>
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                                        {/* Period/Day diagonal cell */}
                                                        <th className="relative w-32 border-r border-slate-100 px-4 py-4">
                                                            <span className="absolute bottom-2 left-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Period</span>
                                                            <span className="absolute right-3 top-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Day</span>
                                                            <svg className="absolute inset-0 h-full w-full text-slate-200" preserveAspectRatio="none" viewBox="0 0 100 100">
                                                                <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.8" />
                                                            </svg>
                                                        </th>
                                                        {DAYS.map(d => (
                                                            <th key={d} className="border-l border-slate-100 px-3 py-4 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                                {d}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {periods.map((periodObj, pi) => {
                                                        const isBreak = periodObj.isBreak;
                                                        console.log(pi)
                                                        return (
                                                            <tr key={periodObj.id} className={cn('group/row border-b border-slate-50', isBreak ? 'bg-amber-50/50' : 'hover:bg-slate-50/40')}>
                                                                {/* Period label */}
                                                                <td className={cn('border-r border-slate-100 px-3 py-3 text-left', isBreak ? 'bg-amber-50/80' : 'bg-slate-50/60')}>
                                                                    <p className="font-mono text-[11px] font-bold text-slate-600 whitespace-nowrap">{periodObj.label}</p>
                                                                    {isBreak && <p className="font-mono text-[10px] text-amber-500">{periodObj.type}</p>}
                                                                </td>
                                                                {DAYS.map(day => {
                                                                    const slot = slotMap[day]?.[periodObj.id];
                                                                    return (
                                                                        <td key={day} className={cn('h-[88px] min-w-[140px] border-l border-slate-50 p-2 align-top', isBreak ? 'bg-amber-50/30' : '')}>
                                                                            {isBreak ? (
                                                                                <div className="flex h-full items-center justify-center font-mono text-xs text-amber-400 opacity-50">–</div>
                                                                            ) : slot ? (
                                                                                <motion.div
                                                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                                    className={cn('group relative flex h-full cursor-default flex-col justify-center rounded-xl border p-2.5 text-xs', slot.color)}
                                                                                >
                                                                                    <p className="truncate font-bold">{slot.subject}</p>
                                                                                    <p className="mt-0.5 truncate font-mono text-[10px] opacity-70">{slot.teacherName}</p>
                                                                                    <button
                                                                                        onClick={() => handleDelete(day, periodObj.id)}
                                                                                        className="absolute right-1.5 top-1.5 rounded-lg p-1 text-red-500 opacity-0 transition-all hover:bg-white/60 group-hover:opacity-100"
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </button>
                                                                                </motion.div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => { setAdding({ day, period: periodObj.id }); setAddForm({ subject: '', teacherName: '', teacherId: '', color: SLOT_COLORS[Math.floor(Math.random() * SLOT_COLORS.length)] }); }}
                                                                                    className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-100 text-slate-300 opacity-0 transition-all hover:border-[#1E4DA6]/20 hover:bg-[#1E4DA6]/8 hover:text-[#1E4DA6] group-hover/row:opacity-100"
                                                                                >
                                                                                    <Plus className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* ── MOBILE VIEW ──────────────────── */}
                                    <div className="md:hidden">
                                        {/* Day tabs */}
                                        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
                                            {DAYS.map((d, i) => (
                                                <button
                                                    key={d}
                                                    onClick={() => setMobileDay(i)}
                                                    className={cn(
                                                        'flex-1 rounded-lg py-2 font-mono text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap',
                                                        mobileDay === i
                                                            ? 'bg-white text-[#173F8C] shadow-sm ring-1 ring-slate-200'
                                                            : 'text-slate-400 hover:text-slate-600'
                                                    )}
                                                >
                                                    {DAYS_SHORT[i]}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Periods for selected day */}
                                        <div className="space-y-2">
                                            {periods.map(periodObj => {
                                                const day = DAYS[mobileDay];
                                                const slot = slotMap[day]?.[periodObj.id];
                                                const isBreak = periodObj.isBreak;

                                                if (isBreak) return (
                                                    <div key={periodObj.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-2">
                                                        <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                        <span className="font-mono text-[11px] text-amber-600">{periodObj.type} · {periodObj.label}</span>
                                                    </div>
                                                );

                                                return (
                                                    <div key={periodObj.id} className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
                                                        <div className="shrink-0 text-right">
                                                            <p className="font-mono text-[10px] font-bold text-slate-400 whitespace-nowrap">{periodObj.label.split('–')[0].trim()}</p>
                                                        </div>
                                                        <div className="mx-1 h-8 w-px bg-slate-100 shrink-0" />
                                                        {slot ? (
                                                            <div className={cn('flex flex-1 items-center justify-between rounded-xl border px-3 py-2', slot.color)}>
                                                                <div>
                                                                    <p className="text-xs font-bold">{slot.subject}</p>
                                                                    <p className="font-mono text-[10px] opacity-70">{slot.teacherName}</p>
                                                                </div>
                                                                <button onClick={() => handleDelete(day, periodObj.id)} className="ml-2 rounded-lg p-1.5 text-red-500 opacity-0 transition-all hover:bg-white/60 group-hover:opacity-100">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setAdding({ day, period: periodObj.id }); setAddForm({ subject: '', teacherName: '', teacherId: '', color: SLOT_COLORS[Math.floor(Math.random() * SLOT_COLORS.length)] }); }}
                                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-100 py-2 text-slate-300 transition-all hover:border-[#1E4DA6]/20 hover:bg-[#1E4DA6]/8 hover:text-[#1E4DA6]"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                                <span className="font-mono text-[10px]">Add</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Add Slot Modal ──────────────────────── */}
            <AnimatePresence>
                {adding && (
                    <Modal onClose={() => setAdding(null)}>
                        <ModalHeader
                            title="Add Class Period"
                            subtitle={`${adding.day} · ${adding.period}`}
                            onClose={() => setAdding(null)}
                        />
                        <div className="space-y-4 p-6">
                            {/* Context pill */}
                            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
                                <Calendar className="h-4 w-4 text-[#1E4DA6]" />{adding.day}
                                <span className="text-slate-300">·</span>
                                <Clock className="h-4 w-4 text-[#1E4DA6]" />{adding.period}
                            </div>

                            <div>
                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject</Label>
                                <select value={addForm.subject} onChange={e => setAddForm(f => ({ ...f, subject: e.target.value }))} className={fieldCls}>
                                    <option value="" disabled>Select Subject</option>
                                    {subjects.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Teacher</Label>
                                <select value={addForm.teacherId} onChange={e => {
                                    const t = dbTeachers.find(t => t.id === e.target.value);
                                    if (t) setAddForm(f => ({ ...f, teacherId: t.id, teacherName: t.name }));
                                }} className={fieldCls}>
                                    <option value="" disabled>Select Teacher</option>
                                    {dbTeachers.length > 0
                                        ? dbTeachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.department ? ` (${t.department})` : ''}</option>)
                                        : teachers.map(t => <option key={t} value={t}>{t}</option>)
                                    }
                                </select>
                            </div>

                            <div>
                                <Label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Colour</Label>
                                <div className="flex flex-wrap gap-2">
                                    {SLOT_COLORS.map((c, i) => (
                                        <button key={i} onClick={() => setAddForm(f => ({ ...f, color: c }))}
                                            className={cn('flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all', c, addForm.color === c ? 'ring-2 ring-[#1E4DA6] ring-offset-1 scale-110' : 'hover:scale-105')}>
                                            {addForm.color === c && <span className="h-2 w-2 rounded-full bg-current" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <Button variant="outline" onClick={() => setAdding(null)} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                            <Button
                                onClick={handleAddSlot}
                                disabled={!addForm.subject || !addForm.teacherName || saving}
                                className="flex-1 gap-2 rounded-xl bg-[#173F8C] text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69] disabled:opacity-50"
                            >
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {saving ? 'Saving…' : 'Save Slot'}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── AI Generation Modal ─────────────────── */}
            <AnimatePresence>
                {showAIModal && (
                    <Modal onClose={() => !isGenerating && setShowAIModal(false)}>
                        {!isGenerating && genStep === 0 ? (
                            <>
                                {/* Gradient hero */}
                                <div className="flex flex-col items-center bg-gradient-to-br from-[#173F8C] to-[#0E2450] p-8 text-center text-white">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">Auto-Generate Timetables</h3>
                                    <p className="mt-1 max-w-xs font-mono text-sm text-white/70">Fills all classes with teacher and subject assignments, saved directly to the database.</p>
                                </div>
                                <div className="space-y-2.5 p-6">
                                    {[
                                        `Covering all ${classNames.length} classes`,
                                        `Using ${dbTeachers.length > 0 ? dbTeachers.length : 'sample'} teachers from your database`,
                                        `Using ${dbSubjects.length > 0 ? dbSubjects.length : FALLBACK_SUBJECTS.length} subjects`,
                                        'Break periods left free automatically',
                                        '~12% random free periods for flexibility',
                                    ].map((line, i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />{line}
                                        </div>
                                    ))}
                                    <div className="mt-2 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                        <span className="shrink-0">⚠️</span>
                                        This will <strong>overwrite</strong> existing timetables for all classes.
                                    </div>
                                </div>
                                <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                    <Button variant="outline" onClick={() => setShowAIModal(false)} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                                    <Button onClick={runGeneration} className="flex-1 gap-2 rounded-xl bg-[#173F8C] text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69]">
                                        <Settings2 className="h-3.5 w-3.5" /> Start Generation
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center p-12 text-center">
                                {/* Spinner */}
                                <div className="relative mb-8 h-24 w-24">
                                    <div className="absolute inset-0 rounded-full border-4 border-[#1E4DA6]/10" />
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                        className="absolute inset-0 rounded-full border-4 border-[#1E4DA6] border-l-transparent border-b-transparent" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="h-8 w-8 animate-pulse text-[#1E4DA6]" />
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-extrabold text-slate-900">Generating Timetables…</h3>
                                <div className="h-6">
                                    <AnimatePresence mode="wait">
                                        <motion.p key={genStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                            className="font-mono text-sm text-slate-500">
                                            {genSteps[genStep - 1] || 'Saving to database…'}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                                <div className="mt-8 flex gap-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <div key={s} className={cn('h-2 w-2 rounded-full transition-colors duration-300', s <= genStep ? 'bg-[#1E4DA6]' : 'bg-slate-200')} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Setup Modal ─────────────────────────── */}
            <AnimatePresence>
                {showSetup && (
                    <Modal onClose={() => setShowSetup(false)}>
                        <ModalHeader title="Timetable Setup" subtitle={`Configure periods and breaks for ${selectedClass}`} onClose={() => setShowSetup(false)} />
                        <div className="max-h-[60vh] space-y-5 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Number of Periods</Label>
                                    <input type="number" min="1" max="15" value={setupForm.numOfPeriods} onChange={e => setSetupForm(f => ({ ...f, numOfPeriods: Number(e.target.value) }))} className={fieldCls} />
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Period Duration (mins)</Label>
                                    <input type="number" min="15" max="120" value={setupForm.periodDuration} onChange={e => setSetupForm(f => ({ ...f, periodDuration: Number(e.target.value) }))} className={fieldCls} />
                                </div>
                            </div>
                            <div>
                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">School Start Time</Label>
                                <input type="text" placeholder="08:00 AM" value={setupForm.startTime} onChange={e => setSetupForm(f => ({ ...f, startTime: e.target.value }))} className={fieldCls} />
                            </div>

                            <Separator className="bg-slate-100" />
                            <p className="flex items-center gap-2 font-bold text-sm text-slate-800"><Clock className="h-4 w-4 text-amber-500" /> Short Break</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Start (Optional)</Label>
                                    <input type="text" placeholder="10:00 AM" value={setupForm.shortBreakStart || ''} onChange={e => setSetupForm(f => ({ ...f, shortBreakStart: e.target.value }))} className={fieldCls} />
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">End</Label>
                                    <input type="text" placeholder="10:15 AM" value={setupForm.shortBreakEnd || ''} onChange={e => setSetupForm(f => ({ ...f, shortBreakEnd: e.target.value }))} className={fieldCls} />
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />
                            <p className="flex items-center gap-2 font-bold text-sm text-slate-800"><Clock className="h-4 w-4 text-[#1E4DA6]" /> Long Break / Lunch</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Start (Optional)</Label>
                                    <input type="text" placeholder="12:00 PM" value={setupForm.longBreakStart || ''} onChange={e => setSetupForm(f => ({ ...f, longBreakStart: e.target.value }))} className={fieldCls} />
                                </div>
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">End</Label>
                                    <input type="text" placeholder="12:30 PM" value={setupForm.longBreakEnd || ''} onChange={e => setSetupForm(f => ({ ...f, longBreakEnd: e.target.value }))} className={fieldCls} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <Button onClick={() => handleSaveSetup(false)} disabled={saving} className="w-full gap-2 rounded-xl bg-[#173F8C] text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69]">
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Save to {selectedClass}
                            </Button>
                            <Button onClick={() => handleSaveSetup(true)} disabled={saving} variant="outline" className="w-full rounded-xl text-xs font-semibold text-[#173F8C] border-[#1E4DA6]/20 hover:bg-[#1E4DA6]/5">
                                Apply to All Classes
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
}
