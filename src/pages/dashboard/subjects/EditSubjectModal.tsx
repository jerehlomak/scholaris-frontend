import React, { useState, useEffect } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';

const API = '/api/v1';
const inputCls = 'bg-white border-gray-200 h-11 shadow-sm';

interface ClassOption { id: string; name: string; level: string; }
interface TeacherOption { id: string; name: string; department?: string; }



interface EditSubjectModalProps {
    subjectId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditSubjectModal({ subjectId, onClose, onSuccess }: EditSubjectModalProps) {
    const [form, setForm] = useState({
        name: '', code: '', categoryId: 'none', type: 'CORE', description: '', teacherId: 'none', status: 'Active'
    });
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!subjectId) return;
        setIsLoading(true);

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
                const subRes = await axios.get(`${API}/subjects/${subjectId}`, { withCredentials: true });
                const s = subRes.data.subject;

                setForm({
                    name: s.name || '',
                    code: s.code || '',
                    categoryId: s.categoryId || 'none',
                    type: s.type || 'CORE',
                    description: s.description || '',
                    teacherId: s.teacherId || 'none',
                    status: s.status || 'Active'
                });
                setSelectedClassIds(s.classes ? s.classes.map((c: any) => c.classId) : []);

            } catch (err) {
                toast.error("Failed to load subject details");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [subjectId, onClose]);

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const toggleClass = (clsId: string) =>
        setSelectedClassIds(prev => prev.includes(clsId) ? prev.filter(x => x !== clsId) : [...prev, clsId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) { toast.error('Subject name is required'); return; }
        setIsSubmitting(true);
        try {
            await axios.patch(`${API}/subjects/${subjectId}`, {
                ...form,
                categoryId: form.categoryId === 'none' ? null : form.categoryId,
                teacherId: form.teacherId === 'none' ? null : form.teacherId,
                classIds: selectedClassIds
            }, { withCredentials: true });
            toast.success(`Subject "${form.name}" updated successfully!`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to update subject');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={!!subjectId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-2 sticky top-0 bg-white z-10 border-b border-gray-100">
                    <DialogTitle className="text-xl font-bold">Edit Subject</DialogTitle>
                    <DialogDescription>Update subject details, teacher assignment, and classes.</DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" /></div>
                ) : (
                    <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
                        {/* Section 1: Subject Info */}
                        <div className="bg-slate-50/50 rounded-2xl border border-gray-100 p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-semibold">Subject Name <span className="text-[#1E4DA6]">*</span></Label>
                                    <Input value={form.name} onChange={e => set('name', e.target.value)}
                                        className={inputCls} placeholder="e.g. Mathematics" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-semibold text-gray-500">Subject Code</Label>
                                    <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                                        className={inputCls} placeholder="e.g. MTH-101" />
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
                                    <Label className="font-semibold text-gray-900">Subject Type <span className="text-[#1E4DA6]">*</span></Label>
                                    <Select value={form.type} onValueChange={val => set('type', val)}>
                                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CORE">Core (Compulsory)</SelectItem>
                                            <SelectItem value="ELECTIVE">Elective (Optional)</SelectItem>
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
                                    <Label className="font-semibold text-gray-900">Status</Label>
                                    <Select value={form.status} onValueChange={val => set('status', val)}>
                                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
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



                        {/* Section 2: Classes */}
                        {classes.length > 0 && (
                            <div className="bg-slate-50/50 rounded-2xl border border-gray-100 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="font-semibold block">Assign to Classes</Label>
                                    <button type="button" 
                                        onClick={() => setSelectedClassIds(selectedClassIds.length === classes.length ? [] : classes.map(c => c.id))}
                                        className="text-xs font-bold text-[#1E4DA6] hover:text-[#122F69]">
                                        {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {Array.from(new Set(classes.map(c => c.level))).map(level => (
                                        <div key={level}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{level}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {classes.filter(c => c.level === level).map(cls => (
                                                    <button key={cls.id} type="button" onClick={() => toggleClass(cls.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedClassIds.includes(cls.id) ? 'bg-[#1E4DA6] text-white border-[#1E4DA6]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E4DA6]/40'}`}>
                                                        {cls.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-6 rounded-xl font-semibold">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="h-10 px-8 rounded-xl bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-bold flex items-center gap-2">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {isSubmitting ? 'Saving...' : 'Update Subject'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
