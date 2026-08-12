import { useState } from 'react';
import { Users, ShieldOff, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface BulkRestrictModalProps {
    role: string; // e.g. 'TEACHER', 'PARENT', 'STUDENT'
    roleLabel: string; // e.g. 'All Teachers'
    isRestricting: boolean; // true = restrict, false = unrestrict
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkRestrictModal({ role, roleLabel, isRestricting, onClose, onSuccess }: BulkRestrictModalProps) {
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isRestricting && !reason.trim()) {
            toast.error('Please provide a bulk restriction reason');
            return;
        }
        setIsSaving(true);
        try {
            const res = await axios.post('/api/v1/users/bulk-restrict', {
                role,
                isRestricted: isRestricting,
                reason: isRestricting ? reason.trim() : 'Bulk lift by administrator'
            }, { withCredentials: true });

            toast.success(res.data.msg);
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Bulk operation failed');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className={cn('p-5 text-white', isRestricting ? 'bg-gradient-to-r from-orange-600 to-red-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700')}>
                    <div className="flex items-center gap-3">
                        {isRestricting ? <ShieldOff className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
                        <div>
                            <h2 className="text-lg font-black">{isRestricting ? `Bulk Restrict ${roleLabel}` : `Lift All Restrictions`}</h2>
                            <p className="text-sm opacity-80">{isRestricting ? 'This affects all active accounts in this group' : `Restores access for all ${roleLabel.toLowerCase()}`}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className={cn('flex items-start gap-3 p-3 rounded-xl border', isRestricting ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200')}>
                        <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-0.5', isRestricting ? 'text-red-500' : 'text-emerald-600')} />
                        <p className={cn('text-sm', isRestricting ? 'text-red-700' : 'text-emerald-700')}>
                            {isRestricting
                                ? <>This action will immediately lock <strong>all {roleLabel.toLowerCase()}</strong> out of the portal. They will see your reason on the login screen.</>
                                : <>This will remove restrictions from <strong>all {roleLabel.toLowerCase()}</strong>, allowing them to log in again immediately.</>
                            }
                        </p>
                    </div>

                    {isRestricting && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">
                                Reason for Bulk Restriction <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required value={reason} onChange={e => setReason(e.target.value)}
                                placeholder="e.g. End-of-term portal lockdown, School holiday suspension, etc."
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 resize-none"
                            />
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-slate-400 shrink-0" />
                        Super Admins and School Admins are excluded from bulk operations.
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving}
                            className={cn('rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-70 flex items-center gap-2',
                                isRestricting ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700')}>
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSaving ? 'Processing...' : isRestricting ? 'Restrict All' : 'Lift All Restrictions'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
