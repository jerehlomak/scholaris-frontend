import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Loader2, Send, CheckSquare, Square, Megaphone } from 'lucide-react';

const DEFAULT_TEMPLATE = `Dear Parent,\n\nThis is a friendly reminder that your child's school fees have an outstanding balance. Kindly make payment at your earliest convenience to avoid any disruption.\n\nThank you.`;

interface Props {
    onClose: () => void;
    onSent: () => void;
}

export default function BulkFinanceMessageModal({ onClose, onSent }: Props) {
    const [classes, setClasses] = useState<any[]>([]);
    const [classId, setClassId] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [onlyOutstanding, setOnlyOutstanding] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [subject, setSubject] = useState('Fee Reminder');
    const [body, setBody] = useState(DEFAULT_TEMPLATE);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        axios.get('/api/v1/classes/all', { withCredentials: true })
            .then(res => setClasses(res.data.classes || []))
            .catch(() => toast.error('Failed to load classes'));
    }, []);

    useEffect(() => {
        if (!classId) { setStudents([]); setSelected(new Set()); return; }
        setLoadingStudents(true);
        axios.get(`/api/v1/finance-v2/billing/classes/${classId}/students`, { withCredentials: true })
            .then(res => {
                setStudents(res.data.students || []);
                setSelected(new Set());
            })
            .catch(() => toast.error('Failed to load students for this class'))
            .finally(() => setLoadingStudents(false));
    }, [classId]);

    const visibleStudents = onlyOutstanding
        ? students.filter(s => s.billingStatus === 'UNPAID' || s.billingStatus === 'PARTIAL')
        : students;

    const toggleOne = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === visibleStudents.length) setSelected(new Set());
        else setSelected(new Set(visibleStudents.map(s => s.id)));
    };

    const handleSend = async () => {
        if (selected.size === 0) return toast.error('Select at least one student');
        if (!body.trim()) return toast.error('Message body is required');
        setSending(true);
        try {
            const res = await axios.post('/api/v1/finance-v2/reminders/bulk', {
                studentIds: Array.from(selected),
                subject,
                body
            }, { withCredentials: true });
            toast.success(res.data.message || 'Reminders sent');
            onSent();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || e.response?.data?.message || 'Failed to send reminders');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-bold text-slate-900">Bulk Finance Message</h2>
                    </div>
                    <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                            <select
                                value={classId}
                                onChange={e => setClassId(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            >
                                <option value="">Select a class...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 h-10">
                                <input type="checkbox" checked={onlyOutstanding} onChange={e => setOnlyOutstanding(e.target.checked)} className="h-4 w-4 rounded" />
                                Only students with outstanding balance
                            </label>
                        </div>
                    </div>

                    {classId && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-200">
                                <button onClick={toggleAll} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    {selected.size === visibleStudents.length && visibleStudents.length > 0
                                        ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                                        : <Square className="h-4 w-4 text-slate-400" />}
                                    Select All ({visibleStudents.length})
                                </button>
                                <span className="text-xs font-bold text-indigo-600">{selected.size} selected</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {loadingStudents ? (
                                    <div className="p-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading students...
                                    </div>
                                ) : visibleStudents.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-slate-500">No students match this filter.</div>
                                ) : (
                                    visibleStudents.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleOne(s.id)}
                                            className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                                                <p className="text-[11px] text-slate-400">{s.admissionNo} • ₦{(s.totalOutstanding || 0).toLocaleString()} outstanding</p>
                                            </div>
                                            {selected.has(s.id) ? <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" /> : <Square className="h-4 w-4 text-slate-300 shrink-0" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={5}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-2 shrink-0">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || selected.size === 0}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send to {selected.size || ''} Parent{selected.size === 1 ? '' : 's'}
                    </button>
                </div>
            </div>
        </div>
    );
}
