import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SkcoolyWordmark } from '../../components/shared/SkcoolyWordmark';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Network } from 'lucide-react';

export default function GroupAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { groupLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await groupLogin({ email, password });
            navigate('/group-admin');
        } catch (error) {
            // Error is handled in context via sonner
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#FDF6E3] px-6 py-12 overflow-hidden">
            {/* Ambient brand glow — same idiom as the portal login's abstract graphic, kept quiet here */}
            <div className="absolute top-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#15316B]/[0.04] blur-[100px]" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#F5B800]/[0.06] blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-block transition-opacity hover:opacity-80">
                        <SkcoolyWordmark size="lg" className="items-center" />
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xl shadow-[#15316B]/[0.06] overflow-hidden">
                    <div className="h-[3px] bg-gradient-to-r from-[#15316B] to-[#F5B800]" />

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-11 h-11 rounded-xl bg-[#15316B]/[0.06] flex items-center justify-center shrink-0">
                                <Network className="w-5 h-5 text-[#15316B]" strokeWidth={1.75} />
                            </div>
                            <div>
                                <h1 className="text-lg font-heading font-bold text-[#15316B] leading-tight">Group Admin</h1>
                                <p className="text-[13px] text-gray-400">Manage all your school branches from one place</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="groupEmail" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Email address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                    <Input
                                        id="groupEmail"
                                        type="email"
                                        placeholder="owner@group.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-gray-50 border-gray-200 text-[14px] focus-visible:ring-[#15316B] rounded-xl transition-all placeholder:text-gray-300"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="groupPassword" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-300 pointer-events-none" strokeWidth={1.5} />
                                    <Input
                                        id="groupPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        placeholder="••••••••"
                                        onChange={(e) => setPassword(e.target.value)}
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

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-11 bg-[#15316B] hover:bg-[#0E2450] text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 text-[14px] group shadow-lg shadow-[#15316B]/25 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        <span>Authenticating…</span>
                                    </>
                                ) : (
                                    <>
                                        Access Dashboard
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center space-y-2">
                    <p className="text-[13px] text-gray-400">Need help? Contact platform support.</p>
                    <Link to="/portal/login" className="text-[12px] font-medium text-[#15316B] hover:text-[#F5B800] transition-colors">
                        &larr; Back to school portal login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
