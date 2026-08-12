import { useState } from 'react';
import { ShieldOff, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent } from '../ui/dialog';

interface RestrictUserModalProps {
    userId: string;
    userName: string;
    isRestricted: boolean;
    onClose: () => void;
    onSuccess: (userId: string, isRestricted: boolean, reason: string | null) => void;
}

export function RestrictUserModal({ userId, userName, isRestricted, onClose, onSuccess }: RestrictUserModalProps) {
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isRestricted && !reason.trim()) {
            toast.error('Please provide a restriction reason');
            return;
        }
        setIsSaving(true);
        try {
            await axios.patch(`/api/v1/users/${userId}/restrict`, {
                isRestricted: !isRestricted,
                reason: !isRestricted ? reason.trim() : undefined
            }, { withCredentials: true });

            toast.success(`${userName} has been ${!isRestricted ? 'restricted' : 'unrestricted'} successfully`);
            onSuccess(userId, !isRestricted, !isRestricted ? reason.trim() : null);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to update restriction');
        } finally {
            setIsSaving(false);
        }
    };

    const willRestrict = !isRestricted;

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent hideClose className="max-w-md p-0 overflow-hidden bg-white">
                <div className={cn('p-5 text-white shrink-0', willRestrict ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-emerald-600 to-emerald-800')}>
                    <div className="flex items-center gap-3">
                        {willRestrict ? <ShieldOff className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
                        <div>
                            <h2 className="text-lg font-black text-white/80">{willRestrict ? 'Restrict Account' : 'Lift Restriction'}</h2>
                            <p className="text-sm opacity-80">{userName}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[70vh]">
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {willRestrict ? (
                            <>
                                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">
                                        <strong>{userName}</strong> will immediately be blocked from logging in. They will see your reason when they attempt to log in.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">
                                        Restriction Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required value={reason} onChange={e => setReason(e.target.value)}
                                        placeholder="e.g. Outstanding school fees balance, Unauthorized access, etc."
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 resize-none"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-700">
                                    <strong>{userName}</strong>'s account restriction will be lifted. They will be able to log in again immediately.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <button type="button" onClick={onClose}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={isSaving}
                                className={cn('rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-70 flex items-center gap-2',
                                    willRestrict ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700')}>
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSaving ? 'Saving...' : willRestrict ? 'Restrict Account' : 'Lift Restriction'}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
