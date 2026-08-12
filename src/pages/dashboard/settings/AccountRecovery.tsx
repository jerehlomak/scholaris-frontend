import { useState } from 'react';
import { Search, Key, Check, Loader2, UserCog, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { cn } from '../../../lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog';

type RoleType = 'STUDENT' | 'TEACHER' | 'PARENT';

const API_ROUTES: Record<RoleType, string> = {
    STUDENT: '/api/v1/students/all',
    TEACHER: '/api/v1/teachers/all',
    PARENT: '/api/v1/parents/all',
};

const extractUsers = (data: any, role: RoleType) => {
    if (!data) return [];
    if (role === 'STUDENT') return data.students || [];
    if (role === 'TEACHER') return data.teachers || [];
    if (role === 'PARENT') return data.parents || [];
    return [];
};

const PAGE_SIZE = 15;

export function AccountRecovery() {
    const [search, setSearch] = useState('');
    const [activeRole, setActiveRole] = useState<RoleType>('STUDENT');
    const [page, setPage] = useState(1);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [generatedKeyData, setGeneratedKeyData] = useState<{ name: string; loginId: string; key: string } | null>(null);

    const { data: rawData, isLoading } = useSWR(API_ROUTES[activeRole], fetcher);
    const items = extractUsers(rawData, activeRole);

    const filteredItems = items.filter((item: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            (item.user?.name || '').toLowerCase().includes(s) ||
            (item.user?.email || '').toLowerCase().includes(s) ||
            (item.admissionNo || item.employeeId || item.parentId || '').toLowerCase().includes(s)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const displayedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleRoleChange = (role: RoleType) => {
        setActiveRole(role);
        setPage(1);
        setSearch('');
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        setPage(1);
    };

    const handleGenerateKey = async (userId: string, name: string, loginId: string) => {
        setGeneratingId(userId);
        try {
            const res = await axios.post(`/api/v1/recovery/generate/${userId}`, {}, { withCredentials: true });
            setGeneratedKeyData({ name, loginId, key: res.data.recoveryKey });
            toast.success('Recovery key generated successfully');
        } catch (e) {
            toast.error('Failed to generate recovery key');
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <SettingsShell
            breadcrumbCurrent="Account Recovery"
            tabLabel="Account Recovery"
            tabIcon={<Key className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<Key className="h-7 w-7" />}
                title="Account Recovery"
                subtitle="Generate 6-digit recovery keys for users who have forgotten their password."
            />

            {/* Role Tabs */}
            <div className="flex overflow-x-auto whitespace-nowrap gap-2 mb-6 border-b border-slate-200 pb-2 scrollbar-hide">
                {[
                    { id: 'STUDENT', label: 'Students', icon: <GraduationCap className="w-4 h-4" /> },
                    { id: 'TEACHER', label: 'Teachers', icon: <UserCog className="w-4 h-4" /> },
                    { id: 'PARENT', label: 'Parents', icon: <Users className="w-4 h-4" /> },
                ].map((role) => (
                    <button
                        key={role.id}
                        onClick={() => handleRoleChange(role.id as RoleType)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-bold transition-all border-b-2 shrink-0',
                            activeRole === role.id
                                ? 'text-blue-700 border-blue-700 bg-blue-50/50'
                                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                        )}
                    >
                        {role.icon} {role.label}
                    </button>
                ))}
            </div>

            {/* Data Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
                <div className="w-full p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative max-w-md flex-1">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeRole.toLowerCase()}s by name or ID...`}
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
                        />
                    </div>
                    {!isLoading && filteredItems.length > 0 && (
                        <p className="text-xs text-slate-400 font-semibold shrink-0">
                            {filteredItems.length} record{filteredItems.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left">Name</th>
                                <th className="px-4 py-4 text-left">Login ID</th>
                                <th className="px-4 py-4 text-left">Email</th>
                                <th className="px-4 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></td></tr>
                            ) : displayedItems.length === 0 ? (
                                <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No users found.</td></tr>
                            ) : displayedItems.map((item: any) => {
                                const loginId = item.admissionNo || item.employeeId || item.parentId;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-800">{item.user?.name}</td>
                                        <td className="px-4 py-4 font-mono text-slate-500 font-bold">{loginId}</td>
                                        <td className="px-4 py-4 text-slate-500">{item.user?.email || 'N/A'}</td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => handleGenerateKey(item.user.id, item.user.name, loginId)}
                                                disabled={generatingId === item.user.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                {generatingId === item.user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                                                Generate Key
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-xs text-slate-500 font-semibold">
                            Page <span className="text-slate-800">{currentPage}</span> of <span className="text-slate-800">{totalPages}</span>
                            &nbsp;·&nbsp; Showing <span className="text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)}</span> of <span className="text-slate-800">{filteredItems.length}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={cn(
                                            'h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors',
                                            currentPage === pageNum
                                                ? 'bg-blue-700 text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Generated Key Modal */}
            <Dialog open={!!generatedKeyData} onOpenChange={(open) => !open && setGeneratedKeyData(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-black text-slate-800">Recovery Key Generated</DialogTitle>
                    </DialogHeader>

                    {generatedKeyData && (
                        <div className="py-6 text-center">
                            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                                A 6-digit recovery key has been generated for <strong>{generatedKeyData.name}</strong> ({generatedKeyData.loginId}).
                            </p>
                            <p className="text-xs text-slate-400 mb-6 px-4">
                                Share this key securely with the user. They will need it to reset their password via the login portal. It expires in 24 hours.
                            </p>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 inline-block">
                                <span className="font-mono text-4xl tracking-[0.25em] font-black text-slate-800 ml-2">
                                    {generatedKeyData.key}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="sm:justify-center">
                        <button
                            type="button"
                            onClick={() => setGeneratedKeyData(null)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-colors"
                        >
                            Done
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </SettingsShell>
    );
}
