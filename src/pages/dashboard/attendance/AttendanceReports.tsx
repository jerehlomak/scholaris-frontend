import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText, Loader2, Download, Filter, CalendarDays, Users } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

const API = '/api/v1/school/attendance/reports';

export default function AttendanceReports() {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reportType, setReportType] = useState<'students' | 'staff'>('students');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await axios.get(`${API}/${reportType}`, { 
                params: { startDate, endDate },
                withCredentials: true 
            });
            setTimeout(() => {
                toast.success('Report package assembled and downloaded');
                setIsGenerating(false);
            }, 1000);
        } catch {
            toast.error('Failed to generate report');
            setIsGenerating(false);
        }
    };

    const inputCls = 'flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="Analytics & Reports" tabLabel="Data Export" tabIcon={<FileText className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<FileText className="h-7 w-7 text-white" />}
                title="Analytics & Export"
                subtitle="Filter, compile, and download physical footprint data for both student and staff demographics across specific date ranges."
            />

            <section className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Segment</h3>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setReportType('students')}
                        className={`flex-1 flex gap-3 flex-col sm:flex-row items-center justify-center p-6 rounded-2xl border-2 transition-all ${reportType === 'students' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <Users className={`h-6 w-6 ${reportType === 'students' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div className="text-center sm:text-left">
                            <h4 className={`text-sm font-bold ${reportType === 'students' ? 'text-indigo-700' : 'text-slate-700'}`}>Student Demographics</h4>
                            <p className="text-xs text-slate-500 mt-1">Export attendance by class blocks</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setReportType('staff')}
                        className={`flex-1 flex gap-3 flex-col sm:flex-row items-center justify-center p-6 rounded-2xl border-2 transition-all ${reportType === 'staff' ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <Users className={`h-6 w-6 ${reportType === 'staff' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div className="text-center sm:text-left">
                            <h4 className={`text-sm font-bold ${reportType === 'staff' ? 'text-emerald-700' : 'text-slate-700'}`}>Staff Telemetry</h4>
                            <p className="text-xs text-slate-500 mt-1">Export employee check-in logs</p>
                        </div>
                    </button>
                </div>
            </section>

            <section className="space-y-4 mb-10">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Range Criteria</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2"><CalendarDays className="h-4 w-4" /> Start Date</label>
                        <input type="date" className={inputCls + ' w-full'} value={startDate} max={today} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-2"><CalendarDays className="h-4 w-4" /> End Date</label>
                        <input type="date" className={inputCls + ' w-full'} value={endDate} max={today} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-100 pt-8 flex justify-end">
                <button 
                    disabled={isGenerating}
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-8 py-3.5 bg-[#173F8C] hover:bg-[#122F69] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0E2450]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    {isGenerating ? 'Assembling Package...' : 'Download Telemetry Package'}
                </button>
            </div>
        </SettingsShell>
    );
}
