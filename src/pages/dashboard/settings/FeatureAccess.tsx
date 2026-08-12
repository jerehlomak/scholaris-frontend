import React, { useState, useEffect } from 'react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { ShieldOff, Loader2, Save, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const FEATURES = [
    { key: 'timetable', label: 'Timetable', desc: 'Allow access to Timetable module' },
    { key: 'homework', label: 'Homework', desc: 'Allow access to Homework module' },
    { key: 'behaviour', label: 'Behaviour & Skills', desc: 'Allow access to Behaviour module' },
    { key: 'store', label: 'Online Store & POS', desc: 'Allow access to Online Store' },
    { key: 'whatsapp', label: 'WhatsApp', desc: 'Allow access to WhatsApp Integration' },
    { key: 'messaging', label: 'Messaging', desc: 'Allow access to in-app Messaging' },
    { key: 'sms', label: 'SMS Services', desc: 'Allow access to SMS Services' },
    { key: 'live-class', label: 'Live Class', desc: 'Allow access to Live Class module' },
    { key: 'question-paper', label: 'Question Paper', desc: 'Allow access to Question Paper generator' },
    { key: 'exams', label: 'Exams', desc: 'Allow access to Exams module' }
];

export function FeatureAccess() {
    const [blocked, setBlocked] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get('/api/v1/school-settings', { withCredentials: true })
            .then(res => setBlocked(res.data.settings?.blockedFeatures || []))
            .catch(() => toast.error('Failed to load feature settings'))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (key: string) => {
        if (blocked.includes(key)) {
            setBlocked(blocked.filter(k => k !== key));
        } else {
            setBlocked([...blocked, key]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.patch('/api/v1/school-settings', { blockedFeatures: blocked }, { withCredentials: true });
            toast.success('Feature access updated. Please refresh the page to apply changes.');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsShell breadcrumbParent="Settings" breadcrumbCurrent="Feature Access" tabLabel="Features" tabIcon={<ShieldOff className="h-4 w-4" />}>
            <SettingsHero title="Feature Access" subtitle="Enable or disable specific modules for your entire school." icon={<ShieldOff className="h-8 w-8 text-white" />} />
            
            <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start gap-4 md:items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Module Access Control</h2>
                        <p className="text-sm text-slate-500">Disabled modules will be hidden from the sidebar for all users.</p>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                    </button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-2 py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                    ) : (
                        FEATURES.map(feat => {
                            const isEnabled = !blocked.includes(feat.key);
                            return (
                                <div key={feat.key} onClick={() => handleToggle(feat.key)} className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-4 \${isEnabled ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                                    <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 \${isEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-500'}`}>
                                        {isEnabled ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold \${isEnabled ? 'text-emerald-900' : 'text-slate-600'}`}>{feat.label}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{feat.desc}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </SettingsShell>
    );
}
