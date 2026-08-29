import React, { useState, useEffect, useRef } from 'react';
import {
    Loader2, Check, X, Pencil, Trash2, Plus, GripVertical, AlertTriangle, Blocks
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { cn } from '../../../lib/utils';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';

const API = '/api/v1/sections';

interface Section {
    id: string;
    name: string;
    shortCode: string | null;
    _count: {
        classes: number;
    };
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

export function Sections() {
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editShortCode, setEditShortCode] = useState('');
    
    const [newName, setNewName] = useState('');
    const [newShortCode, setNewShortCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const editRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(API, { withCredentials: true });
            setSections(res.data.sections || []);
        } catch (e) {
            toast.error('Failed to load sections');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const addSection = async () => {
        if (!newName.trim()) {
            toast.error('Section name is required');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await axios.post(API, { 
                name: newName, 
                shortCode: newShortCode 
            }, { withCredentials: true });
            
            // Add the returned section with initial class count 0
            setSections([...sections, { ...res.data.section, _count: { classes: 0 } }]);
            setNewName('');
            setNewShortCode('');
            toast.success('Section created successfully');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to create section');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEdit = (section: Section) => {
        setEditingId(section.id);
        setEditName(section.name);
        setEditShortCode(section.shortCode || '');
        setTimeout(() => editRef.current?.focus(), 50);
    };

    const saveEdit = async (id: string) => {
        if (!editName.trim()) {
            setEditingId(null);
            return;
        }
        try {
            const res = await axios.patch(`${API}/${id}`, { 
                name: editName, 
                shortCode: editShortCode 
            }, { withCredentials: true });
            
            setSections(prev => prev.map(s => s.id === id ? { ...s, name: res.data.section.name, shortCode: res.data.section.shortCode } : s));
            toast.success('Section updated');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to update section');
        }
        setEditingId(null);
    };

    const deleteSection = async (id: string, force: boolean = false) => {
        try {
            await axios.delete(`${API}/${id}${force ? '?force=true' : ''}`, { withCredentials: true });
            setSections(prev => prev.filter(s => s.id !== id));
            toast.success('Section deleted');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to delete section');
        }
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    return (
        <SettingsShell breadcrumbCurrent="Sections" tabLabel="Sections" tabIcon={<Blocks className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Blocks className="h-7 w-7" />}
                title="School Sections"
                subtitle="Define the high-level sections (e.g. Nursery, Primary, Secondary) that make up your school."
            />

            <section className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered Sections</h3>
                    <span className="font-mono text-[10px] text-slate-400">{sections.length} sections</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-50">
                    {sections.length === 0 && (
                        <div className="flex items-center justify-center px-4 py-12 text-slate-400 text-sm">
                            No sections defined yet.
                        </div>
                    )}
                    {sections.map((section) => (
                        <div key={section.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                            {editingId === section.id ? (
                                <div className="flex flex-1 items-center gap-2">
                                    <input 
                                        ref={editRef} 
                                        value={editName} 
                                        onChange={e => setEditName(e.target.value)} 
                                        placeholder="Section Name"
                                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(section.id); if (e.key === 'Escape') setEditingId(null); }} 
                                        className={inputCls + ' flex-[2]'} 
                                    />
                                    <input 
                                        value={editShortCode} 
                                        onChange={e => setEditShortCode(e.target.value)} 
                                        placeholder="Short Code (Optional)"
                                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(section.id); if (e.key === 'Escape') setEditingId(null); }} 
                                        className={inputCls + ' flex-1'} 
                                    />
                                    <button onClick={() => saveEdit(section.id)} className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"><Check className="h-4 w-4" /></button>
                                    <button onClick={() => setEditingId(null)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="flex-1 font-semibold text-slate-800 text-sm">{section.name}</span>
                                    {section.shortCode && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">{section.shortCode}</span>}
                                    <span className="font-mono text-xs text-slate-400 w-24 text-right pr-4">{section._count.classes} classes</span>
                                    
                                    <button onClick={() => startEdit(section)} className="rounded-lg p-2 text-slate-400 hover:bg-[#1E4DA6]/5 hover:text-[#1E4DA6] transition-colors"><Pencil className="h-4 w-4" /></button>
                                    
                                    {section._count.classes > 0 ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                                        <AlertTriangle className="w-5 h-5" /> Warning
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        There are <strong>{section._count.classes} classes</strong> currently linked to this section. 
                                                        Deleting it might cause those classes to lose their section context. 
                                                        Are you sure you want to proceed?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteSection(section.id, true)} className="bg-red-600 hover:bg-red-700 text-white">Delete Anyway</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                                                    <AlertDialogDescription>Are you sure you want to delete this section? This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteSection(section.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 flex-col sm:flex-row mt-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex-[2]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Section Name <span className="text-[#1E4DA6]">*</span></label>
                        <input className={inputCls} placeholder="e.g. Primary" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Short Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <input className={inputCls} placeholder="e.g. PRI" value={newShortCode} onChange={e => setNewShortCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} />
                    </div>
                    <div className="flex items-end shrink-0">
                        <button onClick={addSection} disabled={isSubmitting} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 font-bold text-white hover:bg-slate-900 transition-colors disabled:opacity-50 min-w-[120px]">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add</>}
                        </button>
                    </div>
                </div>
            </section>
        </SettingsShell>
    );
}
