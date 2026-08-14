import React, { useState, useEffect, useRef } from 'react';
import { Check, ArrowLeft, Loader2, GraduationCap, Plus, X, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';

const API_CLASSES = '/api/v1/classes';

interface Section { id: string; name: string; type: string | null; shortCode: string | null; }
interface ClassLevel { id: string; name: string; category: string | null; }

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';
const miniInputCls = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

export function AddClass() {
    const navigate = useNavigate();
    const [sections, setSections] = useState<Section[]>([]);
    const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    
    // form state
    const [form, setForm] = useState({ name: '', sectionId: '', arms: '', sessionId: '', nextTermFee: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inline section state
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionCode, setNewSectionCode] = useState('');
    const [isCreatingSection, setIsCreatingSection] = useState(false);
    const sectionInputRef = useRef<HTMLInputElement>(null);

    // Inline class level state
    const [showAddClassLevel, setShowAddClassLevel] = useState(false);
    const [newClassLevelName, setNewClassLevelName] = useState('');
    const [newClassLevelCategory, setNewClassLevelCategory] = useState('');
    const [isCreatingClassLevel, setIsCreatingClassLevel] = useState(false);
    const classLevelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/sections', { withCredentials: true }),
            axios.get('/api/v1/school-settings/class-levels', { withCredentials: true }),
            axios.get('/api/v1/sessions', { withCredentials: true })
        ])
        .then(([sectionsRes, classLevelsRes, sessionsRes]) => {
            const activeSections = sectionsRes.data.sections || [];
            const levels = classLevelsRes.data.levels || [];
            setSections(activeSections);
            setClassLevels(levels);
            setSessions(sessionsRes.data.sessions);

            const currentSession = sessionsRes.data.sessions.find((s: any) => s.isCurrent);
            setForm(f => ({
                ...f,
                sectionId: activeSections.length > 0 ? activeSections[0].id : '',
                name: '',
                sessionId: currentSession ? currentSession.id : (sessionsRes.data.sessions[0]?.id || '')
            }));
        })
        .catch(() => toast.error('Could not load required setup data.'))
        .finally(() => setLoadingData(false));
    }, []);

    useEffect(() => {
        if (showAddSection) setTimeout(() => sectionInputRef.current?.focus(), 50);
    }, [showAddSection]);

    useEffect(() => {
        if (showAddClassLevel) setTimeout(() => classLevelInputRef.current?.focus(), 50);
    }, [showAddClassLevel]);

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const handleCreateSection = async () => {
        if (!newSectionName.trim()) { toast.error('Section name is required'); return; }
        setIsCreatingSection(true);
        try {
            const res = await axios.post('/api/v1/sections', {
                name: newSectionName.trim(),
                shortCode: newSectionCode.trim() || undefined
            }, { withCredentials: true });

            const created: Section = res.data.section;
            setSections(prev => [...prev, created]);
            setForm(f => ({ ...f, sectionId: created.id }));
            setNewSectionName(''); setNewSectionCode('');
            setShowAddSection(false);
            toast.success(`Section "${created.name}" created`);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to create section');
        } finally {
            setIsCreatingSection(false);
        }
    };

    const handleDeleteSection = async () => {
        const selectedSec = sections.find(s => s.id === form.sectionId);
        if (!selectedSec) return;
        if (!window.confirm(`Are you sure you want to delete the "${selectedSec.name}" section?`)) return;

        try {
            await axios.delete(`/api/v1/sections/${selectedSec.id}`, { withCredentials: true });
            setSections(prev => prev.filter(s => s.id !== selectedSec.id));
            setForm(f => ({ ...f, sectionId: '' }));
            toast.success('Section deleted');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to delete section');
        }
    };

    const handleCreateClassLevel = async () => {
        if (!newClassLevelName.trim()) { toast.error('Class Level name is required'); return; }
        setIsCreatingClassLevel(true);
        try {
            const res = await axios.post('/api/v1/school-settings/class-levels', {
                name: newClassLevelName.trim(),
                category: newClassLevelCategory.trim() || 'Custom',
                order: classLevels.length + 1
            }, { withCredentials: true });

            const created: ClassLevel = res.data.classLevel;
            setClassLevels(prev => [...prev, created]);
            setForm(f => ({ ...f, name: created.name }));
            setNewClassLevelName(''); setNewClassLevelCategory('');
            setShowAddClassLevel(false);
            toast.success(`Class Level "${created.name}" created`);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to create class level');
        } finally {
            setIsCreatingClassLevel(false);
        }
    };

    const handleDeleteClassLevel = async () => {
        const selectedLvl = classLevels.find(c => c.name === form.name);
        if (!selectedLvl) return;
        if (!window.confirm(`Are you sure you want to delete the "${selectedLvl.name}" class level?`)) return;

        try {
            await axios.delete(`/api/v1/school-settings/class-levels/${selectedLvl.id}`, { withCredentials: true });
            setClassLevels(prev => prev.filter(c => c.id !== selectedLvl.id));
            setForm(f => ({ ...f, name: '' }));
            toast.success('Class Level deleted');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to delete class level');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.sectionId) { toast.error('Section is required'); return; }
        if (!form.name) { toast.error('Class Level (Base Name) is required'); return; }
        setIsSubmitting(true);
        try {
            const armsArray = form.arms.split(',').map(a => a.trim()).filter(a => a);

            await axios.post(`${API_CLASSES}/add`, {
                name: form.name.trim(),
                sectionId: form.sectionId,
                arms: armsArray.length > 0 ? armsArray : undefined,
                sessionId: form.sessionId || undefined
            }, { withCredentials: true });

            toast.success(`Class${armsArray.length > 1 ? 'es' : ''} created successfully! Ready for the next one.`);
            // Stay on this page instead of bouncing back to the list — keep the
            // section/session selected (the common case is adding several class
            // levels to the same section in one sitting) and only clear the
            // per-class fields, so the next entry doesn't start from scratch.
            setForm(f => ({ ...f, name: '', arms: '', nextTermFee: '' }));
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Failed to create class');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedSection = sections.find(s => s.id === form.sectionId);

    return (
        <SettingsShell breadcrumbParent="Classes" breadcrumbCurrent="Add Class" tabLabel="Add New Class" tabIcon={<GraduationCap className="h-3.5 w-3.5" />}>
            <SettingsHero icon={<GraduationCap className="h-7 w-7" />} title="Add New Class" subtitle="Select a section and fill in the class details below." />

            {loadingData ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>
            ) : (
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm px-3 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Section picker */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Section <span className="text-[#1E4DA6]">*</span></label>
                                    <button type="button" onClick={() => setShowAddSection(v => !v)} className={cn('flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all', showAddSection ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-[#1E4DA6]/5 text-[#1E4DA6] hover:bg-[#1E4DA6]/10')}>
                                        {showAddSection ? <><X className="h-3 w-3" /> Cancel</> : <><Plus className="h-3 w-3" /> New Section</>}
                                    </button>
                                </div>
                                {showAddSection ? (
                                    <div className="rounded-xl border border-[#1E4DA6]/20 bg-[#1E4DA6]/8 p-4 space-y-3">
                                        <p className="text-xs font-bold text-[#173F8C]">Create a new section</p>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <input ref={sectionInputRef} value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSection(); } if (e.key === 'Escape') setShowAddSection(false); }} placeholder="e.g. Primary" className={cn(miniInputCls, 'flex-[2]')} />
                                            <input value={newSectionCode} onChange={e => setNewSectionCode(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSection(); } if (e.key === 'Escape') setShowAddSection(false); }} placeholder="Code" className={cn(miniInputCls, 'flex-1')} />
                                        </div>
                                        <button type="button" onClick={handleCreateSection} disabled={isCreatingSection || !newSectionName.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173F8C] px-4 py-2 text-sm font-bold text-white hover:bg-[#122F69] disabled:opacity-50 transition-colors">
                                            {isCreatingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {isCreatingSection ? 'Creating…' : 'Create Section'}
                                        </button>
                                    </div>
                                ) : (
                                    sections.length === 0 ? (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium">No sections yet — click <strong>+ New Section</strong>.</div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select value={form.sectionId} onValueChange={val => set('sectionId', val)}>
                                                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select section" /></SelectTrigger>
                                                    <SelectContent>
                                                        {sections.map(sec => <SelectItem key={sec.id} value={sec.id}>{sec.name}{sec.shortCode ? ` (${sec.shortCode})` : ''}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {form.sectionId && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteSection}
                                                    title="Delete this section"
                                                    className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Class Level picker */}
                            <div className="space-y-2">
                                <div className="flex flex-col gap-3 md:flex-row items-start md:items-center justify-between">
                                    <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Level (Base Name) <span className="text-[#1E4DA6]">*</span></label>
                                    <button type="button" onClick={() => setShowAddClassLevel(v => !v)} className={cn('flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all', showAddClassLevel ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-[#1E4DA6]/5 text-[#1E4DA6] hover:bg-[#1E4DA6]/10')}>
                                        {showAddClassLevel ? <><X className="h-3 w-3" /> Cancel</> : <><Plus className="h-3 w-3" /> New Class Level</>}
                                    </button>
                                </div>
                                {showAddClassLevel ? (
                                    <div className="rounded-xl border border-[#1E4DA6]/20 bg-[#1E4DA6]/8 p-4 space-y-3">
                                        <p className="text-xs font-bold text-[#173F8C]">Create a new class level</p>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <input ref={classLevelInputRef} value={newClassLevelName} onChange={e => setNewClassLevelName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateClassLevel(); } if (e.key === 'Escape') setShowAddClassLevel(false); }} placeholder="e.g. Primary 1" className={cn(miniInputCls, 'flex-[2]')} />
                                            <input value={newClassLevelCategory} onChange={e => setNewClassLevelCategory(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateClassLevel(); } if (e.key === 'Escape') setShowAddClassLevel(false); }} placeholder="Category (Opt)" className={cn(miniInputCls, 'flex-1')} />
                                        </div>
                                        <button type="button" onClick={handleCreateClassLevel} disabled={isCreatingClassLevel || !newClassLevelName.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173F8C] px-4 py-2 text-sm font-bold text-white hover:bg-[#122F69] disabled:opacity-50 transition-colors">
                                            {isCreatingClassLevel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {isCreatingClassLevel ? 'Creating…' : 'Create Class Level'}
                                        </button>
                                    </div>
                                ) : (
                                    classLevels.length === 0 ? (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium">No class levels yet — click <strong>+ New Class Level</strong>.</div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select value={form.name} onValueChange={val => set('name', val)}>
                                                    <SelectTrigger className={cn(inputCls, 'font-black text-[#173F8C]')}><SelectValue placeholder="Select class level" /></SelectTrigger>
                                                    <SelectContent>
                                                        {classLevels.map(lvl => <SelectItem key={lvl.id} value={lvl.name}>{lvl.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {form.name && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteClassLevel}
                                                    title="Delete this class level"
                                                    className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Arms */}
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Arms <span className="text-slate-300">(Optional)</span></label>
                                <input value={form.arms} onChange={e => set('arms', e.target.value.toUpperCase())} className={inputCls} placeholder="e.g. A, B, C" />
                                <p className="text-xs text-slate-400">Comma-separated — leave blank to create a single class with no arm suffix.</p>
                            </div>
                            
                            {/* Next Term Fee */}
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Term Fee <span className="text-slate-300">(Optional)</span></label>
                                <input value={form.nextTermFee} onChange={e => set('nextTermFee', e.target.value)} className={inputCls} placeholder="e.g. 150,000" />
                                <p className="text-xs text-slate-400">Amount to be shown on the report card for next term's fees.</p>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    {form.name && (
                        <div className="rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-5 text-center">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Class Preview
                                {selectedSection && <span className="ml-2 normal-case not-italic font-normal text-slate-400">— {selectedSection.name}</span>}
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                {form.arms.split(',').filter(x => x.trim()).length > 0 ? (
                                    form.arms.split(',').filter(x => x.trim()).map((arm, i) => (
                                        <span key={i} className="rounded-lg bg-[#1E4DA6]/10 px-3 py-1.5 text-sm font-black text-[#173F8C]">
                                            {form.name.trim()} {arm.trim()}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-3xl font-black text-[#173F8C]">{form.name.trim()}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <ArrowLeft className="h-4 w-4 inline mr-1" />Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || !form.sectionId || !form.name.trim()} className="flex items-center gap-2 rounded-xl bg-[#173F8C] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#122F69] disabled:opacity-50 transition-colors">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            {isSubmitting ? 'Creating…' : 'Save Class'}
                        </button>
                    </div>
                </form>
            )}
        </SettingsShell>
    );
}
