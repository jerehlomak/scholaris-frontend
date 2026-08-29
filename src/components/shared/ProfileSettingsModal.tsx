import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, User, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all";
const labelCls = "font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block";

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
    const { user, refreshSession } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    const [loginId, setLoginId] = useState('');
    const [name, setName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            let currentId = user.email || '';
            if (user.role === 'TEACHER') currentId = user.teacherProfile?.employeeId || user.email || '';
            if (user.role === 'STUDENT') currentId = user.studentProfile?.admissionNo || user.email || '';
            if (user.role === 'PARENT') currentId = user.parentProfile?.parentId || user.email || '';
            
            setLoginId(currentId);
            setName(user.name || '');
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Update User Profile (Username & Name)
            await axios.post('/api/v1/users/updateUser', { loginId, name, email: user?.email }, { withCredentials: true });
            
            // Update Password if provided
            if (password) {
                if (!oldPassword) {
                    toast.error('Please provide your current password to set a new one.');
                    setIsLoading(false);
                    return;
                }
                await axios.post('/api/v1/users/updateUserPassword', { oldPassword, newPassword: password }, { withCredentials: true });
            }

            toast.success('Account settings updated successfully');
            setOldPassword('');
            setPassword('');
            await refreshSession(); // Refresh the context with new data
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to update settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1E4DA6]/10 flex items-center justify-center text-[#1E4DA6]">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Account Settings</h2>
                            <p className="text-xs text-slate-500 font-medium">Manage your personal details & security</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="profile-form" onSubmit={handleUpdate} className="space-y-6">
                        
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                <User size={16} className="text-[#1E4DA6]" />
                                Personal Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                                    <input required className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Username <span className="text-red-500">*</span></label>
                                    <input required className={inputCls} value={loginId} onChange={e => setLoginId(e.target.value)} />
                                    <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Changing this will immediately change what you use to log in next time.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                <Lock size={16} className="text-red-500" />
                                Security (Optional)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Current Password</label>
                                    <input type="password" placeholder="Leave blank to keep current" className={inputCls} value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>New Password</label>
                                    <input type="password" placeholder="New secure password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        
                    </form>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="profile-form" disabled={isLoading} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1E4DA6] hover:bg-[#173F8C] shadow-md shadow-[#1E4DA6]/20 transition-all disabled:opacity-50 flex items-center">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
