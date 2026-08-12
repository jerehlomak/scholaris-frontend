/**
 * Fees.tsx — Admin Fee Collection & Invoice Management
 * Redesigned: Tailwind CSS + shadcn/ui, animated, fully mobile responsive
 * All API calls, state logic, and business logic unchanged.
 */
import { useState, useEffect } from 'react';
import {
    DollarSign, Plus, Printer, Search, CheckCircle2, Clock, AlertCircle,
    FileText, Users, TrendingUp, Filter, ChevronDown, Loader2, Play, Trash2, ChevronRight
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

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

interface StudentFee {
    id: string; studentId: string; admNo: string; name: string; classLevel: string;
    totalFee: number; amountPaid: number; status: PaymentStatus;
    lastPayment: string | null; avatar?: string; avatarColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PaymentStatus, { label: string; textColor: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    paid: { label: 'Paid', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    partial: { label: 'Partial', textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100', icon: <Clock className="h-3.5 w-3.5" /> },
    unpaid: { label: 'Unpaid', textColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-100', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG'); }

const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400';

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : 'bg-blue-500')}
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
                {/* Student pill */}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm', student.avatarColor || avatarColor(student.name))}>
                        {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{student.admNo} · {student.classLevel}</p>
                    </div>
                </div>

                {/* Fee breakdown */}
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
                        {['Cash', 'Flutterwave', 'Remita', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                <Button onClick={handleSave} disabled={amount <= 0 || processing}
                    className="flex-1 gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800 disabled:opacity-50">
                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {processing ? 'Processing…' : `Collect ${fmt(amount)}`}
                </Button>
            </div>
        </Modal>
    );
}

type TargetMode = 'all' | 'class_level' | 'class_arm' | 'student' | 'new_students';

function GenerateModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => Promise<void> }) {
    const [feeParticulars, setFeeParticulars] = useState<any[]>([]);
    const [classArms, setClassArms] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [selectedFees, setSelectedFees] = useState<string[]>([]);
    const [term, setTerm] = useState('First Term');
    const [year, setYear] = useState(new Date().getFullYear() + '/' + (new Date().getFullYear() + 1));
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
                {/* Term / Year */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Term <span className="text-rose-500">*</span></Label>
                        <select value={term} onChange={e => setTerm(e.target.value)} className={fieldCls}>
                            {['First Term', 'Second Term', 'Third Term'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Year <span className="text-rose-500">*</span></Label>
                        <select value={year} onChange={e => setYear(e.target.value)} className={fieldCls}>
                            {['2023/2024', '2024/2025', '2025/2026', '2026/2027'].map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Target mode */}
                <div>
                    <Label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Assignment Target <span className="text-rose-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {TARGET_MODES.map(m => (
                            <button key={m.value} onClick={() => setTargetMode(m.value)}
                                className={cn(
                                    'rounded-xl border-2 p-3 text-left transition-all',
                                    targetMode === m.value
                                        ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                                        : 'border-slate-100 hover:border-slate-200'
                                )}>
                                <p className={cn('text-xs font-bold', targetMode === m.value ? 'text-blue-700' : 'text-slate-800')}>{m.label}</p>
                                <p className="mt-0.5 font-mono text-[10px] leading-tight text-slate-400">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conditional sub-filters */}
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
                    <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                        <span className="shrink-0">ℹ️</span>
                        Fees will be assigned to all students whose enrollment date is within the last 30 days.
                    </div>
                )}

                {/* Fee items */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Fee Items to Assign <span className="text-rose-500">*</span></Label>
                        <button onClick={() => setSelectedFees(feeParticulars.map(f => f.id))} className="font-mono text-[10px] font-bold text-blue-600 hover:underline">Select All</button>
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
                                    selectedFees.includes(fee.id) ? 'border-blue-400 bg-blue-50/60' : 'border-slate-100 hover:border-slate-200'
                                )}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={selectedFees.includes(fee.id)} onChange={() => toggleFee(fee.id)} className="h-4 w-4 accent-blue-600" />
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
                        <div className="mt-2 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
                            <span className="font-mono text-xs text-slate-500">{selectedFees.length} item{selectedFees.length > 1 ? 's' : ''} selected</span>
                            <span className="font-mono text-sm font-black text-blue-700">{fmt(totalSelected)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl text-xs font-semibold">Cancel</Button>
                <Button onClick={handleSaveWrapper} disabled={processing}
                    className="flex-1 gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800 disabled:opacity-50">
                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {processing ? 'Assigning…' : 'Assign Fees'}
                </Button>
            </div>
        </Modal>
    );
}

// ─── KPI Card component ──────────────────────────────────────────────────────
interface KPICardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    iconBg: string;
    iconText: string;
    delay: number;
}

function KPICard({ icon, label, value, sub, iconBg, iconText, delay }: KPICardProps) {
    const [vis, setVis] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVis(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div className={cn(
            'rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-0.5',
            vis ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        )}>
            <div className="mb-2 flex items-center gap-2">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg, iconText)}>{icon}</div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            </div>
            <p className="font-mono text-xl font-black text-slate-900">{value}</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{sub}</p>
        </div>
    );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function SchoolFees() {
    const [students, setStudents] = useState<StudentFee[]>([]);
    const [feeParticulars, setFeeParticulars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
    const [filterClass, setFilterClass] = useState('all');
    const [collecting, setCollecting] = useState<StudentFee | null>(null);
    const [activeTab, setActiveTab] = useState<'payments' | 'schedule'>('payments');
    const [showFilters, setShowFilters] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => { const t = setTimeout(() => setPageVisible(true), 60); return () => clearTimeout(t); }, []);

    const fetchFees = async () => {
        try {
            const [feesRes, particularsRes] = await Promise.all([
                axios.get('/api/v1/finance-v2/invoices?limit=2000', { withCredentials: true }),
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
                    classLevel: 'Student', 
                    totalFee: inv.totalAmount,
                    amountPaid,
                    isSent: inv.isSent,
                    status: inv.status === 'PAID' ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
                    lastPayment: null
                };
            });
            setStudents(mapped);
            setFeeParticulars(particularsRes.data.fees || []);
        } catch { toast.error('Failed to load fee information'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFees(); }, []);

    const totalBilled = students.reduce((s, f) => s + f.totalFee, 0);
    const totalCollected = students.reduce((s, f) => s + f.amountPaid, 0);
    const outstanding = totalBilled - totalCollected;
    const overdueCount = students.filter(f => f.status === 'unpaid').length;
    const collectionPct = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    const classes = ['all', ...Array.from(new Set(students.map(s => s.classLevel)))];
    const displayed = students.filter(s =>
        (filterStatus === 'all' || s.status === filterStatus) &&
        (filterClass === 'all' || s.classLevel === filterClass) &&
        (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admNo.toLowerCase().includes(search.toLowerCase()))
    );

    // ── Handlers (unchanged) ──────────────────────────────────────────────────
    const handleCollect = async (id: string, amount: number, paymentMethod: string) => {
        try {
            const res = await axios.post('/api/v1/finance/fees', { invoiceId: id, amount, paymentMethod }, { withCredentials: true });
            if (res.data.gatewayData?.paymentLink && paymentMethod === 'Flutterwave') alert(`Redirecting to Flutterwave:\n${res.data.gatewayData.paymentLink}`);
            else if (res.data.gatewayData?.rrr && paymentMethod === 'Remita') alert(`RRR for Bank:\n${res.data.gatewayData.rrr}`);
            else alert('Payment collected successfully.');
            setStudents(prev => prev.map(s => {
                if (s.id !== id) return s;
                const newPaid = s.amountPaid + amount;
                const newStatus: PaymentStatus = newPaid >= s.totalFee ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
                return { ...s, amountPaid: newPaid, status: newStatus, lastPayment: new Date().toISOString().split('T')[0] };
            }));
            setCollecting(null);
        } catch (e) { console.error(e); alert('Error collecting fee. See console.'); }
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">Loading fees…</span>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .fees-root, .fees-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .fees-root .font-mono    { font-family: 'DM Mono', monospace !important; }
                @keyframes fees-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
                @keyframes fees-pulse { 0%{transform:scale(0.9);opacity:.4} 100%{transform:scale(1.5);opacity:0} }
                .fees-float { animation: fees-float 3.5s ease-in-out infinite; }
                .fees-pulse { animation: fees-pulse 2.4s ease-out infinite; }
            `}</style>

            <div className="fees-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.25]"
                    style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-6 flex items-center gap-1.5 transition-all duration-500', pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">School Fees</span>
                    </div>

                    {/* Main panel */}
                    <div className={cn(
                        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl shadow-blue-900/5 backdrop-blur-xl transition-all duration-500',
                        pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                    )}>
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6">
                            <div className="inline-flex items-center gap-2 border-b-2 border-blue-600 pb-3 pt-3.5">
                                <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-bold tracking-tight text-blue-600">Fee Collection</span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* Hero + actions */}
                            <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                                <div className="fees-float relative mb-5 h-16 w-16 shrink-0 sm:mb-0">
                                    <div className="fees-pulse absolute inset-0 rounded-2xl bg-blue-400/25" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg shadow-blue-200">
                                        <DollarSign className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">School Fees</h2>
                                    <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">Collect payments, generate invoices, and track outstanding balances.</p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:self-start">
                                    <Button variant="outline" onClick={() => setShowGenerate(true)}
                                        className="h-9 gap-1.5 rounded-xl border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50">
                                        <Play className="h-3.5 w-3.5" /> Assign Fees
                                    </Button>
                                    <Button variant="outline" onClick={() => window.print()}
                                        className="h-9 gap-1.5 rounded-xl text-xs font-semibold text-slate-600">
                                        <Printer className="h-3.5 w-3.5" /> Print
                                    </Button>
                                    <Button className="h-9 gap-1.5 rounded-xl bg-blue-700 px-4 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800">
                                        <Plus className="h-3.5 w-3.5" /> Collect Fee
                                    </Button>
                                </div>
                            </div>

                            {/* KPI cards */}
                            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { icon: <DollarSign className="h-5 w-5" />, label: 'Total Billed', value: fmt(totalBilled), sub: 'This term', iconBg: 'bg-blue-50', iconText: 'text-blue-600', delay: 80 },
                                    { icon: <TrendingUp className="h-5 w-5" />, label: 'Collected', value: fmt(totalCollected), sub: `${collectionPct}% rate`, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', delay: 140 },
                                    { icon: <AlertCircle className="h-5 w-5" />, label: 'Outstanding', value: fmt(outstanding), sub: 'Pending', iconBg: 'bg-amber-50', iconText: 'text-amber-600', delay: 200 },
                                    { icon: <Users className="h-5 w-5" />, label: 'Unpaid Students', value: String(overdueCount), sub: 'Require follow-up', iconBg: 'bg-red-50', iconText: 'text-red-600', delay: 260 },
                                ].map((card) => (
                                    <KPICard key={card.label} {...card} />
                                ))}
                            </div>


                            {/* Collection progress */}
                            <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-sm">Collection Progress</span>
                                    <span className="font-mono text-sm font-black text-blue-600">{collectionPct}%</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${collectionPct}%` }}
                                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                                    />
                                </div>
                                <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-400">
                                    <span>{fmt(totalCollected)} collected</span>
                                    <span>{fmt(outstanding)} remaining</span>
                                </div>
                            </div>

                                                    </div>
                    </div>
                </div>
            </div>
        </>
    );
}
