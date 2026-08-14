import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { UserPlus, Settings2, ShieldCheck, Mail, Building2, AlertCircle, CheckCircle } from 'lucide-react';

interface School {
    id: string;
    name: string;
    schoolCode: string | null;
    email: string;
    adminEmail?: string;
    studentCount: number;
    status: string;
}

export default function BranchesManagement() {
    const { T, theme } = useOutletContext<any>();
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

    // Form states
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBranches = async () => {
        try {
            const response = await axios.get('/api/v1/group-admin/branches');
            setSchools(response.data.schools);
        } catch (error) {
            toast.error('Failed to load branches');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/api/v1/group-admin/schools/${selectedSchool.id}/admins`, {
                name: adminName,
                email: adminEmail,
                password: adminPassword
            });
            toast.success('School Admin created successfully');
            setIsAddAdminOpen(false);
            setAdminName('');
            setAdminEmail('');
            setAdminPassword('');
            fetchBranches(); // Refresh list to get updated adminEmail
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setIsSubmitting(false);
        }
    };

    const cardStyle = {
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: '1rem',
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#1E4DA6]/30 border-t-[#1E4DA6] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: T.textPrimary }}>Branches Management</h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>Manage school locations and create branch administrators</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {schools.map((school) => (
                    <div key={school.id} style={cardStyle} className="flex flex-col lg:flex-row overflow-hidden transition-shadow hover:shadow-lg">
                        {/* Summary side */}
                        <div className="p-6 lg:w-1/2" style={{ borderRight: `1px solid ${T.border}` }}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-base truncate" style={{ color: T.textPrimary }}>{school.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#1E4DA6]/10 text-[#1E4DA6] font-semibold uppercase tracking-wide">
                                                {school.schoolCode || 'No Code'}
                                            </span>
                                            {school.status === 'ACTIVE' ? (
                                                <span className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
                                            ) : (
                                                <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {school.status}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mt-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span style={{ color: T.textMuted }}>Enrolled Students</span>
                                    <strong style={{ color: T.textPrimary }}>{school.studentCount}</strong>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4" style={{ color: T.textMuted }} />
                                    <span className="truncate" style={{ color: T.textPrimary }}>{school.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Admin side */}
                        <div className="p-6 lg:w-1/2 flex flex-col justify-between" style={{ background: theme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.01)' }}>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>Branch Administrator</h3>
                                {school.adminEmail ? (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.activeNavBg, color: T.activeNavColor }}>
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm" style={{ color: T.textPrimary }}>Assigned Admin</p>
                                            <p className="text-sm font-medium" style={{ color: '#3b82f6' }}>{school.adminEmail}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center flex-shrink-0" style={{ borderColor: T.border, color: T.textMuted }}>
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: T.textMuted }}>No admin assigned to this branch.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                {!school.adminEmail ? (
                                    <Button
                                        onClick={() => {
                                            setSelectedSchool(school);
                                            setIsAddAdminOpen(true);
                                        }}
                                        className="h-9 px-4 text-xs font-bold shadow-md shadow-[#1E4DA6]/20"
                                    >
                                        <UserPlus className="w-4 h-4 mr-1.5" />
                                        Create School Admin
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="h-9 px-4 text-xs font-bold"
                                        style={{ borderColor: T.border, color: T.textPrimary, background: 'transparent' }}
                                        onClick={() => toast.success('You can reset this admin\'s password from the "School Admins" tab.')}
                                    >
                                        <Settings2 className="w-4 h-4 mr-1.5" />
                                        Manage Admin
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {schools.length === 0 && (
                <div className="py-16 text-center" style={{ color: T.textMuted }}>
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No branches found. Connect a school to this group in Central Admin.</p>
                </div>
            )}

            {/* Add Admin Dialog */}
            <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Branch Admin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAdmin} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Admin Name</Label>
                            <Input
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                required
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Email (Login)</Label>
                            <Input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                required
                                placeholder="john@school.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Admin'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
