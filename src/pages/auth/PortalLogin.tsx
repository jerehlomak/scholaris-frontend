import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Lock, ShieldCheck, ShieldOff,
    User, GraduationCap, UserCog, CheckCircle2, Users, ArrowRight, Building2, Phone
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import logo from '../../assets/SkcoolyPlus.png';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

const roles: { id: Role; label: string; icon: ReactNode; dest: string; desc: string }[] = [
    { id: 'ADMIN', label: 'School Admin', icon: <ShieldCheck size={20} />, dest: '/dashboard', desc: 'Full system control' },
    { id: 'TEACHER', label: 'Staff', icon: <UserCog size={20} />, dest: '/teacher', desc: 'Manage classes & grades' },
    { id: 'STUDENT', label: 'Student', icon: <GraduationCap size={20} />, dest: '/student', desc: 'View portal & results' },
    { id: 'PARENT', label: 'Parent', icon: <Users size={20} />, dest: '/parent', desc: 'Track child progress' },
];

export default function PortalLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
    const [schoolCode, setSchoolCode] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            const user = await login({ loginId, password, role: selectedRole, schoolCode: schoolCode.toUpperCase().trim() });

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
            // Check if the error is a restriction
            const data = error?.response?.data;
            if (data?.isRestricted) {
                setRestrictionError({ reason: data.reason });
            }
            // Other errors are handled by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex font-poppins" style={{ backgroundColor: '#f7f8f5' }}>

            {/* ── LEFT PANEL ── */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 lg:px-0 bg-white relative z-10 w-full lg:w-1/2 lg:flex-none xl:w-[46%]">

                {/* Subtle top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal via-brand-green to-[#78c878]" />

                <div className="w-full max-w-[450px] py-12 px-2">

                    {/* Logo */}
                    <div className="mb-10">
                        <Link to="/" className="inline-block transition-opacity hover:opacity-80">
                            <img src={logo} alt="SkcoolyPlus" className="h-auto w-28 object-contain" />
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-[28px] font-heading font-bold text-brand-dark tracking-tight leading-tight mb-2">
                            Sign in to your portal
                        </h1>
                        <p className="text-[14px] text-gray-400 leading-relaxed">
                            Select your role, enter your credentials, and access your educational hub.
                        </p>
                    </div>

                    {/* Restriction Banner */}
                    {restrictionError && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
                            <div className="flex items-center gap-3 bg-red-600 px-4 py-3">
                                <ShieldOff className="w-5 h-5 text-white shrink-0" />
                                <p className="text-sm font-bold text-white">Portal Access Restricted</p>
                            </div>
                            <div className="px-4 py-4 space-y-3">
                                <p className="text-sm text-red-700">
                                    Your account has been restricted by the school administration.
                                </p>
                                <div className="rounded-xl bg-white border border-red-100 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1">Reason</p>
                                    <p className="text-sm font-semibold text-red-800">{restrictionError.reason}</p>
                                </div>
                                <p className="text-xs text-red-500 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 shrink-0" />
                                    Please contact your school administration to resolve this.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Role Selector — horizontal pill tabs */}
                    <div className="mb-8">
                        <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100/80 border border-gray-200/60">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-200",
                                        selectedRole === role.id
                                            ? "bg-white text-brand-green shadow-sm border border-gray-200/80"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <span className={cn(
                                        "transition-colors duration-200",
                                        selectedRole === role.id ? "text-brand-green" : "text-gray-400"
                                    )}>
                                        {role.icon}
                                    </span>
                                    {role.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* School ID */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                School ID
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    type="text"
                                    value={schoolCode}
                                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                    placeholder="038290"
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-1 focus-visible:ring-brand-green focus-visible:border-brand-green font-mono font-semibold tracking-widest uppercase rounded-xl transition-all placeholder:text-gray-300"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <p className="text-[11px] text-gray-300 pl-0.5">Provided by your school administrator.</p>
                        </div>

                        {/* Login ID */}
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                {selectedRole === 'ADMIN' ? 'Email Address' :
                                    selectedRole === 'STUDENT' ? 'Admission Number' :
                                        selectedRole === 'TEACHER' ? 'Staff ID' : 'Parent ID'}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    type={selectedRole === 'ADMIN' ? 'email' : 'text'}
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    placeholder={
                                        selectedRole === 'ADMIN' ? 'admin@school.com' :
                                            selectedRole === 'STUDENT' ? 'SKL-YYYY-XXXX' :
                                                selectedRole === 'TEACHER' ? 'TCH-YYYY-XXXX' : 'PRT-YYYY-XXXX'
                                    }
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-1 focus-visible:ring-brand-green focus-visible:border-brand-green rounded-xl transition-all placeholder:text-gray-300"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                                <Link to="/portal/recover" className="text-[12px] font-medium text-brand-green hover:text-brand-teal transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 pr-11 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-1 focus-visible:ring-brand-green focus-visible:border-brand-green rounded-xl transition-all placeholder:text-gray-300"
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-green transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-400 select-none">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 accent-brand-green"
                                />
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 bg-brand-green hover:bg-brand-teal text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 text-[14px] group shadow-lg shadow-brand-green/20 disabled:opacity-60"
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
                        <span className="text-[12px] text-gray-300 font-medium">New to SkcoolyPlus?</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <div className="mt-4">
                        <Link
                            to="/get-started"
                            className="flex items-center justify-center w-full h-11 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:border-brand-green hover:text-brand-green transition-all duration-200 gap-2 group"
                        >
                            Register your school
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                    </div>

                    {/* Footer */}
                    <p className="mt-10 text-center text-[11px] text-gray-300">
                        &copy; {new Date().getFullYear()} SkcoolyPlus. All rights reserved.
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="hidden lg:flex relative flex-1 overflow-hidden flex-col">

                {/* Base dark green */}
                <div className="absolute inset-0 bg-[#062b1a]" />

                {/* Photo */}
                <img
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                    alt="Students on campus"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />

                {/* Gradient overlays for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/70 via-[#065f46]/60 to-[#022c16]/90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#011a0d]/80 via-transparent to-transparent" />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />

                {/* Decorative glow blobs */}
                <div className="absolute top-[-80px] right-[-80px] w-[480px] h-[480px] rounded-full bg-brand-green/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-60px] left-[-60px] w-[360px] h-[360px] rounded-full bg-brand-teal/15 blur-[100px] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">

                    {/* Top badge */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#7fe0b0]" />
                            <span className="text-[12px] font-semibold text-white/70 tracking-wide">Trusted by 500+ schools across Africa</span>
                        </div>
                    </div>

                    {/* Central copy */}
                    <div className="max-w-md">
                        <h2 className="font-heading text-[42px] xl:text-[52px] text-white leading-[1.08] tracking-tight mb-6">
                            Your complete<br />
                            <span className="text-[#7fe0b0]">educational</span><br />
                            ecosystem.
                        </h2>
                        <p className="text-[16px] text-white/50 leading-relaxed mb-10 max-w-[340px]">
                            Manage attendance, grades, communication, and everything in between — from a single, unified platform.
                        </p>

                        {/* Stat row */}
                        <div className="flex items-center gap-8">
                            {[
                                { value: '500+', label: 'Schools' },
                                { value: '120k', label: 'Students' },
                                { value: '99.9%', label: 'Uptime' },
                            ].map(stat => (
                                <div key={stat.label}>
                                    <p className="text-[24px] font-bold text-white leading-none">{stat.value}</p>
                                    <p className="text-[12px] text-white/40 mt-1 font-medium">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom feature cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                icon: <UserCog className="w-4 h-4" />,
                                title: 'For Teachers',
                                body: 'Streamline daily tasks. Focus on empowering students.',
                            },
                            {
                                icon: <GraduationCap className="w-4 h-4" />,
                                title: 'For Students',
                                body: 'Stay on top of assignments, grades, and announcements.',
                            },
                        ].map(card => (
                            <div
                                key={card.title}
                                className="rounded-2xl border border-white/8 bg-white/5 backdrop-blur-md p-5"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#7fe0b0] mb-3.5">
                                    {card.icon}
                                </div>
                                <p className="text-[13px] font-bold text-white/90 mb-1.5">{card.title}</p>
                                <p className="text-[12px] text-white/45 leading-relaxed">{card.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}