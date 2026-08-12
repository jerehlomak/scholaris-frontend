/**
 * Behaviour.tsx — Student behaviour incidents, rewards, and disciplinary log
 * Redesigned: Tailwind CSS + shadcn/ui, animated, fully mobile responsive
 */
import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Star, Shield, X, BookOpen, ChevronRight } from 'lucide-react';
import { Card, CardContent } from './../../components/ui/card';
import { Button } from './../../components/ui/button';
import { Input } from './../../components/ui/input';
import { Label } from './../../components/ui/label';
import { Separator } from './../../components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './../../lib/utils';

// ─────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────
type RecordType = 'incident' | 'reward' | 'warning';

interface BehaviourRecord {
    id: string; studentName: string; avatar: string; avatarColor: string;
    classLevel: string; type: RecordType; description: string; date: string;
    reportedBy: string; severity?: 'low' | 'medium' | 'high';
}

const INITIAL_RECORDS: BehaviourRecord[] = [
    { id: 'b1', studentName: 'Chinoso Obi', avatar: 'CO', avatarColor: 'bg-orange-500', classLevel: 'SS 1A', type: 'incident', description: 'Disrupted class during Mathematics period. Warned twice before being sent out.', date: '2025-03-01', reportedBy: 'Mr. Adebayo', severity: 'medium' },
    { id: 'b2', studentName: 'Ayomide Balogun', avatar: 'AB', avatarColor: 'bg-purple-500', classLevel: 'SS 1A', type: 'reward', description: 'Outstanding performance in the inter-house science quiz. Scored highest in the school.', date: '2025-02-28', reportedBy: 'Mrs. Emeka' },
    { id: 'b3', studentName: 'Amina Yusuf', avatar: 'AY', avatarColor: 'bg-red-500', classLevel: 'SS 1A', type: 'warning', description: 'Late to school three times in one week without a valid excuse.', date: '2025-02-26', reportedBy: 'Mrs. Ngozi Chukwu', severity: 'low' },
    { id: 'b4', studentName: 'Fatima Musa', avatar: 'FM', avatarColor: 'bg-pink-500', classLevel: 'SS 1A', type: 'reward', description: 'Voluntarily mentored three junior students after school. Exemplary character.', date: '2025-02-24', reportedBy: 'Mr. Ibrahim' },
    { id: 'b5', studentName: 'David Okonkwo', avatar: 'DO', avatarColor: 'bg-blue-500', classLevel: 'SS 2B', type: 'incident', description: 'Vandalism of school property — desk defaced. Referred to housemaster.', date: '2025-02-20', reportedBy: 'Mrs. Okafor', severity: 'high' },
];

const TYPE_CFG: Record<RecordType, {
    label: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
}> = {
    incident: {
        label: 'Incident',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    reward: {
        label: 'Reward',
        textColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        icon: <Star className="h-3.5 w-3.5" />,
    },
    warning: {
        label: 'Warning',
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        icon: <Shield className="h-3.5 w-3.5" />,
    },
};

const SEVERITY_CFG: Record<string, string> = {
    low: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    medium: 'bg-orange-50 text-orange-700 border border-orange-100',
    high: 'bg-red-50   text-red-700    border border-red-100',
};

interface NewForm {
    studentName: string; classLevel: string; type: RecordType;
    description: string; reportedBy: string; severity: 'low' | 'medium' | 'high';
}
const BLANK_FORM: NewForm = {
    studentName: '', classLevel: 'SS 1A', type: 'incident',
    description: '', reportedBy: '', severity: 'low',
};

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
function StatCard({
    label, count, icon, active, onClick, delay,
    iconBg, iconText,
}: {
    label: string; count: number; icon: React.ReactNode;
    active: boolean; onClick: () => void; delay: number;
    iconBg: string; iconText: string;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

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
            {/* Active indicator bar */}
            {active && (
                <motion.div
                    layoutId="statActive"
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-500"
                />
            )}
            <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
                iconBg, iconText
            )}>
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
// Record card
// ─────────────────────────────────────────────
function RecordCard({ record, delay }: { record: BehaviourRecord; delay: number }) {
    const cfg = TYPE_CFG[record.type];
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
            <Card className={cn(
                'group overflow-hidden border transition-all duration-300',
                'hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200',
                cfg.borderColor,
            )}>
                {/* Type accent bar at top */}
                <div className={cn('h-1 w-full', {
                    'bg-red-400': record.type === 'incident',
                    'bg-emerald-400': record.type === 'reward',
                    'bg-amber-400': record.type === 'warning',
                })} />

                <CardContent className="flex items-start gap-4 p-4">
                    {/* Avatar */}
                    <div className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white shadow-sm',
                        record.avatarColor
                    )}>
                        {record.avatar}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                            <p className="font-bold text-slate-900">{record.studentName}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                                {record.classLevel}
                            </span>
                            <span className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold',
                                cfg.bgColor, cfg.textColor
                            )}>
                                {cfg.icon}
                                {cfg.label}
                            </span>
                            {record.severity && (
                                <span className={cn(
                                    'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold capitalize',
                                    SEVERITY_CFG[record.severity]
                                )}>
                                    {record.severity}
                                </span>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{record.description}</p>
                        <p className="mt-1.5 font-mono text-[10px] text-slate-400">
                            Reported by {record.reportedBy} · {record.date}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Input / Select helpers (native styled)
// ─────────────────────────────────────────────
const fieldCls = cn(
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800',
    'shadow-sm transition-all outline-none',
    'focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400'
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function Behaviour() {
    const [records, setRecords] = useState<BehaviourRecord[]>(INITIAL_RECORDS);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<RecordType | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<NewForm>(BLANK_FORM);
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    const displayed = records.filter(r =>
        (filter === 'all' || r.type === filter) &&
        (!search || r.studentName.toLowerCase().includes(search.toLowerCase()))
    );

    // ── Add record (unchanged logic) ──────────
    const handleAdd = () => {
        if (!form.studentName || !form.description || !form.reportedBy) return;
        const newR: BehaviourRecord = {
            id: `b${Date.now()}`, ...form,
            avatar: form.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
            avatarColor: 'bg-slate-500',
            date: new Date().toISOString().split('T')[0],
        };
        setRecords(p => [newR, ...p]);
        setShowForm(false);
        setForm(BLANK_FORM);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .bh-root, .bh-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .bh-root .font-mono  { font-family: 'DM Mono', monospace !important; }
                @keyframes bh-float {
                    0%, 100% { transform: translateY(0); }
                    50%       { transform: translateY(-5px); }
                }
                @keyframes bh-pulse-ring {
                    0%   { transform: scale(0.9);  opacity: 0.4; }
                    100% { transform: scale(1.5);  opacity: 0; }
                }
                .bh-float      { animation: bh-float 3.5s ease-in-out infinite; }
                .bh-pulse-ring { animation: bh-pulse-ring 2.4s ease-out infinite; }
            `}</style>

            <div className="bh-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">

                {/* Dot grid */}
                <div
                    className="pointer-events-none fixed inset-0 opacity-[0.25]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn(
                        'mb-6 flex items-center gap-1.5 transition-all duration-500',
                        pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                    )}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Students</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Behaviour Management</span>
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
                                <span className="text-xs font-bold tracking-tight text-blue-600">Behaviour Log</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* ── Hero ──────────────────────────────── */}
                            <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="bh-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="bh-pulse-ring absolute inset-0 rounded-2xl bg-blue-400/25" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg shadow-blue-200">
                                        <BookOpen className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                        Behaviour Management
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                                        Track incidents, rewards, and disciplinary actions across all students.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="mt-4 h-10 gap-2 rounded-xl bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-200 transition-all hover:scale-[1.02] hover:bg-blue-800 sm:mt-0 sm:self-start"
                                >
                                    <Plus className="h-4 w-4" />
                                    Log Behaviour
                                </Button>
                            </div>

                            {/* ── Stat cards ────────────────────────── */}
                            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <StatCard delay={80} label="Total" count={records.length} icon={<Shield className="h-5 w-5" />} active={filter === 'all'} onClick={() => setFilter('all')} iconBg="bg-blue-50" iconText="text-blue-600" />
                                <StatCard delay={140} label="Incidents" count={records.filter(r => r.type === 'incident').length} icon={<AlertTriangle className="h-5 w-5" />} active={filter === 'incident'} onClick={() => setFilter('incident')} iconBg="bg-red-50" iconText="text-red-600" />
                                <StatCard delay={200} label="Rewards" count={records.filter(r => r.type === 'reward').length} icon={<Star className="h-5 w-5" />} active={filter === 'reward'} onClick={() => setFilter('reward')} iconBg="bg-emerald-50" iconText="text-emerald-600" />
                            </div>

                            {/* ── Search ────────────────────────────── */}
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search student name…"
                                        className="h-10 border-slate-200 bg-white pl-9 text-sm shadow-sm transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                                    />
                                </div>
                                {/* Filter pills */}
                                <div className="flex gap-2">
                                    {(['all', 'incident', 'warning', 'reward'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={cn(
                                                'rounded-xl border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all',
                                                filter === f
                                                    ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                                            )}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator className="mb-6 bg-slate-100" />

                            {/* ── Records list ──────────────────────── */}
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {displayed.map((r, i) => (
                                        <RecordCard key={r.id} record={r} delay={i * 50} />
                                    ))}
                                </AnimatePresence>

                                {displayed.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                                            <BookOpen className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-500">No records found</p>
                                            <p className="mt-0.5 font-mono text-xs text-slate-400">
                                                {search ? `No match for "${search}"` : 'Click "Log Behaviour" to add one.'}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal ─────────────────────────────────── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        key="modal-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
                    >
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700">
                                        <Plus className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="font-bold text-slate-900">Log Behaviour Record</span>
                                </div>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="space-y-3 p-6">
                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Student Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <input
                                        value={form.studentName}
                                        onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                                        placeholder="e.g. Chinoso Obi"
                                        className={fieldCls}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    <div>
                                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Class</Label>
                                        <input
                                            value={form.classLevel}
                                            onChange={e => setForm(f => ({ ...f, classLevel: e.target.value }))}
                                            placeholder="SS 1A"
                                            className={fieldCls}
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</Label>
                                        <select
                                            value={form.type}
                                            onChange={e => setForm(f => ({ ...f, type: e.target.value as RecordType }))}
                                            className={fieldCls}
                                        >
                                            <option value="incident">Incident</option>
                                            <option value="warning">Warning</option>
                                            <option value="reward">Reward</option>
                                        </select>
                                    </div>
                                    {form.type !== 'reward' && (
                                        <div>
                                            <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Severity</Label>
                                            <select
                                                value={form.severity}
                                                onChange={e => setForm(f => ({ ...f, severity: e.target.value as 'low' | 'medium' | 'high' }))}
                                                className={fieldCls}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Reported By <span className="text-rose-500">*</span>
                                    </Label>
                                    <input
                                        value={form.reportedBy}
                                        onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))}
                                        placeholder="e.g. Mr. Adebayo"
                                        className={fieldCls}
                                    />
                                </div>

                                <div>
                                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Description <span className="text-rose-500">*</span>
                                    </Label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Describe the incident or reward in detail…"
                                        className={cn(fieldCls, 'resize-none')}
                                    />
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                    className="h-9 rounded-xl border-slate-200 text-xs font-semibold text-slate-600"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAdd}
                                    disabled={!form.studentName || !form.description || !form.reportedBy}
                                    className="h-9 gap-1.5 rounded-xl bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-200 transition-all hover:scale-[1.02] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Save Record
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
