import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Loader2, Clock, Globe, ShieldCheck } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { SaveButton } from '../settings/shared/SaveButton';
import { Switch } from '../../../components/ui/switch';

const API = '/api/v1/school/attendance/settings';

export default function AttendanceSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    const [qrEnabled, setQrEnabled] = useState(true);
    const [manualEnabled, setManualEnabled] = useState(true);
    const [allowMultipleScan, setAllowMultipleScan] = useState(false);
    const [staffCheckOutRequired, setStaffCheckOutRequired] = useState(true);

    const [schoolStartTime, setSchoolStartTime] = useState('08:00');
    const [lateThresholdTime, setLateThresholdTime] = useState('08:30');
    const [autoCloseTime, setAutoCloseTime] = useState('17:00');
    const [timezone, setTimezone] = useState('Africa/Lagos');

    useEffect(() => {
        axios.get(API, { withCredentials: true })
            .then(res => {
                const s = res.data.settings;
                if (s) {
                    setQrEnabled(s.qrEnabled ?? true);
                    setManualEnabled(s.manualEnabled ?? true);
                    setAllowMultipleScan(s.allowMultipleScan ?? false);
                    setStaffCheckOutRequired(s.staffCheckOutRequired ?? true);
                    setSchoolStartTime(s.schoolStartTime || '08:00');
                    setLateThresholdTime(s.lateThresholdTime || '08:30');
                    setAutoCloseTime(s.autoCloseTime || '17:00');
                    setTimezone(s.timezone || 'Africa/Lagos');
                }
            })
            .catch(() => toast.error('Failed to load Attendance Settings'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            await axios.put(API, {
                qrEnabled,
                manualEnabled,
                allowMultipleScan,
                staffCheckOutRequired,
                schoolStartTime,
                lateThresholdTime,
                autoCloseTime,
                timezone
            }, { withCredentials: true });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            toast.success('Attendance Settings saved successfully');
        } catch {
            toast.error('Failed to save Attendance Settings');
        }
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    const inputCls = 'flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="Configuration" tabLabel="Attendance Config" tabIcon={<SettingsIcon className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<SettingsIcon className="h-7 w-7" />}
                title="System Configuration"
                subtitle="Manage how your school's physical footprint is measured, including strict timezone boundaries and latency rules."
            />

            <section className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Core Policies</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-blue-500" /> QR Code Scanners Active</h4>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Allow students and staff to mark attendance autonomously using distributed physical or web-based QR scanners.</p>
                        </div>
                        <Switch checked={qrEnabled} onCheckedChange={setQrEnabled} />
                    </div>

                    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-slate-500" /> Manual Overrides</h4>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Allow administrators and form teachers to manually log Present/Absent values if scanners fail or are disconnected.</p>
                        </div>
                        <Switch checked={manualEnabled} onCheckedChange={setManualEnabled} />
                    </div>

                    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-orange-500" /> Allow Multiple Student Scans</h4>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">If disabled, the system inherently blocks duplicate duplicate rapid scans natively protecting metrics.</p>
                        </div>
                        <Switch checked={allowMultipleScan} onCheckedChange={setAllowMultipleScan} />
                    </div>

                    <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-purple-500" /> Staff Strict Check-Out</h4>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Require staff members to scan twice daily (Check-In & Check-Out) to complete their 100% daily footprint metric.</p>
                        </div>
                        <Switch checked={staffCheckOutRequired} onCheckedChange={setStaffCheckOutRequired} />
                    </div>
                </div>
            </section>

            <section className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Metrics & Localization</h3>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Clock className="h-4 w-4 text-emerald-500" /> Official Start Time</h4>
                            <p className="mt-0.5 text-xs text-slate-500">The time physical gates open for recording daily student attendance footprints.</p>
                        </div>
                        <input type="time" value={schoolStartTime} onChange={e => setSchoolStartTime(e.target.value)} className={inputCls + ' sm:max-w-[200px] text-center'} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Clock className="h-4 w-4 text-red-500" /> Late Threshold Limit</h4>
                            <p className="mt-0.5 text-xs text-slate-500">Scanning dynamically shifts records from PRESENT to LATE once this local threshold ticks over.</p>
                        </div>
                        <input type="time" value={lateThresholdTime} onChange={e => setLateThresholdTime(e.target.value)} className={inputCls + ' sm:max-w-[200px] text-center'} />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Clock className="h-4 w-4 text-slate-500" /> Official Close Time</h4>
                            <p className="mt-0.5 text-xs text-slate-500">Soft limit indicating when gates internally stop acknowledging incoming footprint traffic.</p>
                        </div>
                        <input type="time" value={autoCloseTime} onChange={e => setAutoCloseTime(e.target.value)} className={inputCls + ' sm:max-w-[200px] text-center'} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Globe className="h-4 w-4 text-blue-500" /> System Timezone</h4>
                            <p className="mt-0.5 text-xs text-slate-500">Determines native date parsing to resolve UTC timezone rollover collisions safely.</p>
                        </div>
                        <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls + ' sm:max-w-[200px] cursor-pointer'}>
                            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                            <option value="America/New_York">America/New_York (EST/EDT)</option>
                            <option value="Europe/London">Europe/London (GMT/BST)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                            <option value="UTC">UTC (Universal)</option>
                        </select>
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} saveLabel="Save Attendance Setup" savedLabel="Setup Saved!" />
            </div>
        </SettingsShell>
    );
}
