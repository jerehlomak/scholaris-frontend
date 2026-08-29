import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, ArrowLeft, Loader2, X, Check, UserPlus, Users, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';

const API = '/api/v1';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';
const labelCls = 'font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block';

interface StudentOption { id: string; name: string; admissionNo: string; classLevel: string; className?: string; classId?: string; }
interface ClassObj { id: string; name: string; }

const SectionCard = ({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3 rounded-t-2xl">
            <div className="h-8 w-8 bg-[#1E4DA6]/10 rounded-xl flex items-center justify-center text-[#1E4DA6]">{icon}</div>
            <div><h2 className="font-bold text-slate-800">{title}</h2>{sub && <p className="text-xs text-slate-400">{sub}</p>}</div>
        </div>
        <div className="py-6 px-3">{children}</div>
    </div>
);

export default function AddParent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditMode = location.pathname.includes('/edit/');

    const [formData, setFormData] = useState({
        fatherName: '', fatherPhone: '', fatherNationalId: '', fatherOccupation: '', fatherEducation: '',
        motherName: '', motherPhone: '', motherNationalId: '', motherOccupation: '', motherEducation: '',
        address: '', occupation: ''
    });
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
    const [classes, setClasses] = useState<ClassObj[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ parentId: string; loginEmail: string; generatedPassword: string; } | null>(null);

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/students/all`, { withCredentials: true }),
            axios.get(`${API}/classes/all`, { withCredentials: true })
        ]).then(([studentsRes, classesRes]) => {
            const s = (studentsRes.data.students || []).map((s: {
                userId: string; user?: { name?: string; id?: string };
                admissionNo: string; classLevel: string; classId?: string;
                classArm?: { id?: string; name?: string }
            }) => ({
                id: s.userId || s.user?.id || '',
                name: s.user?.name || '',
                admissionNo: s.admissionNo,
                classLevel: s.classLevel,
                className: s.classArm?.name || '',
                classId: s.classArm?.id || s.classId || ''
            })).filter((s: StudentOption) => s.id && s.name);
            setAvailableStudents(s);
            setClasses(classesRes.data.classes || []);
        }).catch(() => toast.error('Failed to load students and classes'));
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            setIsFetching(true);
            axios.get(`${API}/parents/${id}`, { withCredentials: true })
                .then(res => {
                    const p = res.data.parent;
                    setFormData({ fatherName: p.fatherName || '', fatherPhone: p.fatherPhone || '', fatherNationalId: p.fatherNationalId || '', fatherOccupation: p.fatherOccupation || '', fatherEducation: p.fatherEducation || '', motherName: p.motherName || '', motherPhone: p.motherPhone || '', motherNationalId: p.motherNationalId || '', motherOccupation: p.motherOccupation || '', motherEducation: p.motherEducation || '', address: p.address || '', occupation: p.occupation || '' });
                    // Students are linked via userId
                    setSelectedStudentIds((p.students || []).map((s: { userId?: string; id?: string }) => s.userId || s.id || ''));
                })
                .catch(() => toast.error('Failed to fetch parent data'))
                .finally(() => setIsFetching(false));
        }
    }, [id, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const toggleStudent = (sId: string) => setSelectedStudentIds(prev => prev.includes(sId) ? prev.filter(i => i !== sId) : [...prev, sId]);
    const removeStudent = (sId: string) => setSelectedStudentIds(prev => prev.filter(i => i !== sId));
    const filteredStudents = availableStudents.filter(s => {
        if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
        return s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.admissionNo?.toLowerCase() || '').includes(studentSearch.toLowerCase()) ||
        (s.className?.toLowerCase() || '').includes(studentSearch.toLowerCase());
    });
    const selectedStudents = availableStudents.filter(s => selectedStudentIds.includes(s.id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fatherName && !formData.motherName) { toast.error("At least one guardian's name is required"); return; }
        setIsSubmitting(true);
        try {
            if (isEditMode && id) {
                await axios.patch(`${API}/parents/${id}`, { ...formData, studentIds: selectedStudentIds }, { withCredentials: true });
                toast.success('Parent updated successfully!');
                navigate('/dashboard/parents/all');
            } else {
                const name = formData.fatherName || formData.motherName;
                const phone = formData.fatherPhone || formData.motherPhone;
                if (!phone) { toast.error('At least one phone number is required'); setIsSubmitting(false); return; }
                const res = await axios.post(`${API}/parents/add`, { name, phone, ...formData, studentIds: selectedStudentIds }, { withCredentials: true });
                toast.success('Parent Profile Created Successfully!');
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
            <SettingsShell breadcrumbParent="Parents" breadcrumbCurrent="Add Parent" tabLabel="Add Parent" tabIcon={<Users className="h-3.5 w-3.5" />}>
                <div className="max-w-xl mx-auto mt-10 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Parent Registered!</h2>
                    <p className="text-slate-500 text-sm mb-8">Portal access credentials have been securely generated. <span className="text-red-500 font-bold">Please instruct the parent to save these.</span></p>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-left space-y-4 shadow-sm">
                        {[{ label: 'Parent ID', val: createdCredentials.parentId }, { label: 'System Login Email', val: createdCredentials.loginEmail }, { label: 'Generated Password', val: createdCredentials.generatedPassword }].map(c => (
                            <div key={c.label}>
                                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
                                <p className="font-mono text-base font-black text-[#173F8C] bg-[#1E4DA6]/5 px-4 py-2.5 rounded-xl border border-[#1E4DA6]/10 break-all">{c.val}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => {
                                setFormData({ fatherName: '', fatherPhone: '', fatherNationalId: '', fatherOccupation: '', fatherEducation: '', motherName: '', motherPhone: '', motherNationalId: '', motherOccupation: '', motherEducation: '', address: '', occupation: '' });
                                setSelectedStudentIds([]);
                                setStudentSearch('');
                                setSelectedClassId('all');
                                setCreatedCredentials(null);
                                setSubmitted(false);
                            }}
                            className="px-6 py-3 bg-[#173F8C] text-white rounded-xl font-bold hover:bg-[#122F69] transition-colors"
                        >
                            + Add Another Parent
                        </button>
                        <button onClick={() => navigate('/dashboard/parents/all')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">Done — Return to Parents List</button>
                    </div>
                </div>
            </SettingsShell>
        );
    }



    const fieldRow = (name: string, label: string, type = 'text', required = false) => (
        <div className="space-y-2">
            <label className={labelCls}>{label} {required && <span className="text-[#1E4DA6]">*</span>}</label>
            <input type={type} name={name} value={(formData as Record<string, string>)[name]}
                onChange={handleChange} className={inputCls} placeholder={`Enter ${label.toLowerCase()}`} />
        </div>
    );

    return (
        <SettingsShell breadcrumbParent="Parents" breadcrumbCurrent="Add Parent" tabLabel="Add Parent" tabIcon={<Users className="h-3.5 w-3.5" />}>
            <Link to="/dashboard/parents/all" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1E4DA6] mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to All Parents
            </Link>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-800">{isEditMode ? 'Edit Parent/Guardian' : 'Add New Parent/Guardian'}</h1>
                <p className="text-slate-500 text-sm mt-1">{isEditMode ? 'Update family contact information.' : 'Register a family account and grant portal access to guardians.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Assign Children */}
                <SectionCard icon={<UserPlus className="h-4 w-4" />} title="Assign Children" sub="Link one or more students to this parent account.">
                    {selectedStudents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedStudents.map(s => (
                                <span key={s.id} className="inline-flex items-center gap-1.5 bg-[#1E4DA6]/10 text-[#173F8C] text-xs font-bold px-3 py-1.5 rounded-full">
                                    {s.name} ({s.classLevel})
                                    <button type="button" onClick={() => removeStudent(s.id)} className="hover:text-red-500 transition-colors ml-1"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelCls}>Step 1: Select Class</label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-[46px] bg-white text-sm font-semibold text-slate-800">
                                    <SelectValue placeholder="Filter by class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 relative">
                            <label className={labelCls}>Step 2: Select Student</label>
                            <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} onFocus={() => setStudentDropdownOpen(true)} onBlur={() => setTimeout(() => setStudentDropdownOpen(false), 200)}
                                placeholder="Search and select students..." className={inputCls} />
                            {studentDropdownOpen && (
                                <div className="absolute z-30 top-full left-0 right-0 max-h-56 overflow-y-auto mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto">
                                    {filteredStudents.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-slate-400 text-center">No matching students found in this class.</div>
                                    ) : filteredStudents.map(s => (
                                        <button key={s.id} type="button" onMouseDown={() => toggleStudent(s.id)}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between transition-colors">
                                            <div>
                                                <span className="font-bold text-slate-800">{s.name}</span>
                                                <span className="text-slate-400 text-xs ml-2">{s.admissionNo} · {s.className || s.classLevel}</span>
                                            </div>
                                            {selectedStudentIds.includes(s.id) && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">{selectedStudentIds.length} student(s) selected</p>
                </SectionCard>

                {/* Father */}
                <SectionCard icon={<Users className="h-4 w-4" />} title="Father / Primary Guardian" sub="Primary contact person for the student.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {fieldRow('fatherName', "Father's Full Name", 'text', true)}
                        {fieldRow('fatherPhone', "Father's Phone Number", 'tel')}
                        {fieldRow('fatherNationalId', 'National ID')}
                        {fieldRow('fatherOccupation', 'Occupation')}
                        {fieldRow('fatherEducation', 'Education Level')}
                    </div>
                </SectionCard>

                {/* Mother */}
                <SectionCard icon={<Heart className="h-4 w-4" />} title="Mother / Secondary Guardian" sub="Secondary contact person for the student.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {fieldRow('motherName', "Mother's Full Name")}
                        {fieldRow('motherPhone', "Mother's Phone Number", 'tel')}
                        {fieldRow('motherNationalId', 'National ID')}
                        {fieldRow('motherOccupation', 'Occupation')}
                        {fieldRow('motherEducation', 'Education Level')}
                    </div>
                </SectionCard>

                {/* Additional */}
                <SectionCard icon={<Users className="h-4 w-4" />} title="Additional Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {fieldRow('occupation', 'Primary Occupation (Combined)')}
                        <div className="md:col-span-2 space-y-2">
                            <label className={labelCls}>Home Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputCls} placeholder="Enter home address" />
                        </div>
                    </div>
                </SectionCard>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => navigate('/dashboard/parents/all')} className={cn('px-5 py-2.5 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors')}>Cancel</button>
                    <button type="submit" disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-[#173F8C] hover:bg-[#122F69] rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Update Parent' : 'Save Parent'}
                    </button>
                </div>
            </form>
        </SettingsShell>
    );
}
