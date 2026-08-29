import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';
import { Card } from '../../components/ui/card';
import { Loader2, CalendarDays, CheckCircle2, XCircle, Clock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const API = '/api/v1/school';

export default function ParentAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Parent API returns { attendance: Record<studentId, { dates: ..., summary: ... }> }
    const { data: attendanceData, isLoading } = useSWR(
        `${API}/my-attendance`,
        fetcher
    );

    if (isLoading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    const studentsAttendance = attendanceData?.attendance || {};

    if (Object.keys(studentsAttendance).length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Attendance</h1>
                <Card className="p-12 text-center text-slate-500 bg-white border border-slate-100 shadow-sm">
                    No attendance records found for your children yet.
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">My Children's Attendance</h1>

            {Object.entries(studentsAttendance).map(([studentId, data]: [string, any]) => {
                const total = data.summary.PRESENT + data.summary.ABSENT + data.summary.LATE + data.summary.EXCUSED;
                const pct = total ? Math.round(((data.summary.PRESENT + data.summary.LATE) / total) * 100) : 0;
                
                return (
                    <Card key={studentId} className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#1E4DA6]/10 text-[#1E4DA6] font-bold rounded-xl flex items-center justify-center text-lg shadow-inner">
                                    {data.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{data.name}</h2>
                                    <p className="text-sm font-mono text-slate-500">{data.admissionNo} · {data.className}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-500">Attendance Rate</div>
                                    <div className={`text-2xl font-black ${pct >= 90 ? 'text-emerald-500' : pct >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {pct}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 text-center">
                            <div className="py-4 bg-emerald-50/30">
                                <div className="text-xl font-bold text-emerald-600">{data.summary.PRESENT}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Present</div>
                            </div>
                            <div className="py-4 bg-red-50/30">
                                <div className="text-xl font-bold text-red-500">{data.summary.ABSENT}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-red-500/70">Absent</div>
                            </div>
                            <div className="py-4 bg-amber-50/30">
                                <div className="text-xl font-bold text-amber-500">{data.summary.LATE}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500/70">Late</div>
                            </div>
                            <div className="py-4 bg-[#1E4DA6]/8">
                                <div className="text-xl font-bold text-[#1E4DA6]">{data.summary.EXCUSED}</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#1E4DA6]/70">Excused</div>
                            </div>
                        </div>

                        {/* Calendar view for this student */}
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-[#1E4DA6]" /> Recent Records
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(data.dates).slice(-5).reverse().map(([date, status]) => (
                                    <div key={date} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                        <span className="font-mono text-sm text-slate-600 font-medium">{date}</span>
                                        <StatusBadge status={status as string} />
                                    </div>
                                ))}
                                {Object.keys(data.dates).length === 0 && (
                                    <div className="text-sm text-slate-400 italic">No daily records recorded yet.</div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'PRESENT') return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Present</span>;
    if (status === 'ABSENT') return <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Absent</span>;
    if (status === 'LATE') return <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Late</span>;
    if (status === 'EXCUSED') return <span className="px-2.5 py-1 text-xs font-bold bg-[#1E4DA6]/10 text-[#173F8C] rounded-full flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Excused</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded">{status}</span>;
}
