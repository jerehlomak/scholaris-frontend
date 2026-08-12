import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
    Download, RotateCcw, Check, ArrowLeft, Loader2, User, Info, FileText, Printer, AlertCircle
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { cn } from '../../../lib/utils';
import TranscriptSheet from '../results/TranscriptSheet';

const API = '/api/v1';

const EMPTY_FORM = {
    name: '', classLevel: '', classId: '', subjectCategoryId: '', gender: '',
    phone: '', admissionDate: '', dateOfBirth: '', orphan: 'no', religion: '', club: '',
    bloodGroup: '', genotype: '', address: '', previousSchool: '',
};

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-60 disabled:bg-slate-50';
const labelCls = 'font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block';

const SectionCard = ({ icon, num, title, sub, children }: {
    icon: React.ReactNode; num: number; title: string; sub?: string; children: React.ReactNode;
}) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-700 text-white flex items-center justify-center text-sm font-black shrink-0">{num}</div>
            <div className="h-8 w-8 flex items-center justify-center text-blue-600 -ml-3 shrink-0">{icon}</div>
            <div>
                <h2 className="font-bold text-slate-800">{title}</h2>
                {sub && <p className="text-xs text-slate-400">{sub}</p>}
            </div>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
    </div>
);

export function AdmissionForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const isViewMode = location.pathname.includes('/view/');
    const isEditMode = location.pathname.includes('/edit/');
    const pageTitle = isViewMode ? 'Student Details' : isEditMode ? 'Edit Student' : 'Admission Form';

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStudent, setIsFetchingStudent] = useState(false);
    const [viewTranscript, setViewTranscript] = useState(false);
    const [admissionNo, setAdmissionNo] = useState('');
    const [admissionNoError, setAdmissionNoError] = useState('');
    const [admissionNoChecking, setAdmissionNoChecking] = useState(false);
    const [profilePicture, setProfilePicture] = useState<string>('');
    const [fileName, setFileName] = useState('No file chosen');
    const [createdCredentials, setCreatedCredentials] = useState<{
        admissionNo: string; loginEmail: string; generatedPassword: string;
    } | null>(null);
    const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string; level: string }[]>([]);
    const [availableSubjectCategories, setAvailableSubjectCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [linkedParent, setLinkedParent] = useState<{
        fatherName?: string; fatherPhone?: string; motherName?: string; motherPhone?: string;
    } | null>(null);

    useEffect(() => {
        axios.get(`${API}/classes/all`, { withCredentials: true })
            .then(res => setAvailableClasses(res.data.classes || []))
            .catch(() => {});

        axios.get(`${API}/subject-categories`, { withCredentials: true })
            .then(res => setAvailableSubjectCategories(res.data.categories || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if ((isEditMode || isViewMode) && id) {
            setIsFetchingStudent(true);
            axios.get(`${API}/students/${id}`, { withCredentials: true })
                .then(res => {
                    const s = res.data.student;
                    const u = res.data.user;
                    setAdmissionNo(s.admissionNo);
                    setProfilePicture(s.profilePicture || '');
                    setFormData({
                        name: u.name || '',
                        classId: s.classId || '',
                        classLevel: s.classLevel || '',
                        subjectCategoryId: s.subjectCategoryId || '',
                        gender: s.gender || '',
                        phone: s.phone || '',
                        admissionDate: s.admissionDate ? s.admissionDate.split('T')[0] : '',
                        dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
                        orphan: s.orphan ? 'yes' : 'no',
                        religion: s.religion || '',
                        club: s.club || '',
                        bloodGroup: s.bloodGroup || '',
                        genotype: s.genotype || '',
                        address: s.address || '',
                        previousSchool: s.previousSchool || '',
                    });
                    // Set selected class level for hierarchical dropdown
                    setSelectedLevel(s.classLevel || '');
                    if (s.parent) {
                        setLinkedParent({
                            fatherName: s.parent.fatherName,
                            fatherPhone: s.parent.fatherPhone,
                            motherName: s.parent.motherName,
                            motherPhone: s.parent.motherPhone,
                        });
                    }
                })
                .catch(() => toast.error('Failed to load student data'))
                .finally(() => setIsFetchingStudent(false));
        }
    }, [id, isEditMode, isViewMode]);

    const set = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

    // Duplicate admission number check
    const checkAdmissionNo = useCallback(async (value: string) => {
        if (!value || isEditMode) return;
        setAdmissionNoChecking(true);
        setAdmissionNoError('');
        try {
            const res = await axios.get(`${API}/students/check-admission?admissionNo=${encodeURIComponent(value)}`, {
                withCredentials: true
            });
            if (res.data.exists) {
                setAdmissionNoError(`Admission number "${value}" already exists in the system.`);
            }
        } catch {
            // silently fail check
        } finally {
            setAdmissionNoChecking(false);
        }
    }, [isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (admissionNoError) { toast.error(admissionNoError); return; }
        if (!formData.name || !formData.classId) {
            toast.error('Please fill all required fields: Name and Class.');
            return;
        }
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                admissionNo: admissionNo || undefined,
                subjectCategoryId: formData.subjectCategoryId === 'none' ? '' : formData.subjectCategoryId,
                profilePicture: profilePicture || undefined,
            };
            if (isEditMode && id) {
                await axios.patch(`${API}/students/${id}`, payload, { withCredentials: true });
                toast.success('Student updated successfully!');
                navigate('/dashboard/students/all');
            } else {
                const res = await axios.post(`${API}/students/add`, payload, { withCredentials: true });
                toast.success('Student registered successfully!');
                setCreatedCredentials(res.data.credentials);
                setFormData(EMPTY_FORM);
                setAdmissionNo('');
            }
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Operation failed. Check you are logged in as Admin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintProfile = () => {
        const printContent = `
            <html><head><title>Student Profile — ${formData.name}</title>
            <style>
                body{font-family:sans-serif;padding:32px;color:#1e293b;max-width:680px;margin:0 auto}
                .header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0}
                .avatar{width:64px;height:64px;border-radius:50%;background:#1d4ed8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900}
                h1{font-size:22px;margin:0 0 4px;font-weight:900}
                .sub{font-size:13px;color:#64748b;font-family:monospace}
                .section{margin-bottom:24px}
                .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
                .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px}
                .field label{font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:2px}
                .field span{font-size:13px;font-weight:600;color:#1e293b}
                @media print{body{padding:0}}
            </style></head><body>
            <div class="header">
                <div class="avatar">${(formData.name || 'S').charAt(0)}</div>
                <div>
                    <h1>${formData.name || '—'}</h1>
                    <div class="sub">${admissionNo || 'No Admission No.'}</div>
                </div>
            </div>
            <div class="section">
                <div class="section-title">Student Information</div>
                <div class="grid">
                    <div class="field"><label>Class</label><span>${availableClasses.find(c => c.id === formData.classId)?.name || formData.classLevel || '—'}</span></div>
                    <div class="field"><label>Gender</label><span>${formData.gender || '—'}</span></div>
                    <div class="field"><label>Date of Birth</label><span>${formData.dateOfBirth || '—'}</span></div>
                    <div class="field"><label>Admission Date</label><span>${formData.admissionDate || '—'}</span></div>
                    <div class="field"><label>Phone</label><span>${formData.phone || '—'}</span></div>
                    <div class="field"><label>Religion</label><span>${formData.religion || '—'}</span></div>
                    <div class="field"><label>Club / Society</label><span>${formData.club || '—'}</span></div>
                    <div class="field"><label>Blood Group</label><span>${formData.bloodGroup || '—'}</span></div>
                    <div class="field"><label>Genotype</label><span>${formData.genotype || '—'}</span></div>
                    <div class="field"><label>Orphan</label><span>${formData.orphan === 'yes' ? 'Yes' : 'No'}</span></div>
                    <div class="field"><label>Previous School</label><span>${formData.previousSchool || '—'}</span></div>
                    <div class="field" style="grid-column:span 2"><label>Address</label><span>${formData.address || '—'}</span></div>
                </div>
            </div>
            ${linkedParent ? `
            <div class="section">
                <div class="section-title">Parent / Guardian</div>
                <div class="grid">
                    <div class="field"><label>Father's Name</label><span>${linkedParent.fatherName || '—'}</span></div>
                    <div class="field"><label>Father's Phone</label><span>${linkedParent.fatherPhone || '—'}</span></div>
                    <div class="field"><label>Mother's Name</label><span>${linkedParent.motherName || '—'}</span></div>
                    <div class="field"><label>Mother's Phone</label><span>${linkedParent.motherPhone || '—'}</span></div>
                </div>
            </div>` : ''}
            <div style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:right">Printed: ${new Date().toLocaleString()}</div>
            </body></html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(printContent); win.document.close(); win.print(); }
    };

    const disabled = isViewMode || isLoading;
    if (isFetchingStudent) return <div className="flex items-center justify-center min-h-64"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent={pageTitle} tabLabel={pageTitle} tabIcon={<User className="h-3.5 w-3.5" />}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-6">
                <span>Dashboard</span><span>/</span>
                <button onClick={() => navigate('/dashboard/students/all')} className="hover:text-blue-600 transition-colors">Students</button>
                <span>/</span><span>{pageTitle}</span>
                {admissionNo && <span className="ml-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{admissionNo}</span>}
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <h1 className="text-2xl font-black text-slate-800">{pageTitle}</h1>
                </div>
                <div className="flex gap-3">
                    {isViewMode ? (
                        <>
                            <button onClick={handlePrintProfile}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                <Printer className="h-4 w-4" /> Print Profile
                            </button>
                            {id && (
                                <button onClick={() => setViewTranscript(true)}
                                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
                                    <FileText className="h-4 w-4" /> Transcript
                                </button>
                            )}
                            <button onClick={() => navigate(`/dashboard/students/edit/${id}`)}
                                className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 transition-colors">
                                Edit Student
                            </button>
                        </>
                    ) : !isEditMode && (
                        <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <Download className="h-4 w-4" /> Import Students
                        </button>
                    )}
                </div>
            </div>

            {/* Credentials Banner */}
            {createdCredentials && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Check className="h-6 w-6 text-emerald-600" />
                        <h3 className="text-base font-black text-emerald-700">Student Registered Successfully!</h3>
                    </div>
                    <p className="text-sm text-emerald-600 mb-4">Copy and securely share these credentials with the student.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Admission No.', val: createdCredentials.admissionNo },
                            { label: 'Login Email', val: createdCredentials.loginEmail },
                            { label: 'Generated Password', val: createdCredentials.generatedPassword },
                        ].map(c => (
                            <div key={c.label} className="rounded-xl bg-white border border-emerald-100 p-3">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{c.label}</span>
                                <span className="font-mono font-black text-blue-700 text-sm break-all">{c.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {/* Section 1 — Student Information */}
                <SectionCard icon={<User className="h-4 w-4" />} num={1} title="Student Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Name */}
                        <div className="md:col-span-2 lg:col-span-2">
                            <label className={labelCls}>Student Name <span className="text-blue-600">*</span></label>
                            <Input value={formData.name} onChange={e => set('name', e.target.value)}
                                className={inputCls} placeholder="Full name (type in any language)" disabled={disabled} />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className={labelCls}>Gender (Optional)</label>
                            <Select value={formData.gender} onValueChange={val => set('gender', val)} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class Level */}
                        <div>
                            <label className={labelCls}>Class Level <span className="text-blue-600">*</span></label>
                            <Select value={selectedLevel} onValueChange={val => { setSelectedLevel(val); set('classId', ''); }} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Select Class Level" /></SelectTrigger>
                                <SelectContent>
                                    {Array.from(new Set(availableClasses.map(c => c.level))).filter(Boolean).map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Class Arm */}
                        <div>
                            <label className={labelCls}>Class <span className="text-blue-600">*</span></label>
                            <Select value={formData.classId} onValueChange={val => set('classId', val)} disabled={disabled || !selectedLevel}>
                                <SelectTrigger className={inputCls}>
                                    <SelectValue placeholder={selectedLevel ? "Select Class Arm" : "Select Level First"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableClasses
                                        .filter(c => c.level === selectedLevel)
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject Category */}
                        <div>
                            <label className={labelCls}>Subject Category (Optional)</label>
                            <Select value={formData.subjectCategoryId} onValueChange={val => set('subjectCategoryId', val)} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="General (All Subjects)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">General (All Subjects)</SelectItem>
                                    {availableSubjectCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Admission No. */}
                        <div>
                            <label className={labelCls}>Admission No.</label>
                            <div className="relative">
                                <Input
                                    value={admissionNo}
                                    onChange={e => { setAdmissionNo(e.target.value); setAdmissionNoError(''); }}
                                    onBlur={() => checkAdmissionNo(admissionNo)}
                                    className={cn(inputCls, admissionNoError && 'border-red-400 focus:border-red-400 focus:ring-red-100')}
                                    placeholder="Auto-generated if left blank"
                                    disabled={disabled || (isEditMode && !!admissionNo)}
                                />
                                {admissionNoChecking && (
                                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                )}
                            </div>
                            {admissionNoError && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs font-semibold">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {admissionNoError}
                                </div>
                            )}
                            {!admissionNoError && !isEditMode && !admissionNo && (
                                <p className="text-xs text-slate-400 mt-1">Leave blank to auto-generate (e.g. SKL-2026-0001)</p>
                            )}
                        </div>

                        {/* Admission Date */}
                        <div>
                            <label className={labelCls}>Date of Admission</label>
                            <Input type="date" value={formData.admissionDate} onChange={e => set('admissionDate', e.target.value)}
                                className={inputCls} disabled={disabled} />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className={labelCls}>Phone (SMS / WhatsApp)</label>
                            <Input value={formData.phone} onChange={e => set('phone', e.target.value)}
                                className={inputCls} placeholder="+234xxxxxxxxxx" disabled={disabled} />
                        </div>

                        {/* Photo */}
                        <div>
                            <label className={labelCls}>Picture</label>
                            <div className={cn('relative', disabled && 'opacity-60 pointer-events-none')}>
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={disabled} onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setFileName(file.name);
                                        const reader = new FileReader();
                                        reader.onloadend = () => setProfilePicture(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                                <div className="rounded-xl border border-slate-200 h-12 flex items-center px-1 bg-white shadow-sm overflow-hidden">
                                    <div className="bg-slate-100 px-4 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold mr-3 text-slate-600 shrink-0">Choose File</div>
                                    <span className="text-slate-500 text-sm truncate pr-2">{fileName}</span>
                                </div>
                                {profilePicture && <img src={profilePicture} className="h-10 w-10 absolute right-1 top-1 rounded-lg object-cover" />}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Section 2 — Other Information */}
                <SectionCard icon={<Info className="h-4 w-4" />} num={2} title="Other Information" sub="Personal and medical details">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className={labelCls}>Date of Birth</label>
                            <Input type="date" value={formData.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                                className={inputCls} disabled={disabled} />
                        </div>

                        <div>
                            <label className={labelCls}>Orphan Student</label>
                            <Select value={formData.orphan} onValueChange={val => set('orphan', val)} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no">No</SelectItem>
                                    <SelectItem value="yes">Yes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className={labelCls}>Religion</label>
                            <Select value={formData.religion} onValueChange={val => set('religion', val)} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Religion" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Christianity">Christianity</SelectItem>
                                    <SelectItem value="Islam">Islam</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className={labelCls}>Club / Society</label>
                            <Input value={formData.club} onChange={e => set('club', e.target.value)}
                                className={inputCls} placeholder="e.g. Debate Club" disabled={disabled} />
                        </div>

                        {/* Medical Info */}
                        <div>
                            <label className={labelCls}>Blood Group</label>
                            <Select value={formData.bloodGroup} onValueChange={val => set('bloodGroup', val)} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Blood Group" /></SelectTrigger>
                                <SelectContent>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg =>
                                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className={labelCls}>Genotype</label>
                            <Select value={formData.genotype} onValueChange={val => set('genotype', val)} disabled={disabled}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Genotype" /></SelectTrigger>
                                <SelectContent>
                                    {['AA', 'AS', 'AC', 'SS', 'SC', 'CC'].map(g =>
                                        <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className={labelCls}>Previous School</label>
                            <Input value={formData.previousSchool} onChange={e => set('previousSchool', e.target.value)}
                                className={inputCls} placeholder="Previous School" disabled={disabled} />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3">
                            <label className={labelCls}>Address</label>
                            <Input value={formData.address} onChange={e => set('address', e.target.value)}
                                className={inputCls} placeholder="Home Address" disabled={disabled} />
                        </div>
                    </div>
                </SectionCard>

                {/* Parent Info — read-only, shown only in view/edit if a parent is linked */}
                {(isViewMode || isEditMode) && linkedParent && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-black">P</div>
                            <h3 className="font-bold text-slate-800">Linked Parent / Guardian</h3>
                            <span className="text-xs text-slate-400 ml-1">(read-only — manage in the Parent module)</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {[
                                { label: "Father's Name", val: linkedParent.fatherName },
                                { label: "Father's Phone", val: linkedParent.fatherPhone },
                                { label: "Mother's Name", val: linkedParent.motherName },
                                { label: "Mother's Phone", val: linkedParent.motherPhone },
                            ].map(f => (
                                <div key={f.label}>
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1">{f.label}</span>
                                    <span className="font-bold text-slate-700">{f.val || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isViewMode && (
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 border-t border-slate-100 pb-8">
                        <button type="button" onClick={() => { setFormData(EMPTY_FORM); setAdmissionNo(''); setAdmissionNoError(''); }}
                            disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 sm:py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <RotateCcw className="h-4 w-4" /> Reset
                        </button>
                        <button type="submit" disabled={isLoading || !!admissionNoError}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 sm:py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-50 transition-colors">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {isLoading ? 'Saving...' : isEditMode ? 'Update Student' : 'Register Student'}
                        </button>
                    </div>
                )}
            </form>

            {viewTranscript && id && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl relative my-8 p-4">
                        <TranscriptSheet studentId={id} API={API} onClose={() => setViewTranscript(false)} />
                    </div>
                </div>
            )}
        </SettingsShell>
    );
}
