import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Loader2, User, FileText, CheckCircle2, CreditCard, ChevronRight } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import RecordPaymentModal from './components/RecordPaymentModal';

export default function SinglePaymentView() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'class' | 'admission' | 'family'>('name');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [payInv, setPayInv] = useState<any | null>(null);

    useEffect(() => {
        axios.get('/api/v1/students/all', { withCredentials: true })
            .then(res => setStudents(res.data.students || []))
            .catch(() => toast.error('Failed to load students'))
            .finally(() => setLoading(false));
    }, []);

    const fetchInvoices = (studentId: string) => {
        setLoadingInvoices(true);
        axios.get(`/api/v1/finance-v2/invoices?studentId=${studentId}&limit=100`, { withCredentials: true })
            .then(res => setInvoices(res.data.invoices || []))
            .catch(() => toast.error('Failed to load invoices'))
            .finally(() => setLoadingInvoices(false));
    };

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setSearch('');
        fetchInvoices(student.id);
    };

    const classOf = (s: any) => s.classArm?.name || s.classLevel || 'No Class';
    const familyOf = (s: any) => s.parent?.user?.name || s.parent?.fatherName || s.parent?.motherName || '';

    const classOptions = useMemo(
        () => Array.from(new Set(students.map(classOf))).sort((x, y) => x.localeCompare(y, undefined, { numeric: true })),
        [students]
    );

    // Search matches student name, admission no., class, and the family (parent/guardian
    // names, phone, parent ID) so the right payer can be found however the school knows them.
    const filteredStudents = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q && classFilter === 'ALL') return [];
        const matches = students.filter(s => {
            if (classFilter !== 'ALL' && classOf(s) !== classFilter) return false;
            if (!q) return true;
            const haystack = [
                s.user?.name, s.admissionNo, classOf(s),
                s.parent?.user?.name, s.parent?.fatherName, s.parent?.motherName,
                s.parent?.phone, s.parent?.fatherPhone, s.parent?.motherPhone, s.parent?.parentId
            ].filter(Boolean).join(' ').toLowerCase();
            return q.split(/s+/).every(term => haystack.includes(term));
        });
        const key = (s: any) => sortBy === 'class' ? classOf(s) : sortBy === 'admission' ? (s.admissionNo || '') : sortBy === 'family' ? familyOf(s) : (s.user?.name || '');
        return matches.sort((x, y) => key(x).localeCompare(key(y), undefined, { numeric: true, sensitivity: 'base' }) || (x.user?.name || '').localeCompare(y.user?.name || ''));
    }, [students, search, classFilter, sortBy]);
    const showResults = search.trim().length > 0 || classFilter !== 'ALL';

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fd-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fd-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="relative z-10 mx-auto max-w-full space-y-6">
                    {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
                <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Single Payment</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1E4DA6] text-white shadow-lg shadow-[#1E4DA6]/20">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Single Payment</h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Record a payment for a specific student's outstanding invoices.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Search by student, admission no., class, or family / parent name..." 
                        className="pl-10 h-12 text-base rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    
                    {showResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden overflow-y-auto max-h-96 z-10">
                            {filteredStudents.length > 0 ? filteredStudents.slice(0, 50).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectStudent(s)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3"
                                >
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {s.user?.name?.[0] || 'S'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{s.user?.name}</p>
                                        <p className="text-xs text-slate-500">{s.admissionNo} • {classOf(s)}{familyOf(s) ? ` • Family: ${familyOf(s)}` : ''}</p>
                                    </div>
                                </button>
                            )) : (
                                <div className="p-4 text-center text-slate-500 text-sm">No students found</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <label className="flex flex-1 items-center gap-2 text-xs font-semibold text-slate-500">
                        Class
                        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500">
                            <option value="ALL">All classes</option>
                            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-1 items-center gap-2 text-xs font-semibold text-slate-500">
                        Sort by
                        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500">
                            <option value="name">Student name</option>
                            <option value="class">Class</option>
                            <option value="admission">Admission number</option>
                            <option value="family">Family / parent name</option>
                        </select>
                    </label>
                </div>
            </div>

            {selectedStudent && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                            {selectedStudent.user?.name?.[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{selectedStudent.user?.name}</h3>
                            <p className="text-slate-500 text-sm">{selectedStudent.admissionNo} • {selectedStudent.classArm?.name || selectedStudent.classLevel || 'No Class'}</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-500" /> Outstanding Invoices
                        </h4>

                        {loadingInvoices ? (
                            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
                        ) : invoices.filter(inv => inv.balanceDue > 0).length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                                <p className="text-slate-600 font-medium">No outstanding invoices</p>
                                <p className="text-slate-400 text-sm">This student's account is fully settled.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {invoices.filter(inv => inv.balanceDue > 0).map(inv => (
                                    <div key={inv.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors gap-4 shadow-sm">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                                    {inv.term} {inv.academicYear}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">Generated: {new Date(inv.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 w-full sm:w-auto">
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Amount Due</p>
                                                <p className="font-bold text-lg text-red-600">₦{inv.balanceDue.toLocaleString()}</p>
                                            </div>
                                            <button 
                                                onClick={() => setPayInv(inv)}
                                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                                            >
                                                Pay
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

                </div>
                
                {payInv && (
                    <RecordPaymentModal 
                        inv={payInv}
                        onClose={() => setPayInv(null)}
                        onSuccess={() => { setPayInv(null); fetchInvoices(selectedStudent.id); }}
                    />
                )}
            </div>
        </>
    );
}
