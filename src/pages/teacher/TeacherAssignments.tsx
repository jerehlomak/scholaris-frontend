/**
 * TeacherAssignments.tsx — Assignment creation & management for teachers
 * Redesigned with shadcn UI. All business logic, state, and mock data
 * are preserved exactly. Modals migrated to shadcn Dialog.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, FileText, CheckCircle2,
    XCircle, Edit3, Users, Calendar, BookOpen, Send, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import { Pagination } from '../../components/shared/Pagination';

// ─── All types and mock data kept exactly as-is ──────────────────────────────
type AssignmentStatus = 'draft' | 'active' | 'overdue' | 'graded';

interface Submission {
    studentId: string; studentName: string; avatar: string; avatarColor: string;
    submittedAt: string | null; grade: number | null; feedback: string;
}
interface Assignment {
    id: string; title: string; classLevel: string; subject: string;
    dueDate: string; maxMarks: number; instructions: string;
    status: AssignmentStatus; submissions: Submission[]; createdAt: string;
}

const INITIAL_ASSIGNMENTS: Assignment[] = [
    {
        id: 'a1', title: 'Algebra Worksheet — Chapter 5', classLevel: 'SS 1A', subject: 'Mathematics',
        dueDate: '2025-03-05', maxMarks: 50, status: 'active', createdAt: '2025-02-28',
        instructions: 'Solve all problems in Chapter 5 exercises. Show all workings clearly.',
        submissions: [
            { studentId: 's1', studentName: 'Ayomide Balogun', avatar: 'AB', avatarColor: 'bg-[#1E4DA6]', submittedAt: '2025-03-03 09:30', grade: null, feedback: '' },
            { studentId: 's2', studentName: 'Chinoso Obi', avatar: 'CO', avatarColor: 'bg-orange-500', submittedAt: null, grade: null, feedback: '' },
            { studentId: 's3', studentName: 'Fatima Musa', avatar: 'FM', avatarColor: 'bg-pink-500', submittedAt: '2025-03-02 14:15', grade: 44, feedback: 'Excellent work!' },
            { studentId: 's4', studentName: 'Emmanuel Adeyemi', avatar: 'EA', avatarColor: 'bg-teal-500', submittedAt: null, grade: null, feedback: '' },
        ],
    },
    {
        id: 'a2', title: "Essay: My Role Model", classLevel: 'SS 2B', subject: 'English Language',
        dueDate: '2025-02-25', maxMarks: 30, status: 'graded', createdAt: '2025-02-18',
        instructions: 'Write a 500-word essay on your role model.',
        submissions: [
            { studentId: 's9', studentName: 'Ngozi Ibe', avatar: 'NI', avatarColor: 'bg-yellow-600', submittedAt: '2025-02-24 08:45', grade: 27, feedback: 'Very well written!' },
            { studentId: 's10', studentName: 'Tunde Afolabi', avatar: 'TA', avatarColor: 'bg-cyan-600', submittedAt: '2025-02-25 09:55', grade: 22, feedback: 'Good but needs more depth.' },
        ],
    },
    {
        id: 'a3', title: "Lab Report — Newton's 2nd Law", classLevel: 'JSS 3C', subject: 'Physics',
        dueDate: '2025-02-20', maxMarks: 40, status: 'overdue', createdAt: '2025-02-10',
        instructions: 'Write a complete lab report including hypothesis, procedure, results, and conclusion.',
        submissions: [
            { studentId: 's14', studentName: 'Chidi Okonkwo', avatar: 'CO', avatarColor: 'bg-amber-600', submittedAt: '2025-02-19 17:30', grade: null, feedback: '' },
        ],
    },
];

const CLASS_OPTIONS = ['SS 1A', 'SS 2B', 'JSS 3C'];
const SUBJECT_OPTIONS = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology'];

const STATUS_CFG: Record<AssignmentStatus, { label: string; color: string; bg: string; border: string }> = {
    draft: { label: 'Draft', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
    active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    graded: { label: 'Graded', color: 'text-[#173F8C]', bg: 'bg-[#1E4DA6]/5', border: 'border-[#1E4DA6]/20' },
};

interface NewForm { title: string; classLevel: string; subject: string; dueDate: string; maxMarks: number; instructions: string; }
const BLANK: NewForm = { title: '', classLevel: 'SS 1A', subject: 'Mathematics', dueDate: '', maxMarks: 50, instructions: '' };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeacherAssignments() {
    // All state kept exactly as-is
    const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
    const [selected, setSelected] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<NewForm>(BLANK);
    const [grading, setGrading] = useState<{ assnId: string; studentId: string; grade: string; feedback: string } | null>(null);
    const [filter, setFilter] = useState<AssignmentStatus | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const selectedAssn = assignments.find(a => a.id === selected);
    const displayed = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);

    // All handlers kept exactly as-is
    const handleCreate = () => {
        if (!form.title || !form.dueDate) return;
        setAssignments(p => [{
            id: `a${Date.now()}`, ...form, status: 'active',
            createdAt: new Date().toISOString().split('T')[0], submissions: [],
        }, ...p]);
        setShowCreate(false); setForm(BLANK);
    };

    const handleGrade = () => {
        if (!grading) return;
        setAssignments(prev => prev.map(a =>
            a.id === grading.assnId
                ? {
                    ...a, submissions: a.submissions.map(s => s.studentId === grading.studentId
                        ? { ...s, grade: Number(grading.grade), feedback: grading.feedback } : s)
                }
                : a
        ));
        setGrading(null);
    };

    return (
        <div className="max-w-[1200px] mx-auto w-full pb-10">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Create and manage student assignments</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white gap-1.5">
                    <Plus size={16} /> New Assignment
                </Button>
            </div>

            {/* ── Filter Cards (KPI) ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(['all', 'active', 'overdue', 'graded'] as const).map(s => {
                    const count = s === 'all' ? assignments.length : assignments.filter(a => a.status === s).length;
                    const icons: Record<string, React.ReactNode> = {
                        all: <FileText size={18} />,
                        active: <CheckCircle2 size={18} />,
                        overdue: <XCircle size={18} />,
                        graded: <Edit3 size={18} />,
                    };
                    const styles: Record<string, string> = {
                        all: 'bg-[#1E4DA6]/5 text-[#1E4DA6]',
                        active: 'bg-emerald-50 text-emerald-600',
                        overdue: 'bg-red-50 text-red-600',
                        graded: 'bg-violet-50 text-violet-600',
                    };
                    const isActive = filter === s;
                    return (
                        <button
                            key={s}
                            onClick={() => { setFilter(s); setCurrentPage(1); }}
                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all shadow-sm bg-white ${isActive ? 'border-[#1E4DA6]/60 ring-2 ring-[#1E4DA6]/10' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles[s]}`}>
                                {icons[s]}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 capitalize">{s === 'all' ? 'All' : STATUS_CFG[s].label}</p>
                                <p className="text-xl font-bold text-slate-900">{count}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Split View ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Assignment List */}
                <div className="lg:col-span-2 space-y-2.5">
                    {displayed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(a => {
                        const cfg = STATUS_CFG[a.status];
                        const submitted = a.submissions.filter(s => s.submittedAt).length;
                        return (
                            <Card
                                key={a.id}
                                onClick={() => setSelected(a.id)}
                                className={`p-4 cursor-pointer border transition-all hover:shadow-md ${selected === a.id ? 'border-[#1E4DA6]/60 ring-2 ring-[#1E4DA6]/5 bg-[#1E4DA6]/8' : 'border-slate-200 bg-white hover:border-[#1E4DA6]/35'}`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{a.title}</h4>
                                    <Badge className={`text-[10px] font-bold shrink-0 ${cfg.bg} ${cfg.color} border ${cfg.border} hover:${cfg.bg}`}>
                                        {cfg.label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2.5">
                                    <span className="flex items-center gap-1"><BookOpen size={11} />{a.subject}</span>
                                    <span className="flex items-center gap-1"><Users size={11} />{a.classLevel}</span>
                                    <span className="flex items-center gap-1"><Calendar size={11} />Due {a.dueDate}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-[#1E4DA6] h-full rounded-full"
                                            style={{ width: a.submissions.length ? `${(submitted / a.submissions.length) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <span>{submitted}/{a.submissions.length} submitted</span>
                                </div>
                            </Card>
                        );
                    })}

                    {displayed.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(displayed.length / PAGE_SIZE)}
                                totalRecords={displayed.length}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-3">
                    {!selectedAssn ? (
                        <Card className="min-h-[400px] flex items-center justify-center text-center border border-dashed border-slate-300 bg-white">
                            <div>
                                <Eye className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                <p className="text-slate-400 text-sm font-medium">Select an assignment to view details</p>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="p-5 pb-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedAssn.title}</h3>
                                    <Badge className={`text-[10px] font-bold shrink-0 ${STATUS_CFG[selectedAssn.status].bg} ${STATUS_CFG[selectedAssn.status].color} border ${STATUS_CFG[selectedAssn.status].border} hover:${STATUS_CFG[selectedAssn.status].bg}`}>
                                        {STATUS_CFG[selectedAssn.status].label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                                    <span className="flex items-center gap-1"><BookOpen size={11} />{selectedAssn.subject} · {selectedAssn.classLevel}</span>
                                    <span className="flex items-center gap-1"><Calendar size={11} />Due: {selectedAssn.dueDate}</span>
                                    <span className="flex items-center gap-1"><FileText size={11} />Max: {selectedAssn.maxMarks} marks</span>
                                </div>
                                {selectedAssn.instructions && (
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">{selectedAssn.instructions}</p>
                                )}
                            </CardHeader>
                            <Separator />
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            {['Student', 'Status', 'Submitted', 'Grade', 'Action'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedAssn.submissions.map(sub => (
                                            <tr key={sub.studentId} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 ${sub.avatarColor} rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                                            {sub.avatar}
                                                        </div>
                                                        <span className="font-semibold text-slate-800">{sub.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {sub.submittedAt
                                                        ? <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px]">Submitted</Badge>
                                                        : <Badge className="bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100 text-[10px]">Pending</Badge>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{sub.submittedAt ?? '—'}</td>
                                                <td className="px-4 py-3 font-bold text-[#1E4DA6]">
                                                    {sub.grade !== null ? `${sub.grade}/${selectedAssn.maxMarks}` : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {sub.submittedAt && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setGrading({ assnId: selectedAssn.id, studentId: sub.studentId, grade: String(sub.grade ?? ''), feedback: sub.feedback })}
                                                            className="h-7 text-xs border-slate-300 hover:border-[#1E4DA6]/60 hover:text-[#1E4DA6]"
                                                        >
                                                            {sub.grade !== null ? 'Edit' : 'Grade'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedAssn.submissions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No submissions yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* ── Create Assignment Dialog (shadcn Dialog) ── */}
            <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setForm(BLANK); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">New Assignment</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</Label>
                            <Input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Assignment title"
                                className="border-slate-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class</Label>
                                <Select value={form.classLevel} onValueChange={v => setForm(f => ({ ...f, classLevel: v }))}>
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subject</Label>
                                <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBJECT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date *</Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                    className="border-slate-200"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Marks</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.maxMarks}
                                    onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) }))}
                                    className="border-slate-200"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Instructions</Label>
                            <Textarea
                                rows={3}
                                value={form.instructions}
                                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                                placeholder="Instructions for students..."
                                className="border-slate-200 resize-none"
                            />
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={() => { setShowCreate(false); setForm(BLANK); }}>Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!form.title || !form.dueDate}
                            className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white gap-1.5"
                        >
                            <Send size={14} /> Create
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Grade Dialog (shadcn Dialog) ── */}
            {grading && selectedAssn && (() => {
                const sub = selectedAssn.submissions.find(s => s.studentId === grading.studentId);
                return (
                    <Dialog open={!!grading} onOpenChange={(o) => { if (!o) setGrading(null); }}>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle className="text-base font-bold">Grade Submission</DialogTitle>
                                <p className="text-xs text-slate-500 mt-0.5">{sub?.studentName}</p>
                            </DialogHeader>
                            <Separator />
                            <div className="space-y-4 py-2">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                                        Score (out of {selectedAssn.maxMarks})
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={selectedAssn.maxMarks}
                                        value={grading.grade}
                                        onChange={e => setGrading(g => g ? { ...g, grade: e.target.value } : null)}
                                        className="border-slate-200"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Feedback</Label>
                                    <Textarea
                                        rows={3}
                                        value={grading.feedback}
                                        onChange={e => setGrading(g => g ? { ...g, feedback: e.target.value } : null)}
                                        placeholder="Feedback for student..."
                                        className="border-slate-200 resize-none"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-end gap-2 pt-1">
                                <Button variant="outline" onClick={() => setGrading(null)}>Cancel</Button>
                                <Button onClick={handleGrade} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white">
                                    Save Grade
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            })()}
        </div>
    );
}
