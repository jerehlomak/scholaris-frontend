import { useState } from 'react';
import { Download, Share2, Search, Filter } from 'lucide-react';
import type { GeneratedRoutine } from '../../lib/timetable-engine';

interface TimetableGridProps {
    routine: GeneratedRoutine;
}

export function TimetableGrid({ routine }: TimetableGridProps) {
    // Default to the first class in the generated routine
    const classes = Object.keys(routine);
    const [selectedClass, setSelectedClass] = useState<string>(classes[0] || '');

    if (!selectedClass || !routine[selectedClass]) return null;

    const classData = routine[selectedClass];
    const days = Object.keys(classData);

    // Calculate the maximum number of periods across all days to build the table headers
    let maxPeriods = 0;
    days.forEach(day => {
        if (classData[day].length > maxPeriods) {
            maxPeriods = classData[day].length;
        }
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-dash">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#f8fafc]">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Viewing Class:</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full sm:w-48 bg-white border border-gray-200 text-gray-800 text-sm rounded-md px-3 py-2 focus:ring-1 focus:ring-[#0036a1] focus:border-[#0036a1] outline-none font-medium shadow-sm transition-shadow appearance-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1em 1em'
                        }}
                    >
                        {classes.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find subject..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0036a1] focus:border-[#0036a1] transition-colors shadow-sm"
                        />
                    </div>
                    <button className="p-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors shadow-sm" title="Filter options">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors shadow-sm hidden sm:block" title="Share via Email">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0036a1] bg-[#0036a1]/10 hover:bg-[#0036a1]/20 border border-transparent rounded-md transition-colors shadow-sm whitespace-nowrap">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Timetable Matrix */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse min-w-[800px]">
                    <thead className="bg-[#1e2230] text-gray-200 font-medium">
                        <tr>
                            <th className="px-4 py-3 border-r border-[#1e2230]/10 w-32 sticky left-0 z-10 bg-[#1e2230]">Day / Period</th>
                            {Array.from({ length: maxPeriods }).map((_, index) => (
                                <th key={index} className="px-4 py-3 text-center border-r border-white/10 min-w-[140px]">
                                    {index === 4 ? '' : `Period ${index < 4 ? index + 1 : index}`}
                                    {index === 4 && <span className="text-gray-400 text-xs tracking-wider uppercase font-bold">Break Time</span>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {days.map(day => (
                            <tr key={day} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-4 py-4 font-bold text-gray-800 border-r border-gray-100 sticky left-0 z-10 bg-white group-hover:bg-gray-50/80 uppercase tracking-wide text-xs">
                                    {day}
                                </td>
                                {classData[day].map((slot, pIndex) => (
                                    <td
                                        key={pIndex}
                                        className={`px-3 py-3 text-center border-r border-gray-100 ${slot.type === 'break' ? 'bg-[#f8fafc]' : ''}`}
                                    >
                                        {slot.type === 'break' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center py-2 opacity-50">
                                                <div className="w-8 h-1 bg-gray-200 rounded-full mb-1" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Break</span>
                                            </div>
                                        ) : (
                                            <div className="bg-[#0036a1]/5 border border-[#0036a1]/10 rounded-lg p-3 hover:bg-[#0036a1]/10 transition-colors cursor-pointer group/slot relative overflow-hidden">
                                                {/* Subject Color Indicator Strip */}
                                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#0036a1] opacity-80" />

                                                <p className="font-semibold text-[#1e2230] text-[13px] mb-1 truncate leading-tight">
                                                    {slot.subject}
                                                </p>
                                                <p className="text-[11px] font-medium text-gray-500 truncate bg-white py-0.5 px-2 rounded-full inline-block border border-gray-100">
                                                    {slot.teacher}
                                                </p>

                                                {/* Hover Edit Overlay */}
                                                <div className="absolute inset-0 bg-[#0036a1]/90 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                    <span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full cursor-pointer hover:bg-white hover:text-[#0036a1] transition-colors shadow-sm">
                                                        Re-assign
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-gray-100 bg-[#f8fafc] flex justify-between items-center text-xs text-gray-500">
                <p>Generated by SkcoolyPlus Smart Scheduler</p>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0036a1]"></span> Subjects: {maxPeriods - 1}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6bc048]"></span> Fully Allocated</span>
                </div>
            </div>
        </div>
    );
}
