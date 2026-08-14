import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Lock, ShieldCheck, Eye, EyeOff,
    User, GraduationCap, UserCog, Users, ArrowRight, Building2, KeyRound, LifeBuoy
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { SkcoolyWordmark } from '../../components/shared/SkcoolyWordmark';
import { BrandGraphic } from '../../components/shared/BrandGraphic';
import { toast } from 'sonner';
import axios from 'axios';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

const roles: { id: Role; label: string; icon: ReactNode }[] = [
    { id: 'ADMIN', label: 'School Admin', icon: <ShieldCheck size={20} /> },
    { id: 'TEACHER', label: 'Staff', icon: <UserCog size={20} /> },
    { id: 'STUDENT', label: 'Student', icon: <GraduationCap size={20} /> },
    { id: 'PARENT', label: 'Parent', icon: <Users size={20} /> },
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
        <div className="min-h-screen flex bg-[#FDF6E3]">

            {/* ── LEFT PANEL — form ── */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 lg:px-0 bg-white relative z-10 w-full lg:w-1/2 lg:flex-none xl:w-[46%]">

                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#15316B] to-[#F5B800]" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-[450px] py-12 px-2"
                >

                    {/* Logo */}
                    <div className="mb-10">
                        <Link to="/" className="inline-block transition-opacity hover:opacity-80">
                            <SkcoolyWordmark size="lg" />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-[28px] font-heading font-bold tracking-tight leading-tight mb-2 text-[#15316B]">
                            Account recovery
                        </h1>
                        <p className="text-[14px] text-gray-400 leading-relaxed">
                            Use the 6-digit recovery key provided by your school to reset your password.
                        </p>
                    </div>

                    {/* Role Selector */}
                    <Card className="mb-8 flex flex-row gap-1.5 p-1 bg-gray-100/80 border-gray-200/60 shadow-none">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRole(role.id)}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[11px] font-semibold transition-colors duration-200",
                                    selectedRole === role.id ? "text-[#15316B] bg-white shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <span className="relative">{role.icon}</span>
                                <span className="relative">{role.label}</span>
                            </button>
                        ))}
                    </Card>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* School ID */}
                            <div className="space-y-1.5">
                                <Label htmlFor="recoverSchoolCode" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                    School ID
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                    <Input
                                        id="recoverSchoolCode"
                                        type="text"
                                        value={schoolCode}
                                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                        placeholder="038290"
                                        className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-[#15316B] rounded-xl transition-all placeholder:text-gray-300 font-mono font-semibold tracking-widest uppercase"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Login ID */}
                            <div className="space-y-1.5">
                                <Label htmlFor="recoverLoginId" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                    {selectedRole === 'ADMIN' ? 'Email Address' :
                                        selectedRole === 'STUDENT' ? 'Admission No' :
                                            selectedRole === 'TEACHER' ? 'Staff ID' : 'Parent ID'}
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                    <Input
                                        id="recoverLoginId"
                                        type={selectedRole === 'ADMIN' ? 'email' : 'text'}
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        placeholder={
                                            selectedRole === 'ADMIN' ? 'admin@school.com' :
                                                selectedRole === 'STUDENT' ? 'SKL-YYYY-XXXX' :
                                                    selectedRole === 'TEACHER' ? 'TCH-YYYY-XXXX' : 'PRT-YYYY-XXXX'
                                        }
                                        className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-[#15316B] rounded-xl transition-all placeholder:text-gray-300"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recovery Key */}
                        <div className="space-y-1.5">
                            <Label htmlFor="recoveryKey" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                6-digit recovery key
                            </Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    id="recoveryKey"
                                    type="text"
                                    value={recoveryKey}
                                    onChange={(e) => setRecoveryKey(e.target.value)}
                                    placeholder="e.g. 123456"
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-[#15316B] rounded-xl transition-all placeholder:text-gray-300 font-mono font-semibold tracking-[0.25em]"
                                    required
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="newPassword" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                New password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 pr-11 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-[#15316B] rounded-xl transition-all placeholder:text-gray-300"
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors hover:text-[#15316B]"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 bg-[#15316B] hover:bg-[#0E2450] text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 text-[14px] group shadow-lg shadow-[#15316B]/25 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>Resetting password…</span>
                                </>
                            ) : (
                                <>
                                    Reset password
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Back to login */}
                    <div className="mt-8 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <Link
                            to="/portal/login"
                            className="text-[12px] font-semibold text-gray-500 hover:text-[#15316B] transition-colors whitespace-nowrap"
                        >
                            &larr; Back to login
                        </Link>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Footer */}
                    <p className="mt-10 text-center text-[11px] text-gray-300">
                        &copy; {new Date().getFullYear()} Skcooly. All rights reserved.
                    </p>
                </motion.div>
            </div>

            {/* ── RIGHT PANEL — brand ── */}
            <div className="hidden lg:flex relative flex-1 overflow-hidden flex-col">

                {/* Base navy gradient (no stock photo — abstract graphic instead) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#15316B] via-[#0E2450] to-[#081434]" />

                <BrandGraphic />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">

                    {/* Top badge */}
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <Badge className="gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/5 backdrop-blur-sm text-white/70 font-semibold tracking-wide text-[12px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#FFC72C]" />
                            Safe & secure recovery
                        </Badge>
                    </motion.div>

                    {/* Central copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                        className="max-w-md"
                    >
                        <h2 className="font-heading text-[42px] xl:text-[52px] text-white leading-[1.08] tracking-tight mb-6">
                            Regain access,<br />
                            <span className="text-[#FFC72C]">in minutes</span>,<br />
                            not days.
                        </h2>
                        <p className="text-[16px] text-white/50 leading-relaxed mb-10 max-w-[340px]">
                            Request a secure recovery key from your school administrator, then use it here to set a fresh password — no waiting on IT.
                        </p>
                    </motion.div>

                    {/* Bottom help card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    >
                        <Card className="rounded-2xl border-white/8 bg-white/5 backdrop-blur-md p-5 shadow-none gap-0">
                            <div className="flex items-start gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#FFC72C]">
                                    <LifeBuoy className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-white/90 mb-1">Don't have a recovery key?</p>
                                    <p className="text-[12px] text-white/45 leading-relaxed">Ask your school administrator to generate one from their dashboard — it's a one-time 6-digit code tied to your account.</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>

        </div>
    );
}
