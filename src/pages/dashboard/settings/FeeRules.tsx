import { useState, useEffect } from 'react';
import { Coins, ClockAlert, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';

interface FeeDefinition {
    id: string;
    name: string;
}

interface FeeRule {
    id: string;
    name: string;
    targetFeeId: string | null;
    conditionType: string;
    conditionValue: string | null;
    actionType: string;
    actionValue: number;
    isActive: boolean;
}

const CONDITION_LABELS: Record<string, string> = {
    ALL: 'All Students',
    NEW_STUDENT: 'New Students Only',
    CLASS_LEVEL: 'Specific Class Level',
    TRANSPORT_ROUTE: 'Transport Route',
    LATE_PAYMENT: 'Late Payment (> X Days)'
};

const ACTION_LABELS: Record<string, string> = {
    SURCHARGE_FLAT: 'Add Flat Rate (₦)',
    SURCHARGE_PERCENT: 'Add Percentage (%)',
    DISCOUNT_FLAT: 'Discount Flat Rate (₦)',
    DISCOUNT_PERCENT: 'Discount Percentage (%)'
};

export function FeeRules() {
    const [rules, setRules] = useState<FeeRule[]>([]);
    const [fees, setFees] = useState<FeeDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [form, setForm] = useState<Partial<FeeRule> & { isNew: boolean }>({
        isNew: true,
        name: '',
        targetFeeId: '',
        conditionType: 'ALL',
        conditionValue: '',
        actionType: 'SURCHARGE_FLAT',
        actionValue: 0,
        isActive: true
    });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/finance-v2/fee-rules', { withCredentials: true }),
            axios.get('/api/v1/finance-v2/fees', { withCredentials: true })
        ]).then(([rulesRes, feesRes]) => {
            setRules(rulesRes.data.rules || []);
            setFees(feesRes.data.fees || []);
        }).catch(() => toast.error('Failed to load rules and fees'))
          .finally(() => setLoading(false));
    }, []);

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.conditionType || !form.actionType || form.actionValue === undefined) {
            toast.error('Please fill all required fields');
            return;
        }

        setSaving(true);
        const payload = {
            name: form.name,
            targetFeeId: form.targetFeeId || null,
            conditionType: form.conditionType,
            conditionValue: form.conditionValue || null,
            actionType: form.actionType,
            actionValue: Number(form.actionValue),
            isActive: form.isActive
        };

        try {
            if (form.id && !form.isNew) {
                const res = await axios.put(`/api/v1/finance-v2/fee-rules/${form.id}`, payload, { withCredentials: true });
                setRules(p => p.map(r => r.id === form.id ? res.data.rule : r));
                toast.success('Rule updated');
            } else {
                const res = await axios.post('/api/v1/finance-v2/fee-rules', payload, { withCredentials: true });
                setRules(p => [res.data.rule, ...p]);
                toast.success('Rule created');
            }
            setShowForm(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to save rule');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete rule "${name}"?`)) return;
        try {
            await axios.delete(`/api/v1/finance-v2/fee-rules/${id}`, { withCredentials: true });
            setRules(p => p.filter(r => r.id !== id));
            toast.success('Rule deleted');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to delete rule');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>;

    const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10';

    return (
        <SettingsShell breadcrumbParent="Finance" breadcrumbCurrent="Custom Fee Rules" tabLabel="Special Fees & Discounts" tabIcon={<Coins className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Coins className="h-7 w-7" />}
                title="Custom Fee Rules"
                subtitle="Configure conditional discounts, late penalties, and specific surcharges that apply to your base fees."
            />

            <div className="mb-6 space-y-4">
                {rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                {r.name}
                                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', 
                                    r.actionType.includes('DISCOUNT') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                                    {r.actionType.includes('DISCOUNT') ? 'Discount' : 'Surcharge'}
                                </span>
                            </h4>
                            <p className="text-sm text-slate-500">
                                Applies to: <span className="font-semibold text-slate-700">{CONDITION_LABELS[r.conditionType] || r.conditionType} {r.conditionValue && `(${r.conditionValue})`}</span> 
                                {' '} on {' '}
                                <span className="font-semibold text-[#1E4DA6]">{r.targetFeeId ? (fees.find(f => f.id === r.targetFeeId)?.name || 'Unknown Fee') : 'Invoice Total'}</span>
                            </p>
                            <p className="font-mono text-xs text-slate-400 mt-1">
                                Action: {ACTION_LABELS[r.actionType]} of {r.actionValue}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => {
                                setForm({ ...r, isNew: false });
                                setShowForm(true);
                            }} className="text-sm font-semibold text-[#1E4DA6] hover:text-[#122F69] px-3 py-1">Edit</button>
                            <button onClick={() => handleDelete(r.id, r.name)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!showForm && (
                <button onClick={() => {
                    setForm({ isNew: true, name: '', targetFeeId: '', conditionType: 'ALL', conditionValue: '', actionType: 'SURCHARGE_FLAT', actionValue: 0, isActive: true });
                    setShowForm(true);
                }} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1E4DA6]/20 py-4 text-sm font-semibold text-[#1E4DA6] hover:bg-[#1E4DA6]/5 transition-colors">
                    <Plus className="h-4 w-4" /> Create New Rule
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSaveRule} className="rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-6 space-y-5">
                    <div className="flex justify-between items-center mb-2 border-b border-[#1E4DA6]/10 pb-2">
                        <h3 className="font-bold text-slate-800">{form.isNew ? 'Create New Rule' : 'Edit Rule'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Cancel</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">Rule Name</label>
                            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g. Staff Discount, Late Fee" required />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">Target Fee</label>
                            <select value={form.targetFeeId || ''} onChange={e => setForm({...form, targetFeeId: e.target.value})} className={inputCls}>
                                <option value="">Invoice Total (Applies to all)</option>
                                {fees.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">Condition Type</label>
                            <select value={form.conditionType} onChange={e => setForm({...form, conditionType: e.target.value})} className={inputCls}>
                                {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">Condition Value (Optional)</label>
                            <input value={form.conditionValue || ''} onChange={e => setForm({...form, conditionValue: e.target.value})} className={inputCls} placeholder="e.g. JSS1, 14 (for days late)" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">Action Type</label>
                            <select value={form.actionType} onChange={e => setForm({...form, actionType: e.target.value})} className={inputCls}>
                                {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-500">Action Amount / Percentage</label>
                            <input type="number" value={form.actionValue} onChange={e => setForm({...form, actionValue: Number(e.target.value)})} className={inputCls} required />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <SaveButton onClick={() => {}} saved={saved} saving={saving} saveLabel="Save Rule" savedLabel="Saved!" />
                    </div>
                </form>
            )}
        </SettingsShell>
    );
}
