import React, { useState, useEffect } from 'react';
import { Check, Loader2, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

const API_CLASSES = '/api/v1/classes';

interface Section { id: string; name: string; type: string | null; shortCode: string | null; }

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all';

interface EditClassModalProps {
    classId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditClassModal({ classId, onClose, onSuccess }: EditClassModalProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [form, setForm] = useState({ name: '', sectionId: '', sessionId: '', status: 'Active', nextTermFee: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!classId) return;
        setLoadingData(true);

        Promise.all([
            axios.get('/api/v1/sections', { withCredentials: true }),
            axios.get('/api/v1/sessions', { withCredentials: true }),
            axios.get(`${API_CLASSES}/${classId}`, { withCredentials: true })
        ])
        .then(([sectionsRes, sessionsRes, classRes]) => {
            setSections(sectionsRes.data.sections || []);
            setSessions(sessionsRes.data.sessions);
            
            const cls = classRes.data.class;
            setForm({
                name: cls.name,
                sectionId: cls.sectionId || '',
                sessionId: cls.sessionId || '',
                status: cls.status || 'Active',
                nextTermFee: cls.nextTermFee || ''
            });
        })
        .catch(() => {
            toast.error('Could not load required data.');
            onClose();
        })
        .finally(() => setLoadingData(false));
    }, [classId, onClose]);

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) { toast.error('Class name is required'); return; }
        setIsSubmitting(true);
        try {
            await axios.patch(`${API_CLASSES}/${classId}`, {
                name: form.name.trim(),
                sectionId: form.sectionId || null,
                sessionId: form.sessionId || null,
                status: form.status,
                nextTermFee: form.nextTermFee || null
            }, { withCredentials: true });
            
            toast.success('Class updated successfully!');
            onSuccess();
            onClose();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to update class');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group sections by type for the dropdown
    const grouped: Record<string, Section[]> = {};
    sections.forEach(sec => {
        const type = sec.type || 'General';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(sec);
    });

    return (
        <Dialog open={!!classId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100 flex flex-row items-center gap-4 space-y-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173F8C] text-white shadow-md">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">Edit Class</DialogTitle>
                        <DialogDescription className="mt-1">Modify the details of your class below.</DialogDescription>
                    </div>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
                    </div>
                ) : (
                    <form className="p-6 flex flex-col gap-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Class Name */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Name <span className="text-[#1E4DA6]">*</span></label>
                                <input value={form.name} onChange={e => set('name', e.target.value.toUpperCase())}
                                    className={cn(inputCls, 'font-black text-[#173F8C]')} placeholder="e.g. JSS1 A" required />
                            </div>

                            {/* Section picker */}
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Section <span className="text-slate-300">(Optional)</span></label>
                                <Select value={form.sectionId || 'none'} onValueChange={val => set('sectionId', val === 'none' ? '' : val)}>
                                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select section" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">— None —</SelectItem>
                                        {Object.entries(grouped).map(([type, typeSections]) => (
                                            <div key={type}>
                                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</div>
                                                {typeSections.map(sec => (
                                                    <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                                                ))}
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
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

                            {/* Next Term Fee */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Term Fee <span className="text-slate-300">(Optional)</span></label>
                                <input value={form.nextTermFee} onChange={e => set('nextTermFee', e.target.value)}
                                    className={inputCls} placeholder="e.g. 150,000" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                            <button type="button" onClick={onClose}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-xl bg-[#173F8C] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#122F69] disabled:opacity-50 transition-colors">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                {isSubmitting ? 'Updating…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
