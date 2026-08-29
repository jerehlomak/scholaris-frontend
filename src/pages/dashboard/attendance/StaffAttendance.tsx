import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'sonner';
import { Briefcase, Loader2, Search, SlidersHorizontal, CheckSquare, Clock } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { fetcher } from '../../../utils/fetcher';

const API = '/api/v1/school/attendance/staff';

export default function StaffAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Fetch Stats
    const { data: statsData, isLoading: loadingStats } = useSWR(`${API}/stats?date=${selectedDate}`, fetcher);
    const stats = statsData || { totalStaff: 0, present: 0, absent: 0, late: 0, halfDay: 0 };

    // Fetch Records
    const { data: recordsData, isLoading: loadingRecords, mutate } = useSWR(`${API}?date=${selectedDate}`, fetcher);
    const records = recordsData?.records || [];

    const handleManualOverride = async (staffId: string, status: string) => {
        try {
            await axios.post(`${API}/manual`, { staffId, date: selectedDate, status }, { withCredentials: true });
            toast.success('Staff attendance updated manually');
            mutate(); // Re-fetch
        } catch {
            toast.error('Failed to override staff attendance');
        }
    };

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="Staff Monitor" tabLabel="Staff Attendance" tabIcon={<Briefcase className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Briefcase className="h-7 w-7 text-emerald-600" />}
                title="Staff Telemetry & Monitor"
                subtitle="Live dashboard resolving physical footprints of teaching and administrative staff using cryptographically verified QR scans."
            />

            {/* Date filter & Telemetry header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 mb-6 gap-4">
                <input 
                    type="date" 
                    value={selectedDate} 
                    max={today}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white shadow-sm w-full sm:w-auto" 
                />
            </div>

            <section className="mb-8 hidden sm:block">
                {loadingStats ? (
                    <div className="h-24 flex items-center justify-center border border-slate-100 rounded-2xl bg-white"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                            <span className="text-2xl font-bold text-slate-800">{stats.totalStaff}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Staff</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm flex flex-col justify-center text-center">
                            <span className="text-2xl font-bold text-emerald-600">{stats.present}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mt-1">Present</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm flex flex-col justify-center text-center">
                            <span className="text-2xl font-bold text-orange-600">{stats.late}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mt-1">Late</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 shadow-sm flex flex-col justify-center text-center">
                            <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-1">Absent</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#1E4DA6]/5 border border-[#1E4DA6]/10 shadow-sm flex flex-col justify-center text-center">
                            <span className="text-2xl font-bold text-[#1E4DA6]">{stats.halfDay}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6] mt-1">Half Day</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Records Data Table */}
            <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {loadingRecords ? (
                         <div className="flex h-64 items-center justify-center">
                             <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                         </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col h-64 items-center justify-center text-slate-400">
                            <CheckSquare className="h-10 w-10 mb-2 opacity-30" />
                            <p className="font-semibold text-slate-500">No physical footprints found.</p>
                            <p className="text-xs mt-1">Staff attendance logs for {new Date(selectedDate).toDateString()} remain empty.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Staff Identity</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Trace Logs</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Manual Bridge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {records.map((rec: any) => (
                                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-sm text-slate-800">{rec.staff.user.name}</div>
                                                <div className="font-mono text-[10px] text-slate-400 mt-1 uppercase">ID: {rec.staffId.slice(0,8)}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                    <Clock className="w-3.5 h-3.5" /> 
                                                    IN: {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], {timeStyle: 'short'}) : '--:--'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
                                                    <Clock className="w-3.5 h-3.5" /> 
                                                    OUT: {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], {timeStyle: 'short'}) : '--:--'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                                    rec.status === 'LATE' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                    rec.status === 'PRESENT' ? 'bg-emerald-500' :
                                                    rec.status === 'LATE' ? 'bg-orange-500' : 'bg-red-500'
                                                }`}></div>
                                                    {rec.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <select 
                                                    value={rec.status}
                                                    onChange={e => handleManualOverride(rec.staffId, e.target.value)}
                                                    className="border border-slate-200 text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-slate-300 font-semibold text-slate-600"
                                                >
                                                    <option value="PRESENT">Mark Present</option>
                                                    <option value="LATE">Mark Late</option>
                                                    <option value="HALF_DAY">Mark Half-Day</option>
                                                    <option value="ABSENT">Mark Absent</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </SettingsShell>
    );
}
