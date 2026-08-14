import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, User, AlertCircle, CheckCircle2, Loader2, Briefcase, Landmark } from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';

const API = '/api/v1';
const DEPARTMENTS = ['Science', 'Mathematics', 'Arts', 'Commerce', 'Languages', 'Social Science', 'ICT', 'Physical Education', 'Administration', 'Other'];

interface FormState {
    name: string; email: string; phone: string;
    department: string; gender: string; dateOfBirth: string;
    address: string; qualification: string; salary: string;
    subjects: string; bankName: string; accountName: string; accountNumber: string;
    staffType: string; employeeId: string; customRoleId: string; canEnterPastScores: boolean;
}
const BLANK: FormState = {
    name: '', email: '', phone: '', department: DEPARTMENTS[0],
    gender: 'Male', dateOfBirth: '', address: '', qualification: '',
    salary: '', subjects: '', bankName: '', accountName: '', accountNumber: '', staffType: 'ACADEMIC', employeeId: '', customRoleId: '', canEnterPastScores: false
};

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';
const labelCls = 'font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block';

const SectionCard = ({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-3 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="h-8 w-8 bg-[#1E4DA6]/10 rounded-xl flex items-center justify-center text-[#1E4DA6]">{icon}</div>
            <div><h2 className="font-bold text-slate-800">{title}</h2><p className="text-xs text-slate-400">{sub}</p></div>
        </div>
        <div className="px-3 py-6">{children}</div>
    </div>
);

export default function AddStaff() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = location.pathname.includes('/edit/');

    const [form, setForm] = useState<FormState>(BLANK);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [createdCredentials, setCreatedCredentials] = useState<{ employeeId: string; loginEmail: string; generatedPassword: string; } | null>(null);
    
    const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string; isSystemDefault: boolean }>>([]);

    useEffect(() => {

        axios.get(`${API}/roles`, { withCredentials: true })
            .then(res => { if (res.data?.roles) setAvailableRoles(res.data.roles); })
            .catch(err => console.error('Failed to load roles', err));
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            setIsFetching(true);
            axios.get(`${API}/teachers/${id}`, { withCredentials: true })
                .then(res => {
                    const t = res.data.teacher; const u = res.data.user;
                    setForm({ name: u.name || '', email: u.email || '', phone: t.phone || '', department: t.department || DEPARTMENTS[0], gender: t.gender || 'Male', dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split('T')[0] : '', address: t.address || '', qualification: t.qualification || '', salary: t.salary ? String(t.salary) : '', subjects: t.subjects || '', bankName: t.bankName || '', accountName: t.accountName || '', accountNumber: t.accountNumber || '', staffType: t.staffType || 'TEACHER', employeeId: t.employeeId || '', customRoleId: u.customRoleId || '', canEnterPastScores: t.canEnterPastScores || false });
                    if (t.photoUrl) setPhotoPreview(t.photoUrl);
                })
                .catch(() => toast.error('Failed to fetch Staff data'))
                .finally(() => setIsFetching(false));
        }
    }, [id, isEditMode]);

    const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be less than 2MB'); return; }
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const toggleSubject = (name: string) => {
        const selected = form.subjects ? form.subjects.split(',').map(s => s.trim()).filter(Boolean) : [];
        const updated = selected.includes(name) ? selected.filter(s => s !== name) : [...selected, name];
        setForm(f => ({ ...f, subjects: updated.join(', ') }));
    };

    const validate = () => {
        const errs: typeof errors = {};
        if (!form.name.trim()) errs.name = 'Full name is required';
        if (!form.department.trim()) errs.department = 'Department is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', form.name);
            payload.append('email', form.email);
            payload.append('department', form.department);
            payload.append('gender', form.gender);
            payload.append('staffType', form.staffType);
            payload.append('customRoleId', form.customRoleId);
            if (form.employeeId) payload.append('employeeId', form.employeeId);
            
            if (form.phone) payload.append('phone', form.phone);
            if (form.dateOfBirth) payload.append('dateOfBirth', form.dateOfBirth);
            if (form.address) payload.append('address', form.address);
            if (form.qualification) payload.append('qualification', form.qualification);
            if (form.salary) payload.append('salary', form.salary);
            
            if (form.bankName) payload.append('bankName', form.bankName);
            if (form.accountName) payload.append('accountName', form.accountName);
            if (form.accountNumber) payload.append('accountNumber', form.accountNumber);
            if (photo) payload.append('photo', photo);

            if (isEditMode && id) {
                await axios.patch(`${API}/teachers/${id}`, payload, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Staff updated successfully!');
                navigate('/dashboard/employees/all');
            } else {
                const res = await axios.post(`${API}/teachers/add`, payload, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Staff Added Successfully!');
                setCreatedCredentials(res.data.credentials);
                setSubmitted(true);
            }
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Operation failed');
        } finally { setIsSubmitting(false); }
    };

    if (isFetching) return <div className="flex items-center justify-center min-h-64"><Loader2 className="h-10 w-10 animate-spin text-[#1E4DA6]" /></div>;

    if (submitted && createdCredentials) {
        return (
            <SettingsShell breadcrumbParent="Employees" breadcrumbCurrent="Add Staff" tabLabel="Add Staff" tabIcon={<User className="h-3.5 w-3.5" />}>
                <div className="max-w-xl mx-auto mt-10 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Staff Registered!</h2>
                    <p className="text-slate-500 text-sm mb-8">Portal credentials have been securely generated. <span className="text-red-500 font-bold">Copy these down — they will not be shown again.</span></p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left space-y-4 shadow-sm">
                        {[{ label: 'Staff ID', val: createdCredentials.employeeId }, { label: 'Login Email', val: createdCredentials.loginEmail }, { label: 'Temporary Password', val: createdCredentials.generatedPassword }].map(c => (
                            <div key={c.label}>
                                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
                                <p className="font-mono text-base font-black text-[#173F8C] bg-[#1E4DA6]/5 px-4 py-2.5 rounded-xl border border-[#1E4DA6]/10 break-all">{c.val}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => { setForm(BLANK); setPhoto(null); setPhotoPreview(null); setCreatedCredentials(null); setSubmitted(false); }}
                            className="px-6 py-3 bg-[#173F8C] text-white rounded-xl font-bold hover:bg-[#122F69] transition-colors"
                        >
                            + Add Another Staff Member
                        </button>
                        <button onClick={() => navigate('/dashboard/employees/all')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Done — Return to Staff List</button>
                    </div>
                </div>
            </SettingsShell>
        );
    }



    const field = (id: keyof FormState, label: string, type = 'text', placeholder = '', span2 = false) => (
        <div className={span2 ? 'md:col-span-2' : ''}>
            <label className={labelCls}>{label}</label>
            <input type={type} value={String((form as unknown as Record<string, unknown>)[id] ?? '')} onChange={set(id)} placeholder={placeholder}
                className={cn(inputCls, errors[id] && 'border-red-400 focus:border-red-400 focus:ring-red-100')} />
            {errors[id] && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[id]}</p>}
        </div>
    );

    return (
        <SettingsShell breadcrumbParent="Employees" breadcrumbCurrent="Add Staff" tabLabel="Add Staff" tabIcon={<User className="h-3.5 w-3.5" />}>
            <Link to="/dashboard/employees/all" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1E4DA6] mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to All Staffs
            </Link>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-800">{isEditMode ? 'Edit Staff' : 'Add New Staff'}</h1>
                <p className="text-slate-500 text-sm mt-1">{isEditMode ? 'Update Staff information and portal access.' : 'Register a new teaching staff member and set their portal access.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <SectionCard icon={<User className="h-4 w-4" />} title="Personal Information" sub="Basic staff identification details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 flex flex-col items-center sm:flex-row gap-6 mb-4">
                            <div className="h-24 w-24 shrink-0 rounded-full border-4 border-slate-50 bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center relative group">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Staff Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-slate-300" />
                                )}
                                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[10px] font-bold tracking-widest uppercase">
                                    <span className="mb-1">Upload</span>
                                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handlePhotoChange} />
                                </label>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-sm font-bold text-slate-800">Profile Photo</h3>
                                <p className="text-xs text-slate-500 mb-3">Optional. Max size 2MB (JPG, PNG, WebP).</p>
                                <label className="cursor-pointer text-xs font-bold text-[#1E4DA6] bg-[#1E4DA6]/5 px-3 py-1.5 rounded-lg border border-[#1E4DA6]/10 hover:bg-[#1E4DA6]/10 transition-colors inline-block">
                                    Browse Files
                                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handlePhotoChange} />
                                </label>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            {field('name', 'Full Name *', 'text', 'e.g. Alamin Yusuf')}
                        </div>
                        {field('email', 'Email Address (Optional)', 'email', 'Staff@school.com')}
                        {field('phone', 'Phone Number', 'tel', '+234...')}

                        <div>
                            <label className={labelCls}>Staff Type</label>
                            <select value={form.staffType} onChange={set('staffType')} className={inputCls}>
                                <option value="ACADEMIC">Academic</option>
                                <option value="NON_ACADEMIC">Non-Academic</option>
                                <option value="ADMINISTRATIVE">Administrative</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className={labelCls}>Access Role (Optional)</label>
                            <select value={form.customRoleId} onChange={set('customRoleId')} className={inputCls}>
                                <option value="">-- No Specific Role --</option>
                                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name} {r.isSystemDefault ? '(System)' : ''}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                <input type="checkbox" checked={form.canEnterPastScores} onChange={e => setForm(f => ({ ...f, canEnterPastScores: e.target.checked }))} className="w-5 h-5 text-[#1E4DA6] rounded" />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Allow entering past scores (Override Lock)</p>
                                    <p className="text-xs text-slate-500">If enabled, this teacher can select past terms/sessions when entering scores. Otherwise, they are locked to the current active term.</p>
                                </div>
                            </label>
                        </div>
                        
                        {field('employeeId', 'Staff ID (Optional)', 'text', 'Auto-generated if blank')}
                        {field('dateOfBirth', 'Date of Birth', 'date')}
                        <div>
                            <label className={labelCls}>Gender</label>
                            <select value={form.gender} onChange={set('gender')} className={inputCls}>
                                <option>Male</option><option>Female</option>
                            </select>
                        </div>
                        {field('qualification', 'Qualification', 'text', 'e.g. B.Ed, M.Sc')}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Home Address</label>
                            <textarea rows={2} value={form.address} onChange={set('address')} placeholder="Enter home address" className={cn(inputCls, 'resize-none')} />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard icon={<Briefcase className="h-4 w-4" />} title="Role & Employment" sub="Department and salary structure">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelCls}>Department *</label>
                            <select value={form.department} onChange={set('department')} className={inputCls}>
                                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        {field('salary', 'Monthly Salary (₦)', 'number', 'e.g. 150000')}

                    </div>
                </SectionCard>

                <SectionCard icon={<Landmark className="h-4 w-4" />} title="Bank Details" sub="Required for salary disbursements">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {field('bankName', 'Bank Name', 'text', 'e.g. Access Bank')}
                        {field('accountNumber', 'Account Number', 'text', 'e.g. 0690000031')}
                        <div className="md:col-span-2">{field('accountName', 'Account Name', 'text', 'e.g. John Doe')}</div>
                    </div>
                </SectionCard>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link to="/dashboard/employees/all" className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors">Cancel</Link>
                    <button type="submit" disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-[#173F8C] hover:bg-[#122F69] rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Update Staff' : 'Save Staff'}
                    </button>
                </div>
            </form>
        </SettingsShell>
    );
}
