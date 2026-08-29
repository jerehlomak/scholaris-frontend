import { useState, useEffect } from 'react';
import { Building2, Upload, Phone, Mail, MapPin, Hash, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';

const API = '/api/v1/school-settings';

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

export function InstituteProfile() {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { refreshSession } = useAuth();

    const [form, setForm] = useState({ schoolName: '', arabicName: '', tagline: '', motto: '', formTeacherTitle: '', phone: '', email: '', address: '', country: 'ng', logoUrl: '' });

    //... (I'll need to fetch the lines 15-30 first so I don't mess up)

    useEffect(() => {
        axios.get(API, { withCredentials: true })
            .then(res => {
                const s = res.data.settings;
                setForm({
                    schoolName: s.schoolName || '', arabicName: s.arabicName || '', tagline: s.tagline || '', motto: s.motto || '', formTeacherTitle: s.formTeacherTitle || 'Form Teacher',
                    phone: s.phone || '', email: s.email || '', address: s.address || '', country: s.country || 'ng', logoUrl: s.logoUrl || ''
                });
                if (s.logoUrl) setLogoPreview(s.logoUrl);
            })
            .catch(() => toast.error('Failed to load profile'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = reader.result as string;
                setLogoPreview(b64);
                handleChange('logoUrl', b64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.patch(API, form, { withCredentials: true });
            await refreshSession();
            setSaved(true);
            toast.success('School Profile updated successfully');
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Failed to update profile');
        } finally { setIsSaving(false); }
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    return (
        <SettingsShell breadcrumbCurrent="School Profile" tabLabel="School Profile" tabIcon={<Building2 className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Building2 className="h-7 w-7" />}
                title="School Profile"
                subtitle="Configure your school's name, logo, contact details and tagline that appear across the portal and on reports."
            />

            <div className="flex flex-col xl:flex-row gap-8">
                {/* Left column */}
                <div className="flex-1 space-y-5">
                    {/* Logo upload */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">School Logo <span className="text-red-500">*</span></p>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                            <div className="h-24 w-24 shrink-0 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-[#1E4DA6]/35 transition-colors">
                                {logoPreview
                                    ? <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                                    : <div className="text-center"><Upload className="h-6 w-6 text-slate-300 mx-auto mb-1" /><span className="text-[10px] text-slate-400">No logo</span></div>
                                }
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Choose Image File</label>
                                <input type="file" accept="image/*" onChange={handleLogoChange}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-[#1E4DA6]/5 file:px-3 file:py-1 file:text-xs file:font-bold file:text-[#1E4DA6] hover:file:bg-[#1E4DA6]/10" />
                                <p className="text-xs text-slate-500">Recommended: 256×256px. Max 2MB (JPG, PNG).</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {[
                            { label: 'Name of School', field: 'schoolName', placeholder: 'e.g. Cambridge Academy', required: true },
                            { label: 'School Name (Arabic)', field: 'arabicName', placeholder: 'e.g. أكاديمية كامبريدج', required: false },
                            { label: 'School Motto', field: 'motto', placeholder: 'e.g. Knowledge is Power', required: false },
                            { label: 'Tagline / Slogan', field: 'tagline', placeholder: 'e.g. Excellence in Education', required: true },
                            { label: 'Form Teacher Title', field: 'formTeacherTitle', placeholder: 'e.g. Class Teacher', required: false },
                            { label: 'Phone Number', field: 'phone', placeholder: '+234 xxx xxx xxxx', required: true },
                            { label: 'Email Address', field: 'email', placeholder: 'admin@school.com', required: false },
                            { label: 'Full Address', field: 'address', placeholder: '123 School Line, City', required: true },
                        ].map(f => (
                            <div key={f.field} className="space-y-1.5">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {f.label} {f.required && <span className="text-red-500">*</span>}
                                </label>
                                <input className={inputCls} value={form[f.field as keyof typeof form]} onChange={e => handleChange(f.field, e.target.value)} placeholder={f.placeholder} />
                            </div>
                        ))}
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Country <span className="text-red-500">*</span></label>
                            <select className={inputCls + ' cursor-pointer'} value={form.country} onChange={e => handleChange('country', e.target.value)}>
                                <option value="ng">Nigeria</option>
                                <option value="gh">Ghana</option>
                                <option value="us">United States</option>
                                <option value="gb">United Kingdom</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right: profile preview */}
                <div className="w-full xl:w-72 shrink-0">
                    <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400 block text-center mb-5">Preview</span>
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-20 w-20 rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" /> : <span className="text-xs font-black text-slate-300">LOGO</span>}
                            </div>
                            <div className="text-center">
                                <h3 className="font-black text-slate-800">{form.schoolName || 'School Name'}</h3>
                                {form.arabicName && <h4 className="font-bold text-slate-600 mt-1" dir="rtl">{form.arabicName}</h4>}
                                <p className="text-xs text-slate-500 mt-0.5">{form.tagline || 'Tagline here'}</p>
                            </div>
                            <div className="w-full space-y-2.5 border-t border-slate-100 pt-4">
                                {[
                                    { icon: <Phone className="h-3.5 w-3.5" />, value: form.phone || '—', label: 'Phone' },
                                    { icon: <Mail className="h-3.5 w-3.5" />, value: form.email || '—', label: 'Email' },
                                    { icon: <MapPin className="h-3.5 w-3.5" />, value: form.address || '—', label: 'Address' },
                                    { icon: <Hash className="h-3.5 w-3.5" />, value: form.country.toUpperCase(), label: 'Country' },
                                ].map(row => (
                                    <div key={row.label} className="flex items-start gap-2 text-xs">
                                        <span className="text-[#1E4DA6] mt-0.5">{row.icon}</span>
                                        <div><p className="text-slate-400 leading-none">{row.label}</p><p className="font-semibold text-slate-700 mt-0.5 break-all">{row.value}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} saving={isSaving} saveLabel="Update Profile" savedLabel="Profile Saved!" />
            </div>
        </SettingsShell>
    );
}
