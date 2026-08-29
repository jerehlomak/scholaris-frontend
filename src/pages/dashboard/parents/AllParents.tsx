import { useViewPreference } from '../../../hooks/useViewPreference';
import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Phone, Mail, Loader2, ChevronDown, Users, CheckCircle2, ShieldOff, ShieldCheck, Eye, MapPin, Briefcase, X, Key } from 'lucide-react';
import { RestrictUserModal } from '../../../components/shared/RestrictUserModal';
import { AdminEditCredentialsModal } from '../../../components/modals/AdminEditCredentialsModal';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../../../components/ui/dialog';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { cn } from '../../../lib/utils';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { Pagination } from '../../../components/shared/Pagination';

interface ParentData {
    id: string; parentId: string; phone: string; occupation: string | null; address: string | null;
    fatherName: string | null; motherName: string | null;
    user: { id: string; name: string; email: string; isRestricted?: boolean; restrictionReason?: string | null; };
    students?: { user: { name: string }; admissionNo?: string }[];
}

const AVATAR_COLORS = ['bg-emerald-600', 'bg-[#173F8C]', 'bg-teal-600', 'bg-orange-500', 'bg-[#1E4DA6]', 'bg-pink-600', 'bg-indigo-600'];

function BulkRestrictModal({ selectedIds, onSuccess, onClearSelection }: { selectedIds: string[], onSuccess: () => void, onClearSelection: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRestricted, setIsRestricted] = useState(true);
    const [reason, setReason] = useState('');

    const handleBulkRestrict = async () => {
        if (isRestricted && !reason.trim()) return toast.error('A reason is required when restricting');
        try {
            setLoading(true);
            await axios.post('/api/v1/users/bulk-restrict', { 
                userIds: selectedIds, 
                isRestricted,
                reason
            }, { withCredentials: true });
            toast.success(`${selectedIds.length} users updated successfully`);
            setOpen(false);
            onClearSelection();
            onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Bulk restrict failed');
        } finally {
            setLoading(false);
        }
    };

    if (selectedIds.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-colors whitespace-nowrap">
                    <ShieldOff className="h-4 w-4" /> Bulk Restrict ({selectedIds.length})
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Restrict/Un-restrict Parents</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-500">
                        You have selected <span className="font-bold text-amber-600">{selectedIds.length}</span> parents.
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Action</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 mb-4"
                            value={isRestricted ? 'restrict' : 'unrestrict'} onChange={e => setIsRestricted(e.target.value === 'restrict')}>
                            <option value="restrict">Restrict Access</option>
                            <option value="unrestrict">Lift Restriction</option>
                        </select>
                    </div>
                    {isRestricted && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Reason (Required)</label>
                            <textarea className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 min-h-[100px] resize-y"
                                placeholder="E.g., Outstanding fees..."
                                value={reason} onChange={e => setReason(e.target.value)} />
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                        <button onClick={handleBulkRestrict} disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 flex items-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Apply Changes
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function AllParents() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [view, setView] = useViewPreference('allparents');
    const [restrictTarget, setRestrictTarget] = useState<ParentData | null>(null);
    const [selectedParent, setSelectedParent] = useState<ParentData | null>(null);
    const [editCredTarget, setEditCredTarget] = useState<ParentData | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setSelectedIds([]);
    }, [page, debouncedSearch]);

    const { data, isLoading, mutate } = useSWR(`/api/v1/parents/all?page=${page}&limit=12${debouncedSearch ? `&search=${debouncedSearch}` : ''}`, fetcher);
    
    const parents: ParentData[] = data?.parents || [];
    const totalPages = data?.totalPages || 1;
    const totalRecords = data?.total || 0;

    const toggleSelectAll = () => {
        if (selectedIds.length === parents.length && parents.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(parents.map(p => p.user.id));
        }
    };

    const toggleSelect = (userId: string) => {
        setSelectedIds(prev => prev.includes(userId) ? prev.filter(x => x !== userId) : [...prev, userId]);
    };

    const handleDelete = async (userId: string) => {
        try {
            await axios.delete(`/api/v1/parents/${userId}`, { withCredentials: true });
            toast.success('Parent deleted successfully');
            mutate();
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Failed to delete parent');
        }
    };

    const DeleteDialog = ({ parent }: { parent: ParentData }) => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Parent Account?</AlertDialogTitle>
                    <AlertDialogDescription>This will safely archive <strong>{parent.user.name}</strong>'s account ({parent.parentId}). Their data will be hidden but can be restored later by an administrator.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(parent.user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return (
        <SettingsShell breadcrumbParent="Parents" breadcrumbCurrent="All Parents" tabLabel="All Parents" tabIcon={<Users className="h-3.5 w-3.5" />}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#1C2333]">All Parents</h1>
                    <p className="text-sm text-slate-500 mt-1.5">Manage parent and guardian accounts.</p>
                </div>
                <Link to="/dashboard/parents/add"
                    className="flex items-center gap-2 rounded-full bg-[#1E4DA6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#173F8C] transition-colors shrink-0">
                    <Plus className="h-4 w-4" /> Add Parent
                </Link>
            </div>

            {/* Data Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 items-center">
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by name, ID or phone..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto items-center flex-wrap justify-end">
                        {view === 'grid' && parents.length > 0 && (
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                <input type="checkbox" className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer" 
                                    checked={selectedIds.length === parents.length && parents.length > 0} 
                                    onChange={toggleSelectAll} />
                                Select All
                            </label>
                        )}
                        {selectedIds.length > 0 && (
                            <BulkRestrictModal 
                                selectedIds={selectedIds} 
                                onSuccess={() => mutate()} 
                                onClearSelection={() => setSelectedIds([])} 
                            />
                        )}
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>
                ) : parents.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                        <p className="font-bold text-slate-600">No parents found</p>
                    </div>
                ) : (
                    <>
                        {/* Table view */}
                        {view === 'table' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm whitespace-nowrap">
                                    <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 w-10">
                                                <input type="checkbox" className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer" 
                                                    checked={selectedIds.length === parents.length && parents.length > 0} 
                                                    onChange={toggleSelectAll} />
                                            </th>
                                            <th className="px-6 py-3 text-left">Parent/Guardian</th>
                                            <th className="px-4 py-3 text-left">Parent ID</th>
                                            <th className="px-4 py-3 text-left">Contact Details</th>
                                            <th className="px-4 py-3 text-left">Occupation</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {parents.map((parent, idx) => (
                                            <tr key={parent.id} className={cn('hover:bg-slate-50/60 transition-colors group', parent.user.isRestricted ? 'bg-red-50/30' : '', selectedIds.includes(parent.user.id) ? 'bg-amber-50/30' : '')}>
                                                <td className="px-4 py-3">
                                                    <input type="checkbox" className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer" 
                                                        checked={selectedIds.includes(parent.user.id)} 
                                                        onChange={() => toggleSelect(parent.user.id)} />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0', AVATAR_COLORS[idx % AVATAR_COLORS.length])}>{parent.user.name.charAt(0)}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900">{parent.user.name}</p>
                                                                {parent.user.isRestricted && (
                                                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                        <ShieldOff className="h-3 w-3" /> RESTRICTED
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-400">{parent.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">{parent.parentId}</span></td>
                                                <td className="px-4 py-3">
                                                    <a href={`mailto:${parent.user.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#1E4DA6]"><Mail className="h-3 w-3" />{parent.user.email}</a>
                                                    {parent.phone && <a href={`tel:${parent.phone}`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#1E4DA6] mt-0.5"><Phone className="h-3 w-3" />{parent.phone}</a>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{parent.occupation || <span className="text-slate-400 italic text-xs">Not specified</span>}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                                        <button onClick={() => setSelectedParent(parent)} className="p-1.5 text-slate-400 hover:text-[#1E4DA6] hover:bg-[#1E4DA6]/5 rounded-lg transition-colors" title="View Profile"><Eye className="h-4 w-4" /></button>
                                                        <Link to={`/dashboard/parents/edit/${parent.user.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50" title="Edit"><Edit className="h-4 w-4" /></Link>
                                                        <button onClick={() => setEditCredTarget(parent)} className="p-1.5 text-slate-400 hover:text-[#0F766E] hover:bg-[#0F766E]/10 rounded-lg transition-colors" title="Edit Credentials"><Key className="h-4 w-4" /></button>
                                                        <button onClick={() => setRestrictTarget(parent)}
                                                            title={parent.user.isRestricted ? 'Lift restriction' : 'Restrict account'}
                                                            className={cn('p-1.5 rounded-lg transition-colors', parent.user.isRestricted ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50')}>
                                                            {parent.user.isRestricted ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                                                        </button>
                                                        <DeleteDialog parent={parent} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Grid view */}
                        {view === 'grid' && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {parents.map((parent, idx) => (
                                    <div key={parent.id} className={cn("rounded-2xl border p-4 hover:shadow-md transition-all bg-white group flex flex-col relative", selectedIds.includes(parent.user.id) ? "border-amber-400 bg-amber-50/20 shadow-sm" : "border-slate-200")}>
                                        <div className="absolute top-4 right-4 z-10">
                                            <input type="checkbox" className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-5 h-5 cursor-pointer shadow-sm" 
                                                checked={selectedIds.includes(parent.user.id)} 
                                                onChange={() => toggleSelect(parent.user.id)} />
                                        </div>
                                        <div className="flex items-start gap-3 pr-8">
                                            <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0', AVATAR_COLORS[idx % AVATAR_COLORS.length])}>{parent.user.name.charAt(0)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                                                    {parent.user.name}
                                                    {parent.user.isRestricted && <span title="Restricted"><ShieldOff className="h-3.5 w-3.5 text-red-500" /></span>}
                                                </p>
                                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">{parent.parentId}</span>
                                                {(parent.fatherName || parent.motherName) && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{[parent.fatherName, parent.motherName].filter(Boolean).join(' & ')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <a href={`mailto:${parent.user.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#1E4DA6]"><Mail className="h-3.5 w-3.5" />{parent.user.email}</a>
                                            {parent.phone && <a href={`tel:${parent.phone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#1E4DA6]"><Phone className="h-3.5 w-3.5" />{parent.phone}</a>}
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                                            <span className="text-xs text-slate-400 truncate">{parent.occupation || 'No occupation set'}</span>
                                            <div className="flex gap-1 transition-opacity shrink-0">
                                                <button onClick={() => setSelectedParent(parent)} className="p-1.5 text-slate-400 hover:text-[#1E4DA6] hover:bg-[#1E4DA6]/5 rounded-lg" title="View Profile"><Eye className="h-3.5 w-3.5" /></button>
                                                <Link to={`/dashboard/parents/edit/${parent.user.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit className="h-3.5 w-3.5" /></Link>
                                                <button onClick={() => setEditCredTarget(parent)} className="p-1.5 text-slate-400 hover:text-[#0F766E] hover:bg-[#0F766E]/10 rounded-lg transition-colors" title="Edit Credentials"><Key className="h-3.5 w-3.5" /></button>
                                                <button onClick={() => setRestrictTarget(parent)}
                                                    title={parent.user.isRestricted ? 'Lift restriction' : 'Restrict account'}
                                                    className={cn('p-1.5 rounded-lg transition-colors', parent.user.isRestricted ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50')}>
                                                    {parent.user.isRestricted ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                                                </button>
                                                <DeleteDialog parent={parent} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <Pagination currentPage={page} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setPage} />
                    </>
                )}
            </div>

            {restrictTarget && (
                <RestrictUserModal
                    userId={restrictTarget.user.id}
                    userName={restrictTarget.user.name}
                    isRestricted={!!restrictTarget.user.isRestricted}
                    onClose={() => setRestrictTarget(null)}
                    onSuccess={() => mutate()}
                />
            )}
            
            {editCredTarget && (
                <AdminEditCredentialsModal
                    isOpen={!!editCredTarget}
                    onClose={() => setEditCredTarget(null)}
                    userToEdit={{ id: editCredTarget.user.id, name: editCredTarget.user.name, role: 'PARENT', loginId: editCredTarget.parentId }}
                    onSuccess={mutate}
                />
            )}

            {/* Parent Profile Modal */}
            <Dialog open={!!selectedParent} onOpenChange={(open) => !open && setSelectedParent(null)}>
                <DialogContent hideClose className="max-w-xl p-0 overflow-hidden bg-white">
                    {selectedParent && (
                        <div className="flex flex-col max-h-[85vh]">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                                <h2 className="text-lg font-black text-slate-800">Parent Profile</h2>
                                <button onClick={() => setSelectedParent(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="text-center mb-8">
                                    <div className={cn('h-24 w-24 mx-auto rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-lg mb-4 bg-emerald-600')}>
                                        {selectedParent.user.name.charAt(0)}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">{selectedParent.user.name}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{selectedParent.parentId}</span>
                                        {selectedParent.user.isRestricted && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider">Restricted</span>}
                                    </div>
                                </div>
    
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Info</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Email</span><span className="font-semibold text-slate-700">{selectedParent.user.email}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Phone</span><span className="font-semibold text-slate-700">{selectedParent.phone || 'Not provided'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Address</span><span className="font-semibold text-slate-700">{selectedParent.address || 'Not provided'}</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Additional Details</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Occupation</span><span className="font-semibold text-slate-700">{selectedParent.occupation || 'Not provided'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Father's Name</span><span className="font-semibold text-slate-700">{selectedParent.fatherName || 'Not provided'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Mother's Name</span><span className="font-semibold text-slate-700">{selectedParent.motherName || 'Not provided'}</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Children / Wards</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            {selectedParent.students && selectedParent.students.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {selectedParent.students.map((student, idx) => (
                                                        <li key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                                            <span className="font-semibold text-sm text-slate-700">{student.user.name}</span>
                                                            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{student.admissionNo || 'N/A'}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-sm text-slate-500 italic">No children assigned yet.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                                <Link to={`/dashboard/parents/edit/${selectedParent.user.id}`} onClick={() => setSelectedParent(null)} className="flex items-center gap-2 px-4 py-2 bg-[#1E4DA6] text-white rounded-xl text-sm font-bold hover:bg-[#173F8C]">
                                    <Edit className="h-4 w-4" /> Edit Profile
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </SettingsShell>
    );
}
