import React, { useState, useEffect } from 'react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { Check, ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

const API = '/api/v1';
const inputCls = 'bg-white border-gray-200 h-11 shadow-sm';

interface ClassOption { id: string; name: string; level: string; }
interface TeacherOption { id: string; name: string; department?: string; }
interface ClassLevel { id: string; name: string; category?: string | null; order: number; }

export function AddSubject() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', code: 'Auto-generated on save', categoryId: 'none', type: 'CORE', description: '', teacherId: 'none'
    });
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/classes/all`, { withCredentials: true }).catch(() => ({ data: { classes: [] } })),
            axios.get(`${API}/teachers/all`, { withCredentials: true }).catch(() => ({ data: { teachers: [] } })),
            axios.get('/api/v1/subject-categories', { withCredentials: true }).catch(() => ({ data: { categories: [] } })),
            axios.get(`${API}/school-settings/class-levels`, { withCredentials: true }).catch(() => ({ data: { levels: [] } })),
        ]).then(([clsRes, tRes, catRes, levelsRes]) => {
            setClasses(clsRes.data.classes || []);
            setTeachers((tRes.data.teachers || []).map((t: any) => ({ id: t.id, name: t.user?.name || 'Unknown', department: t.department })));
            setCategories(catRes.data.categories || []);
            const levels: ClassLevel[] = levelsRes.data.levels || [];
            setClassLevels(levels);
        });
    }, []);

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const toggleClass = (id: string) =>
        setSelectedClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) { toast.error('Subject name is required'); return; }
        setIsSubmitting(true);
        try {
            await axios.post(`${API}/subjects/add`, {
                ...form,
                code: undefined, // Let backend auto-generate
                categoryId: form.categoryId === 'none' ? undefined : form.categoryId,
                type: form.type || undefined,
                teacherId: form.teacherId === 'none' ? undefined : form.teacherId,
                classIds: selectedClassIds
            }, { withCredentials: true });
            toast.success(`Subject "${form.name}" created successfully!`);
            navigate('/dashboard/subjects/all');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to create subject');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group sections by category for display
    const levelGroups: Record<string, ClassLevel[]> = {};
    classLevels.forEach(lvl => {
        const cat = lvl.category || 'General';
        if (!levelGroups[cat]) levelGroups[cat] = [];
        levelGroups[cat].push(lvl);
    });

    return (
        <SettingsShell
            breadcrumbParent="Subjects"
            breadcrumbCurrent="Add Subject"
            tabLabel="Add New Subject"
            tabIcon={<BookOpen className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<BookOpen className="h-7 w-7" />}
                title="Add New Subject"
                subtitle="Define a subject and assign it directly to classes."
            />

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

                {/* Section 1: Subject Info */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                        <h2 className="text-base font-bold text-slate-800">Subject Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <div className="space-y-1.5">
                            <Label className="font-semibold">Subject Name <span className="text-blue-600">*</span></Label>
                            <Input value={form.name} onChange={e => set('name', e.target.value)}
                                className={inputCls} placeholder="e.g. Mathematics" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-500">Subject Code</Label>
                            <Input value={form.code} readOnly disabled
                                className={cn(inputCls, 'bg-slate-50 text-slate-400 font-mono text-xs cursor-not-allowed')} />
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
                            <Label className="font-semibold">Subject Type <span className="text-blue-600">*</span></Label>
                            <Select value={form.type} onValueChange={val => set('type', val)}>
                                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CORE">Core (Compulsory)</SelectItem>
                                    <SelectItem value="ELECTIVE">Elective (Optional)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-900">Assign Teacher</Label>
                            <Select value={form.teacherId} onValueChange={val => set('teacherId', val)}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-gray-500 italic">No teacher (assign later)</SelectItem>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name} {t.department ? `(${t.department})` : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="font-semibold text-slate-500">Description (Optional)</Label>
                            <Input value={form.description} onChange={e => set('description', e.target.value)}
                                className={inputCls} placeholder="Brief description..." />
                        </div>

                    </div>
                </div>

                {/* Section 2: Assign to Classes */}
                {classes.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                                <h2 className="text-base font-bold text-slate-800">Assign to Classes <span className="text-blue-600">*</span></h2>
                            </div>
                            <button type="button" 
                                onClick={() => setSelectedClassIds(selectedClassIds.length === classes.length ? [] : classes.map(c => c.id))}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 ml-8">Select which classes teach this subject.</p>
                        
                        {/* Group classes by level visually */}
                        <div className="ml-8 space-y-4">
                            {Array.from(new Set(classes.map(c => c.level))).map(level => (
                                <div key={level}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{level}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {classes.filter(c => c.level === level).map(cls => (
                                            <button key={cls.id} type="button" onClick={() => toggleClass(cls.id)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedClassIds.includes(cls.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                                {cls.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedClassIds.length > 0 && (
                            <p className="text-xs text-blue-600 mt-4 ml-8 font-medium">{selectedClassIds.length} class{selectedClassIds.length > 1 ? 'es' : ''} selected</p>
                        )}
                        {selectedClassIds.length === 0 && isSubmitting && (
                            <p className="text-xs text-red-500 mt-4 ml-8 font-bold">Please select at least one class.</p>
                        )}
                    </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {isSubmitting ? 'Saving...' : 'Save Subject'}
                    </Button>
                </div>
            </form>
        </SettingsShell>
    );
}
