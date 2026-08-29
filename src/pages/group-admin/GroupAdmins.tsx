import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Search, ShieldAlert, ShieldCheck, Mail, LogIn, Lock } from 'lucide-react';

interface School {
    id: string;
    name: string;
    adminEmail?: string;
    status: string;
}

export default function GroupAdmins() {
    const { T } = useOutletContext<any>();
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isResetOpen, setIsResetOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<{ schoolId: string, email: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting] = useState(false);

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/api/v1/group-admin/branches');
            setSchools(res.data.schools);
        } catch {
            toast.error('Failed to load school admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        toast.error('Direct password reset from user email coming soon (requires admin account fetching). Currently you can reset admins from Central Admin.');
        setIsResetOpen(false);
    };

    const cardStyle = {
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: '1rem',
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#1E4DA6]/30 border-t-[#1E4DA6] animate-spin" />
            </div>
        );
    }

    const filtered = schools.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.adminEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: T.textPrimary }}>School Admins</h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>Manage administrator access for all your school branches</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search schools or emails..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all focus:ring-2 focus:ring-[#1E4DA6]/50"
                        style={{ background: T.hoverBg, border: `1px solid ${T.border}`, color: T.textPrimary }}
                    />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(school => (
                    <div key={school.id} style={cardStyle} className="p-5 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: school.adminEmail ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : T.hoverBg }}>
                                    {school.adminEmail
                                        ? <ShieldCheck className="w-5 h-5 text-white" />
                                        : <ShieldAlert className="w-5 h-5" style={{ color: T.textMuted }} />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate" style={{ color: T.textPrimary }}>{school.name}</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase tracking-wider ${school.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {school.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                                <Mail className="w-4 h-4" />
                                <span className={school.adminEmail ? '' : 'italic'}>
                                    {school.adminEmail || 'No admin assigned'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                                <LogIn className="w-4 h-4" />
                                <span>Role: <strong style={{ color: T.textPrimary }}>School Admin</strong></span>
                            </div>
                        </div>

                        <div className="pt-5 mt-4 border-t flex items-center justify-end" style={{ borderColor: T.border }}>
                            {school.adminEmail ? (
                                <button onClick={() => {
                                    setSelectedAdmin({ schoolId: school.id, email: school.adminEmail! });
                                    setIsResetOpen(true);
                                }}
                                    className="flex items-center gap-2 text-sm font-medium transition-colors text-orange-500 hover:text-orange-400">
                                    <Lock className="w-4 h-4" /> Reset Password
                                </button>
                            ) : (
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#1E4DA6]">
                                    Assign from Branches
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center" style={{ color: T.textMuted }}>
                        No branches match your search criteria.
                    </div>
                )}
            </div>

            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Admin Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Admin Account</Label>
                            <Input value={selectedAdmin?.email || ''} disabled readOnly className="bg-slate-50 text-slate-500 font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Resetting...' : 'Confirm Reset'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
