import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Loader2, Settings2, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { PageShell } from '../shared/PageShell';
import { cn } from '../../../lib/utils';

const API_CLASSES = '/api/v1/classes';
const API_SETTINGS = '/api/v1/school-settings';

interface ClassLevel { id: string; name: string; category: string | null; isActive: boolean; }

const groupByCategory = (levels: ClassLevel[]) => {
    const map: Record<string, ClassLevel[]> = {};
    levels.forEach(lvl => {
        const cat = lvl.category || 'Other';
        if (!map[cat]) map[cat] = [];
        map[cat].push(lvl);
    });
    return map;
};

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

export function EditClass() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [levels, setLevels] = useState<ClassLevel[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [form, setForm] = useState({ name: '', level: '', section: '', sessionId: '', status: 'Active' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_SETTINGS}/class-levels`, { withCredentials: true }),
            axios.get('/api/v1/sessions', { withCredentials: true }),
            axios.get(`${API_CLASSES}/${id}`, { withCredentials: true })
        ])
        .then(([levelsRes, sessionsRes, classRes]) => {
            const activeLevels = levelsRes.data.levels.filter((l: ClassLevel) => l.isActive);
            setLevels(activeLevels);
            setSessions(sessionsRes.data.sessions);
            
            const cls = classRes.data.class;
            setForm({
                name: cls.name,
                level: cls.level,
                section: cls.section || '',
                sessionId: cls.sessionId || '',
                status: cls.status || 'Active'
            });
        })
        .catch(() => toast.error('Could not load required data.'))
        .finally(() => setLoadingData(false));
    }, [id]);

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.level || !form.name) { toast.error('Class name and level are required'); return; }
        setIsSubmitting(true);
        try {
            await axios.patch(`${API_CLASSES}/${id}`, {
                name: form.name.trim(),
                level: form.level.trim(),
                section: form.section.trim() || null,
                sessionId: form.sessionId || null,
                status: form.status
            }, { withCredentials: true });
            
            toast.success('Class updated successfully!');
            navigate('/dashboard/classes/all');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to update class');
        } finally {
            setIsSubmitting(false);
        }
    };

    const grouped = groupByCategory(levels);

    return (
        <PageShell maxWidth="lg">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-6">
                <span>Dashboard</span><span>/</span>
                <button onClick={() => navigate('/dashboard/classes/all')} className="hover:text-blue-600 transition-colors">Classes</button>
                <span>/</span><span>Edit Class</span>
            </div>

            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Classes
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Edit Class</h1>
                        <p className="text-sm text-slate-500">Modify the details of your class below.</p>
                    </div>
                </div>
            </div>

            {loadingData ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <form className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 flex flex-col gap-6" onSubmit={handleSubmit}>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Class Name */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Name <span className="text-blue-600">*</span></label>
                            <input value={form.name} onChange={e => set('name', e.target.value.toUpperCase())}
                                className={cn(inputCls, 'font-black text-blue-700')} placeholder="e.g. JSS1 A" required />
                        </div>

                        {/* Level picker */}
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Section <span className="text-blue-600">*</span></label>
                            <Select value={form.level} onValueChange={val => set('level', val)}>
                                <SelectTrigger className={inputCls}><SelectValue placeholder="Select section" /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(grouped).map(([cat, catLevels]) => (
                                        <div key={cat}>
                                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat}</div>
                                            {catLevels.map(lvl => (
                                                <SelectItem key={lvl.id} value={lvl.name}>{lvl.name}</SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Arm / Section */}
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Arm / Section <span className="text-slate-300">(Optional)</span></label>
                            <input value={form.section} onChange={e => set('section', e.target.value.toUpperCase())}
                                className={inputCls} placeholder="e.g. A" />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
                            <Select value={form.status} onValueChange={val => set('status', val)}>
                                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => navigate(-1)}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <ArrowLeft className="h-4 w-4 inline mr-1" />Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-50 transition-colors">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {isSubmitting ? 'Updating…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </PageShell>
    );
}
