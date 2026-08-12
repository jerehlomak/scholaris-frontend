/** AttendanceCalendar — mini calendar showing daily attendance rate for a month */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import type { AttendanceRecord } from '../../../context/AttendanceContext';

interface Props {
    records: AttendanceRecord[];
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

export function AttendanceCalendar({ records, selectedDate, onSelectDate }: Props) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const getDateStr = (day: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const getDayRate = (day: number): number | null => {
        const dateStr = getDateStr(day);
        const dayRecords = records.filter(r => r.date === dateStr);
        if (dayRecords.length === 0) return null;
        const present = dayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        return Math.round((present / dayRecords.length) * 100);
    };

    const monthName = viewDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <Card className="p-5 bg-white border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-gray-900 text-sm">{monthName}</h4>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
                {days.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = getDateStr(day);
                    const rate = getDayRate(day);
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === today.toISOString().split('T')[0];

                    let bg = 'hover:bg-gray-100';
                    if (isSelected) bg = 'bg-[#0036a1] text-white';
                    else if (rate !== null) {
                        if (rate >= 90) bg = 'bg-[#6bc048]/20 text-[#3a7a1f] hover:bg-[#6bc048]/30';
                        else if (rate >= 70) bg = 'bg-[#ff9800]/20 text-[#b86000] hover:bg-[#ff9800]/30';
                        else bg = 'bg-red-100 text-red-700 hover:bg-red-200';
                    }

                    return (
                        <button
                            key={day}
                            onClick={() => onSelectDate(dateStr)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-colors text-xs font-semibold ${bg} ${isToday && !isSelected ? 'ring-2 ring-[#0036a1]/40' : ''}`}
                        >
                            {day}
                            {rate !== null && !isSelected && (
                                <span className="text-[8px] font-normal leading-none mt-0.5 opacity-70">{rate}%</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                {[
                    { label: '≥90%', color: 'bg-[#6bc048]/30' },
                    { label: '70–89%', color: 'bg-[#ff9800]/30' },
                    { label: '<70%', color: 'bg-red-200' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${l.color}`} />
                        <span className="text-[10px] text-gray-500">{l.label}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
