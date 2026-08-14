/**
 * AllStudentPayments.tsx — Admin Fee Collection & Invoice Management
 * Features: Bulk select, Send Reminder modal, filterDispatched, isDisputed badges
 */
import { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, Plus, Printer, Search, CheckCircle2, Clock, AlertCircle,
    FileText, Users, Filter, ChevronDown, Loader2, Play, Trash2,
    ChevronRight, Send, CheckSquare, Square, Bell
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { Pagination } from '../../../components/shared/Pagination';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

interface StudentFee {
    id: string; studentId: string; admNo: string; name: string; classLevel: string;
    totalFee: number; amountPaid: number; status: PaymentStatus;
    lastPayment: string | null; avatar?: string; avatarColor?: string;
    isSent?: boolean; isPrinted?: boolean;
    isDisputed?: boolean; disputeReason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PaymentStatus, { label: string; textColor: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    paid: { label: 'Paid', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    partial: { label: 'Partial', textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100', icon: <Clock className="h-3.5 w-3.5" /> },
    unpaid: { label: 'Unpaid', textColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-100', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const AVATAR_COLORS = ['bg-[#1E4DA6]', 'bg-[#1E4DA6]', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG'); }

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 placeholder:text-slate-400';

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : 'bg-[#1E4DA6]')}
            />
        </div>
    );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function Modal({ children, onClose, maxWidth = 'max-w-sm' }: { children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
    return (
        <motion.div
            key="modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                key="modal"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className={cn('flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl', maxWidth)}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
    return (
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <div>
                <p className="font-bold text-slate-900">{title}</p>
                {subtitle && <p className="mt-0.5 font-mono text-[10px] text-slate-400">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

// ─── Collect Payment Modal ────────────────────────────────────────────────────
interface CollectModalProps { student: StudentFee; onClose: () => void; onSave: (id: string, amount: number, method: string) => void; }

function CollectModal({ student, onClose, onSave }: CollectModalProps) {
    const outstanding = student.totalFee - student.amountPaid;
    const [amount, setAmount] = useState(outstanding);
    const [method, setMethod] = useState('Cash');
    const [processing, setProcessing] = useState(false);

    const handleSave = async () => {
        setProcessing(true);
        await onSave(student.id, amount, method);
        setProcessing(false);
    };

    return (
        <Modal onClose={onClose}>
            <ModalHeader title="Collect Payment" onClose={onClose} />
            <div className="space-y-4 overflow-y-auto p-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm', student.avatarColor || avatarColor(student.name))}>
                        {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{student.admNo} · {student.classLevel}</p>
                    </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-100 p-4">
                    {[
                        { label: 'Total Fee', value: fmt(student.totalFee), valueClass: 'text-slate-900' },
                        { label: 'Already Paid', value: fmt(student.amountPaid), valueClass: 'text-emerald-600' },
                    ].map(row => (
                        <div key={row.label} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{row.label}</span>
                            <span className={cn('font-bold', row.valueClass)}>{row.value}</span>
                        </div>
                    ))}
                    <Separator className="bg-slate-100" />
                    <div className="flex items-center justify-between text-sm font-bold">
                        <span className="text-red-600">Outstanding</span>
                        <span className="text-red-600">{fmt(outstanding)}</span>
                    </div>
                    <ProgressBar value={student.amountPaid} max={student.totalFee} />
                </div>

                <div>
                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount to Collect (₦) <span className="text-rose-500">*</span></Label>
                    <input type="number" min={0} max={outstanding} value={amount}
                        onChange={e => setAmount(Math.min(outstanding, Math.max(0, Number(e.target.value))))}
                        className={fieldCls} />
                    <p className="mt-1 font-mono text-[10px] text-slate-400">Max: {fmt(outstanding)}</p>
                </div>

                <div>
                    <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Method</Label>
                    <select value={method} onChange={e => setMethod(e.target.value)} className={fieldCls}>
                        {['Cash', 'POS', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                <Button onClick={handleSave} disabled={amount <= 0 || processing}
                    className="flex-1 gap-2 rounded-xl bg-[#173F8C] text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69] disabled:opacity-50">
                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {processing ? 'Processing…' : `Collect ${fmt(amount)}`}
                </Button>
            </div>
        </Modal>
    );
}

type TargetMode = 'all' | 'class_level' | 'class_arm' | 'student' | 'new_students';

function GenerateModal({ onClose, onSave, termsList, sessionsList }: { onClose: () => void; onSave: (data: any) => Promise<void>; termsList: any[]; sessionsList: any[] }) {
    const [feeParticulars, setFeeParticulars] = useState<any[]>([]);
    const [classArms, setClassArms] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [selectedFees, setSelectedFees] = useState<string[]>([]);
    const [term, setTerm] = useState(termsList.length > 0 ? termsList[0].name : 'First Term');
    const [year, setYear] = useState(sessionsList.length > 0 ? sessionsList[0].name : new Date().getFullYear() + '/' + (new Date().getFullYear() + 1));
    const [targetMode, setTargetMode] = useState<TargetMode>('all');
    const [selectedClassLevel, setSelectedClassLevel] = useState('JSS 1');
    const [selectedClassArmId, setSelectedClassArmId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/finance-v2/fees', { withCredentials: true }),
            axios.get('/api/v1/classes/all', { withCredentials: true }),
            axios.get('/api/v1/students/all', { withCredentials: true }),
        ]).then(([fpRes, classRes, stuRes]) => {
            setFeeParticulars(fpRes.data.fees || []);
            setClassArms(classRes.data.classes || []);
            setAllStudents(stuRes.data.students || []);
            if ((classRes.data.classes || []).length > 0) setSelectedClassArmId(classRes.data.classes[0].id);
            if ((stuRes.data.students || []).length > 0) setSelectedStudentId(stuRes.data.students[0].id);
        }).catch(console.error);
    }, []);

    const buildTargets = () => {
        switch (targetMode) {
            case 'all': return {};
            case 'class_level': return { classLevel: selectedClassLevel };
            case 'class_arm': return { classId: selectedClassArmId };
            case 'student': return { studentIds: [selectedStudentId] };
            case 'new_students': { const c = new Date(); c.setDate(c.getDate() - 30); return { newStudentsSince: c.toISOString() }; }
            default: return {};
        }
    };

    const handleSaveWrapper = async () => {
        if (selectedFees.length === 0) { toast.error('Please select at least one fee item'); return; }
        if (targetMode === 'student' && !selectedStudentId) { toast.error('Please select a student'); return; }
        if (targetMode === 'class_arm' && !selectedClassArmId) { toast.error('Please select a class'); return; }
        setProcessing(true);
        await onSave({ targets: buildTargets(), feeParticularIds: selectedFees, term, year });
        setProcessing(false);
    };

    const toggleFee = (id: string) => setSelectedFees(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id]);
    const filteredStudents = allStudents.filter(s =>
        s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.admissionNo?.toLowerCase().includes(studentSearch.toLowerCase())
    );
    const classLevels = [...new Set(classArms.map(c => c.level || c.name?.replace(/\s+/g, '').replace(/[ABCD]$/, '').trim()))].filter(Boolean);
    const availableModalTerms = year ? termsList.filter(t => t.session?.name === year) : termsList;
    const TARGET_MODES: { value: TargetMode; label: string; desc: string }[] = [
        { value: 'all', label: 'All Students', desc: 'Every active student in school' },
        { value: 'class_level', label: 'Section', desc: 'e.g. Primary, JSS (all arms)' },
        { value: 'class_arm', label: 'Specific Class', desc: 'e.g. JSS 1A, SS 2B (one arm)' },
        { value: 'student', label: 'One Student', desc: 'Assign to one individual' },
        { value: 'new_students', label: 'New Students', desc: 'Enrolled in last 30 days' },
    ];
    const totalSelected = feeParticulars.filter(f => selectedFees.includes(f.id)).reduce((s, f) => s + f.amount, 0);

    return (
        <Modal onClose={onClose} maxWidth="max-w-2xl">
            <ModalHeader title="Assign Fee Structures" subtitle="Select fee items and customise who they are assigned to." onClose={onClose} />
            <div className="space-y-6 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Year <span className="text-rose-500">*</span></Label>
                        <select value={year} onChange={e => { setYear(e.target.value); setTerm(''); }} className={fieldCls}>
                            <option value="" disabled>Select Year</option>
                            {sessionsList.length > 0 ? sessionsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>) : ['2023/2024', '2024/2025', '2025/2026', '2026/2027'].map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Term <span className="text-rose-500">*</span></Label>
                        <select value={term} onChange={e => setTerm(e.target.value)} className={`${fieldCls} ${!year ? "opacity-50 cursor-not-allowed" : ""}`} disabled={!year}>
                            <option value="" disabled>{year ? 'Select Term' : 'Select a Year First'}</option>
                            {availableModalTerms.length > 0 ? availableModalTerms.map(t => <option key={t.id} value={t.name}>{t.name}</option>) : ['First Term', 'Second Term', 'Third Term'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <Label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Assignment Target <span className="text-rose-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {TARGET_MODES.map(m => (
                            <button key={m.value} onClick={() => setTargetMode(m.value)}
                                className={cn('rounded-xl border-2 p-3 text-left transition-all',
                                    targetMode === m.value ? 'border-[#1E4DA6] bg-[#1E4DA6]/8 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                                )}>
                                <p className={cn('text-xs font-bold', targetMode === m.value ? 'text-[#173F8C]' : 'text-slate-800')}>{m.label}</p>
                                <p className="mt-0.5 font-mono text-[10px] leading-tight text-slate-400">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {targetMode === 'class_level' && (
                    <div>
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Section</Label>
                        <select value={selectedClassLevel} onChange={e => setSelectedClassLevel(e.target.value)} className={fieldCls}>
                            {(classLevels.length > 0 ? classLevels : ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']).map((l: string) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                )}
                {targetMode === 'class_arm' && (
                    <div>
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Specific Class</Label>
                        <select value={selectedClassArmId} onChange={e => setSelectedClassArmId(e.target.value)} className={fieldCls}>
                            {classArms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
                {targetMode === 'student' && (
                    <div className="space-y-2">
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Find Student</Label>
                        <input type="text" placeholder="Search by name or admission no…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className={fieldCls} />
                        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} size={4} className={cn(fieldCls, 'h-32 overflow-y-auto')}>
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.user?.name || s.name} — {s.admissionNo} ({s.classLevel})</option>)}
                        </select>
                    </div>
                )}
                {targetMode === 'new_students' && (
                    <div className="flex gap-2 rounded-xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/5 p-3 text-xs text-[#173F8C]">
                        <span className="shrink-0">ℹ️</span>
                        Fees will be assigned to all students whose enrollment date is within the last 30 days.
                    </div>
                )}

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Fee Items to Assign <span className="text-rose-500">*</span></Label>
                        <button onClick={() => setSelectedFees(feeParticulars.map(f => f.id))} className="font-mono text-[10px] font-bold text-[#1E4DA6] hover:underline">Select All</button>
                    </div>
                    {feeParticulars.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                            No fee structures found. Define them in Settings first.
                        </div>
                    ) : (
                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                            {feeParticulars.map(fee => (
                                <label key={fee.id} className={cn(
                                    'flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 transition-all',
                                    selectedFees.includes(fee.id) ? 'border-[#1E4DA6]/60 bg-[#1E4DA6]/8' : 'border-slate-100 hover:border-slate-200'
                                )}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={selectedFees.includes(fee.id)} onChange={() => toggleFee(fee.id)} className="h-4 w-4 accent-[#1E4DA6]" />
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700">{fee.label}</span>
                                            {fee.isRequired && <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-600">Required</span>}
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-slate-900">{fmt(fee.amount)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    {selectedFees.length > 0 && (
                        <div className="mt-2 flex items-center justify-between rounded-xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/5 px-4 py-2">
                            <span className="font-mono text-xs text-slate-500">{selectedFees.length} item{selectedFees.length > 1 ? 's' : ''} selected</span>
                            <span className="font-mono text-sm font-black text-[#173F8C]">{fmt(totalSelected)}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                <Button onClick={handleSaveWrapper} disabled={processing}
                    className="flex-1 gap-2 rounded-xl bg-[#173F8C] text-xs font-bold text-white shadow-md shadow-[#1E4DA6]/20 hover:bg-[#122F69] disabled:opacity-50">
                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {processing ? 'Assigning…' : 'Assign Fees'}
                </Button>
            </div>
        </Modal>
    );
}



// ─── Main Component ───────────────────────────────────────────────────────────
export default function AllStudentPayments() {
    const [students, setStudents] = useState<StudentFee[]>([]);
    const [feeParticulars, setFeeParticulars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
    const [filterClass, setFilterClass] = useState('all');
    const [filterDispatched, setFilterDispatched] = useState<string>('all');
    const [filterTerm, setFilterTerm] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [collecting, setCollecting] = useState<StudentFee | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);
    const [selectedStudentRows, setSelectedStudentRows] = useState<string[]>([]);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [customMessageChannel, setCustomMessageChannel] = useState('whatsapp');
    const [customMessageSubject, setCustomMessageSubject] = useState('');
    const [customMessageBody, setCustomMessageBody] = useState('');
    const [isBulkSending, setIsBulkSending] = useState(false);
    const [termsList, setTermsList] = useState<any[]>([]);
    const [sessionsList, setSessionsList] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    useEffect(() => { 
        const t = setTimeout(() => setPageVisible(true), 60); 
        Promise.all([
            axios.get('/api/v1/terms', { withCredentials: true }),
            axios.get('/api/v1/sessions', { withCredentials: true })
        ]).then(([termsRes, sessionsRes]) => {
            setTermsList(termsRes.data.terms || []);
            setSessionsList(sessionsRes.data.sessions || []);
        }).catch(console.error);
        return () => clearTimeout(t); 
    }, []);

    const fetchFees = useCallback(async () => {
        if (students.length === 0) setLoading(true);
        setIsFetching(true);
        try {
            const params = new URLSearchParams({ limit: '2000' });
            if (filterTerm) params.append('term', filterTerm);
            if (filterYear) params.append('academicYear', filterYear);
            
            const [feesRes, particularsRes] = await Promise.all([
                axios.get(`/api/v1/finance-v2/invoices?${params.toString()}`, { withCredentials: true }),
                axios.get('/api/v1/finance-v2/fees', { withCredentials: true })
            ]);
            const invoices = feesRes.data.invoices || [];
            const mapped = invoices.map((inv: any) => {
                const amountPaid = inv.totalAmount - inv.balanceDue;
                return {
                    id: inv.id,
                    studentId: inv.studentId,
                    admNo: inv.student?.admissionNo || '-',
                    name: inv.student?.user?.name || 'Unknown',
                    classLevel: inv.student?.classArm?.name || inv.student?.classLevel || 'Student',
                    totalFee: inv.totalAmount,
                    amountPaid,
                    isSent: inv.isSent,
                    isPrinted: inv.isPrinted,
                    isDisputed: inv.isDisputed,
                    disputeReason: inv.disputeReason,
                    status: inv.status === 'PAID' ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
                    lastPayment: inv.payments?.length > 0 ? inv.payments[0].date : null
                };
            });
            setStudents(mapped);
            setFeeParticulars(particularsRes.data.fees || []);
        } catch { toast.error('Failed to load fee information'); }
        finally { setLoading(false); setIsFetching(false); }
    }, [filterTerm, filterYear]);

    useEffect(() => { fetchFees(); }, [fetchFees]);

    const overdueCount = students.filter(f => f.status === 'unpaid').length;

    const classes = ['all', ...Array.from(new Set(students.map(s => s.classLevel)))];
    const availableTerms = filterYear ? termsList.filter(t => t.session?.name === filterYear) : termsList;
    const displayed = students.filter(s => {
        const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admNo.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchesClass = filterClass === 'all' || s.classLevel === filterClass;
        const matchesDispatched = filterDispatched === 'all' ||
            (filterDispatched === 'unsent' && !s.isSent) ||
            (filterDispatched === 'unprinted' && !s.isPrinted);
        return matchesSearch && matchesStatus && matchesClass && matchesDispatched;
    });

    // Pagination is purely a screen-rendering concern — `displayed` (the full filtered list)
    // stays intact for the print view so printing is never limited to the current page.
    useEffect(() => { setPage(1); }, [search, filterStatus, filterClass, filterDispatched, filterTerm, filterYear]);
    const totalPages = Math.max(1, Math.ceil(displayed.length / pageSize));
    const paginated = displayed.slice((page - 1) * pageSize, page * pageSize);

    // UI shows friendly labels; the finance-v2 manual-payment endpoint expects these exact enum values.
    const PAYMENT_METHOD_MAP: Record<string, string> = { 'Cash': 'CASH', 'POS': 'POS', 'Bank Transfer': 'BANK_TRANSFER' };

    const handleCollect = async (id: string, amount: number, paymentMethod: string) => {
        try {
            await axios.post(`/api/v1/finance-v2/invoices/${id}/pay`, {
                amount, method: PAYMENT_METHOD_MAP[paymentMethod] || 'CASH'
            }, { withCredentials: true });
            toast.success('Payment collected successfully.');
            setStudents(prev => prev.map(s => {
                if (s.id !== id) return s;
                const newPaid = s.amountPaid + amount;
                const newStatus: PaymentStatus = newPaid >= s.totalFee ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
                return { ...s, amountPaid: newPaid, status: newStatus, lastPayment: new Date().toISOString().split('T')[0] };
            }));
            setCollecting(null);
            fetchFees(); // refresh from server so balances/status reflect the real invoice state
        } catch (e: any) {
            console.error(e);
            toast.error(e.response?.data?.msg || 'Error collecting fee.');
        }
    };

    const handleBulkSendReminder = async () => {
        if (!customMessageBody.trim()) return toast.error('Message body is required');
        if (selectedStudentRows.length === 0) return toast.error('No students selected');
        setIsBulkSending(true);
        try {
            const res = await axios.post('/api/v1/finance-v2/reminders/bulk', {
                studentIds: selectedStudentRows,
                channel: customMessageChannel,
                subject: customMessageSubject,
                body: customMessageBody
            }, { withCredentials: true });
            toast.success(res.data.message || 'Reminders sent');
            setIsMessageModalOpen(false);
            setCustomMessageBody('');
            setCustomMessageSubject('');
            setSelectedStudentRows([]);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send reminders');
        } finally {
            setIsBulkSending(false);
        }
    };

    const handleGenerateInvoices = async (data: any) => {
        try {
            const res = await axios.post('/api/v1/fee/assign', data, { withCredentials: true });
            toast.success(`${res.data.msg} — ${res.data.stats.invoicesCreated} invoices for ${res.data.stats.studentsTargeted} students.`);
            fetchFees(); setShowGenerate(false);
        } catch (e: any) { toast.error(e.response?.data?.msg || 'Failed to assign fee structures'); }
    };

    const handleDeleteFee = async (id: string, label: string) => {
        if (!confirm(`Delete "${label}"?`)) return;
        try {
            await axios.delete(`/api/v1/fee-particulars/${id}`, { withCredentials: true });
            toast.success(`"${label}" deleted`);
            setFeeParticulars(p => p.filter(f => f.id !== id));
        } catch (e: any) { toast.error(e.response?.data?.msg || 'Failed to delete'); }
    };

    if (loading) return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">Loading fees…</span>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .fees-root .font-mono    { font-family: 'DM Mono', monospace !important; }
                @keyframes fees-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes fees-pulse { 0%{transform:scale(0.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }
                .fees-float { animation: fees-float 3.5s ease-in-out infinite; }
                .fees-pulse { animation: fees-pulse 2.4s ease-out infinite; }
            `}</style>

            <div className="fees-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8 print:bg-white print:p-0">

                <div className="relative z-10 mx-auto max-w-6xl">
                    {/* Breadcrumb */}
                    <div className={cn('mb-6 flex items-center gap-1.5 transition-all duration-500 print:hidden', pageVisible ? 'opacity-100' : '-translate-y-2 opacity-0')}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">All Student Payments</span>
                    </div>

                    {/* Main panel */}
                    <div className={cn('overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-500',
                        pageVisible ? 'opacity-100' : 'translate-y-3 opacity-0')}>
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6 print:hidden">
                            <div className="inline-flex items-center gap-2 border-b-2 border-[#1E4DA6] pb-3 pt-3.5">
                                <DollarSign className="h-3.5 w-3.5 text-[#1E4DA6]" />
                                <span className="text-xs font-bold tracking-tight text-[#1E4DA6]">Fee Collection</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">
                            {/* Hero + actions */}
                            <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="fees-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="fees-pulse absolute inset-0 rounded-2xl bg-[#1E4DA6]/8" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] shadow-lg shadow-[#1E4DA6]/20">
                                        <DollarSign className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                        All Student Payments
                                        {isFetching && <Loader2 className="h-5 w-5 animate-spin text-[#1E4DA6]" />}
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">Collect payments, generate invoices, send reminders and track outstanding balances.</p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:self-start print:hidden">
                                    <Button variant="outline" onClick={() => setShowGenerate(true)}
                                        className="h-9 gap-1.5 rounded-xl border-[#1E4DA6]/20 text-xs font-bold text-[#173F8C] hover:bg-[#1E4DA6]/5">
                                        <Play className="h-3.5 w-3.5" /> Assign Fees
                                    </Button>
                                    <Button variant="outline" onClick={() => window.print()}
                                        className="h-9 gap-1.5 rounded-xl text-xs font-semibold text-slate-600">
                                        <Printer className="h-3.5 w-3.5" /> Print
                                    </Button>
                                </div>
                            </div>

                            {/* Filters — not part of the printed record */}
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search students…"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 font-mono text-xs font-semibold text-slate-700 shadow-sm placeholder:font-normal placeholder:text-slate-400 focus:border-[#1E4DA6]/60 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                        {(['all', 'paid', 'partial', 'unpaid'] as const).map(s => (
                                            <button key={s} onClick={() => setFilterStatus(s)}
                                                className={cn('rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide capitalize transition-all',
                                                    filterStatus === s ? 'bg-white text-[#173F8C] shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600')}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                                        className={cn("h-9 gap-2 rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all", showFilters ? 'bg-slate-100 text-[#173F8C] border-[#1E4DA6]/20' : 'bg-white text-slate-700')}>
                                        <Filter className="h-4 w-4" /> Filters
                                        {(filterClass !== 'all' || filterTerm !== '' || filterYear !== '' || filterDispatched !== 'all') && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E4DA6] font-mono text-[10px] font-bold text-white shadow-sm">
                                                {[filterClass !== 'all', filterTerm !== '', filterYear !== '', filterDispatched !== 'all'].filter(Boolean).length}
                                            </span>
                                        )}
                                    </Button>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                        className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        title="Rows per page"
                                    >
                                        {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n} / page</option>)}
                                    </select>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 print:hidden"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Class</Label>
                                                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-sm focus:border-[#1E4DA6]/60 focus:outline-none">
                                                    {classes.map(c => <option key={c} value={c}>{c === 'all' ? 'All Classes' : c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Academic Year</Label>
                                                <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterTerm(''); }}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-sm focus:border-[#1E4DA6]/60 focus:outline-none">
                                                    <option value="">All Years</option>
                                                    {sessionsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Term</Label>
                                                <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} disabled={!filterYear}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-sm focus:border-[#1E4DA6]/60 focus:outline-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed">
                                                    <option value="">{filterYear ? 'All Terms' : 'Select a Year First'}</option>
                                                    {availableTerms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Dispatch Status</Label>
                                                <select value={filterDispatched} onChange={e => setFilterDispatched(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-sm focus:border-[#1E4DA6]/60 focus:outline-none">
                                                    <option value="all">All Documents</option>
                                                    <option value="unsent">Unsent</option>
                                                    <option value="unprinted">Unprinted</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bulk actions bar */}
                            {selectedStudentRows.length > 0 && (
                                <div className="mb-3 flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2.5 print:hidden">
                                    <span className="font-mono text-xs font-bold text-indigo-700">{selectedStudentRows.length} student{selectedStudentRows.length > 1 ? 's' : ''} selected</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedStudentRows([])} className="h-8 flex-1 rounded-lg text-xs text-slate-500 sm:h-7 sm:flex-none">Deselect</Button>
                                        <Button size="sm" onClick={() => setIsMessageModalOpen(true)} className="h-8 flex-1 gap-1.5 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 sm:h-7 sm:flex-none">
                                            <Send className="h-3 w-3" /> Send Reminder
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Student table */}
                            <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                {displayed.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                                            <Users className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">No students match your filters</p>
                                    </div>
                                ) : (
                                    <>
                                    {/* Mobile: card grid (table below is desktop-only, too many columns for a small screen) */}
                                    <div className="sm:hidden print:hidden">
                                        <button
                                            onClick={() => setSelectedStudentRows(
                                                selectedStudentRows.length === displayed.length ? [] : displayed.map(s => s.id)
                                            )}
                                            className="flex w-full items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400"
                                        >
                                            {selectedStudentRows.length === displayed.length && displayed.length > 0
                                                ? <CheckSquare className="h-3.5 w-3.5 text-[#1E4DA6]" />
                                                : <Square className="h-3.5 w-3.5 text-slate-400" />}
                                            Select All
                                        </button>
                                        <div className="divide-y divide-slate-100">
                                        {paginated.map((s, idx) => {
                                            const cfg = STATUS_CFG[s.status];
                                            const balance = s.totalFee - s.amountPaid;
                                            return (
                                                <motion.div
                                                    key={s.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    className={cn('p-4', selectedStudentRows.includes(s.id) && 'bg-indigo-50/50')}
                                                >
                                                    {/* Identity row: checkbox + avatar left, status badge right */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => setSelectedStudentRows(prev =>
                                                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                            )} className="shrink-0">
                                                                {selectedStudentRows.includes(s.id)
                                                                    ? <CheckSquare className="h-4 w-4 text-[#1E4DA6]" />
                                                                    : <Square className="h-4 w-4 text-slate-300" />}
                                                            </button>
                                                            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm', s.avatarColor || avatarColor(s.name))}>
                                                                {s.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider', cfg.bgColor, cfg.textColor)}>
                                                            {cfg.icon} {cfg.label}
                                                        </span>
                                                    </div>

                                                    {/* Name + admission/class — full card width, stacked below the identity row */}
                                                    <div className="mt-3">
                                                        <p className="font-semibold text-slate-900 text-base">{s.name}</p>
                                                        <p className="mt-0.5 font-mono text-xs text-slate-400">{s.admNo} · {s.classLevel}</p>
                                                    </div>

                                                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5">
                                                        <div>
                                                            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                                                            <p className="mt-0.5 font-mono text-xs font-bold text-slate-900">{fmt(s.totalFee)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Paid</p>
                                                            <p className="mt-0.5 font-mono text-xs font-bold text-emerald-600">{fmt(s.amountPaid)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Balance</p>
                                                            <p className="mt-0.5 font-mono text-xs font-bold text-red-600">{fmt(balance)}</p>
                                                        </div>
                                                    </div>

                                                    {(s.isDisputed || s.isSent || s.isPrinted) && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {s.isDisputed && (
                                                                <span title={s.disputeReason || 'Disputed by parent'} className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                                                                    <Bell className="h-2.5 w-2.5" /> DISPUTED
                                                                </span>
                                                            )}
                                                            {s.isSent && <span className="inline-flex items-center rounded-full bg-[#1E4DA6]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#173F8C]">SENT</span>}
                                                            {s.isPrinted && <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">PRINTED</span>}
                                                        </div>
                                                    )}

                                                    {s.status !== 'paid' && (
                                                        <Button size="sm" onClick={() => setCollecting(s)}
                                                            className="mt-3 h-8 w-full gap-1.5 rounded-xl bg-[#1E4DA6] text-xs font-bold text-white shadow-sm shadow-[#1E4DA6]/20 hover:bg-[#173F8C]">
                                                            <Plus className="h-3 w-3" /> Collect
                                                        </Button>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                        </div>
                                    </div>

                                    {/* Desktop: paginated table (screen only — print uses the unpaginated table below) */}
                                    <div className="hidden overflow-x-auto sm:block print:hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                                    <th className="px-4 py-3.5 text-center">
                                                        <button onClick={() => setSelectedStudentRows(
                                                            selectedStudentRows.length === displayed.length ? [] : displayed.map(s => s.id)
                                                        )}>
                                                            {selectedStudentRows.length === displayed.length && displayed.length > 0
                                                                ? <CheckSquare className="h-4 w-4 text-[#1E4DA6] mx-auto" />
                                                                : <Square className="h-4 w-4 text-slate-400 mx-auto" />}
                                                        </button>
                                                    </th>
                                                    <th className="px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                                                    <th className="px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</th>
                                                    <th className="px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Paid</th>
                                                    <th className="px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Balance</th>
                                                    <th className="px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                                    <th className="px-5 py-3.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {paginated.map((s, idx) => {
                                                    const cfg = STATUS_CFG[s.status];
                                                    const balance = s.totalFee - s.amountPaid;
                                                    return (
                                                        <motion.tr
                                                            key={s.id}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.02 }}
                                                            className={cn('transition-colors hover:bg-slate-50/80', selectedStudentRows.includes(s.id) && 'bg-indigo-50/50')}
                                                        >
                                                            {/* Checkbox */}
                                                            <td className="px-4 py-4 text-center print:hidden">
                                                                <button onClick={() => setSelectedStudentRows(prev =>
                                                                    prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                                )}>
                                                                    {selectedStudentRows.includes(s.id)
                                                                        ? <CheckSquare className="h-4 w-4 text-[#1E4DA6] mx-auto" />
                                                                        : <Square className="h-4 w-4 text-slate-300 mx-auto" />}
                                                                </button>
                                                            </td>
                                                            {/* Student info */}
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm', s.avatarColor || avatarColor(s.name))}>
                                                                        {s.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                                                                        <p className="font-mono text-[11px] text-slate-400">{s.admNo} · {s.classLevel}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 font-mono text-sm font-bold text-slate-900">{fmt(s.totalFee)}</td>
                                                            <td className="px-5 py-4 font-mono text-sm font-bold text-emerald-600">{fmt(s.amountPaid)}</td>
                                                            <td className="px-5 py-4 font-mono text-sm font-bold text-red-600">{fmt(balance)}</td>
                                                            {/* Status + badges */}
                                                            <td className="px-5 py-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider', cfg.bgColor, cfg.textColor)}>
                                                                        {cfg.icon} {cfg.label}
                                                                    </span>
                                                                    {s.isDisputed && (
                                                                        <span title={s.disputeReason || 'Disputed by parent'} className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                                                                            <Bell className="h-2.5 w-2.5" /> DISPUTED
                                                                        </span>
                                                                    )}
                                                                    {s.isSent && <span className="inline-flex w-fit items-center rounded-full bg-[#1E4DA6]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#173F8C]">SENT</span>}
                                                                    {s.isPrinted && <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">PRINTED</span>}
                                                                </div>
                                                            </td>
                                                            {/* Action */}
                                                            <td className="px-5 py-4 print:hidden">
                                                                {s.status !== 'paid' && (
                                                                    <Button size="sm" onClick={() => setCollecting(s)}
                                                                        className="h-8 gap-1.5 rounded-xl bg-[#1E4DA6] text-xs font-bold text-white shadow-sm shadow-[#1E4DA6]/20 hover:bg-[#173F8C]">
                                                                        <Plus className="h-3 w-3" /> Collect
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="print:hidden">
                                        <Pagination currentPage={page} totalPages={totalPages} totalRecords={displayed.length} onPageChange={setPage} />
                                    </div>

                                    {/* Print-only: the FULL filtered list, not just the current page */}
                                    <div className="hidden print:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="px-5 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
                                                    <th className="px-5 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</th>
                                                    <th className="px-5 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Paid</th>
                                                    <th className="px-5 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Balance</th>
                                                    <th className="px-5 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {displayed.map(s => {
                                                    const cfg = STATUS_CFG[s.status];
                                                    const balance = s.totalFee - s.amountPaid;
                                                    return (
                                                        <tr key={s.id}>
                                                            <td className="px-5 py-2.5">
                                                                <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                                                                <p className="font-mono text-[11px] text-slate-400">{s.admNo} · {s.classLevel}</p>
                                                            </td>
                                                            <td className="px-5 py-2.5 font-mono text-sm font-bold text-slate-900">{fmt(s.totalFee)}</td>
                                                            <td className="px-5 py-2.5 font-mono text-sm font-bold text-emerald-600">{fmt(s.amountPaid)}</td>
                                                            <td className="px-5 py-2.5 font-mono text-sm font-bold text-red-600">{fmt(balance)}</td>
                                                            <td className="px-5 py-2.5 font-mono text-xs font-bold uppercase">{cfg.label}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {collecting && <CollectModal student={collecting} onClose={() => setCollecting(null)} onSave={handleCollect} />}
                {showGenerate && (
                    <GenerateModal 
                        onClose={() => setShowGenerate(false)} 
                        onSave={handleGenerateInvoices} 
                        termsList={termsList}
                        sessionsList={sessionsList}
                    />
                )}
                {isMessageModalOpen && (
                    <Modal onClose={() => setIsMessageModalOpen(false)}>
                        <ModalHeader title="Send Reminder" subtitle={`Send a custom reminder to ${selectedStudentRows.length} selected student(s).`} onClose={() => setIsMessageModalOpen(false)} />
                        <div className="space-y-4 overflow-y-auto p-5">
                            <div className="rounded-xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/5 px-4 py-3 text-xs text-[#173F8C]">
                                <strong>Tip:</strong> Use <code className="bg-[#1E4DA6]/10 px-1 rounded font-mono">{'{PAYMENT_LINK}'}</code> in your message body to auto-insert a payment link for each student's invoice.
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Channel</Label>
                                <select className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1E4DA6] focus:outline-none"
                                    value={customMessageChannel} onChange={e => setCustomMessageChannel(e.target.value)}>
                                    <option value="sms">SMS</option>
                                    <option value="whatsapp">WhatsApp</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject</Label>
                                <Input value={customMessageSubject} onChange={e => setCustomMessageSubject(e.target.value)} className="h-10 rounded-xl" placeholder="e.g. Fee Payment Reminder" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message</Label>
                                <textarea value={customMessageBody} onChange={e => setCustomMessageBody(e.target.value)}
                                    className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1E4DA6] focus:outline-none"
                                    placeholder="Dear Parent, this is a reminder to pay fees. Click here: {PAYMENT_LINK}" />
                            </div>
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                            <Button variant="outline" disabled={isBulkSending} onClick={() => setIsMessageModalOpen(false)} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                            <Button onClick={handleBulkSendReminder} disabled={isBulkSending} className="flex-1 gap-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700">
                                {isBulkSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                {isBulkSending ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
}
