import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
    Loader2, ChevronRight, Plus, Trash2, Edit2, Check,
    X as CloseIcon, TrendingUp, TrendingDown, Users, DollarSign
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Staff {
    id: string; name: string; employeeId: string; department: string;
    bankName: string; accountNumber: string; accountName: string;
    gross: number; totalDeductions: number; net: number;
}
interface PayrollItem {
    id: string; type: 'earning' | 'deduction'; itemName: string; amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-teal-500','bg-rose-500','bg-amber-500','bg-indigo-500'];
function avatarBg(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PayrollSettings() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [settings, setSettings] = useState<PayrollItem[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    // Add-item form state
    const [newType, setNewType] = useState<'earning' | 'deduction'>('earning');
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');

    // Inline editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    // Load staff list
    useEffect(() => {
        axios.get('/api/v1/payroll/staff', { withCredentials: true })
            .then(res => { setStaff(res.data.staff || []); })
            .catch(() => toast.error('Failed to load staff list'))
            .finally(() => setLoadingStaff(false));
    }, []);

    // Load settings when staff selected
    useEffect(() => {
        if (!selectedStaffId) { setSettings([]); return; }
        setLoadingSettings(true);
        axios.get(`/api/v1/payroll/settings/${selectedStaffId}`, { withCredentials: true })
            .then(res => setSettings(res.data.settings || []))
            .catch(() => toast.error('Failed to load payroll settings'))
            .finally(() => setLoadingSettings(false));
    }, [selectedStaffId]);

    // Computed values
    const earnings = settings.filter(s => s.type === 'earning');
    const deductions = settings.filter(s => s.type === 'deduction');
    const gross = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const net = Math.max(0, gross - totalDeductions);

    const selectedStaff = staff.find(s => s.id === selectedStaffId);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        if (!newName.trim() || !newAmount || !selectedStaffId) return;
        setSaving(true);
        try {
            const res = await axios.post('/api/v1/payroll/settings', {
                staffId: selectedStaffId, type: newType,
                itemName: newName.trim(), amount: parseFloat(newAmount),
            }, { withCredentials: true });
            setSettings(prev => [...prev, res.data.setting]);
            setNewName(''); setNewAmount('');
            toast.success(`${newType === 'earning' ? 'Earning' : 'Deduction'} added`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to add item');
        } finally { setSaving(false); }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim() || !editAmount) return;
        setSaving(true);
        try {
            const res = await axios.put(`/api/v1/payroll/settings/${id}`, {
                itemName: editName.trim(), amount: parseFloat(editAmount),
            }, { withCredentials: true });
            setSettings(prev => prev.map(s => s.id === id ? res.data.setting : s));
            setEditingId(null);
            toast.success('Item updated');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update item');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this item?')) return;
        setSaving(true);
        try {
            await axios.delete(`/api/v1/payroll/settings/${id}`, { withCredentials: true });
            setSettings(prev => prev.filter(s => s.id !== id));
            toast.success('Item removed');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to remove item');
        } finally { setSaving(false); }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .prs-root, .prs-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .prs-root .mono { font-family: 'DM Mono', monospace !important; }
            `}</style>

            <div className="prs-root min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30 px-3 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]"
                    style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className={cn('mb-3 sm:mb-6 flex flex-wrap items-center gap-1.5 transition-all duration-500 text-[9px] sm:text-[10px]', pageVisible ? 'opacity-100' : 'opacity-0 -translate-y-2')}>
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Payroll</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-violet-600">Payroll Settings</span>
                    </div>

                    {/* Page header */}
                    <div className={cn('mb-4 sm:mb-8 transition-all duration-500', pageVisible ? 'opacity-100' : 'opacity-0 translate-y-3')}>
                        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Payroll Settings</h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">Configure earnings and deductions per staff member.</p>
                    </div>

                    {/* Staff Selector */}
                    <div className={cn('mb-5 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-500', pageVisible ? 'opacity-100' : 'opacity-0 translate-y-3')}>
                        <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                                <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                            </div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-800">Select Staff Member</h2>
                        </div>
                        <div className="p-4 sm:p-6">
                            {loadingStaff ? (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
                                </div>
                            ) : (
                                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {staff.map(s => (
                                        <button key={s.id} onClick={() => setSelectedStaffId(s.id === selectedStaffId ? '' : s.id)}
                                            className={cn(
                                                'group flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer',
                                                selectedStaffId === s.id
                                                    ? 'border-violet-300 bg-violet-50 shadow-md shadow-violet-100'
                                                    : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm'
                                            )}>
                                            <div className={cn('flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm', avatarBg(s.name))}>
                                                {s.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn('truncate font-semibold text-xs sm:text-sm', selectedStaffId === s.id ? 'text-violet-700' : 'text-slate-800')}>
                                                    {s.name}
                                                </p>
                                                <p className="mono text-[10px] text-slate-400 truncate">{s.department || s.employeeId}</p>
                                            </div>
                                            {selectedStaffId === s.id && (
                                                <Check className="h-4 w-4 shrink-0 text-violet-600" />
                                            )}
                                        </button>
                                    ))}
                                    {staff.length === 0 && (
                                        <p className="col-span-3 py-8 text-center text-xs sm:text-sm text-slate-400">No active staff found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings Panel — only shown when staff selected */}
                    <AnimatePresence>
                        {selectedStaffId && (
                            <motion.div key="settings-panel"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>

                                {/* Summary bar */}
                                <div className="mb-4 sm:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    {[
                                        { label: 'Gross Salary', value: fmt(gross), icon: <TrendingUp className="h-4 w-4" />, bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200' },
                                        { label: 'Total Deductions', value: fmt(totalDeductions), icon: <TrendingDown className="h-4 w-4" />, bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200' },
                                        { label: 'Net Pay', value: fmt(net), icon: <DollarSign className="h-4 w-4" />, bg: 'bg-violet-50/70', text: 'text-violet-700', border: 'border-violet-200' },
                                    ].map(card => (
                                        <div key={card.label} className={cn('flex items-center gap-3 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-sm', card.bg, card.border)}>
                                            <div className={cn('flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl', card.bg, card.text)}>
                                                {card.icon}
                                            </div>
                                            <div>
                                                <p className="mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
                                                <p className={cn('mono text-base sm:text-lg font-black', card.text)}>{card.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Item Form */}
                                <div className="mb-4 sm:mb-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
                                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6 sm:py-4">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-800">Add Earning / Deduction</h3>
                                        <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">Add items to {selectedStaff?.name}'s pay structure</p>
                                    </div>
                                    <div className="p-4 sm:p-6">
                                        <div className="grid gap-3 sm:grid-cols-4">
                                            <div>
                                                <Label className="mb-1.5 text-xs font-semibold text-slate-600">Type</Label>
                                                <select value={newType} onChange={e => setNewType(e.target.value as 'earning' | 'deduction')}
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 cursor-pointer">
                                                    <option value="earning">💰 Earning</option>
                                                    <option value="deduction">➖ Deduction</option>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label className="mb-1.5 text-xs font-semibold text-slate-600">Item Name</Label>
                                                <Input value={newName} onChange={e => setNewName(e.target.value)}
                                                    placeholder={newType === 'earning' ? 'e.g. Basic Salary, Allowance' : 'e.g. Tax, Pension'}
                                                    className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-100" />
                                            </div>
                                            <div>
                                                <Label className="mb-1.5 text-xs font-semibold text-slate-600">Amount (₦)</Label>
                                                <Input type="number" min="0" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-100" />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button onClick={handleAdd}
                                                disabled={saving || !newName.trim() || !newAmount}
                                                className={cn('w-full sm:w-auto h-10 gap-2 rounded-xl px-6 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer',
                                                    newType === 'earning'
                                                        ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'
                                                        : 'bg-rose-600 shadow-rose-200 hover:bg-rose-700')}>
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                Add {newType === 'earning' ? 'Earning' : 'Deduction'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Earnings & Deductions panels */}
                                {loadingSettings ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                                        {/* Earnings */}
                                        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-200 bg-white shadow-sm">
                                            <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-4 py-3 sm:px-5 sm:py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                    <h3 className="font-bold text-emerald-800 text-xs sm:text-sm">Earnings</h3>
                                                </div>
                                                <span className="mono rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                    {fmt(gross)}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-emerald-50 p-2.5 sm:p-3 space-y-1">
                                                <AnimatePresence>
                                                    {earnings.map(item => (
                                                        <motion.div key={item.id}
                                                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}
                                                            className="flex items-center justify-between rounded-xl bg-white border border-emerald-100/80 px-3 py-2.5 sm:px-4 sm:py-2.5 shadow-sm">
                                                            {editingId === item.id ? (
                                                                <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 mr-2">
                                                                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-xs flex-1 min-w-[120px]" />
                                                                    <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 text-xs w-24 sm:w-28" />
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => handleUpdate(item.id)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
                                                                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"><CloseIcon className="h-3.5 w-3.5" /></button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="min-w-0 pr-2">
                                                                        <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{item.itemName}</p>
                                                                        <p className="mono text-xs font-bold text-emerald-600">{fmt(item.amount)}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button onClick={() => { setEditingId(item.id); setEditName(item.itemName); setEditAmount(String(item.amount)); }}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer">
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button onClick={() => handleDelete(item.id)}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                                {earnings.length === 0 && (
                                                    <p className="py-6 sm:py-8 text-center text-xs text-slate-400">No earnings configured. Add an item above.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-rose-200 bg-white shadow-sm">
                                            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 px-4 py-3 sm:px-5 sm:py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <TrendingDown className="h-4 w-4 text-rose-600" />
                                                    <h3 className="font-bold text-rose-800 text-xs sm:text-sm">Deductions</h3>
                                                </div>
                                                <span className="mono rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                                                    -{fmt(totalDeductions)}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-rose-50 p-2.5 sm:p-3 space-y-1">
                                                <AnimatePresence>
                                                    {deductions.map(item => (
                                                        <motion.div key={item.id}
                                                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}
                                                            className="flex items-center justify-between rounded-xl bg-white border border-rose-100/80 px-3 py-2.5 sm:px-4 sm:py-2.5 shadow-sm">
                                                            {editingId === item.id ? (
                                                                <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 mr-2">
                                                                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-xs flex-1 min-w-[120px]" />
                                                                    <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 text-xs w-24 sm:w-28" />
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => handleUpdate(item.id)} className="p-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
                                                                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"><CloseIcon className="h-3.5 w-3.5" /></button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="min-w-0 pr-2">
                                                                        <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{item.itemName}</p>
                                                                        <p className="mono text-xs font-bold text-rose-600">-{fmt(item.amount)}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button onClick={() => { setEditingId(item.id); setEditName(item.itemName); setEditAmount(String(item.amount)); }}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 cursor-pointer">
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button onClick={() => handleDelete(item.id)}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                                {deductions.length === 0 && (
                                                    <p className="py-6 sm:py-8 text-center text-xs text-slate-400">No deductions configured. Add an item above.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Empty state */}
                    {!selectedStaffId && !loadingStaff && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 sm:py-20 text-center px-4">
                            <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-violet-50">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />
                            </div>
                            <p className="font-semibold text-slate-500 text-xs sm:text-sm">Select a staff member above</p>
                            <p className="mt-1 text-[11px] sm:text-xs text-slate-400">to configure their earnings and deductions</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
