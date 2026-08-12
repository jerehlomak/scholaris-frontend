/**
 * Homework.tsx — Admin homework / assignment overview
 * Redesigned: Tailwind CSS + shadcn/ui, animated, fully mobile responsive
 */
import { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Calendar, Clock, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent } from './../../components/ui/card';
import { Button } from './../../components/ui/button';
import { Input } from './../../components/ui/input';
import { Separator } from './../../components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './../../lib/utils';

// ─────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────
type Status = 'active' | 'overdue' | 'graded';

interface Homework {
    id: string; title: string; subject: string; teacher: string;
    classLevel: string; dueDate: string; status: Status; submissions: number; total: number;
}

const INITIAL: Homework[] = [
    { id: 'h1', title: 'Algebra Worksheet — Ch. 5', subject: 'Mathematics', teacher: 'Mr. Adebayo', classLevel: 'SS 1A', dueDate: '2025-03-05', status: 'active', submissions: 3, total: 38 },
    { id: 'h2', title: 'Essay: My Role Model', subject: 'English Language', teacher: 'Mrs. Chukwu', classLevel: 'SS 2B', dueDate: '2025-02-25', status: 'graded', submissions: 35, total: 35 },
    { id: 'h3', title: "Lab Report — Newton's 2nd Law", subject: 'Physics', teacher: 'Mrs. Emeka', classLevel: 'JSS 3C', dueDate: '2025-02-20', status: 'overdue', submissions: 12, total: 40 },
    { id: 'h4', title: 'Periodic Table Quiz', subject: 'Chemistry', teacher: 'Mr. Ibrahim', classLevel: 'SS 1B', dueDate: '2025-03-10', status: 'active', submissions: 0, total: 36 },
    { id: 'h5', title: 'Cell Division Diagram', subject: 'Biology', teacher: 'Mrs. Okafor', classLevel: 'SS 2A', dueDate: '2025-03-08', status: 'active', submissions: 8, total: 34 },
];

const STATUS_CFG: Record<Status, {
    label: string; textColor: string; bgColor: string; borderColor: string; barColor: string; icon: React.ReactNode;
}> = {
    active: { label: 'Active', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', barColor: 'bg-emerald-500', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    overdue: { label: 'Overdue', textColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-100', barColor: 'bg-red-500', icon: <XCircle className="h-3.5 w-3.5" /> },
    graded: { label: 'Graded', textColor: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', barColor: 'bg-blue-500', icon: <FileText className="h-3.5 w-3.5" /> },
};

const STAT_KEYS = [
    { key: 'all', label: 'Total', icon: <FileText className="h-5 w-5" />, iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
    { key: 'active', label: 'Active', icon: <CheckCircle2 className="h-5 w-5" />, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
    { key: 'overdue', label: 'Overdue', icon: <Clock className="h-5 w-5" />, iconBg: 'bg-red-50', iconText: 'text-red-600' },
    { key: 'graded', label: 'Graded', icon: <BookOpen className="h-5 w-5" />, iconBg: 'bg-purple-50', iconText: 'text-purple-600' },
] as const;

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
function StatCard({
    label, count, icon, iconBg, iconText, active, onClick, delay,
}: {
    label: string; count: number; icon: React.ReactNode;
    iconBg: string; iconText: string;
    active: boolean; onClick: () => void; delay: number;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

    return (
        <button
            onClick={onClick}
            className={cn(
                'group relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300',
                'hover:shadow-md hover:-translate-y-0.5',
                active
                    ? 'border-blue-300 bg-blue-50/60 shadow-md shadow-blue-100 ring-1 ring-blue-200'
                    : 'border-slate-100 bg-white shadow-sm hover:border-slate-200',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
                'transition-all duration-500'
            )}
        >
            {active && (
                <motion.div layoutId="hwStatActive" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-500" />
            )}
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110', iconBg, iconText)}>
                {icon}
            </div>
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="font-mono text-2xl font-bold text-slate-900">{count}</p>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : color)}
                />
            </div>
            <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">{value}/{max}</span>
        </div>
    );
}

// ─────────────────────────────────────────────
// Desktop table row
// ─────────────────────────────────────────────
function TableRow({ hw, delay }: { hw: Homework; delay: number }) {
    const cfg = STATUS_CFG[hw.status];
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="group border-b border-slate-50 transition-colors hover:bg-slate-50/60"
        >
            {/* Assignment */}
            <td className="px-5 py-4">
                <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{hw.title}</p>
                <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <BookOpen className="h-3 w-3" />{hw.subject}
                </p>
            </td>
            {/* Teacher */}
            <td className="px-4 py-4 text-sm font-medium text-slate-600">{hw.teacher}</td>
            {/* Class */}
            <td className="px-4 py-4 text-center">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                    {hw.classLevel}
                </span>
            </td>
            {/* Due date */}
            <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3" />{hw.dueDate}
                </span>
            </td>
            {/* Submissions */}
            <td className="px-4 py-4 w-36">
                <ProgressBar value={hw.submissions} max={hw.total} color={cfg.barColor} />
            </td>
            {/* Status */}
            <td className="px-4 py-4 text-center">
                <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold',
                    cfg.bgColor, cfg.textColor
                )}>
                    {cfg.icon}{cfg.label}
                </span>
            </td>
        </motion.tr>
    );
}

// ─────────────────────────────────────────────
// Mobile card
// ─────────────────────────────────────────────
function MobileCard({ hw, delay }: { hw: Homework; delay: number }) {
    const cfg = STATUS_CFG[hw.status];
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
            <Card className={cn(
                'overflow-hidden border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
                cfg.borderColor
            )}>
                {/* Top accent */}
                <div className={cn('h-1 w-full', {
                    'bg-emerald-400': hw.status === 'active',
                    'bg-red-400': hw.status === 'overdue',
                    'bg-blue-400': hw.status === 'graded',
                })} />
                <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-snug">{hw.title}</p>
                            <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                                <BookOpen className="h-3 w-3" />{hw.subject}
                            </p>
                        </div>
                        <span className={cn(
                            'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold',
                            cfg.bgColor, cfg.textColor
                        )}>
                            {cfg.icon}{cfg.label}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                        <span className="font-mono text-[11px] text-slate-500">{hw.teacher}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">{hw.classLevel}</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            <Calendar className="h-3 w-3" />{hw.dueDate}
                        </span>
                    </div>

                    <ProgressBar value={hw.submissions} max={hw.total} color={cfg.barColor} />
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function Homework() {
    const [items] = useState<Homework[]>(INITIAL);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Status | 'all'>('all');
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => { const t = setTimeout(() => setPageVisible(true), 60); return () => clearTimeout(t); }, []);

    const displayed = items.filter(h =>
        (filter === 'all' || h.status === filter) &&
        (!search || h.title.toLowerCase().includes(search.toLowerCase()) || h.subject.toLowerCase().includes(search.toLowerCase()))
    );

    const countFor = (s: Status | 'all') =>
        s === 'all' ? items.length : items.filter(h => h.status === s).length;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .hw-root, .hw-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .hw-root .font-mono  { font-family: 'DM Mono', monospace !important; }
                @keyframes hw-float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes hw-pulse-ring { 0%{transform:scale(0.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }
                .hw-float      { animation: hw-float 3.5s ease-in-out infinite; }
                .hw-pulse-ring { animation: hw-pulse-ring 2.4s ease-out infinite; }
            `}</style>

            <div className="hw-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">

                {/* Dot grid */}
                <div className="pointer-events-none fixed inset-0 opacity-[0.25]"
                    style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-6 flex items-center gap-1.5 transition-all duration-500',
                        pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Academics</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Homework & Assignments</span>
                    </div>

                    {/* Main panel */}
                    <div className={cn(
                        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl shadow-blue-900/5 backdrop-blur-xl transition-all duration-500',
                        pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                    )}>
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6">
                            <div className="inline-flex items-center gap-2 border-b-2 border-blue-600 pb-3 pt-3.5">
                                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-bold tracking-tight text-blue-600">Assignment Tracker</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* Hero */}
                            <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="hw-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="hw-pulse-ring absolute inset-0 rounded-2xl bg-blue-400/25" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg shadow-blue-200">
                                        <BookOpen className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                        Homework & Assignments
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                                        School-wide assignment management, tracking, and submission monitoring.
                                    </p>
                                </div>
                                <Button className="mt-4 h-10 gap-2 rounded-xl bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-200 transition-all hover:scale-[1.02] hover:bg-blue-800 sm:mt-0 sm:self-start">
                                    <Plus className="h-4 w-4" /> New Homework
                                </Button>
                            </div>

                            {/* Stat cards */}
                            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {STAT_KEYS.map((s, i) => (
                                    <StatCard
                                        key={s.key}
                                        label={s.label}
                                        count={countFor(s.key)}
                                        icon={s.icon}
                                        iconBg={s.iconBg}
                                        iconText={s.iconText}
                                        active={filter === s.key}
                                        onClick={() => setFilter(s.key)}
                                        delay={80 + i * 60}
                                    />
                                ))}
                            </div>

                            {/* Search + filter */}
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by title or subject…"
                                        className="h-10 border-slate-200 bg-white pl-9 text-sm shadow-sm transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                                    />
                                </div>
                                <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                    {(['all', 'active', 'overdue', 'graded'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFilter(s)}
                                            className={cn(
                                                'rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all capitalize',
                                                filter === s
                                                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                                                    : 'text-slate-400 hover:text-slate-600'
                                            )}
                                        >{s}</button>
                                    ))}
                                </div>
                            </div>

                            <Separator className="mb-6 bg-slate-100" />

                            {/* ── Desktop table ──────────────────── */}
                            <div className="hidden md:block">
                                <Card className="overflow-hidden border border-slate-200/80 shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="border-b border-slate-100 bg-slate-50/80">
                                            <tr>
                                                {['Assignment', 'Teacher', 'Class', 'Due Date', 'Submissions', 'Status'].map(h => (
                                                    <th key={h} className={cn(
                                                        'px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400',
                                                        h === 'Assignment' ? 'text-left' : 'text-center'
                                                    )}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence mode="popLayout">
                                                {displayed.map((hw, i) => (
                                                    <TableRow key={hw.id} hw={hw} delay={i * 50} />
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                    {displayed.length === 0 && <EmptyState search={search} />}
                                </Card>
                            </div>

                            {/* ── Mobile card list ───────────────── */}
                            <div className="space-y-3 md:hidden">
                                <AnimatePresence mode="popLayout">
                                    {displayed.map((hw, i) => (
                                        <MobileCard key={hw.id} hw={hw} delay={i * 50} />
                                    ))}
                                </AnimatePresence>
                                {displayed.length === 0 && <EmptyState search={search} />}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function EmptyState({ search }: { search: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <BookOpen className="h-5 w-5 text-slate-400" />
            </div>
            <div>
                <p className="font-semibold text-slate-500">No assignments found</p>
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                    {search ? `No match for "${search}"` : 'All clear — no assignments here.'}
                </p>
            </div>
        </motion.div>
    );
}
