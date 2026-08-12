
import { Card } from '../../../components/ui/card';
import { Users, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Props {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
}

export function AttendanceStatCards({ totalStudents, presentToday, absentToday, lateToday }: Props) {
    const rate = totalStudents > 0 ? Math.round(((presentToday + lateToday) / totalStudents) * 100) : 0;

    const cards = [
        { icon: <Users className="w-5 h-5" />, label: 'Total Students', value: totalStudents, color: 'bg-[#0036a1]/10 text-[#0036a1]' },
        { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Present Today', value: presentToday, color: 'bg-[#6bc048]/10 text-[#6bc048]' },
        { icon: <XCircle className="w-5 h-5" />, label: 'Absent Today', value: absentToday, color: 'bg-red-100 text-red-600' },
        { icon: <Clock className="w-5 h-5" />, label: 'Late Today', value: lateToday, color: 'bg-[#ff9800]/10 text-[#ff9800]' },
        { icon: <AlertCircle className="w-5 h-5" />, label: 'Attendance Rate', value: `${rate}%`, color: 'bg-purple-100 text-purple-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {cards.map((c, i) => (
                <Card key={i} className="p-4 bg-white border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>{c.icon}</div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">{c.label}</p>
                        <h4 className="text-xl font-bold text-gray-900">{c.value}</h4>
                    </div>
                </Card>
            ))}
        </div>
    );
}
