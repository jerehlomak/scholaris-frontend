import React from 'react';
import { CalendarDays } from 'lucide-react';

export default function AttendanceBlock({ data, config, design  }: { data: any, config?: any, design?: any  }) {
    const title = config?.title || 'Attendance';
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    
    const att = data?.attendance || { opened: 100, present: 92, absent: 8, late: 4 };
    
    // Ensure total is at least 1 to avoid division by zero
    const totalDays = att.opened || att.total || Math.max(1, (att.present || 0) + (att.absent || 0));
    
    const presentPct = Math.round(((att.present || 0) / totalDays) * 100);
    const absentPct = Math.round(((att.absent || 0) / totalDays) * 100);
    const punctualityPct = Math.max(0, 100 - Math.round(((att.late || 0) / totalDays) * 100));

    // "Bulletin" preset: a bordered box with a solid navy header bar and
    // plain label:value rows — matches AcademicSummaryBlock's NAVY_CARD
    // variant so the two sit side-by-side as a matching pair.
    if (config?.variant === 'NAVY_CARD') {
        const primaryColor = design?.primaryColor || accentColor;
        const rows = [
            { label: 'Number of Days Open', value: totalDays },
            { label: 'Days Present', value: att.present || 0 },
            { label: 'Days Absent', value: att.absent || 0 },
        ];
        return (
            <div className="border rounded overflow-hidden h-full" style={{ borderColor: primaryColor }}>
                <div className="text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1" style={{ backgroundColor: primaryColor }}>
                    {title}
                </div>
                <div className="divide-y" style={{ borderColor: `${primaryColor}25` }}>
                    {rows.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 text-[10px]">
                            <span className="text-gray-500">{r.label}:</span>
                            <span className="font-bold" style={{ color: primaryColor }}>{r.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="text-[9px] font-bold uppercase tracking-widest pb-1 border-b flex items-center gap-1.5 mb-1.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                <CalendarDays className="w-3 h-3" />
                <span>{title} (Total: {totalDays} Days)</span>
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded border border-gray-100">
                <div className="flex flex-col text-center w-1/3 border-r border-gray-200">
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Days Open</span>
                    <span className="text-xs font-bold text-gray-800">{totalDays}</span>
                </div>
                <div className="flex flex-col text-center w-1/3 border-r border-gray-200">
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Days Present</span>
                    <span className="text-xs font-bold text-green-700">{att.present || 0}</span>
                </div>
                <div className="flex flex-col text-center w-1/3">
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Days Absent</span>
                    <span className="text-xs font-bold text-red-600">{att.absent || 0}</span>
                </div>
            </div>
            
            {(att.late > 0) && (
                <div className="mt-2.5 flex items-center justify-between text-[11px] bg-orange-50/50 p-2 rounded border border-orange-100">
                    <span className="text-orange-800 font-medium">Late Arrivals</span>
                    <span className="font-bold text-orange-600">{att.late}</span>
                </div>
            )}
        </div>
    );
}
