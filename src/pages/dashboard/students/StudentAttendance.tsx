import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, Download, QrCode, Shield, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

const API = '/api/v1/school/attendance/my-attendance';

export function StudentAttendance() {
    const { user } = useAuth();
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [year, setYear] = useState(new Date().getFullYear().toString());

    const { data, isLoading } = useSWR(`${API}?month=${month}&year=${year}`, fetcher);
    
    const backendUrl = import.meta.env.VITE_API_BASE_URL || '';
    const profileId = user?.studentProfile?.id;

    const stats = data?.summary || { present: 0, absent: 0, late: 0, excused: 0 };
    const records = data?.records || [];

    const handleDownloadID = () => {
        window.open(`${backendUrl}/api/v1/school/attendance/id-card/me?userType=student`, '_blank');
    };

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent="Attendance" tabLabel="ID & Attendance" tabIcon={<Calendar className="h-3.5 w-3.5" />}>
            <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ID & Attendance</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Securely download your Digital ID and view your active scan logs.
                    </p>
                </div>
                
                <button 
                    onClick={handleDownloadID}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-colors"
                >
                    <Download className="w-4 h-4" /> Export Public ID
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-500 mb-1">Present</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.present}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-500 mb-1">Late</p>
                    <p className="text-3xl font-bold text-orange-500">{stats.late}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-500 mb-1">Absent</p>
                    <p className="text-3xl font-bold text-red-500">{stats.absent}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-500 mb-1">Excused</p>
                    <p className="text-3xl font-bold text-[#1E4DA6]">{stats.excused}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden text-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Date Filter
                    </h2>
                    <div className="flex items-center gap-2">
                        <select value={month} onChange={e => setMonth(e.target.value)} className="rounded-lg border-slate-200 bg-white py-1.5 px-3 font-semibold text-slate-700 outline-none focus:border-indigo-500">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m.toString().padStart(2, '0')}>
                                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select value={year} onChange={e => setYear(e.target.value)} className="rounded-lg border-slate-200 bg-white py-1.5 px-3 font-semibold text-slate-700 outline-none focus:border-indigo-500">
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-xl border-b border-slate-100">Date Logged</th>
                                <th className="p-4 border-b border-slate-100 hidden sm:table-cell">Marker</th>
                                <th className="p-4 border-b border-slate-100">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="p-10 text-center text-slate-400">Loading scan logs...</td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-10 text-center text-slate-400">
                                        <Search className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            ) : records.map((record: any) => (
                                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td className="p-4 text-xs font-mono text-slate-400 font-semibold hidden sm:table-cell">
                                        {record.markedBy === 'QR Scanner' ? (
                                            <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> Hardware Terminal</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {record.markedBy}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md inline-flex items-center gap-1.5
                                            ${record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 
                                            record.status === 'ABSENT' ? 'bg-red-50 text-red-600 border border-red-100/50' : 
                                            record.status === 'LATE' ? 'bg-orange-50 text-orange-600 border border-orange-100/50' : 
                                            'bg-[#1E4DA6]/5 text-[#1E4DA6] border border-[#1E4DA6]/50'}
                                        `}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4 text-indigo-800">
                <MapPin className="w-6 h-6 shrink-0 mt-0.5 opacity-80" />
                <div className="text-sm font-medium leading-relaxed">
                    <p className="font-bold mb-1">Campus Isolation Engaged</p>
                    Your digital ID card carries explicit cryptographic signatures pinning your registration down to your specific school and branch instance. Accessing scan-portals outside your branch jurisdiction will implicitly bounce any requests to protect physical security boundaries.
                </div>
            </div>
            </div>
        </SettingsShell>
    );
}
