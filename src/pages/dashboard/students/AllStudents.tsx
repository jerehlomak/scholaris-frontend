import { useViewPreference } from '../../../hooks/useViewPreference';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Plus, Eye, Edit, Trash2, Loader2, Users, BookOpen,
    CheckCircle2, Printer, Download, GraduationCap, ShieldOff, ShieldCheck, ArrowRightLeft, Key
} from 'lucide-react';
import { RestrictUserModal } from '../../../components/shared/RestrictUserModal';
import { AdminEditCredentialsModal } from '../../../components/modals/AdminEditCredentialsModal';
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
import { useSchoolType } from '../../../context/SchoolTypeContext';

interface StudentData {
    id: string;
    admissionNo: string;
    classLevel: string;
    classArm?: { id: string; name: string; level: string };
    classId?: string;
    gender: string;
    phone: string | null;
    status: string;
    dateOfBirth?: string;
    religion?: string;
    address?: string;
    user: { id: string; name: string; email: string; isRestricted?: boolean; restrictionReason?: string | null };
    parent?: { fatherName?: string; fatherPhone?: string; motherName?: string; motherPhone?: string } | null;
}

const AVATAR_COLORS = ['bg-blue-700', 'bg-purple-600', 'bg-emerald-600', 'bg-orange-500', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600'];
const STATUS_COLORS: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-500',
    Suspended: 'bg-red-100 text-red-600',
    Graduated: 'bg-blue-100 text-blue-600',
};

function downloadCSV(students: StudentData[]) {
    const headers = ['Name', 'Admission No.', 'Gender', 'Phone', 'Status', 'Class'];
    const rows = students.map(s => [
        `"${s.user?.name || 'Unknown'}"`,
        s.admissionNo,
        s.gender,
        s.phone || '',
        s.status,
        s.classArm?.name || s.classLevel,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Students.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function TransferStudentModal({ student, classes, onSuccess }: { student: StudentData; classes: any[]; onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [targetClass, setTargetClass] = useState('');

    const handleTransfer = async () => {
        if (!targetClass) return toast.error('Please select a destination class');
        if (targetClass === student.classId || targetClass === student.classLevel) {
            return toast.error('Student is already in this class');
        }
        try {
            setLoading(true);
            await axios.post(`/api/v1/students/${student.user.id}/transfer`, { newClassId: targetClass }, { withCredentials: true });
            toast.success('Student transferred successfully');
            setOpen(false);
            onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Transfer Class">
                    <ArrowRightLeft className="h-4 w-4" />
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transfer {student.user.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-500">
                        Current Class: <span className="font-bold text-slate-800">{student.classArm?.name || student.classLevel}</span>
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Destination Class</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"
                            value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                            <option value="">Select a class...</option>
                            {classes.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                        <button onClick={handleTransfer} disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Transfer
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BulkPromoteModal({ selectedIds, classes, onSuccess, onClearSelection }: { selectedIds: string[], classes: any[], onSuccess: () => void, onClearSelection: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [targetClass, setTargetClass] = useState('');
    const [status, setStatus] = useState('Active'); // or GRADUATED

    const handleBulkPromote = async () => {
        if (status === 'Active' && !targetClass) return toast.error('Please select a destination class');
        try {
            setLoading(true);
            await axios.post('/api/v1/students/promote', { 
                studentIds: selectedIds, 
                targetClassId: status === 'GRADUATED' ? null : targetClass,
                status: status === 'GRADUATED' ? 'GRADUATED' : 'ACTIVE'
            }, { withCredentials: true });
            toast.success(`${selectedIds.length} students promoted/changed successfully`);
            setOpen(false);
            onClearSelection();
            onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Bulk promotion failed');
        } finally {
            setLoading(false);
        }
    };

    if (selectedIds.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap">
                    <ArrowRightLeft className="h-4 w-4" /> Bulk Change Class ({selectedIds.length})
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Class Change / Promotion</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-500">
                        You are moving <span className="font-bold text-indigo-600">{selectedIds.length}</span> students.
                    </p>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Action</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 mb-4"
                            value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="Active">Move to another class</option>
                            <option value="GRADUATED">Graduate students</option>
                        </select>
                    </div>
                    {status === 'Active' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Destination Class</label>
                            <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400"
                                value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                                <option value="">Select a class...</option>
                                {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                        <button onClick={handleBulkPromote} disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Apply Changes
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function AllStudents() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [view, setView] = useViewPreference('allstudents');
    const [restrictTarget, setRestrictTarget] = useState<StudentData | null>(null);
    const [editCredTarget, setEditCredTarget] = useState<StudentData | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [classFilter, setClassFilter] = useState('');
    const { activeSchoolType } = useSchoolType();

    const { data: classesData } = useSWR(activeSchoolType ? `/api/v1/classes/all?schoolType=${activeSchoolType}` : '/api/v1/classes/all', fetcher);
    const classesList = classesData?.classes || [];

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
    }, [page, debouncedSearch, classFilter, activeSchoolType]);

    const { data, isLoading, mutate } = useSWR(`/api/v1/students/all?page=${page}&limit=12${debouncedSearch ? `&search=${debouncedSearch}` : ''}${classFilter ? `&classId=${classFilter}` : ''}`, fetcher);
    
    const students: StudentData[] = data?.students || [];
    const totalPages = data?.totalPages || 1;
    const totalRecords = data?.total || 0;

    const toggleSelectAll = () => {
        if (selectedIds.length === students.length && students.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleDelete = async (userId: string, name: string) => {
        try {
            await axios.delete(`/api/v1/students/${userId}`, { withCredentials: true });
            toast.success(`${name} deleted successfully`);
            mutate();
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Failed to delete student');
        }
    };

    const fetchAllDataForExport = async () => {
        const toastId = toast.loading('Fetching data...');
        try {
            const url = `/api/v1/students/all?limit=100000${debouncedSearch ? `&search=${debouncedSearch}` : ''}${classFilter ? `&classId=${classFilter}` : ''}`;
            const res = await axios.get(url, { withCredentials: true });
            toast.dismiss(toastId);
            return res.data.students || [];
        } catch (e) {
            toast.dismiss(toastId);
            toast.error('Failed to fetch data for export');
            return [];
        }
    };

    const handlePrint = async () => {
        const fullList = await fetchAllDataForExport();
        if (fullList.length === 0) return;

        const printContent = `
            <html><head><title>Student List</title>
            <style>
                body{font-family:sans-serif;padding:24px;color:#1e293b}
                h1{font-size:20px;margin-bottom:4px}
                p{font-size:12px;color:#64748b;margin:0 0 16px}
                table{width:100%;border-collapse:collapse;font-size:12px}
                th{background:#f1f5f9;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
                td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
                .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700}
                .active{background:#d1fae5;color:#065f46}
                .inactive{background:#f1f5f9;color:#475569}
                @media print{body{padding:0}}
            </style></head><body>
            <h1>All Students List</h1>
            <p>Total Records: ${fullList.length} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead><tr><th>#</th><th>Name</th><th>Admission No.</th><th>Gender</th><th>Status</th><th>Class</th></tr></thead>
                <tbody>
                ${fullList.map((s: StudentData, i: number) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${s.user?.name || 'Unknown'}</td>
                        <td style="font-family:monospace">${s.admissionNo}</td>
                        <td>${s.gender}</td>
                        <td><span class="badge ${s.status === 'Active' ? 'active' : 'inactive'}">${s.status}</span></td>
                        <td>${s.classArm?.name || s.classLevel}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            </body></html>`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(printContent);
        iframe.contentDocument?.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };

    const handleDownload = async () => {
        const fullList = await fetchAllDataForExport();
        if (fullList.length > 0) downloadCSV(fullList);
    };

    const StudentActions = ({ student }: { student: StudentData }) => (
        <div className="flex flex-wrap items-center justify-end gap-1">
            <Dialog>
                <DialogTrigger asChild>
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                        <Eye className="h-4 w-4" />
                    </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800 pb-2 border-b">Student Profile</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={cn('h-16 w-16 rounded-full flex items-center justify-center text-white font-black text-2xl bg-blue-600')}>
                                {student.user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-800">{student.user.name}</h3>
                                <p className="text-sm text-slate-500 font-mono">{student.admissionNo}</p>
                                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', STATUS_COLORS[student.status] || STATUS_COLORS.Inactive)}>
                                    {student.status}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                            {[
                                { label: 'Class', val: student.classArm?.name || student.classLevel },
                                { label: 'Gender', val: student.gender },
                                { label: 'Phone', val: student.phone || 'N/A' },
                                { label: 'Email', val: student.user.email },
                                { label: 'Parent', val: student.parent?.fatherName || student.parent?.motherName || 'Not linked' },
                                { label: 'Parent Phone', val: student.parent?.fatherPhone || student.parent?.motherPhone || 'N/A' },
                            ].map(item => (
                                <div key={item.label}>
                                    <span className="text-slate-400 block mb-0.5 text-xs font-semibold uppercase tracking-wide">{item.label}</span>
                                    <span className="font-bold text-slate-800 break-all">{item.val}</span>
                                </div>
                                ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <TransferStudentModal student={student} classes={classesList} onSuccess={mutate} />
            <Link to={`/dashboard/students/edit/${student.user.id}`}>
                <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                    <Edit className="h-4 w-4" />
                </button>
            </Link>
            <button onClick={() => setEditCredTarget(student)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Credentials">
                <Key className="h-4 w-4" />
            </button>
            <button onClick={() => setRestrictTarget(student)}
                title={student.user.isRestricted ? 'Lift restriction' : 'Restrict account'}
                className={cn('p-1.5 rounded-lg transition-colors', student.user.isRestricted ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50')}>
                {student.user.isRestricted ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            </button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive <strong>{student.user.name}</strong> ({student.admissionNo}).
                            Their data can be restored by an administrator.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(student.user.id, student.user.name)} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent="All Students" tabLabel="All Students" tabIcon={<Users className="h-3.5 w-3.5" />}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">All Students</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage all student enrollments and profiles.</p>
                </div>
                <Link to="/dashboard/students/add" className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors shrink-0">
                    <Plus className="h-4 w-4" /> Add New Student
                </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-xl">
                        <div className="relative flex-1 w-full">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by name or admission no..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <select 
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-blue-400 w-full sm:w-auto min-w-[140px]"
                            value={classFilter}
                            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Classes</option>
                            {classesList.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
                        {view === 'grid' && students.length > 0 && (
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                    checked={selectedIds.length === students.length && students.length > 0} 
                                    onChange={toggleSelectAll} />
                                Select All
                            </label>
                        )}
                        {selectedIds.length > 0 && (
                            <BulkPromoteModal 
                                selectedIds={selectedIds} 
                                classes={classesList} 
                                onSuccess={() => mutate()} 
                                onClearSelection={() => setSelectedIds([])} 
                            />
                        )}
                        <ViewToggle view={view} onChange={setView} />
                        <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" title="Print All">
                            <Printer className="h-4 w-4" />
                        </button>
                        <button onClick={handleDownload} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" title="Download All CSV">
                            <Download className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : students.length === 0 ? (
                    <div className="py-16 text-center">
                        <GraduationCap className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                        <p className="font-bold text-slate-600">No students found</p>
                    </div>
                ) : (
                    <>
                        {view === 'table' ? (
                            <div className="overflow-x-auto pb-4">
                                <table className="w-full text-sm text-left min-w-[800px] whitespace-nowrap">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 w-10">
                                                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                                    checked={selectedIds.length === students.length && students.length > 0} 
                                                    onChange={toggleSelectAll} />
                                            </th>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3">Class</th>
                                            <th className="px-4 py-3">Gender</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map((student, i) => (
                                            <tr key={student.id} className={cn("hover:bg-slate-50/50 transition-colors", selectedIds.includes(student.id) ? "bg-blue-50/30" : "")}>
                                                <td className="px-4 py-3">
                                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                                        checked={selectedIds.includes(student.id)} 
                                                        onChange={() => toggleSelect(student.id)} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs', AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                                                            {student.user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                {student.user.name}
                                                                {student.user.isRestricted && <span title="Restricted"><ShieldOff className="h-3 w-3 text-red-500" /></span>}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 font-mono">{student.admissionNo}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{student.classArm?.name || student.classLevel}</span></td>
                                                <td className="px-4 py-3">{student.gender}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', STATUS_COLORS[student.status] || STATUS_COLORS.Inactive)}>
                                                        {student.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3"><StudentActions student={student} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {students.map((student, i) => (
                                    <div key={student.id} className={cn("border rounded-2xl p-4 hover:shadow-md transition-all flex flex-col relative", selectedIds.includes(student.id) ? "border-blue-400 bg-blue-50/20 shadow-sm" : "border-slate-200 bg-white")}>
                                        <div className="absolute top-4 left-4 z-10">
                                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer shadow-sm" 
                                                checked={selectedIds.includes(student.id)} 
                                                onChange={() => toggleSelect(student.id)} />
                                        </div>
                                        <div className="flex justify-between items-start mb-3 pl-8">
                                            <div className={cn('h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg', AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                                                {student.user.name.charAt(0)}
                                            </div>
                                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', STATUS_COLORS[student.status] || STATUS_COLORS.Inactive)}>
                                                {student.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 line-clamp-1">{student.user.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono mb-3">{student.admissionNo}</p>
                                        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-3">
                                            <div>
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold uppercase">
                                                    {student.classArm?.name || student.classLevel}
                                                </span>
                                            </div>
                                            <div className="flex justify-end">
                                                <StudentActions student={student} />
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
                    userToEdit={{ id: editCredTarget.user.id, name: editCredTarget.user.name, role: 'STUDENT', loginId: editCredTarget.admissionNo }}
                    onSuccess={mutate}
                />
            )}
        </SettingsShell>
    );
}
