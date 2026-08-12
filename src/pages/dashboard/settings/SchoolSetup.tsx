import React, { useState, useEffect, useRef } from 'react';
import {
    School, BookOpen, CheckCircle2, Plus, Trash2, Pencil, Check, X,
    ChevronUp, ChevronDown, Loader2, RefreshCw, AlertTriangle, Building2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../../../components/ui/dialog';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const API = '/api/v1/school-settings';
type SchoolType = 'PRIMARY' | 'SECONDARY' | 'ARABIC';

interface ClassLevel {
    id: string;
    name: string;
    category: string | null;
    order: number;
    isActive: boolean;
}

interface TemplateClass {
    name: string;
    category?: string | null;
    order: number;
}

// Loaded dynamically from backend SchoolType models
interface SchoolTypeOption {
    id: string;
    type: string;
    label: string;
    sub: string;
    preview: string[];
    icon?: React.ReactNode;
    defaultClasses: TemplateClass[];
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

export function SchoolSetup() {
    const [classes, setClasses] = useState<ClassLevel[]>([]);
    const [schoolTypes, setSchoolTypes] = useState<SchoolTypeOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [selectedSchoolType, setSelectedSchoolType] = useState<SchoolTypeOption | null>(null);
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const editRef = useRef<HTMLInputElement>(null);

    // New School Type Modal State
    const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeDescription, setNewTypeDescription] = useState('');
    const [isCreatingType, setIsCreatingType] = useState(false);

    // Template Customization Modal State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplateType, setEditingTemplateType] = useState<SchoolTypeOption | null>(null);
    const [tempClasses, setTempClasses] = useState<TemplateClass[]>([]);
    const [tempNewName, setTempNewName] = useState('');
    const [tempNewCategory, setTempNewCategory] = useState('');
    const [tempEditingIndex, setTempEditingIndex] = useState<number | null>(null);
    const [tempEditName, setTempEditName] = useState('');
    const [tempEditCategory, setTempEditCategory] = useState('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const tempEditRef = useRef<HTMLInputElement>(null);

    const [resultSubjectPosition, setResultSubjectPosition] = useState(false);
    const [resultClassPosition, setResultClassPosition] = useState(true);
    const [resultShowBorder, setResultShowBorder] = useState(true);
    const [resultShowSignature, setResultShowSignature] = useState(true);
    const [resultShowNextTermFees, setResultShowNextTermFees] = useState(false);
    const [resultAutomaticComments, setResultAutomaticComments] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch school types from backend
                const typesRes = await axios.get('/api/v1/school-types', { withCredentials: true });
                const dbTypes = typesRes.data.types || [];
                
                const mappedTypes: SchoolTypeOption[] = dbTypes.map((dbType: any) => {
                    const type = dbType.name.toUpperCase();
                    let icon: React.ReactNode = <Building2 className="h-5 w-5" />;
                    if (type.includes('PRIMARY')) {
                        icon = <BookOpen className="h-5 w-5" />;
                    } else if (type.includes('SECONDARY')) {
                        icon = <School className="h-5 w-5" />;
                    } else if (type.includes('ARABIC')) {
                        icon = <Building2 className="h-5 w-5" />;
                    }
                    
                    let sub = dbType.description || '';
                    if (!sub) {
                        if (type.includes('PRIMARY')) sub = 'Nursery, Kindergarten, and Primary classes';
                        else if (type.includes('SECONDARY')) sub = 'Junior and Senior Secondary classes';
                        else if (type.includes('ARABIC')) sub = 'Standard Arabic and Islamic school curriculum';
                        else sub = 'Custom school type';
                    }
                    
                    const defaultClasses: TemplateClass[] = Array.isArray(dbType.defaultClasses)
                        ? dbType.defaultClasses
                        : (typeof dbType.defaultClasses === 'string'
                            ? JSON.parse(dbType.defaultClasses)
                            : []);

                    let preview: string[] = [];
                    if (defaultClasses.length > 0) {
                        preview = defaultClasses.slice(0, 3).map((c: any) => c.name);
                        if (defaultClasses.length > 3) {
                            preview.push(`+ ${defaultClasses.length - 3} more`);
                        }
                    } else {
                        preview = ['No classes defined'];
                    }
                    
                    let label = dbType.name;
                    if (type === 'PRIMARY') label = 'Primary School';
                    else if (type === 'SECONDARY') label = 'Secondary School';
                    else if (type === 'ARABIC') label = 'Arabic/Islamic';
                    
                    return {
                        id: dbType.id,
                        type: dbType.name,
                        label,
                        sub,
                        preview,
                        icon,
                        defaultClasses
                    };
                });
                setSchoolTypes(mappedTypes);

                // 2. Fetch settings singleton
                const settingsRes = await axios.get(API, { withCredentials: true });
                const s = settingsRes.data.settings;
                setClasses(s.classLevels || []);
                
                if (s.schoolTypeId) {
                    setSelectedTypeId(s.schoolTypeId);
                    const match = mappedTypes.find(st => st.id === s.schoolTypeId);
                    if (match) setSelectedSchoolType(match);
                }

                if (s.resultSubjectPosition !== undefined) setResultSubjectPosition(s.resultSubjectPosition);
                if (s.resultClassPosition !== undefined) setResultClassPosition(s.resultClassPosition);
                if (s.resultShowBorder !== undefined) setResultShowBorder(s.resultShowBorder);
                if (s.resultShowSignature !== undefined) setResultShowSignature(s.resultShowSignature);
                if (s.resultShowNextTermFees !== undefined) setResultShowNextTermFees(s.resultShowNextTermFees);
                if (s.resultAutomaticComments !== undefined) setResultAutomaticComments(s.resultAutomaticComments);
            } catch {
                toast.error('Failed to load school setup');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // --- Template Customization ---
    const openTemplateModal = (st: SchoolTypeOption) => {
        setEditingTemplateType(st);
        setTempClasses([...st.defaultClasses]);
        setIsTemplateModalOpen(true);
    };

    const moveTempClass = (idx: number, dir: 'up' | 'down') => {
        if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === tempClasses.length - 1)) return;
        const newClasses = [...tempClasses];
        const swap = dir === 'up' ? idx - 1 : idx + 1;
        [newClasses[idx], newClasses[swap]] = [newClasses[swap], newClasses[idx]];
        setTempClasses(newClasses.map((c, i) => ({ ...c, order: i + 1 })));
    };

    const startTempEdit = (idx: number, cls: TemplateClass) => {
        setTempEditingIndex(idx);
        setTempEditName(cls.name);
        setTempEditCategory(cls.category || '');
        setTimeout(() => tempEditRef.current?.focus(), 50);
    };

    const saveTempEdit = (idx: number) => {
        if (!tempEditName.trim()) { setTempEditingIndex(null); return; }
        setTempClasses(prev => prev.map((c, i) => i === idx ? { ...c, name: tempEditName, category: tempEditCategory || null } : c));
        setTempEditingIndex(null);
    };

    const deleteTempClass = (idx: number) => {
        setTempClasses(prev => {
            const arr = prev.filter((_, i) => i !== idx);
            return arr.map((c, i) => ({ ...c, order: i + 1 }));
        });
    };

    const addTempClass = () => {
        if (!tempNewName.trim()) return;
        setTempClasses([...tempClasses, { name: tempNewName, category: tempNewCategory || null, order: tempClasses.length + 1 }]);
        setTempNewName('');
        setTempNewCategory('');
    };

    const saveTemplate = async () => {
        if (!editingTemplateType) return;
        setIsSavingTemplate(true);
        try {
            await axios.patch(`/api/v1/school-types/${editingTemplateType.id}`, { defaultClasses: tempClasses }, { withCredentials: true });
            
            // Re-generate previews
            let preview: string[] = [];
            if (tempClasses.length > 0) {
                preview = tempClasses.slice(0, 3).map(c => c.name);
                if (tempClasses.length > 3) preview.push(`+ ${tempClasses.length - 3} more`);
            } else {
                preview = ['No classes defined'];
            }

            const updatedType = { ...editingTemplateType, defaultClasses: tempClasses, preview };
            setSchoolTypes(prev => prev.map(st => st.id === editingTemplateType.id ? updatedType : st));
            if (selectedSchoolType?.id === editingTemplateType.id) setSelectedSchoolType(updatedType);
            
            toast.success(`${editingTemplateType.label} template updated`);
            setIsTemplateModalOpen(false);
        } catch {
            toast.error('Failed to update template');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleCreateSchoolType = async () => {
        if (!newTypeName.trim()) return;
        setIsCreatingType(true);
        try {
            const res = await axios.post('/api/v1/school-types', {
                name: newTypeName,
                description: newTypeDescription,
                isDefault: false,
                defaultClasses: []
            }, { withCredentials: true });

            const dbType = res.data.type;
            const newOption: SchoolTypeOption = {
                id: dbType.id,
                type: dbType.name,
                label: dbType.name,
                sub: dbType.description || 'Custom school type',
                preview: ['No classes defined'],
                icon: <Building2 className="h-5 w-5" />,
                defaultClasses: []
            };

            setSchoolTypes(prev => [...prev, newOption]);
            toast.success('School type created');
            setIsAddTypeModalOpen(false);
            setNewTypeName('');
            setNewTypeDescription('');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to create school type');
        } finally {
            setIsCreatingType(false);
        }
    };
    // ------------------------------

    const [loadingSeed, setLoadingSeed] = useState(false);

    const applySeed = async () => {
        try {
            if (!selectedSchoolType) throw new Error('Select a school type first');
            setLoadingSeed(true);
            await axios.post('/api/v1/school-settings/class-levels/seed', { schoolType: selectedSchoolType.type, replace: false }, { withCredentials: true });
            const res = await axios.get(API, { withCredentials: true });
            setClasses(res.data.settings.classLevels || []);
            setSelectedSchoolType(selectedSchoolType);
            setSelectedTypeId(selectedSchoolType?.id || '');
            toast.success('Classes applied successfully!');
        } catch { toast.error('Failed to apply class template'); } finally { setLoadingSeed(false); }
    };

    const moveClass = async (id: string, dir: 'up' | 'down') => {
        const idx = classes.findIndex(c => c.id === id);
        if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === classes.length - 1)) return;
        const newClasses = [...classes];
        const swap = dir === 'up' ? idx - 1 : idx + 1;
        [newClasses[idx], newClasses[swap]] = [newClasses[swap], newClasses[idx]];
        const reordered = newClasses.map((c, i) => ({ ...c, order: i + 1 }));
        setClasses(reordered);
        try {
            await axios.patch(`${API}/class-levels/reorder`, { classLevels: reordered.map(c => ({ id: c.id, order: c.order })) }, { withCredentials: true });
        } catch { toast.error('Failed to reorder'); }
    };

    const startEdit = (cls: ClassLevel) => { setEditingId(cls.id); setEditName(cls.name); setTimeout(() => editRef.current?.focus(), 50); };

    const saveEdit = async (id: string) => {
        if (!editName.trim()) { setEditingId(null); return; }
        try {
            await axios.patch(`${API}/class-levels/${id}`, { name: editName }, { withCredentials: true });
            setClasses(prev => prev.map(c => c.id === id ? { ...c, name: editName } : c));
            toast.success('Class renamed');
        } catch { toast.error('Failed to rename class'); }
        setEditingId(null);
    };

    const deleteClass = async (id: string) => {
        try {
            await axios.delete(`${API}/class-levels/${id}`, { withCredentials: true });
            setClasses(prev => prev.filter(c => c.id !== id));
            toast.success('Class deleted');
        } catch { toast.error('Failed to delete class'); }
    };

    const addClass = async () => {
        if (!newClassName.trim()) return;
        try {
            const res = await axios.post(`${API}/class-levels`, { name: newClassName, category: newCategory, order: classes.length + 1 }, { withCredentials: true });
            setClasses([...classes, res.data.classLevel]);
            setNewClassName(''); setNewCategory('');
            toast.success('Class added');
        } catch { toast.error('Failed to add class'); }
    };

    const handleSave = async () => {
        try {
            await axios.patch(API, {
                schoolType: selectedTypeId,
                schoolTypeId: selectedTypeId,
                resultSubjectPosition,
                resultClassPosition,
                resultShowBorder,
                resultShowSignature,
                resultShowNextTermFees,
                resultAutomaticComments
            }, { withCredentials: true });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            toast.success('Settings saved');
        } catch { toast.error('Failed to save'); }
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    return (
        <SettingsShell breadcrumbCurrent="School Setup" tabLabel="School Setup" tabIcon={<School className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<School className="h-7 w-7" />}
                title="School Setup"
                subtitle="Set your school type and manage the sections available across the entire system."
            />

            {/* School type picker */}
            <section className="mb-10 space-y-4">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">School Type</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {schoolTypes.map(st => (
                        <div
                            key={st.type}
                            onClick={() => { setSelectedSchoolType(st); setSelectedTypeId(st.id); }}
                            className={cn('cursor-pointer rounded-2xl border-2 p-5 transition-all', selectedSchoolType?.id === st.id ? 'border-blue-500 bg-blue-50/60 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm')}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', selectedSchoolType?.id === st.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')}>
                                    {st.icon}
                                </div>
                                {selectedSchoolType?.id === st.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                            </div>
                            <h4 className={cn('font-bold text-sm', selectedSchoolType?.type === st.type ? 'text-blue-700' : 'text-slate-700')}>{st.label}</h4>
                            <p className="text-xs text-slate-500 mt-0.5 mb-3">{st.sub}</p>
                            <div className="flex flex-wrap gap-1">
                                {st.preview.map(p => <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{p}</span>)}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openTemplateModal(st);
                                }}
                                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600"
                            >
                                <Pencil className="h-3.5 w-3.5" /> Customize Template
                            </button>
                        </div>
                    ))}

                    <div
                        onClick={() => setIsAddTypeModalOpen(true)}
                        className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 transition-all hover:border-slate-300 hover:bg-slate-50 flex flex-col items-center justify-center text-center min-h-[180px]"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/50 text-slate-400 mb-3">
                            <Plus className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-700">Add School Type</h4>
                        <p className="text-xs text-slate-500 mt-1">Create a custom template</p>
                    </div>
                </div>

                {/* Seed button */}
                <button onClick={applySeed} disabled={loadingSeed} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loadingSeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
                    {loadingSeed ? 'Applying...' : `Apply Template`}
                </button>
            </section>



            {/* Result Display Settings */}
            <section className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Result Display Toggles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Subject Position</h4>
                            <p className="text-xs text-slate-500">Rank students dynamically per subject in the master list</p>
                        </div>
                        <Switch checked={resultSubjectPosition} onCheckedChange={setResultSubjectPosition} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Class Position</h4>
                            <p className="text-xs text-slate-500">Calculate overall position across the entire class</p>
                        </div>
                        <Switch checked={resultClassPosition} onCheckedChange={setResultClassPosition} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Automatic Remarks</h4>
                            <p className="text-xs text-slate-500">Auto-generate Principal/Head Teacher remarks based on average</p>
                        </div>
                        <Switch checked={resultAutomaticComments} onCheckedChange={setResultAutomaticComments} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Show Table Borders</h4>
                            <p className="text-xs text-slate-500">Display inner grid lines on the printed report card</p>
                        </div>
                        <Switch checked={resultShowBorder} onCheckedChange={setResultShowBorder} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Show Signatures</h4>
                            <p className="text-xs text-slate-500">Display signature lines for teachers and principal</p>
                        </div>
                        <Switch checked={resultShowSignature} onCheckedChange={setResultShowSignature} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Show Next Term Fees</h4>
                            <p className="text-xs text-slate-500">Include a notice of outstanding/next term fees</p>
                        </div>
                        <Switch checked={resultShowNextTermFees} onCheckedChange={setResultShowNextTermFees} />
                    </div>
                </div>
            </section>

            <div className="border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} saveLabel="Save School Setup" savedLabel="Setup Saved!" />
            </div>

            {/* Template Customization Modal */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-h-[90vh] sm:max-w-xl overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-white">
                        <DialogTitle className="text-xl font-bold text-slate-800">
                            Customize {editingTemplateType?.label} Template
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Edit the default classes that will be created when a school applies this template.
                        </p>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-50 mb-6">
                            {tempClasses.length === 0 && (
                                <div className="flex items-center justify-center px-4 py-12 text-slate-400 text-sm">No template classes defined.</div>
                            )}
                            {tempClasses.map((cls, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => moveTempClass(idx, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => moveTempClass(idx, 'down')} disabled={idx === tempClasses.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
                                    </div>
                                    <span className="w-6 text-center font-mono text-xs text-slate-400">{cls.order}</span>
                                    {tempEditingIndex === idx ? (
                                        <div className="flex flex-1 items-center gap-2">
                                            <input ref={tempEditRef} value={tempEditName} onChange={e => setTempEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveTempEdit(idx); if (e.key === 'Escape') setTempEditingIndex(null); }} className={inputCls + ' flex-1 !py-1.5'} placeholder="Name" />
                                            <input value={tempEditCategory} onChange={e => setTempEditCategory(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveTempEdit(idx); if (e.key === 'Escape') setTempEditingIndex(null); }} className={inputCls + ' w-24 !py-1.5'} placeholder="Cat." />
                                            <button onClick={() => saveTempEdit(idx)} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"><Check className="h-4 w-4" /></button>
                                            <button onClick={() => setTempEditingIndex(null)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-1 font-semibold text-slate-800 text-sm">{cls.name}</span>
                                            {cls.category && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{cls.category}</span>}
                                            <button onClick={() => startTempEdit(idx, cls)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={() => deleteTempClass(idx)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add template class */}
                        <div className="flex gap-2 flex-col sm:flex-row p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                            <input className={inputCls + ' flex-[2]'} placeholder="New template class (e.g. SS 3)" value={tempNewName} onChange={e => setTempNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTempClass()} />
                            <input className={inputCls + ' flex-1'} placeholder="Category" value={tempNewCategory} onChange={e => setTempNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTempClass()} />
                            <button onClick={addTempClass} className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-900 transition-colors shrink-0">
                                <Plus className="h-4 w-4" /> Add
                            </button>
                        </div>
                    </div>
                    
                    <DialogFooter className="p-6 border-t border-slate-100 bg-white">
                        <button onClick={() => setIsTemplateModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button onClick={saveTemplate} disabled={isSavingTemplate} className="flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50">
                            {isSavingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save Template
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Custom School Type Modal */}
            <Dialog open={isAddTypeModalOpen} onOpenChange={setIsAddTypeModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold text-slate-800">Add School Type</DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">Create a custom school type and define its class template.</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Name</label>
                            <input
                                className={inputCls}
                                placeholder="e.g. British Curriculum"
                                value={newTypeName}
                                onChange={e => setNewTypeName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                            <input
                                className={inputCls}
                                placeholder="e.g. Standard British key stages"
                                value={newTypeDescription}
                                onChange={e => setNewTypeDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-0 border-none">
                        <button onClick={() => setIsAddTypeModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                        <button
                            onClick={handleCreateSchoolType}
                            disabled={isCreatingType || !newTypeName.trim()}
                            className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                            {isCreatingType ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SettingsShell>
    );
}
