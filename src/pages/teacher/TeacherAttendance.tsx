/**
 * TeacherAttendance.tsx — Teacher-facing attendance page
 *
 * Teachers can:
 *   1. Pick from their assigned Form Class(es) and a date
 *   2. Mark attendance (mark roster)
 *   3. View student history for their class
 *
 * CRITICAL: Only shows classes where the teacher is the Form Teacher.
 * REDESIGN NOTE: Only the main page shell (header, tabs, selectors) has been
 * updated for the shadcn redesign. All inner components (MiniCalendar,
 * MarkAttendancePane, StudentHistoryPane, QRScannerPane) are untouched.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, History, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Pagination } from '../../components/shared/Pagination';

const API = '/api/v1';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
type Tab = 'mark' | 'history';

interface FormClass {
    id: string;
    name: string;
    level: string;
}

interface RosterStudent {
    studentId: string;
    name: string;
    admissionNo: string;
    gender: string;
    record: { status: AttendanceStatus; note?: string; markedBy: string } | null;
}

interface StudentHistory {
    studentId: string;
    name: string;
    admissionNo: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; dot: string; abbr: string }> = {
    PRESENT: { label: 'Present', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', dot: 'bg-[#10b981]', abbr: 'P' },
    ABSENT: { label: 'Absent', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500', abbr: 'A' },
    LATE: { label: 'Late', bg: 'bg-[#ff9800]/10', text: 'text-[#ff9800]', dot: 'bg-[#ff9800]', abbr: 'L' },
    EXCUSED: { label: 'Excused', bg: 'bg-[#1E4DA6]/10', text: 'text-[#1E4DA6]', dot: 'bg-[#1E4DA6]', abbr: 'E' },
};

// ─── Mini Calendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ classId, selectedDate, onSelectDate }: { classId: string; selectedDate: string; onSelectDate: (d: string) => void }) {
    const today = new Date().toISOString().split('T')[0];
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yearStr = currentDate.getFullYear();
    const { data: calData } = useSWR(
        classId ? `${API}/school/attendance/calendar?classId=${classId}&month=${monthStr}&year=${yearStr}` : null,
        fetcher
    );
    const calendar = calData?.calendar || {};

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const rateColor = (rate: number) => {
        if (rate >= 0.9) return 'bg-[#10b981]';
        if (rate >= 0.7) return 'bg-[#ff9800]';
        if (rate > 0) return 'bg-red-400';
        return 'bg-gray-100';
    };

    return (
        <Card className="bg-white border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`b${i}`} />)}
                {days.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                    const isFuture = dateStr > today;
                    const data = calendar[dateStr];
                    const isSelected = dateStr === selectedDate;
                    return (
                        <button key={day}
                            onClick={() => !isWeekend && !isFuture && onSelectDate(dateStr)}
                            disabled={isWeekend || isFuture}
                            className={`h-8 w-full rounded text-[10px] font-semibold transition-all
                                ${isSelected ? 'ring-2 ring-[#1E4DA6] ring-offset-1' : ''}
                                ${isWeekend || isFuture ? 'opacity-25 cursor-default text-gray-400' :
                                    data ? `${rateColor(data.rate)} text-white hover:opacity-90 cursor-pointer` :
                                        'bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer'}`}>
                            {day}
                        </button>
                    );
                })}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#10b981]" />≥90%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#ff9800]" />70–89%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-400" />&lt;70%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 border" />No data</span>
            </div>
        </Card>
    );
}

// ─── Mark Attendance ─────────────────────────────────────────────────────────
function MarkAttendancePane({ classId, className, date }: { classId: string; className: string; date: string }) {
    const [marks, setMarks] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const { data: rosterData, isLoading: loading, mutate } = useSWR(
        classId && date ? `${API}/school/attendance/roster?classId=${classId}&date=${date}` : null,
        fetcher
    );
    const roster: RosterStudent[] = rosterData?.roster || [];

    useEffect(() => {
        if (roster.length > 0) {
            const init: Record<string, { status: AttendanceStatus; note: string }> = {};
            roster.forEach((s) => {
                init[s.studentId] = { status: s.record?.status || 'PRESENT', note: s.record?.note || '' };
            });
            setMarks(init);
        }
    }, [rosterData]);

    const markAll = (status: AttendanceStatus) =>
        setMarks(m => Object.fromEntries(Object.keys(m).map(k => [k, { ...m[k], status }])));

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API}/school/attendance/mark`, {
                classId, date,
                records: Object.entries(marks).map(([studentId, v]) => ({ studentId, status: v.status, note: v.note })),
            }, { withCredentials: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            mutate();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1E4DA6]" /></div>;

    if (roster.length === 0) return (
        <Card className="p-10 text-center text-gray-400 bg-white border border-gray-100">
            <p className="font-medium">No active students found in {className}</p>
            <p className="text-xs mt-1">Ensure students are enrolled in this class arm.</p>
        </Card>
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(s => (
                    <button key={s} onClick={() => markAll(s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} hover:opacity-80 transition-opacity`}>
                        All {STATUS_CONFIG[s].label}
                    </button>
                ))}
                <button onClick={() => mutate()} className="ml-auto text-gray-400 hover:text-[#1E4DA6] p-1.5 rounded">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
            <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-8">#</th>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Adm. No.</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Note</th>
                                {roster[0]?.record && <th className="px-4 py-3">Marked By</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {roster.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((s, idx) => (
                                <tr key={s.studentId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-400">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#1E4DA6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{s.admissionNo}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5">
                                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(st => (
                                                <button key={st}
                                                    onClick={() => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], status: st } }))}
                                                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${marks[s.studentId]?.status === st ? `${STATUS_CONFIG[st].bg} ${STATUS_CONFIG[st].text} border-2 border-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    {STATUS_CONFIG[st].abbr}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input value={marks[s.studentId]?.note || ''}
                                            onChange={e => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], note: e.target.value } }))}
                                            placeholder="e.g. sick, trip..."
                                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-36 outline-none focus:border-[#1E4DA6]" />
                                    </td>
                                    {s.record && <td className="px-4 py-3 text-xs text-gray-500">{s.record.markedBy}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4 p-4">
                    {roster.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((s, idx) => (
                        <div key={s.studentId} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#1E4DA6] flex items-center justify-center text-white font-bold text-sm">
                                        {s.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                                        <div className="text-xs text-gray-400">{s.admissionNo}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                    #{(currentPage - 1) * PAGE_SIZE + idx + 1}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Status</label>
                                    <div className="flex gap-2">
                                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(st => (
                                            <button key={st}
                                                onClick={() => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], status: st } }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${marks[s.studentId]?.status === st ? `${STATUS_CONFIG[st].bg} ${STATUS_CONFIG[st].text} border-2 border-current` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                {STATUS_CONFIG[st].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Note</label>
                                    <input value={marks[s.studentId]?.note || ''}
                                        onChange={e => setMarks(m => ({ ...m, [s.studentId]: { ...m[s.studentId], note: e.target.value } }))}
                                        placeholder="e.g. sick, trip..."
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1E4DA6]" />
                                </div>

                                {s.record && (
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400">Marked by: {s.record.markedBy}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {roster.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={Math.ceil(roster.length / PAGE_SIZE)} 
                            totalRecords={roster.length} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center gap-4 md:justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">{roster.length} students · {className} · {date}</p>
                    <AnimatePresence mode="wait">
                        {saved ? (
                            <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 text-[#10b981] font-bold text-sm">
                                ✓ Attendance saved!
                            </motion.div>
                        ) : (
                            <Button onClick={handleSave} disabled={saving || Object.keys(marks).length === 0} className="bg-[#1E4DA6] text-white">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
}

// ─── Student History ─────────────────────────────────────────────────────────
function StudentHistoryPane({ classId }: { classId: string }) {
    const { data: histData, isLoading: loading } = useSWR(
        classId ? `${API}/school/attendance/history?classId=${classId}` : null,
        fetcher
    );
    const data: StudentHistory[] = histData?.data || [];
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1E4DA6]" /></div>;
    if (data.length === 0) return <Card className="p-10 text-center text-gray-400 bg-white border border-gray-100">No attendance history this month.</Card>;

    return (
        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3">Student</th>
                                <th className="px-5 py-3">Adm. No.</th>
                                <th className="px-5 py-3 text-[#10b981]">Present</th>
                                <th className="px-5 py-3 text-red-500">Absent</th>
                                <th className="px-5 py-3 text-[#ff9800]">Late</th>
                                <th className="px-5 py-3 text-[#1E4DA6]">Excused</th>
                                <th className="px-5 py-3">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(s => {
                                const total = s.present + s.absent + s.late + s.excused;
                                const rate = total ? Math.round(((s.present + s.late) / total) * 100) : 0;
                                return (
                                    <tr key={s.studentId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#1E4DA6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {s.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{s.admissionNo}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-[#10b981]">{s.present}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-red-500">{s.absent}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-[#ff9800]">{s.late}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-[#1E4DA6]">{s.excused}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${rate}%` }} />
                                                </div>
                                                <span className={`text-xs font-bold ${rate >= 90 ? 'text-[#10b981]' : rate >= 70 ? 'text-[#ff9800]' : 'text-red-500'}`}>{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden space-y-4 p-4">
                    {data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((s, idx) => {
                        const total = s.present + s.absent + s.late + s.excused;
                        const rate = total ? Math.round(((s.present + s.late) / total) * 100) : 0;
                        return (
                            <div key={s.studentId} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#1E4DA6] flex items-center justify-center text-white font-bold text-sm">
                                            {s.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                                            <div className="text-xs text-gray-400">{s.admissionNo}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                        #{(currentPage - 1) * PAGE_SIZE + idx + 1}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    <div className="bg-[#10b981]/10 text-center py-2 rounded-xl border border-[#10b981]/20">
                                        <div className="text-[10px] font-bold text-[#10b981] uppercase">P</div>
                                        <div className="text-sm font-bold text-[#10b981]">{s.present}</div>
                                    </div>
                                    <div className="bg-red-50 text-center py-2 rounded-xl border border-red-100">
                                        <div className="text-[10px] font-bold text-red-500 uppercase">A</div>
                                        <div className="text-sm font-bold text-red-500">{s.absent}</div>
                                    </div>
                                    <div className="bg-[#ff9800]/10 text-center py-2 rounded-xl border border-[#ff9800]/20">
                                        <div className="text-[10px] font-bold text-[#ff9800] uppercase">L</div>
                                        <div className="text-sm font-bold text-[#ff9800]">{s.late}</div>
                                    </div>
                                    <div className="bg-[#1E4DA6]/5 text-center py-2 rounded-xl border border-[#1E4DA6]/10">
                                        <div className="text-[10px] font-bold text-[#1E4DA6] uppercase">E</div>
                                        <div className="text-sm font-bold text-[#1E4DA6]">{s.excused}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${rate >= 90 ? 'bg-[#10b981]' : rate >= 70 ? 'bg-[#ff9800]' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                                    </div>
                                    <span className={`text-xs font-bold ${rate >= 90 ? 'text-[#10b981]' : rate >= 70 ? 'text-[#ff9800]' : 'text-red-500'}`}>{rate}% Rate</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            {data.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={Math.ceil(data.length / PAGE_SIZE)} 
                        totalRecords={data.length} 
                        onPageChange={setCurrentPage} 
                    />
                </div>
            )}
        </Card>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TeacherAttendance() {
    // All state and data logic kept exactly as-is
    const today = new Date().toISOString().split('T')[0];
    const [tab, setTab] = useState<Tab>('mark');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(today);

    const { data: classesData, isLoading: loadingClasses } = useSWR(
        `${API}/teachers/me/form-class`,
        fetcher
    );
    const formClasses: FormClass[] = classesData?.formClasses || [];

    useEffect(() => {
        if (formClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(formClasses[0].id);
        }
    }, [formClasses, selectedClassId]);

    const selectedClass = formClasses.find(c => c.id === selectedClassId);

    return (
        <div className="max-w-[1200px] mx-auto w-full pb-10">
            {/* ── Header + Selectors ── */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Mark and track student attendance for your form class</p>
                </div>

                {/* Class + Date selectors */}
                <div className="flex items-center gap-3 flex-wrap">
                    {loadingClasses ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : formClasses.length === 0 ? (
                        <span className="text-sm text-slate-400 italic">No form class assigned</span>
                    ) : (
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-44 border-slate-200 h-9 text-sm">
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                {formClasses.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Input
                        type="date"
                        value={selectedDate}
                        max={today}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-40 border-slate-200 h-9 text-sm"
                    />
                </div>
            </div>

            {/* ── Tab Navigation (shadcn Tabs) ── */}
            <div className="mb-6">
                <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
                    <TabsList className="bg-slate-100 p-1 h-10">
                        <TabsTrigger value="mark" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-[#173F8C] data-[state=active]:shadow-sm">
                            <ClipboardCheck size={14} /> Mark Attendance
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-[#173F8C] data-[state=active]:shadow-sm">
                            <History size={14} /> Student History
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {!selectedClassId && !loadingClasses ? (
                <Card className="p-12 text-center bg-white border border-dashed border-slate-300">
                    <p className="font-semibold text-slate-700 text-lg mb-2">No Form Class Assigned</p>
                    <p className="text-sm text-slate-400">You have not been assigned as a Form Teacher for any class. Please contact the Admin.</p>
                </Card>
            ) : (
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {tab === 'mark' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Calendar sidebar — untouched */}
                            <div className="lg:col-span-1">
                                <MiniCalendar
                                    classId={selectedClassId}
                                    selectedDate={selectedDate}
                                    onSelectDate={setSelectedDate}
                                />
                            </div>
                            {/* Main marking sheet — untouched */}
                            <div className="lg:col-span-3">
                                <div className="mb-3">
                                    <h3 className="font-bold text-slate-900 text-lg">
                                        {selectedClass?.name} ·{' '}
                                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Click a status button to set each student's attendance, then press Save.</p>
                                </div>
                                <MarkAttendancePane
                                    classId={selectedClassId}
                                    className={selectedClass?.name || ''}
                                    date={selectedDate}
                                />
                            </div>
                        </div>
                    )}
                    {tab === 'history' && <StudentHistoryPane classId={selectedClassId} />}
                </motion.div>
            )}
        </div>
    );
}
