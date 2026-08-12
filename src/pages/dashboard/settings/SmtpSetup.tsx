import { useState, useEffect } from 'react';
import { Mail, Check, X, Server, User, Key, Save, Play, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';

export default function SmtpSetup() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFrom, setSmtpFrom] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/api/v1/school-settings', { withCredentials: true });
                const data = res.data.settings;
                if (data) {
                    setSmtpHost(data.smtpHost || '');
                    setSmtpPort(data.smtpPort?.toString() || '');
                    setSmtpUser(data.smtpUser || '');
                    setSmtpPass(data.smtpPass ? '********' : '');
                    setSmtpFrom(data.smtpFrom || '');
                }
            } catch (err) {
                toast.error('Failed to load SMTP settings');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload: any = {
                smtpHost,
                smtpPort: parseInt(smtpPort, 10),
                smtpUser,
                smtpFrom
            };
            if (smtpPass && smtpPass !== '********') {
                payload.smtpPass = smtpPass;
            }

            await axios.patch('/api/v1/school-settings', payload, { withCredentials: true });
            toast.success('SMTP settings saved successfully!');
        } catch (err) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        try {
            const res = await axios.post('/api/v1/school-settings/test-smtp', {}, { withCredentials: true });
            toast.success(res.data.msg || 'Test email sent successfully! Please check your inbox.');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to send test email. Check your credentials.');
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-[#1a2fa0] animate-spin" />
            </div>
        );
    }

    return (
        <SettingsShell breadcrumbCurrent="Email Setup (SMTP)" tabLabel="SMTP" tabIcon={<Mail className="h-3.5 w-3.5" />}>
            <SettingsHero 
                icon={<Mail className="h-7 w-7 text-white" />}
                title="Email Setup (SMTP)"
                subtitle="Configure your school's custom email server to send admission letters, invoices, and notifications directly from your domain."
            />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <form onSubmit={handleSave}>
                        <div className="p-6 sm:p-8 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">SMTP Host *</label>
                                <div className="relative">
                                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        required
                                        value={smtpHost}
                                        onChange={(e) => setSmtpHost(e.target.value)}
                                        placeholder="e.g. smtp.gmail.com"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a2fa0] focus:border-[#1a2fa0] outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">SMTP Port *</label>
                                <input 
                                    type="number" 
                                    required
                                    value={smtpPort}
                                    onChange={(e) => setSmtpPort(e.target.value)}
                                    placeholder="e.g. 587 or 465"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a2fa0] focus:border-[#1a2fa0] outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">SMTP Username *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        required
                                        value={smtpUser}
                                        onChange={(e) => setSmtpUser(e.target.value)}
                                        placeholder="e.g. admissions@school.edu"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a2fa0] focus:border-[#1a2fa0] outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">SMTP Password *</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="password" 
                                        required
                                        value={smtpPass}
                                        onChange={(e) => setSmtpPass(e.target.value)}
                                        placeholder="App password or standard password"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a2fa0] focus:border-[#1a2fa0] outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Sender "From" Details *</label>
                            <input 
                                type="text" 
                                required
                                value={smtpFrom}
                                onChange={(e) => setSmtpFrom(e.target.value)}
                                placeholder='e.g. "Springfield Admissions" <admissions@springfield.edu>'
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a2fa0] focus:border-[#1a2fa0] outline-none"
                            />
                            <p className="mt-1 text-xs text-slate-500">This is what recipients will see as the sender name and email.</p>
                        </div>

                    </div>
                    
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleTest}
                            disabled={isTesting || !smtpHost}
                            className="bg-white"
                        >
                            <Play className="w-4 h-4 mr-2 text-slate-600" />
                            {isTesting ? 'Sending...' : 'Test Connection'}
                        </Button>
                        
                        <Button 
                            type="submit" 
                            variant="success"
                            disabled={isSaving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
            
                <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-5 text-sm text-blue-800 flex items-start gap-3">
                    <div className="mt-0.5"><Mail className="w-5 h-5 text-blue-500" /></div>
                    <div>
                        <p className="font-medium mb-1">Configuration Note</p>
                        <p className="text-blue-700/80 mb-2">If you use Gmail, you must enable 2-Step Verification and generate an <strong>App Password</strong>. Do not use your standard login password.</p>
                        <p className="text-blue-700/80">If you leave these settings blank or they fail to authenticate, the system will seamlessly fall back to the global SaaS SMTP configuration to ensure your emails are always delivered.</p>
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
}
