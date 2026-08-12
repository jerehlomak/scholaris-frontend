import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const API = '/api/v1';
const inputCls = 'bg-white border-gray-200 h-11 shadow-sm';

interface ClassOption { id: string; name: string; level: string; }
interface TeacherOption { id: string; name: string; department?: string; }

const STREAM_OPTIONS = [
    { value: 'ALL', label: 'All Students (JSS & SS)' },
    { value: 'JSS', label: 'JSS Only (Junior Secondary)' },
    { value: 'SCIENCE', label: 'Science Stream (SS)' },
    { value: 'ARTS', label: 'Arts Stream (SS)' },
    { value: 'COMMERCE', label: 'Commerce Stream (SS)' },
];

export function EditSubject() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', code: '', categoryId: 'none', stream: 'ALL', type: 'CORE', description: '', teacherId: 'none'
    });
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch options
                const [clsRes, tRes, catRes] = await Promise.all([
                    axios.get(`${API}/classes/all`, { withCredentials: true }).catch(() => ({ data: { classes: [] } })),
                    axios.get(`${API}/teachers/all`, { withCredentials: true }).catch(() => ({ data: { teachers: [] } })),
                    axios.get(`${API}/subject-categories`, { withCredentials: true }).catch(() => ({ data: { categories: [] } }))
                ]);
                setClasses(clsRes.data.classes || []);
                setTeachers((tRes.data.teachers || []).map((t: any) => ({ id: t.id, name: t.user?.name || 'Unknown', department: t.department })));
                setCategories(catRes.data.categories || []);

                // Fetch subject
                const subRes = await axios.get(`${API}/subjects/${id}`, { withCredentials: true });
                const s = subRes.data.subject;

                setForm({
                    name: s.name || '',
                    code: s.code || '',
                    categoryId: s.categoryId || 'none',
                    stream: s.stream || 'ALL',
                    type: s.type || 'CORE',
                    description: s.description || '',
                    teacherId: s.teacherId || 'none'
                });
                setSelectedClassIds(s.classes ? s.classes.map((c: any) => c.classId) : []);

            } catch (err) {
                toast.error("Failed to load subject details");
                navigate('/dashboard/subjects/all');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const toggleClass = (clsId: string) =>
        setSelectedClassIds(prev => prev.includes(clsId) ? prev.filter(x => x !== clsId) : [...prev, clsId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) { toast.error('Subject name is required'); return; }
        setIsSubmitting(true);
        try {
            await axios.patch(`${API}/subjects/${id}`, {
                ...form,
                categoryId: form.categoryId === 'none' ? null : form.categoryId,
                teacherId: form.teacherId === 'none' ? null : form.teacherId,
                classIds: selectedClassIds
            }, { withCredentials: true });
            toast.success(`Subject "${form.name}" updated successfully!`);
            navigate('/dashboard/subjects/all');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to update subject');
        } finally {
            setIsSubmitting(false);
        }
    };

    const streamInfo: Record<string, string> = {
        ALL: '📚 Mathematics, English, Civic Education, Basic Science etc.',
        JSS: '🏫 Agricultural Science, Basic Technology, PHE, Cultural & Creative Arts etc.',
        SCIENCE: '🔬 Physics, Chemistry, Biology, Further Maths etc.',
        ARTS: '🎨 Literature, Government, History, Fine Art, Yoruba etc.',
        COMMERCE: '💼 Economics, Commerce, Accounting, Book-keeping etc.',
    };

    if (isLoading) {
        return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0036a1]" /></div>;
    }

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-800">Subjects</span>
                <span>/</span>
                <span>Edit Subject</span>
            </div>

            <div className="w-full text-center mt-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Subject</h1>
                <p className="text-sm text-gray-500">Update subject details, teacher assignment, and classes.</p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

                {/* Section 1: Subject Info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">1</div>
                        <h2 className="text-base font-bold text-gray-800">Subject Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <div className="space-y-1.5">
                            <Label className="font-semibold">Subject Name <span className="text-[#0036a1]">*</span></Label>
                            <Input value={form.name} onChange={e => set('name', e.target.value)}
                                className={inputCls} placeholder="e.g. Mathematics" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-gray-500">Subject Code</Label>
                            <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                                className={inputCls} placeholder="e.g. MTH-101" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold">Subject Type <span className="text-[#0036a1]">*</span></Label>
                            <Select value={form.type} onValueChange={val => set('type', val)}>
                                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CORE">Core (Compulsory)</SelectItem>
                                    <SelectItem value="ELECTIVE">Elective (Optional)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold">Category (Optional)</Label>
                            <Select value={form.categoryId} onValueChange={val => set('categoryId', val)}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">General Subject (No Category)</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-gray-900">Assigned Teacher</Label>
                            <Select value={form.teacherId} onValueChange={val => set('teacherId', val)}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-gray-500 italic">No teacher assigned</SelectItem>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name} {t.department ? `(${t.department})` : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="font-semibold text-gray-500">Description (Optional)</Label>
                            <Input value={form.description} onChange={e => set('description', e.target.value)}
                                className={inputCls} placeholder="Brief description..." />
                        </div>

                    </div>
                </div>

                {/* Section 2: Stream / Category */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">2</div>
                        <h2 className="text-base font-bold text-gray-800">Student Stream</h2>
                    </div>
                    <p className="text-xs text-gray-500 mb-5 ml-8">Choose which category of students this subject applies to.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {STREAM_OPTIONS.map(opt => (
                            <button key={opt.value} type="button" onClick={() => set('stream', opt.value)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${form.stream === opt.value ? 'border-[#0036a1] bg-[#0036a1]/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                <p className={`text-sm font-bold ${form.stream === opt.value ? 'text-[#0036a1]' : 'text-gray-700'}`}>{opt.label}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{streamInfo[opt.value]}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 3: Assign to Classes */}
                {classes.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">3</div>
                            <h2 className="text-base font-bold text-gray-800">Assign to Classes</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 ml-8">Select which classes teach this subject. The assigned teacher will now be responsible for these classes for this subject.</p>
                        <div className="flex flex-wrap gap-2">
                            {classes.map(cls => (
                                <button key={cls.id} type="button" onClick={() => toggleClass(cls.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedClassIds.includes(cls.id) ? 'bg-[#0036a1] text-white border-[#0036a1]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0036a1]/40'}`}>
                                    {cls.name}
                                </button>
                            ))}
                        </div>
                        {selectedClassIds.length > 0 && (
                            <p className="text-xs text-[#0036a1] mt-3 font-medium">{selectedClassIds.length} class{selectedClassIds.length > 1 ? 'es' : ''} selected</p>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11 px-6 rounded-xl font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="h-11 px-8 rounded-xl bg-[#0036a1] hover:bg-[#001761] text-white font-bold flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {isSubmitting ? 'Saving...' : 'Update Subject'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
