import { Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { WEEKDAYS, fmtDate, type LayoutRow, type Slot } from './api';

const palette = ['bg-blue-50 border-blue-200 text-blue-900', 'bg-emerald-50 border-emerald-200 text-emerald-900', 'bg-amber-50 border-amber-200 text-amber-900',
    'bg-violet-50 border-violet-200 text-violet-900', 'bg-rose-50 border-rose-200 text-rose-900', 'bg-cyan-50 border-cyan-200 text-cyan-900', 'bg-orange-50 border-orange-200 text-orange-900'];
const tone = (name: string | null) => {
    let h = 0;
    for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return palette[h % palette.length];
};

interface GridProps {
    layout: LayoutRow[];
    days: string[];
    slots: Slot[];
    clashSlotIds?: Set<string>;
    onCell?: (day: string, row: LayoutRow, slot?: Slot) => void;
    showTeacher?: boolean;
    highlightDay?: string;
}

/** Periods down the side, days across the top. A double / triple period spans its rows. */
export function ClassGrid({ layout, days, slots, clashSlotIds, onCell, showTeacher = true, highlightDay }: GridProps) {
    const at = new Map<string, Slot>();
    for (const s of slots) if (s.day != null) at.set(`${s.day}|${s.rowIndex}`, s);
    const lessonRows = layout.filter(r => r.type === 'LESSON');
    const skip = new Set<string>();

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-50 text-slate-500">
                        <th className="w-24 border-b border-slate-200 p-2 text-left font-bold">Time</th>
                        {days.map(d => (
                            <th key={d} className={cn('border-b border-l border-slate-200 p-2 text-center font-bold', d === highlightDay && 'bg-[#1E4DA6]/10 text-[#173F8C]')}>{d}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {layout.map((row, i) => row.type === 'BREAK' ? (
                        <tr key={`b${i}`} className="bg-slate-100/70">
                            <td className="p-1.5 text-[10px] font-semibold text-slate-500">{row.start}–{row.end}</td>
                            <td colSpan={days.length} className="border-l border-slate-200 p-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">{row.label}</td>
                        </tr>
                    ) : (
                        <tr key={row.rowIndex}>
                            <td className="border-t border-slate-100 p-2 align-top">
                                <p className="font-bold text-slate-700">{row.label}</p>
                                <p className="text-[10px] text-slate-400">{row.start}–{row.end}</p>
                            </td>
                            {days.map(day => {
                                const key = `${day}|${row.rowIndex}`;
                                if (skip.has(key)) return null;
                                const slot = at.get(key);
                                let span = 1;
                                if (slot?.blockId) {
                                    for (const r of lessonRows) {
                                        if (r.rowIndex! > row.rowIndex!) {
                                            const nxt = at.get(`${day}|${r.rowIndex}`);
                                            if (nxt?.blockId === slot.blockId) { skip.add(`${day}|${r.rowIndex}`); span++; }
                                        }
                                    }
                                }
                                const clash = slot && clashSlotIds?.has(slot.id);
                                return (
                                    <td key={day} rowSpan={span} onClick={onCell ? () => onCell(day, row, slot) : undefined}
                                        className={cn('border-l border-t border-slate-100 p-1 align-top', onCell && 'cursor-pointer hover:bg-slate-50', day === highlightDay && 'bg-[#1E4DA6]/[0.03]')}>
                                        {slot ? (
                                            <div className={cn('h-full min-h-[44px] rounded-lg border p-1.5', tone(slot.subject), clash && '!border-red-400 !bg-red-50 ring-1 ring-red-300')}>
                                                <p className="flex items-center gap-1 font-bold leading-tight">{slot.subject}{slot.isLocked && <Lock className="h-2.5 w-2.5 opacity-60" />}</p>
                                                {showTeacher && slot.teacherName && <p className="mt-0.5 text-[10px] opacity-75">{slot.teacherName}</p>}
                                                {slot.room && <p className="text-[10px] opacity-60">Room {slot.room}</p>}
                                                {span > 1 && <p className="text-[10px] font-semibold opacity-60">{span === 2 ? 'Double' : 'Triple'} period</p>}
                                            </div>
                                        ) : onCell ? <div className="min-h-[44px] rounded-lg border border-dashed border-slate-200" /> : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** Staff week view or exam / activity list: grouped by weekday or by date, in time order. */
export function EntryList({ slots, by, showClass = true, highlightDay, onEntry, clashSlotIds }: {
    slots: Slot[]; by: 'day' | 'date'; showClass?: boolean; highlightDay?: string; onEntry?: (s: Slot) => void; clashSlotIds?: Set<string>;
}) {
    const groups = new Map<string, Slot[]>();
    for (const s of slots) {
        const k = (by === 'day' ? s.day : s.date) || '';
        groups.set(k, [...(groups.get(k) || []), s]);
    }
    const keys = [...groups.keys()].sort((a, b) => by === 'day' ? WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b) : a.localeCompare(b));
    if (!keys.length) return <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Nothing scheduled.</p>;
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {keys.map(k => (
                <div key={k} className={cn('rounded-xl border bg-white p-3', k === highlightDay ? 'border-[#1E4DA6]' : 'border-slate-200')}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#173F8C]">{by === 'date' ? fmtDate(k) : k}</p>
                    <div className="space-y-1.5">
                        {(groups.get(k) || []).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(s => (
                            <div key={s.id} onClick={onEntry ? () => onEntry(s) : undefined}
                                className={cn('rounded-lg border px-2.5 py-1.5 text-xs', tone(s.subject), onEntry && 'cursor-pointer hover:brightness-95', clashSlotIds?.has(s.id) && '!border-red-400 !bg-red-50')}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold">{s.title || s.subject}</span>
                                    <span className="shrink-0 font-semibold opacity-70">{s.startTime}–{s.endTime}</span>
                                </div>
                                <p className="opacity-70">{[showClass && s.className, s.teacherName, s.room && `Room ${s.room}`].filter(Boolean).join(' · ')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
