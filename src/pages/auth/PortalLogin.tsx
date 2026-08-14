import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, ShieldCheck, ShieldOff, Eye, EyeOff,
    User, GraduationCap, UserCog, Users, ArrowRight, Building2, Phone,
    TrendingUp, MessageSquare
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { SkcoolyWordmark } from '../../components/shared/SkcoolyWordmark';
import { BrandGraphic } from '../../components/shared/BrandGraphic';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

const roles: { id: Role; label: string; icon: ReactNode; dest: string }[] = [
    { id: 'ADMIN', label: 'School Admin', icon: <ShieldCheck size={20} />, dest: '/dashboard' },
    { id: 'TEACHER', label: 'Staff', icon: <UserCog size={20} />, dest: '/teacher' },
    { id: 'STUDENT', label: 'Student', icon: <GraduationCap size={20} />, dest: '/student' },
    { id: 'PARENT', label: 'Parent', icon: <Users size={20} />, dest: '/parent' },
];

export default function PortalLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
    const [schoolCode, setSchoolCode] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [restrictionError, setRestrictionError] = useState<{ reason: string } | null>(null);

    const currentRole = roles.find(r => r.id === selectedRole)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!schoolCode.trim()) {
            toast.error("Please enter your School ID (e.g. SKL-A1B2C3).");
            return;
        }

        if (!loginId || !password) {
            toast.error("Please provide both your ID and password.");
            return;
        }

        setIsSubmitting(true);
        setRestrictionError(null);

        try {
            const user = await login({ loginId, password, role: selectedRole, schoolCode: schoolCode.toUpperCase().trim(), rememberMe });

            if (['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'BRANCH_STAFF'].includes(user?.role || '') || user?.customRoleId || user?.teacherProfile?.staffType === 'NON_ACADEMIC') {
                navigate('/dashboard');
            } else if (user?.role === 'TEACHER') {
                navigate('/teacher');
            } else if (user?.role === 'STUDENT') {
                navigate('/student');
            } else if (user?.role === 'PARENT') {
                navigate('/parent');
            } else {
                navigate(currentRole.dest);
            }
        } catch (error: any) {
            const data = error?.response?.data;
            if (data?.isRestricted) {
                setRestrictionError({ reason: data.reason });
            }
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
                            Sign in to your portal
                        </h1>
                        <p className="text-[14px] text-gray-400 leading-relaxed">
                            Select your role, enter your credentials, and access your educational hub.
                        </p>
                    </div>

                    {/* Restriction Alert */}
                    <AnimatePresence>
                        {restrictionError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 overflow-hidden"
                            >
                                <Card className="border-red-200 overflow-hidden py-0 gap-0">
                                    <div className="flex items-center gap-3 bg-red-600 px-4 py-3">
                                        <ShieldOff className="w-5 h-5 text-white shrink-0" />
                                        <p className="text-sm font-bold text-white">Portal Access Restricted</p>
                                    </div>
                                    <div className="px-4 py-4 space-y-3">
                                        <p className="text-sm text-red-700">
                                            Your account has been restricted by the school administration.
                                        </p>
                                        <Card className="flex flex-col gap-1 bg-red-50 border-red-100 px-4 py-3 shadow-none">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-red-400">Reason</p>
                                            <p className="text-sm font-semibold text-red-800">{restrictionError.reason}</p>
                                        </Card>
                                        <p className="text-xs text-red-500 flex items-center gap-1.5">
                                            <Phone className="w-3 h-3 shrink-0" />
                                            Please contact your school administration to resolve this.
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Role Selector */}
                    <Card className="mb-8 flex flex-row gap-1.5 p-1 bg-gray-100/80 border-gray-200/60 shadow-none">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => setSelectedRole(role.id)}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[11px] font-semibold transition-colors duration-200",
                                    selectedRole === role.id ? "text-[#15316B]" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {selectedRole === role.id && (
                                    <motion.div
                                        layoutId="role-pill-bg"
                                        className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative">{role.icon}</span>
                                <span className="relative">{role.label}</span>
                            </button>
                        ))}
                    </Card>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* School ID */}
                        <div className="space-y-1.5">
                            <Label htmlFor="schoolCode" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                School ID
                            </Label>
                            <div className="relative">
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    id="schoolCode"
                                    type="text"
                                    value={schoolCode}
                                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                    placeholder="038290"
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-[#15316B] rounded-xl transition-all placeholder:text-gray-300 font-mono font-semibold tracking-widest uppercase"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <p className="text-[11px] text-gray-300 pl-0.5">Provided by your school administrator.</p>
                        </div>

                        {/* Login ID */}
                        <div className="space-y-1.5">
                            <Label htmlFor="loginId" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                {selectedRole === 'ADMIN' ? 'Email Address' :
                                    selectedRole === 'STUDENT' ? 'Admission Number' :
                                        selectedRole === 'TEACHER' ? 'Staff ID' : 'Parent ID'}
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    id="loginId"
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

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Password</Label>
                                <Link to="/portal/recover" className="text-[12px] font-medium text-[#15316B] transition-colors hover:text-[#F5B800]">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        {/* Remember me */}
                        <div className="flex items-center gap-2.5 pt-1">
                            <Switch
                                id="rememberMe"
                                checked={rememberMe}
                                onCheckedChange={setRememberMe}
                                className="data-[state=checked]:bg-[#1E4DA6]"
                            />
                            <Label htmlFor="rememberMe" className="text-[13px] font-normal text-gray-400 cursor-pointer select-none">
                                Remember me for 30 days
                            </Label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 text-[14px] group shadow-lg shadow-[#1E4DA6]/25 disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span>Authenticating…</span>
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider + Register CTA */}
                    <div className="mt-8 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[12px] text-gray-300 font-medium">New to Skcooly?</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <div className="mt-4">
                        <Link
                            to="/get-started"
                            className="flex items-center justify-center w-full h-11 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 transition-all duration-200 gap-2 group hover:border-[#F5B800] hover:text-[#15316B]"
                        >
                            Register your school
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
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
                            One secure portal, every role
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
                            Your complete<br />
                            <span className="text-[#FFC72C]">educational</span><br />
                            ecosystem.
                        </h2>
                        <p className="text-[16px] text-white/50 leading-relaxed mb-10 max-w-[340px]">
                            Manage attendance, grades, communication, and everything in between — from a single, unified platform.
                        </p>
                    </motion.div>

                    {/* Bottom feature cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                        className="grid grid-cols-2 gap-3"
                    >
                        {[
                            { icon: <UserCog className="w-4 h-4" />, title: 'For Teachers', body: 'Streamline daily tasks. Focus on empowering students.' },
                            { icon: <GraduationCap className="w-4 h-4" />, title: 'For Students', body: 'Stay on top of assignments, grades, and announcements.' },
                            { icon: <TrendingUp className="w-4 h-4" />, title: 'For Admins', body: 'Full visibility into finance, attendance, and results.' },
                            { icon: <MessageSquare className="w-4 h-4" />, title: 'For Parents', body: 'Track your child\'s progress, always in the loop.' },
                        ].map(card => (
                            <Card
                                key={card.title}
                                className="rounded-2xl border-white/8 bg-white/5 hover:bg-white/[0.08] backdrop-blur-md p-5 shadow-none transition-colors gap-0"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3.5 text-[#FFC72C]">
                                    {card.icon}
                                </div>
                                <p className="text-[13px] font-bold text-white/90 mb-1.5">{card.title}</p>
                                <p className="text-[12px] text-white/45 leading-relaxed">{card.body}</p>
                            </Card>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
