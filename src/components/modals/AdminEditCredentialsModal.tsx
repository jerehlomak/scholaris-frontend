import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Lock, User, AlertTriangle, Key } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api/v1';

interface AdminEditCredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit: {
        id: string;
        name: string;
        role: string;
        loginId: string;
    };
    onSuccess?: () => void;
}

export function AdminEditCredentialsModal({ isOpen, onClose, userToEdit, onSuccess }: AdminEditCredentialsModalProps) {
    const [newLoginId, setNewLoginId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const getLoginIdLabel = () => {
        if (userToEdit.role === 'STUDENT') return 'Admission Number';
        if (userToEdit.role === 'TEACHER') return 'Staff ID / Username';
        if (userToEdit.role === 'PARENT') return 'Parent ID';
        return 'Email / Username';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newLoginId && !newPassword) {
            toast.error('Please enter a new username or password');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Updating credentials...');

        try {
            await axios.post(`${API}/users/${userToEdit.id}/admin-update-credentials`, {
                newLoginId: newLoginId || undefined,
                newPassword: newPassword || undefined
            }, { withCredentials: true });

            toast.success('Credentials updated successfully', { id: toastId });
            setNewLoginId('');
            setNewPassword('');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to update credentials', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return document.body ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Key className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Edit Credentials</h2>
                            <p className="text-xs text-slate-500 font-medium">For {userToEdit.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                        <div className="text-xs leading-relaxed">
                            <strong>Warning:</strong> Changing these credentials will immediately affect the user's ability to log in. They must be informed of their new credentials.
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Change {getLoginIdLabel()} (Optional)
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={newLoginId}
                                    onChange={e => setNewLoginId(e.target.value)}
                                    placeholder={`Current: ${userToEdit.loginId}`}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Change Password (Optional)
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 chars)"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!newLoginId && !newPassword)}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>,
        document.body
    ) : null;
}
