/** StudentAttendanceHistory — per-student attendance breakdown table */
import { Card } from '../../../components/ui/card';
import { MOCK_STUDENTS, STATUS_CONFIG, useAttendance } from '../../../context/AttendanceContext';

interface Props { classLevel: string; }

export function StudentAttendanceHistory({ classLevel }: Props) {
    const { records, getStudentStats } = useAttendance();
    const students = MOCK_STUDENTS.filter(s => s.classLevel === classLevel);

    // Get unique dates for columns
    const dates = [...new Set(
        records.filter(r => r.classLevel === classLevel).map(r => r.date)
    )].sort().slice(-7); // last 7 recorded days

    return (
        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 sticky left-0 bg-[#f8fafc] min-w-[180px]">Student</th>
                            {dates.map(d => (
                                <th key={d} className="px-3 py-3 text-center whitespace-nowrap">
                                    {new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center">Rate</th>
                            <th className="px-4 py-3 text-center">P</th>
                            <th className="px-4 py-3 text-center">A</th>
                            <th className="px-4 py-3 text-center">L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {students.map(student => {
                            const stats = getStudentStats(student.id);
                            return (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 sticky left-0 bg-white">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 ${student.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                {student.avatar}
                                            </div>
                                            <span className="font-semibold text-gray-900 truncate max-w-[120px]">{student.name}</span>
                                        </div>
                                    </td>
                                    {dates.map(d => {
                                        const rec = records.find(r => r.studentId === student.id && r.date === d);
                                        const cfg = rec ? STATUS_CONFIG[rec.status] : null;
                                        return (
                                            <td key={d} className="px-3 py-3 text-center">
                                                {cfg ? (
                                                    <span className={`inline-block w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                                                        {rec!.status[0].toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">–</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.rate >= 80 ? 'bg-[#10b981]/10 text-[#3a7a1f]' : stats.rate >= 60 ? 'bg-[#ff9800]/10 text-[#b86000]' : 'bg-red-50 text-red-600'}`}>
                                            {stats.rate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-[#10b981] font-bold">{stats.present}</td>
                                    <td className="px-4 py-3 text-center text-red-500 font-bold">{stats.absent}</td>
                                    <td className="px-4 py-3 text-center text-[#ff9800] font-bold">{stats.late}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
