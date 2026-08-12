/** StudentAttendanceRow — single student's attendance history for quick overview */
import { Card } from '../../../components/ui/card';
import { useAttendance, MOCK_STUDENTS, STATUS_CONFIG } from '../../../context/AttendanceContext';

interface Props {
    classLevel: string;
    date: string;
}

export function AttendanceRoster({ classLevel, date }: Props) {
    const { records } = useAttendance();
    const students = MOCK_STUDENTS.filter(s => s.classLevel === classLevel);
    const dayRecords = records.filter(r => r.classLevel === classLevel && r.date === date);

    if (dayRecords.length === 0) {
        return (
            <Card className="p-10 text-center text-gray-400 bg-white border border-gray-100 shadow-sm">
                <p className="font-medium">No records for {classLevel} on {date}</p>
                <p className="text-xs mt-1">Use the "Mark Attendance" tab to record today's attendance.</p>
            </Card>
        );
    }

    return (
        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-5 py-3">#</th>
                            <th className="px-5 py-3">Student</th>
                            <th className="px-5 py-3">Adm. No.</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Note</th>
                            <th className="px-5 py-3">Marked By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {students.map((student, idx) => {
                            const rec = dayRecords.find(r => r.studentId === student.id);
                            const cfg = rec ? STATUS_CONFIG[rec.status] : null;
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
                                        {cfg ? (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {cfg.label}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">{rec?.note || '—'}</td>
                                    <td className="px-5 py-3 text-sm text-gray-500">{rec?.markedBy || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
