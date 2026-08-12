/**
 * Attendance.tsx — Full-stack Attendance Tracking System
 * Redesigned: Tailwind CSS + shadcn/ui, animated, fully mobile responsive
 * All API calls, SWR hooks, and business logic unchanged.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2, List, History, ClipboardList, RefreshCw, Loader2,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, BookOpen, CalendarDays
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import axios from 'axios';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { cn } from '../../../lib/utils';

const API = '/api/v1/school';

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
type Tab = 'overview' | 'mark' | 'roster' | 'history';

interface AttendanceStats {
    date: string; totalStudents: number;
    present: number; absent: number; late: number; excused: number; markedCount: number;
}
interface RosterStudent {
    studentId: string; name: string; admissionNo: string; gender: string;
    record: { status: AttendanceStatus; note?: string; markedBy: string } | null;
}
interface StudentHistoryEntry {
    studentId: string; name: string; admissionNo: string;
    present: number; absent: number; late: number; excused: number;
    records: Record<string, AttendanceStatus>;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AttendanceStatus, {
    label: string; bgColor: string; textColor: string; dotColor: string;
    borderColor: string; abbr: string; icon: React.ReactNode;
}> = {
    PRESENT: { label: 'Present', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', dotColor: 'bg-emerald-500', borderColor: 'border-emerald-300', abbr: 'P', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    ABSENT: { label: 'Absent', bgColor: 'bg-red-50', textColor: 'text-red-600', dotColor: 'bg-red-500', borderColor: 'border-red-300', abbr: 'A', icon: <XCircle className="h-3.5 w-3.5" /> },
    LATE: { label: 'Late', bgColor: 'bg-amber-50', textColor: 'text-amber-600', dotColor: 'bg-amber-500', borderColor: 'border-amber-300', abbr: 'L', icon: <Clock className="h-3.5 w-3.5" /> },
    EXCUSED: { label: 'Excused', bgColor: 'bg-blue-50', textColor: 'text-blue-600', dotColor: 'bg-blue-500', borderColor: 'border-blue-300', abbr: 'E', icon: <BookOpen className="h-3.5 w-3.5" /> },
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const fieldCls = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AttendanceStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold', cfg.bgColor, cfg.textColor)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dotColor)} />
            {cfg.label}
        </span>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, of: total, iconBg, iconText, icon, delay }: {
    label: string; value: number; of?: number;
    iconBg: string; iconText: string; icon: React.ReactNode; delay: number;
}) {
    const pct = total ? Math.round((value / total) * 100) : null;
    const [vis, setVis] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
    return (
        <div className={cn(
            'flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-500',
            'hover:shadow-md hover:-translate-y-0.5',
            vis ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        )}>
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg, iconText)}>{icon}</div>
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <h4 className="font-mono text-2xl font-bold text-slate-900">{value.toLocaleString()}</h4>
                {pct !== null && <p className="font-mono text-[10px] text-slate-400">{pct}% of total</p>}
            </div>
        </div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
    const sz = size === 'sm' ? 'h-8 w-8 text-xs rounded-xl' : 'h-10 w-10 text-sm rounded-xl';
    return (
        <div className={cn('flex shrink-0 items-center justify-center font-bold text-white shadow-sm', avatarBg(name), sz)}>
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
}

// ─── Calendar heatmap ─────────────────────────────────────────────────────────
function AttendanceCalendar({ classId, onSelectDate, selectedDate }: {
    classId: string; onSelectDate: (d: string) => void; selectedDate: string;
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yearStr = currentDate.getFullYear();

    const { data: calData } = useSWR(
        classId ? `${API}/attendance/calendar?classId=${encodeURIComponent(classId)}&month=${monthStr}&year=${yearStr}` : null, fetcher
    );
    const calendar: Record<string, { rate: number; present: number; total: number }> = calData?.calendar || {};

    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const rateColor = (rate: number) =>
        rate >= 0.9 ? 'bg-emerald-500 text-white' :
            rate >= 0.7 ? 'bg-amber-400 text-white' :
                rate > 0 ? 'bg-red-400 text-white' : 'bg-slate-100 text-slate-500';

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-slate-900">Attendance Calendar</p>
                <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                        className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="min-w-[120px] text-center font-mono text-xs font-bold text-slate-700">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                        className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"><ChevronRight className="h-4 w-4" /></button>
                </div>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center font-mono text-[10px] font-bold text-slate-400">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map(i => <div key={`b${i}`} />)}
                {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isWeekend = [0, 6].includes(new Date(year, month, day).getDay());
                    const data = calendar[dateStr];
                    const isSelected = dateStr === selectedDate;
                    return (
                        <button key={day} onClick={() => !isWeekend && onSelectDate(dateStr)}
                            title={data ? `${Math.round(data.rate * 100)}% attendance` : ''}
                            className={cn(
                                'flex h-9 w-full items-center justify-center rounded-xl font-mono text-xs font-bold transition-all',
                                isSelected && 'ring-2 ring-blue-500 ring-offset-1',
                                isWeekend ? 'cursor-default opacity-25 text-slate-400'
                                    : data ? cn(rateColor(data.rate), 'hover:opacity-80 cursor-pointer')
                                        : 'cursor-pointer bg-slate-50 text-slate-500 hover:bg-slate-100'
                            )}>
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-500">
                {[['bg-emerald-500', '≥90%'], ['bg-amber-400', '70–89%'], ['bg-red-400', '<70%'], ['bg-slate-100 border border-slate-200', 'No data']].map(([bg, lbl]) => (
                    <span key={lbl} className="flex items-center gap-1.5">
                        <span className={cn('h-3 w-3 rounded-md', bg)} />{lbl}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Mark Attendance ──────────────────────────────────────────────────────────
function MarkAttendance({ classId, classes, onClassChange }: {
    classId: string; classes: { id: string; name: string }[]; onClassChange: (id: string) => void;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [marks, setMarks] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const { data: rosterData, isLoading: loading, mutate } = useSWR(
        classId && date ? `${API}/attendance/roster?classId=${encodeURIComponent(classId)}&date=${date}` : null, fetcher
    );
    const roster: RosterStudent[] = rosterData?.roster || [];

    useEffect(() => {
        if (roster.length > 0) {
            const init: Record<string, { status: AttendanceStatus; note: string }> = {};
            roster.forEach(s => { init[s.studentId] = { status: s.record?.status || 'PRESENT', note: s.record?.note || '' }; });
            setMarks(init);
        }
    }, [rosterData]);

    const markAll = (status: AttendanceStatus) =>
        setMarks(m => Object.fromEntries(Object.keys(m).map(k => [k, { ...m[k], status }])));

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API}/attendance/mark`, {
                classId, date,
                records: Object.entries(marks).map(([studentId, v]) => ({ studentId, status: v.status, note: v.note })),
            }, { withCredentials: true });
            setSaved(true); setTimeout(() => setSaved(false), 2500); mutate();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <select value={classId} onChange={e => onClassChange(e.target.value)} className={fieldCls}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} className={fieldCls} />
                <div className="ml-auto flex flex-wrap gap-2">
                    {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                            <button key={s} onClick={() => markAll(s)}
                                className={cn('rounded-xl border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-all hover:opacity-80', cfg.bgColor, cfg.textColor, cfg.borderColor)}>
                                All {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
            ) : roster.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                        <ClipboardList className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-500">No active students for {classes.find(c => c.id === classId)?.name}</p>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50/80">
                                <tr>
                                    {['#', 'Student', 'Adm. No.', 'Status', 'Note', 'Marked By'].map(h => (
                                        <th key={h} className="px-4 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {roster.map((s, idx) => (
                                    <tr key={s.studentId} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={s.name} />
                                                <span className="font-bold text-slate-900">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.admissionNo}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(st => {
                                                    const cfg = STATUS_CONFIG[st];
                                                    const active = marks[s.studentId]?.status === st;
                                                    return (
                                                        <button key={st}
                                                            onClick={() => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], status: st } }))}
                                                            className={cn(
                                                                'flex h-7 w-7 items-center justify-center rounded-xl font-mono text-[10px] font-bold transition-all',
                                                                active ? cn(cfg.bgColor, cfg.textColor, 'border-2', cfg.borderColor) : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                            )}>
                                                            {cfg.abbr}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={marks[s.studentId]?.note || ''}
                                                onChange={e => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], note: e.target.value } }))}
                                                placeholder="e.g. sick, trip…"
                                                className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </td>
                                        {s.record && <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{s.record.markedBy}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                            <p className="font-mono text-xs text-slate-500">
                                {roster.length} students · {classes.find(c => c.id === classId)?.name} · {date}
                            </p>
                            <AnimatePresence mode="wait">
                                {saved ? (
                                    <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-2 font-bold text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" /> Attendance saved!
                                    </motion.div>
                                ) : (
                                    <Button onClick={handleSave} disabled={saving || Object.keys(marks).length === 0}
                                        className="h-9 gap-2 rounded-xl bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-800 disabled:opacity-50">
                                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {saving ? 'Saving…' : 'Save Attendance'}
                                    </Button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="space-y-2 md:hidden">
                        {roster.map(s => {
                            const currentStatus = marks[s.studentId]?.status || 'PRESENT';
                            const cfg = STATUS_CONFIG[currentStatus];
                            return (
                                <div key={s.studentId} className={cn('rounded-2xl border-2 p-4 transition-all', cfg.borderColor, cfg.bgColor + '/30')}>
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={s.name} size="md" />
                                            <div>
                                                <p className="font-bold text-slate-900">{s.name}</p>
                                                <p className="font-mono text-[11px] text-slate-400">{s.admissionNo}</p>
                                            </div>
                                        </div>
                                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold', cfg.bgColor, cfg.textColor)}>
                                            {cfg.icon}{cfg.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex gap-2">
                                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(st => {
                                                const c = STATUS_CONFIG[st];
                                                const active = marks[s.studentId]?.status === st;
                                                return (
                                                    <button key={st}
                                                        onClick={() => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], status: st } }))}
                                                        className={cn('flex h-9 w-9 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all',
                                                            active ? cn(c.bgColor, c.textColor, 'border-2', c.borderColor) : 'bg-slate-100 text-slate-500')}>
                                                        {c.abbr}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <input
                                            value={marks[s.studentId]?.note || ''}
                                            onChange={e => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], note: e.target.value } }))}
                                            placeholder="Note…"
                                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Mobile save bar */}
                        <div className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <p className="font-mono text-xs text-slate-500">{roster.length} students · {date}</p>
                                <AnimatePresence mode="wait">
                                    {saved ? (
                                        <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="flex items-center gap-1.5 font-bold text-emerald-600 text-sm">
                                            <CheckCircle2 className="h-4 w-4" /> Saved!
                                        </motion.div>
                                    ) : (
                                        <Button onClick={handleSave} disabled={saving || Object.keys(marks).length === 0}
                                            className="h-9 gap-2 rounded-xl bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-200">
                                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            {saving ? 'Saving…' : 'Save'}
                                        </Button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Read-only Roster View ────────────────────────────────────────────────────
function RosterView({ classId, date }: { classId: string; date: string }) {
    const { data: rosterData, isLoading: loading } = useSWR(
        classId && date ? `${API}/attendance/roster?classId=${encodeURIComponent(classId)}&date=${date}` : null, fetcher
    );
    const roster: RosterStudent[] = rosterData?.roster || [];

    if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>;
    const marked = roster.filter(s => s.record);

    if (marked.length === 0) return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <List className="h-5 w-5 text-slate-400" />
            </div>
            <div>
                <p className="font-semibold text-slate-500">No attendance records for {date}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-400">Use "Mark Attendance" tab to record.</p>
            </div>
        </div>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Desktop */}
            <table className="hidden w-full text-left text-sm md:table">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>
                        {['#', 'Student', 'Adm. No.', 'Status', 'Note', 'Marked By'].map(h => (
                            <th key={h} className="px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {marked.map((s, i) => (
                        <tr key={s.studentId} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                            <td className="px-5 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                            <td className="px-5 py-3">
                                <div className="flex items-center gap-3"><Avatar name={s.name} /><span className="font-bold text-slate-900">{s.name}</span></div>
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.admissionNo}</td>
                            <td className="px-5 py-3">{s.record && <StatusBadge status={s.record.status} />}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.record?.note || '—'}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.record?.markedBy || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Mobile */}
            <div className="divide-y divide-slate-50 md:hidden">
                {marked.map(s => (
                    <div key={s.studentId} className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar name={s.name} size="md" />
                            <div>
                                <p className="font-bold text-slate-900">{s.name}</p>
                                <p className="font-mono text-[11px] text-slate-400">{s.admissionNo}</p>
                            </div>
                        </div>
                        {s.record && <StatusBadge status={s.record.status} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Student History ──────────────────────────────────────────────────────────
function StudentHistory({ classId }: { classId: string }) {
    const { data: histData, isLoading: loading } = useSWR(
        classId ? `${API}/attendance/history?classId=${encodeURIComponent(classId)}` : null, fetcher
    );
    const data: StudentHistoryEntry[] = histData?.data || [];

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
    if (data.length === 0) return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><History className="h-5 w-5 text-slate-400" /></div>
            <p className="font-semibold text-slate-500">No attendance history this month</p>
        </div>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Desktop */}
            <table className="hidden w-full text-left text-sm md:table">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>
                        {[
                            { h: 'Student', cls: '' },
                            { h: 'Adm. No.', cls: '' },
                            { h: 'Present', cls: 'text-emerald-600' },
                            { h: 'Absent', cls: 'text-red-500' },
                            { h: 'Late', cls: 'text-amber-500' },
                            { h: 'Excused', cls: 'text-blue-500' },
                            { h: 'Rate', cls: '' },
                        ].map(({ h, cls }) => (
                            <th key={h} className={cn('px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400', cls)}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map(s => {
                        const total = s.present + s.absent + s.late + s.excused;
                        const rate = total ? Math.round(((s.present + s.late) / total) * 100) : 0;
                        return (
                            <tr key={s.studentId} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3"><Avatar name={s.name} /><span className="font-bold text-slate-900">{s.name}</span></div>
                                </td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.admissionNo}</td>
                                <td className="px-5 py-3 font-mono text-sm font-bold text-emerald-600">{s.present}</td>
                                <td className="px-5 py-3 font-mono text-sm font-bold text-red-500">{s.absent}</td>
                                <td className="px-5 py-3 font-mono text-sm font-bold text-amber-500">{s.late}</td>
                                <td className="px-5 py-3 font-mono text-sm font-bold text-blue-500">{s.excused}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                                className={cn('h-full rounded-full', rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-400' : 'bg-red-500')} />
                                        </div>
                                        <span className={cn('font-mono text-xs font-bold', rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600')}>{rate}%</span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Mobile */}
            <div className="divide-y divide-slate-50 md:hidden">
                {data.map(s => {
                    const total = s.present + s.absent + s.late + s.excused;
                    const rate = total ? Math.round(((s.present + s.late) / total) * 100) : 0;
                    return (
                        <div key={s.studentId} className="p-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar name={s.name} size="md" />
                                    <div>
                                        <p className="font-bold text-slate-900">{s.name}</p>
                                        <p className="font-mono text-[11px] text-slate-400">{s.admissionNo}</p>
                                    </div>
                                </div>
                                <span className={cn('font-mono text-sm font-black', rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600')}>{rate}%</span>
                            </div>
                            <div className="flex gap-3 text-xs">
                                {[
                                    { lbl: 'P', val: s.present, cls: 'text-emerald-600 bg-emerald-50' },
                                    { lbl: 'A', val: s.absent, cls: 'text-red-600 bg-red-50' },
                                    { lbl: 'L', val: s.late, cls: 'text-amber-600 bg-amber-50' },
                                    { lbl: 'E', val: s.excused, cls: 'text-blue-600 bg-blue-50' },
                                ].map(({ lbl, val, cls }) => (
                                    <div key={lbl} className={cn('flex flex-1 flex-col items-center rounded-xl py-1.5 font-mono font-bold', cls)}>
                                        <span className="text-[10px] opacity-70">{lbl}</span>
                                        <span>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const [tab, setTab] = useState<Tab>('mark');
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedClass, setSelectedClass] = useState('');
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => { const t = setTimeout(() => setPageVisible(true), 60); return () => clearTimeout(t); }, []);

    const { data: classesData } = useSWR(`${API}/classes/all`, fetcher);
    const classes: { id: string; name: string }[] = (classesData?.classes || []).map((c: any) => ({ id: c.id, name: c.name }));

    useEffect(() => {
        if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0].id);
    }, [classesData, selectedClass]);

    const { data: statsData, isLoading: loadingStats, mutate: fetchStats } = useSWR(
        selectedClass ? `${API}/attendance/stats?date=${selectedDate}&classId=${encodeURIComponent(selectedClass)}` : null, fetcher
    );
    const stats: AttendanceStats | null = statsData || null;

    const today_ = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const tabs: { key: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
        { key: 'mark', label: 'Mark Attendance', shortLabel: 'Mark', icon: <ClipboardList className="h-3.5 w-3.5" /> },
        { key: 'overview', label: 'Overview', shortLabel: 'Overview', icon: <BarChart2 className="h-3.5 w-3.5" /> },
        { key: 'roster', label: 'Daily Roster', shortLabel: 'Roster', icon: <List className="h-3.5 w-3.5" /> },
        { key: 'history', label: 'Monthly History', shortLabel: 'History', icon: <History className="h-3.5 w-3.5" /> },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .att-root, .att-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .att-root .font-mono   { font-family: 'DM Mono', monospace !important; }
                @keyframes att-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes att-pulse { 0%{transform:scale(0.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }
                .att-float { animation: att-float 3.5s ease-in-out infinite; }
                .att-pulse { animation: att-pulse 2.4s ease-out infinite; }
            `}</style>

            <div className="att-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.25]"
                    style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-6 flex items-center gap-1.5 transition-all duration-500', pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Academics</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Attendance Tracking</span>
                    </div>

                    {/* Main panel */}
                    <div className={cn(
                        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl shadow-blue-900/5 backdrop-blur-xl transition-all duration-500',
                        pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                    )}>
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6">
                            <div className="inline-flex items-center gap-2 border-b-2 border-blue-600 pb-3 pt-3.5">
                                <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-bold tracking-tight text-blue-600">Attendance System</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* Hero + toolbar */}
                            <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="att-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="att-pulse absolute inset-0 rounded-2xl bg-blue-400/25" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg shadow-blue-200">
                                        <CalendarDays className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Attendance Tracking</h2>
                                    <p className="mt-1 font-mono text-xs text-slate-400">{today_}</p>
                                </div>
                                <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:self-start">
                                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={cn(fieldCls, 'pr-8')}>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button onClick={() => fetchStats()}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-blue-600">
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* KPI cards */}
                            {loadingStats ? (
                                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {[0, 1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
                                </div>
                            ) : stats ? (
                                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {[
                                        { label: 'Present Today', value: stats.present, of: stats.totalStudents, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', icon: <CheckCircle2 className="h-5 w-5" />, delay: 80 },
                                        { label: 'Absent', value: stats.absent, of: stats.totalStudents, iconBg: 'bg-red-50', iconText: 'text-red-600', icon: <XCircle className="h-5 w-5" />, delay: 140 },
                                        { label: 'Late', value: stats.late, of: stats.totalStudents, iconBg: 'bg-amber-50', iconText: 'text-amber-600', icon: <Clock className="h-5 w-5" />, delay: 200 },
                                        { label: 'Excused', value: stats.excused, of: stats.totalStudents, iconBg: 'bg-blue-50', iconText: 'text-blue-600', icon: <BookOpen className="h-5 w-5" />, delay: 260 },
                                    ].map(s => <StatCard key={s.label} {...s} />)}
                                </div>
                            ) : null}

                            {/* Tab nav */}
                            <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
                                {tabs.map(t => (
                                    <button key={t.key} onClick={() => setTab(t.key)}
                                        className={cn(
                                            'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide transition-all sm:px-4',
                                            tab === t.key ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                                        )}>
                                        {t.icon}
                                        <span className="hidden sm:inline">{t.label}</span>
                                        <span className="sm:hidden">{t.shortLabel}</span>
                                    </button>
                                ))}
                            </div>

                            <Separator className="mb-6 bg-slate-100" />

                            {/* Tab content */}
                            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                                {tab === 'mark' && (
                                    <MarkAttendance classId={selectedClass} classes={classes} onClassChange={setSelectedClass} />
                                )}
                                {tab === 'overview' && (
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                        <div className="lg:col-span-1">
                                            <AttendanceCalendar classId={selectedClass} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                                        </div>
                                        <div className="space-y-3 lg:col-span-2">
                                            <p className="font-bold text-slate-900">
                                                {classes.find(c => c.id === selectedClass)?.name} · {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <RosterView classId={selectedClass} date={selectedDate} />
                                        </div>
                                    </div>
                                )}
                                {tab === 'roster' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today} className={fieldCls} />
                                            <span className="font-mono text-xs text-slate-500">
                                                {classes.find(c => c.id === selectedClass)?.name} · Daily roster
                                            </span>
                                        </div>
                                        <RosterView classId={selectedClass} date={selectedDate} />
                                    </div>
                                )}
                                {tab === 'history' && <StudentHistory classId={selectedClass} />}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
