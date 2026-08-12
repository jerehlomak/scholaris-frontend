import { Card } from '../../../../components/ui/card';
import { Radio, Calendar, Users, Clock } from 'lucide-react';

interface Props {
    liveCount: number;
    upcomingCount: number;
    totalCount: number;
}

export function LiveStats({ liveCount, upcomingCount, totalCount }: Props) {
    const stats = [
        { icon: <Radio className="w-5 h-5" />, label: 'Live Now', value: liveCount.toString(), color: 'bg-red-100 text-red-600' },
        { icon: <Calendar className="w-5 h-5" />, label: 'Upcoming', value: upcomingCount.toString(), color: 'bg-[#0036a1]/10 text-[#0036a1]' },
        { icon: <Users className="w-5 h-5" />, label: 'Total Sessions', value: totalCount.toString(), color: 'bg-[#6bc048]/10 text-[#6bc048]' },
        { icon: <Clock className="w-5 h-5" />, label: 'Avg. Duration', value: '52 min', color: 'bg-[#ff9800]/10 text-[#ff9800]' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {stats.map((s, i) => (
                <Card key={i} className="p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                        <h4 className="text-2xl font-bold text-gray-900">{s.value}</h4>
                    </div>
                </Card>
            ))}
        </div>
    );
}
