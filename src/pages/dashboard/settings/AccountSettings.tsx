import { Settings, Eye, Trash2, RefreshCw, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { fetcher } from '../../../utils/fetcher';

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

export function AccountSettings() {
    const [saved, setSaved] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [timezone, setTimezone] = useState('Africa/Lagos');
    const [currency, setCurrency] = useState('NGN');
    const [currencySymbol, setCurrencySymbol] = useState('₦');

    // Fetch Data
    const { data: userData, mutate: mutateUser } = useSWR('/api/v1/users/showMe', fetcher);
    const { data: settingsData, mutate: mutateSettings } = useSWR('/api/v1/school-settings', fetcher);

    useEffect(() => {
        if (userData?.user) {
            setEmail(userData.user.email || '');
            setName(userData.user.name || '');
        }
    }, [userData]);

    useEffect(() => {
        if (settingsData?.settings) {
            setTimezone(settingsData.settings.timezone || 'Africa/Lagos');
            setCurrency(settingsData.settings.currency || 'NGN');
            setCurrencySymbol(settingsData.settings.currencySymbol || '₦');
        }
    }, [settingsData]);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            // Update User Profile
            await axios.post('/api/v1/users/updateUser', { email, name }, { withCredentials: true });
            
            // Update Password if provided
            if (password) {
                if (!oldPassword) {
                    toast.error('Please provide your current password to set a new one.');
                    setIsLoading(false);
                    return;
                }
                await axios.post('/api/v1/users/updateUserPassword', { oldPassword, newPassword: password }, { withCredentials: true });
            }

            // Update School Settings
            await axios.patch('/api/v1/school-settings', { 
                timezone, 
                currency, 
                currencySymbol 
            }, { withCredentials: true });

            await mutateUser();
            await mutateSettings();

            setSaved(true);
            toast.success('Settings updated successfully');
            setTimeout(() => setSaved(false), 3000);
            setOldPassword('');
            setPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to update settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsShell breadcrumbCurrent="Account Settings" tabLabel="Account Settings" tabIcon={<Settings className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Settings className="h-7 w-7" />}
                title="Account Settings"
                subtitle="Manage your login credentials, timezone, and currency preferences for this school portal."
            />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: form */}
                <div className="flex-1 space-y-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-[2] space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Username / Login ID <span className="text-red-500">*</span></label>
                            <input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="flex-[3] space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name <span className="text-red-500">*</span></label>
                            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-4 pt-4 border-t border-slate-100">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Password</label>
                        <input 
                            type="password"
                            className={inputCls} 
                            placeholder="Required to change password"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPw ? 'text' : 'password'} 
                                className={inputCls + ' pr-11'} 
                                placeholder="Leave blank to keep current password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                                <Eye className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">To change your password securely, you will need to verify your old password.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Timezone <span className="text-red-500">*</span></label>
                        <select className={inputCls + ' cursor-pointer'} value={timezone} onChange={e => setTimezone(e.target.value)}>
                            <option value="Africa/Lagos">Africa/Lagos</option>
                            <option value="Asia/Karachi">Asia/Karachi</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="America/New_York">America/New_York</option>
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-[2] space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Currency <span className="text-red-500">*</span></label>
                            <select className={inputCls + ' cursor-pointer'} value={currency} onChange={e => setCurrency(e.target.value)}>
                                <option value="NGN">Nigerian Naira (NGN)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="GBP">British Pound (GBP)</option>
                                <option value="EUR">Euro (EUR)</option>
                            </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Symbol <span className="text-red-500">*</span></label>
                            <input className={inputCls + ' text-center text-lg font-black'} value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleUpdate}
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173F8C] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E4DA6]/20 hover:bg-[#122F69] hover:scale-[1.01] transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
                            Update Settings
                        </button>
                    </div>
                </div>

                {/* Right: info card */}
                <div className="w-full lg:w-96">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] p-7 text-white shadow-xl shadow-[#1E4DA6]/20 min-h-[300px] flex flex-col justify-center">
                        {/* Decorative blobs */}
                        <div className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
                        <div className="pointer-events-none absolute -bottom-8 -left-8 h-44 w-44 rounded-full bg-white/5" />

                        <div className="relative flex flex-col items-center gap-6 z-10">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 opacity-80" />
                                <h3 className="font-bold text-lg tracking-tight">Account Details</h3>
                            </div>

                            <div className="w-full space-y-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                                {[
                                    { label: 'Username', value: userData?.user?.email || 'Loading...' },
                                    { label: 'Name', value: userData?.user?.name || 'Loading...' },
                                    { label: 'Role', value: userData?.user?.role || 'Loading...' },
                                    { label: 'Subscription', value: <span className="flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-0.5 text-[10px] font-black tracking-widest"><Check className="h-3 w-3" strokeWidth={3} />FREE</span> },
                                    { label: 'Expiry', value: 'Never' },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between text-sm">
                                        <span className="text-[#1E4DA6]/70">{row.label}:</span>
                                        <span className={`font-semibold text-white ${(row as { mono?: boolean }).mono ? 'font-mono tracking-widest' : ''}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white shadow-md hover:bg-red-600 transition-colors mt-2">
                                <Trash2 className="h-4 w-4" /> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {saved && (
                <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-600">
                    <Check className="h-4 w-4" /> Settings updated successfully!
                </div>
            )}
        </SettingsShell>
    );
}
