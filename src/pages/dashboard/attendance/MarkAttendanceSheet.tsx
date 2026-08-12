/** MarkAttendanceSheet — teacher's one-click attendance marking interface */
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
    useAttendance,
    MOCK_STUDENTS,
    STATUS_CONFIG,
    type AttendanceStatus,
} from '../../../context/AttendanceContext';

interface Props {
    classLevel: string;
    date: string;
    teacherName?: string;
    onSaved?: () => void;
}

type DraftEntry = { studentId: string; status: AttendanceStatus; note: string };

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
    present: <CheckCircle2 className="w-4 h-4" />,
    absent: <XCircle className="w-4 h-4" />,
    late: <Clock className="w-4 h-4" />,
    excused: <AlertCircle className="w-4 h-4" />,
};

export function MarkAttendanceSheet({ classLevel, date, teacherName = 'Teacher', onSaved }: Props) {
    const { getRecordsForClass, markAttendance } = useAttendance();
    const students = MOCK_STUDENTS.filter(s => s.classLevel === classLevel);

    // Build initial draft from existing records
    const buildDraft = (): DraftEntry[] => {
        const existing = getRecordsForClass(classLevel, date);
        return students.map(s => {
            const rec = existing.find(r => r.studentId === s.id);
            return { studentId: s.id, status: rec?.status ?? 'present', note: rec?.note ?? '' };
        });
    };

    const [draft, setDraft] = useState<DraftEntry[]>(buildDraft);
    const [saved, setSaved] = useState(false);

    // Rebuild when class/date changes
    useEffect(() => { setDraft(buildDraft()); setSaved(false); }, [classLevel, date]);

    const setStatus = (studentId: string, status: AttendanceStatus) =>
        setDraft(prev => prev.map(e => e.studentId === studentId ? { ...e, status } : e));

    const markAll = (status: AttendanceStatus) =>
        setDraft(prev => prev.map(e => ({ ...e, status })));

    const handleSave = () => {
        markAttendance(draft.map(e => ({
            studentId: e.studentId,
            classLevel,
            date,
            status: e.status,
            note: e.note || undefined,
            markedBy: teacherName,
        })));
        setSaved(true);
        onSaved?.();
    };

    const summary = STATUS_CYCLE.reduce((acc, s) => {
        acc[s] = draft.filter(e => e.status === s).length;
        return acc;
    }, {} as Record<AttendanceStatus, number>);

    if (students.length === 0) {
        return (
            <Card className="p-10 text-center text-gray-400 bg-white border border-gray-100">
                No students found for {classLevel}
            </Card>
        );
    }

    return (
        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <div className="flex-1 flex flex-wrap gap-2">
                    {STATUS_CYCLE.map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                            <button
                                key={s}
                                onClick={() => markAll(s)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${cfg.bg} ${cfg.color} border-current/20 hover:opacity-80`}
                            >
                                {STATUS_ICONS[s]} Mark All {cfg.label}
                            </button>
                        );
                    })}
                </div>
                {/* Summary pills */}
                <div className="flex gap-2">
                    {STATUS_CYCLE.map(s => (
                        <span key={s} className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`}>
                            {summary[s]} {s[0].toUpperCase()}
                        </span>
                    ))}
                </div>
            </div>

            {/* Student Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-5 py-3 text-left">#</th>
                            <th className="px-5 py-3 text-left">Student</th>
                            <th className="px-5 py-3 text-left">Adm. No.</th>
                            <th className="px-5 py-3 text-center">Status (click to cycle)</th>
                            <th className="px-5 py-3 text-left">Note</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {students.map((student, idx) => {
                            const entry = draft.find(e => e.studentId === student.id)!;
                            const cfg = STATUS_CONFIG[entry.status];
                            return (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3 text-sm text-gray-400">{idx + 1}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 ${student.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                {student.avatar}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">{student.admissionNo}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* Quick status buttons */}
                                            {STATUS_CYCLE.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setStatus(student.id, s)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${entry.status === s
                                                        ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ring-2 ring-current/30`
                                                        : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                    title={STATUS_CONFIG[s].label}
                                                >
                                                    {STATUS_ICONS[s]}
                                                </button>
                                            ))}
                                            {/* Status badge */}
                                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <input
                                            type="text"
                                            placeholder="Optional note..."
                                            value={entry.note}
                                            onChange={e => setDraft(prev => prev.map(d => d.studentId === student.id ? { ...d, note: e.target.value } : d))}
                                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#0036a1]"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-[#f8fafc]">
                <p className="text-xs text-gray-500">{students.length} students · {date}</p>
                <Button onClick={handleSave} className={`flex items-center gap-2 ${saved ? 'bg-[#6bc048]' : 'bg-[#0036a1]'} text-white`}>
                    {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Attendance</>}
                </Button>
            </div>
        </Card>
    );
}
