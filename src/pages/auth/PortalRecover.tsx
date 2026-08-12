import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Lock, ShieldCheck,
    User, GraduationCap, UserCog, CheckCircle2, Users, ArrowRight, Building2, KeyRound
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import logo from '../../assets/SkcoolyPlus.png';
import { toast } from 'sonner';
import axios from 'axios';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

const roles: { id: Role; label: string; icon: ReactNode; desc: string }[] = [
    { id: 'ADMIN', label: 'School Admin', icon: <ShieldCheck size={24} />, desc: 'Full system control' },
    { id: 'TEACHER', label: 'Staff', icon: <UserCog size={24} />, desc: 'Manage classes & grades' },
    { id: 'STUDENT', label: 'Student', icon: <GraduationCap size={24} />, desc: 'View portal & results' },
    { id: 'PARENT', label: 'Parent', icon: <Users size={24} />, desc: 'Track child progress' },
];

export default function PortalRecover() {
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
    const [schoolCode, setSchoolCode] = useState('');
    const [loginId, setLoginId] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!schoolCode.trim() || !loginId || !recoveryKey || !newPassword) {
            toast.error("Please fill in all the required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post('/api/v1/auth/reset-password-with-key', {
                loginId,
                role: selectedRole,
                schoolCode: schoolCode.toUpperCase().trim(),
                recoveryKey,
                newPassword
            });

            toast.success("Password reset successfully! You can now log in.");
            navigate('/portal/login');
        } catch (error: any) {
            const msg = error.response?.data?.msg || 'Failed to reset password. Check your recovery key.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray-light flex font-poppins">
            {/* ── LEFT PANEL (Form) ── */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 bg-white relative z-10 w-full lg:w-1/2 lg:flex-none xl:w-[45%] shadow-2xl">

                <div className="w-full max-w-md mx-auto">
                    {/* Logo & Header */}
                    <div className="mb-6 mt-4">
                        <Link to="/" className="inline-block mb-8 transition-transform hover:scale-105">
                            <img src={logo} alt="SkcoolyPlus Logo" className="h-auto w-32 md:w-40 object-contain" />
                        </Link>
                        <h1 className="text-3xl font-heading text-brand-dark mb-2 tracking-tight">
                            Account Recovery
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">
                            Use the 6-digit recovery key provided by your school to reset your password.
                        </p>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-brand-teal mb-4 uppercase tracking-wider">Account Type</p>
                        <div className="grid grid-cols-2 gap-3">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 group overflow-hidden",
                                        selectedRole === role.id
                                            ? "border-brand-green bg-brand-green/5 shadow-[0_4px_20px_-4px_rgba(6,147,6,0.15)] ring-1 ring-brand-green"
                                            : "border-gray-200 bg-white hover:border-brand-green/30 hover:bg-brand-gray-light"
                                    )}
                                >
                                    {selectedRole === role.id && (
                                        <div className="absolute top-1.5 right-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "mb-2 transition-colors duration-300",
                                        selectedRole === role.id ? "text-brand-green" : "text-gray-400 group-hover:text-brand-green"
                                    )}>
                                        {role.icon}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold",
                                        selectedRole === role.id ? "text-brand-dark" : "text-gray-600"
                                    )}>{role.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* School ID */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-teal">School ID</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                    <Input
                                        type="text"
                                        value={schoolCode}
                                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                        placeholder="038290"
                                        className="pl-11 h-12 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-brand-green focus-visible:border-brand-green font-mono font-semibold tracking-widest transition-all uppercase"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Login ID */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-teal">
                                    {selectedRole === 'ADMIN' ? 'Email Address' :
                                        selectedRole === 'STUDENT' ? 'Admission No' :
                                            selectedRole === 'TEACHER' ? 'Staff ID' : 'Parent ID'}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                    <Input
                                        type={selectedRole === 'ADMIN' ? 'email' : 'text'}
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        placeholder={
                                            selectedRole === 'ADMIN' ? 'admin@school.com' :
                                                selectedRole === 'STUDENT' ? 'SKL-YYYY-XXXX' :
                                                    selectedRole === 'TEACHER' ? 'TCH-YYYY-XXXX' : 'PRT-YYYY-XXXX'
                                        }
                                        className="pl-11 h-12 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-brand-green focus-visible:border-brand-green font-medium transition-all"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recovery Key */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-semibold text-brand-teal">6-Digit Recovery Key</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    type="text"
                                    value={recoveryKey}
                                    onChange={(e) => setRecoveryKey(e.target.value)}
                                    placeholder="e.g. 123456"
                                    className="pl-11 h-12 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-brand-green focus-visible:border-brand-green font-mono font-bold tracking-[0.25em] transition-all"
                                    required
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-semibold text-brand-teal">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-11 pr-12 h-12 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-brand-green focus-visible:border-brand-green font-medium transition-all shadow-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-green transition-colors p-1"
                                >
                                    {showPassword ? (
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-brand-green hover:bg-brand-teal text-white font-bold rounded-xl shadow-lg shadow-brand-green/20 transition-all flex items-center justify-center gap-2 mt-4 text-[15px] group overflow-hidden relative disabled:opacity-70"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isSubmitting ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                )}
                                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                            </span>
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/portal/login" className="text-sm font-semibold text-gray-500 hover:text-brand-green transition-colors">
                            &larr; Back to Login
                        </Link>
                    </div>

                </div>
            </div>

            {/* ── RIGHT PANEL (Image Background) ── */}
            <div className="hidden lg:block relative flex-1 bg-brand-dark overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                    alt="Students on campus"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/90 via-brand-green/80 to-[#046e04]/90 backdrop-blur-[2px]"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-12 text-center">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
                            <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                            <span className="text-sm font-semibold tracking-wide text-white/90">Safe & Secure Recovery</span>
                        </div>

                        <h2 className="text-4xl xl:text-5xl text-white font-heading mb-6 leading-[1.1]">
                            Regain access to your portal instantly.
                        </h2>

                        <p className="text-lg text-white/90 font-secondary leading-relaxed mb-10">
                            Lost your password? Request a secure 6-digit recovery key from your school administrator to securely reset your password.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
