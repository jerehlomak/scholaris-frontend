import { useViewPreference } from '../../../hooks/useViewPreference';
import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit3, Trash2, Mail, Phone, ChevronDown, Users, Briefcase, CheckCircle2, XCircle, Loader2, X, Building2, MapPin, Calendar, GraduationCap, Wallet, Landmark, Eye, BookOpen, ShieldOff, ShieldCheck, ArrowRightLeft, Key } from 'lucide-react';
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
import { SettingsShell } from '../settings/shared/SettingsShell';
import { cn } from '../../../lib/utils';
import { RestrictUserModal } from '../../../components/shared/RestrictUserModal';
import { BulkRestrictModal } from '../../../components/shared/BulkRestrictModal';
import { AdminEditCredentialsModal } from '../../../components/modals/AdminEditCredentialsModal';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../../../components/ui/dialog';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { Pagination } from '../../../components/shared/Pagination';

interface StaffData {
    id: string; employeeId: string; department: string; phone: string | null; gender: string; status: string; hireDate: string;
    dateOfBirth?: string | null; address?: string | null; qualification?: string | null; salary?: number | null;
    bankName?: string | null; accountName?: string | null; accountNumber?: string | null; subjectsTaught?: string | null;
    user: { id: string; name: string; email: string; role?: string; isRestricted?: boolean; restrictionReason?: string | null; };
}

const DEPT_COLORS: Record<string, string> = {
    'Science': 'bg-blue-100 text-blue-700', 'Mathematics': 'bg-purple-100 text-purple-700',
    'Arts': 'bg-pink-100 text-pink-700', 'Commerce': 'bg-orange-100 text-orange-700',
    'Languages': 'bg-teal-100 text-teal-700', 'Social Science': 'bg-indigo-100 text-indigo-700', 'ICT': 'bg-green-100 text-green-700',
};
const AVATAR_COLORS = ['bg-blue-700', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-500', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600', 'bg-slate-600'];

function ReassignStaffModal({ staff, onSuccess }: { staff: StaffData; onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [department, setDepartment] = useState(staff.department || '');
    const [staffType, setStaffType] = useState(staff.user?.role === 'ADMIN' ? 'ADMIN' : 'TEACHER');
    const [formClassId, setFormClassId] = useState('');

    const { data: classesData } = useSWR('/api/v1/classes/all', fetcher);
    const classes = classesData?.classes || [];

    const handleReassign = async () => {
        try {
            setLoading(true);
            await axios.post(`/api/v1/teachers/${staff.user.id}/reassign`, {
                department,
                staffType,
                formClassId: formClassId || undefined
            }, { withCredentials: true });
            toast.success('Staff reassigned successfully');
            setOpen(false);
            onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to reassign staff');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reassign Staff">
                    <ArrowRightLeft className="h-4 w-4" />
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reassign {staff.user.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Department / Section</label>
                        <select className="w-full p-2 border border-slate-200 rounded-xl text-sm" value={department} onChange={e => setDepartment(e.target.value)}>
                            <option value="">None</option>
                            <option value="Primary">Primary</option>
                            <option value="Junior Secondary">Junior Secondary</option>
                            <option value="Senior Secondary">Senior Secondary</option>
                            <option value="Science">Science</option>
                            <option value="Arts">Arts</option>
                            <option value="Commercial">Commercial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Staff Role</label>
                        <select className="w-full p-2 border border-slate-200 rounded-xl text-sm" value={staffType} onChange={e => setStaffType(e.target.value)}>
                            <option value="TEACHER">Teacher</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Assign as Form Teacher (Optional)</label>
                        <select className="w-full p-2 border border-slate-200 rounded-xl text-sm" value={formClassId} onChange={e => setFormClassId(e.target.value)}>
                            <option value="none">No Class</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Use the <Link to="/dashboard/academics/assignments" className="text-blue-600 hover:underline">Teacher Assignments</Link> page for advanced subject and class assignments.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                        <button onClick={handleReassign} disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Reassign
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function AllStaffs() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [view, setView] = useViewPreference('allemployees');
    const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null);
    const [restrictTarget, setRestrictTarget] = useState<StaffData | null>(null);
    const [editCredTarget, setEditCredTarget] = useState<StaffData | null>(null);
    const [showBulkRestrict, setShowBulkRestrict] = useState<'restrict' | 'unrestrict' | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, mutate } = useSWR(`/api/v1/teachers/all?page=${page}&limit=10${debouncedSearch ? `&search=${debouncedSearch}` : ''}`, fetcher);
    
    const Staffs: StaffData[] = data?.teachers || [];
    const totalPages = data?.totalPages || 1;
    const totalRecords = data?.total || 0;

    const handleDelete = async (userId: string) => {
        try {
            await axios.delete(`/api/v1/teachers/${userId}`, { withCredentials: true });
            toast.success('Staff deleted successfully');
            mutate();
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Failed to delete Staff');
        }
    };

    return (
        <SettingsShell breadcrumbParent="Employees" breadcrumbCurrent="All Staff" tabLabel="All Staff" tabIcon={<Users className="h-3.5 w-3.5" />}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">All Staffs</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage teaching staff and their profiles.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center shrink-0">
                    <button onClick={() => setShowBulkRestrict('restrict')}
                        className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors">
                        <ShieldOff className="h-4 w-4" /> Bulk Restrict
                    </button>
                    <Link to="/dashboard/employees/add"
                        className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors">
                        <Plus className="h-4 w-4" /> Add Staff
                    </Link>
                </div>
            </div>

            {/* Data Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 items-center">
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by name, ID, email, or dept..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : Staffs.length === 0 ? (
                    <div className="py-16 text-center">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                        <p className="font-bold text-slate-600">No staff found</p>
                    </div>
                ) : (
                    <>
                        {/* Table View */}
                        {view === 'table' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Staff Member</th>
                                            <th className="px-4 py-3 text-left">Department</th>
                                            <th className="px-4 py-3 text-left">Contact Info</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {Staffs.map((staff, idx) => (
                                            <tr key={staff.id} className={cn('hover:bg-slate-50/60 transition-colors group', staff.user.isRestricted && 'bg-red-50/30')}>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0', AVATAR_COLORS[idx % AVATAR_COLORS.length])}>{staff.user.name.charAt(0)}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900">{staff.user.name}</p>
                                                                {staff.user.isRestricted && (
                                                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                                        <ShieldOff className="h-3 w-3" /> RESTRICTED
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{staff.employeeId}</span>
                                                                {staff.user.role === 'ADMIN' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', DEPT_COLORS[staff.department] || 'bg-slate-100 text-slate-600')}>
                                                        {staff.department}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <a href={`mailto:${staff.user.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"><Mail className="h-3 w-3" />{staff.user.email}</a>
                                                    {staff.phone && <a href={`tel:${staff.phone}`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 mt-0.5"><Phone className="h-3 w-3" />{staff.phone}</a>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full',
                                                        staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                                                        <span className={cn('h-1.5 w-1.5 rounded-full', staff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400')}></span>
                                                        {staff.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => setSelectedStaff(staff)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile"><Eye className="h-4 w-4" /></button>
                                                        <ReassignStaffModal staff={staff} onSuccess={mutate} />
                                                        <Link to={`/dashboard/employees/edit/${staff.user.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit"><Edit3 className="h-4 w-4" /></Link>
                                                        <button onClick={() => setEditCredTarget(staff)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Credentials"><Key className="h-4 w-4" /></button>
                                                        <button onClick={() => setRestrictTarget(staff)}
                                                            title={staff.user.isRestricted ? 'Lift restriction' : 'Restrict account'}
                                                            className={cn('p-1.5 rounded-lg transition-colors', staff.user.isRestricted ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50')}>
                                                            {staff.user.isRestricted ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                                                        </button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Staff Record?</AlertDialogTitle>
                                                                    <AlertDialogDescription>This will archive {staff.user.name}'s account and profile data. Their academic records will remain preserved for historical accuracy.</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(staff.user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Grid View */}
                        {view === 'grid' && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Staffs.map((staff, idx) => (
                                    <div key={staff.id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all bg-white group flex flex-col">
                                        <div className="flex items-start gap-3">
                                            <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0', AVATAR_COLORS[idx % AVATAR_COLORS.length])}>{staff.user.name.charAt(0)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                                                    {staff.user.name}
                                                    {staff.user.isRestricted && <span title="Restricted"><ShieldOff className="h-3.5 w-3.5 text-red-500" /></span>}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{staff.employeeId}</span>
                                                    {staff.user.role === 'ADMIN' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block mb-1', DEPT_COLORS[staff.department] || 'bg-slate-100 text-slate-600')}>
                                                {staff.department}
                                            </span>
                                            <a href={`mailto:${staff.user.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600"><Mail className="h-3.5 w-3.5" />{staff.user.email}</a>
                                            {staff.phone && <a href={`tel:${staff.phone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600"><Phone className="h-3.5 w-3.5" />{staff.phone}</a>}
                                        </div>
                                        <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-slate-50">
                                            <div>
                                                <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider',
                                                    staff.status === 'Active' ? 'text-emerald-600' : 'text-slate-400')}>
                                                    {staff.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-end gap-1 transition-opacity shrink-0 w-full">
                                                <div className="flex flex-wrap items-center justify-end gap-1">
                                                    <button onClick={() => setSelectedStaff(staff)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-3.5 w-3.5" /></button>
                                                    <Link to={`/dashboard/employees/edit/${staff.user.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></Link>
                                                    <button onClick={() => setEditCredTarget(staff)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Key className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => setRestrictTarget(staff)}
                                                        title={staff.user.isRestricted ? 'Lift restriction' : 'Restrict account'}
                                                        className={cn('p-1.5 rounded-lg transition-colors', staff.user.isRestricted ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50')}>
                                                        {staff.user.isRestricted ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                                                    </button>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Staff Record?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will archive {staff.user.name}'s account and profile data.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(staff.user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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

            {/* Profile Modal */}
            <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
                <DialogContent hideClose className="max-w-md p-0 overflow-hidden bg-white">
                    {selectedStaff && (
                        <div className="flex flex-col max-h-[85vh]">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                                <h2 className="text-lg font-black text-slate-800">Staff Profile</h2>
                                <button onClick={() => setSelectedStaff(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="text-center mb-8">
                                    <div className={cn('h-24 w-24 mx-auto rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-lg mb-4', AVATAR_COLORS[0])}>
                                        {selectedStaff.user.name.charAt(0)}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">{selectedStaff.user.name}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{selectedStaff.employeeId}</span>
                                        {selectedStaff.user.role === 'ADMIN' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">Administrator</span>}
                                    </div>
                                </div>
    
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Professional Info</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Department</span><span className="font-semibold text-slate-700">{selectedStaff.department}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Qualification</span><span className="font-semibold text-slate-700">{selectedStaff.qualification || 'Not provided'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Hire Date</span><span className="font-semibold text-slate-700">{new Date(selectedStaff.hireDate).toLocaleDateString()}</span></div>
                                            {selectedStaff.subjectsTaught && (<div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Subjects Taught</span><span className="font-semibold text-slate-700">{selectedStaff.subjectsTaught}</span></div>)}
                                        </div>
                                    </div>
    
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Info</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Email</span><span className="font-semibold text-slate-700">{selectedStaff.user.email}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Phone</span><span className="font-semibold text-slate-700">{selectedStaff.phone || 'Not provided'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Address</span><span className="font-semibold text-slate-700">{selectedStaff.address || 'Not provided'}</span></div>
                                        </div>
                                    </div>
    
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Wallet className="h-4 w-4" /> Payroll Info</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Base Salary</span><span className="font-semibold text-slate-700">{selectedStaff.salary ? `₦${selectedStaff.salary.toLocaleString()}` : 'Not set'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Bank Name</span><span className="font-semibold text-slate-700">{selectedStaff.bankName || 'Not provided'}</span></div>
                                            <div><span className="block text-[11px] font-bold text-slate-400 uppercase mb-0.5">Account Details</span><span className="font-semibold text-slate-700">{selectedStaff.accountNumber ? `${selectedStaff.accountNumber} (${selectedStaff.accountName})` : 'Not provided'}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                                <Link to={`/dashboard/employees/edit/${selectedStaff.user.id}`} onClick={() => setSelectedStaff(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                                    <Edit3 className="h-4 w-4" /> Edit Profile
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
                    userToEdit={{ id: editCredTarget.user.id, name: editCredTarget.user.name, role: editCredTarget.user.role || 'TEACHER', loginId: editCredTarget.employeeId }}
                    onSuccess={mutate}
                />
            )}
            
            {showBulkRestrict && (
                <BulkRestrictModal
                    role="TEACHER"
                    roleLabel="All Staff"
                    isRestricting={showBulkRestrict === 'restrict'}
                    onClose={() => setShowBulkRestrict(null)}
                    onSuccess={() => mutate()}
                />
            )}
        </SettingsShell>
    );
}
