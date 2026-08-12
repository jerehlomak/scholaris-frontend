import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function GroupAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="min-h-screen relative flex items-center justify-center bg-[#080d1a] overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-6 backdrop-blur-sm">
                        <ShieldCheck className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Group Admin</h2>
                    <p className="text-slate-400">Manage all your school branches from one place</p>
                </div>

                <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Email address</Label>
                            <Input
                                type="email"
                                placeholder="owner@group.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    value={password}
                                    placeholder="••••••••"
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                                    required
                                />
                                <LockKeyhole className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 border-0 rounded-xl font-medium transition-all group"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">Authenticating...</span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Access Dashboard
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-slate-500">
                    Need help? Contact platform support
                </p>
            </div>
        </div>
    );
}
