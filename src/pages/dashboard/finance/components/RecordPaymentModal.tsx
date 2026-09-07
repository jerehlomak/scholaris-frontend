import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Loader2, CheckCircle2, Printer } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import ReceiptPrintModal from './ReceiptPrintModal';

export default function RecordPaymentModal({ inv, onClose, onSuccess }: { inv: any; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState(inv.balanceDue.toString());
    const [method, setMethod] = useState('CASH');
    const [discountAmount, setDiscountAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successReceipt, setSuccessReceipt] = useState<any>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    // Itemized breakdown — only editable before any payment has landed on this
    // invoice (updateInvoice blocks line-item edits once amountPaid > 0), same
    // rule the invoice editor already enforces.
    const canEditItems = (inv.amountPaid || 0) === 0 && Array.isArray(inv.items) && inv.items.length > 0;
    const [itemChecks, setItemChecks] = useState<Record<string, boolean>>(
        () => Object.fromEntries((inv.items || []).map((i: any) => [i.id, true]))
    );
    const [savingItems, setSavingItems] = useState(false);
    const checkedItems = (inv.items || []).filter((i: any) => itemChecks[i.id]);
    const checkedTotal = checkedItems.reduce((s: number, i: any) => s + i.amount, 0);
    const itemsChanged = canEditItems && checkedItems.length !== (inv.items || []).length;

    React.useEffect(() => {
        axios.get('/api/v1/finance-v2/settings', { withCredentials: true })
            .then(res => setSettings(res.data.settings))
            .catch(console.error);
    }, []);

    // Persists the unchecked items by dropping them from the invoice (updateInvoice
    // recomputes subTotal/totalAmount/balanceDue), then continues to the actual
    // payment amount input with the new balance.
    const handleApplyItemChanges = async () => {
        setSavingItems(true);
        try {
            const res = await axios.put(`/api/v1/finance-v2/invoices/${inv.id}`, {
                items: checkedItems.map((i: any) => ({
                    type: i.type, referenceId: i.referenceId, label: i.label, quantity: i.quantity, unitPrice: i.unitPrice
                }))
            }, { withCredentials: true });
            const updated = res.data.invoice;
            inv.items = updated.items;
            inv.balanceDue = updated.balanceDue;
            inv.totalAmount = updated.totalAmount;
            setItemChecks(Object.fromEntries(updated.items.map((i: any) => [i.id, true])));
            setAmount(updated.balanceDue.toString());
            toast.success('Invoice items updated');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to update items');
        } finally {
            setSavingItems(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let res;
            if (method === 'WALLET') {
                res = await axios.post('/api/v1/finance-v2/wallet/apply', {
                    studentId: inv.studentId,
                    invoiceId: inv.id,
                    amount: Number(amount)
                }, { withCredentials: true });
                toast.success('Payment from Wallet Successful');
            } else {
                res = await axios.post(`/api/v1/finance-v2/invoices/${inv.id}/pay`, {
                    amount: Number(amount),
                    method,
                    discountAmount: discountAmount ? Number(discountAmount) : 0
                }, { withCredentials: true });
            }
            toast.success('Payment recorded successfully');
            if (res.data?.receipt) {
                setSuccessReceipt(res.data.receipt);
            } else {
                onSuccess(); // If no receipt is returned, just close
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (showPrintModal && successReceipt) {
        // Build a mock tx object that satisfies ReceiptPrintModal which expects tx to have a receipt property and a student property
        const txObj = {
            receipt: successReceipt,
            amount: successReceipt.amountPaid,
            createdAt: successReceipt.createdAt || new Date().toISOString(),
            method: successReceipt.method,
            student: { 
                ...inv.student,
                school: { name: inv.school?.name || 'School' }
            }
        };
        return <ReceiptPrintModal tx={txObj} settings={settings} onClose={onSuccess} />;
    }

    if (successReceipt) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                    <p className="text-slate-500 mb-8">The payment of ₦{Number(amount).toLocaleString()} has been securely recorded.</p>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <Button onClick={() => setShowPrintModal(true)} className="w-full bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-bold h-12 rounded-xl">
                            <Printer className="mr-2 h-5 w-5" /> Print Receipt
                        </Button>
                        <Button onClick={onSuccess} variant="outline" className="w-full h-12 rounded-xl font-bold text-slate-600">
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Record Payment</h2>
                    <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-sm">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Invoice</p>
                        <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Balance Due</p>
                        <p className="font-bold text-red-600">₦{inv.balanceDue.toLocaleString()}</p>
                    </div>
                </div>

                {/* Itemized breakdown — compulsory fees can't be unchecked; optional
                    items/fees can be dropped before charging (only while unpaid). */}
                {Array.isArray(inv.items) && inv.items.length > 0 && (
                    <div className="border-b border-slate-100 px-6 py-4 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items</p>
                        {inv.items.map((item: any) => (
                            <label key={item.id} className={`flex items-center gap-3 text-sm ${!canEditItems ? 'opacity-70' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={!!itemChecks[item.id]}
                                    disabled={!canEditItems || item.isCompulsory}
                                    onChange={() => setItemChecks(p => ({ ...p, [item.id]: !p[item.id] }))}
                                    className="h-4 w-4 rounded border-slate-300 accent-[#1E4DA6]"
                                />
                                <span className="flex-1 text-slate-700 font-medium">
                                    {item.label}
                                    {item.isCompulsory && <span className="ml-1.5 text-[9px] font-bold uppercase text-slate-400">Compulsory</span>}
                                </span>
                                <span className="font-bold text-slate-800">₦{item.amount.toLocaleString()}</span>
                            </label>
                        ))}
                        {canEditItems && (
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="text-xs text-slate-500">
                                    {itemsChanged ? `New total: ₦${checkedTotal.toLocaleString()}` : 'Uncheck an optional item to remove it before charging'}
                                </span>
                                {itemsChanged && (
                                    <Button type="button" size="sm" onClick={handleApplyItemChanges} disabled={savingItems || checkedItems.length === 0}
                                        className="h-7 px-3 text-xs bg-[#1E4DA6] hover:bg-[#173F8C] text-white">
                                        {savingItems ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                                    </Button>
                                )}
                            </div>
                        )}
                        {!canEditItems && (inv.amountPaid || 0) > 0 && (
                            <p className="text-[11px] text-slate-400">Items are locked — a payment has already been recorded on this invoice.</p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Paid (₦)</label>
                        <Input type="number" required min={1} max={settings?.allowOverpayment ? undefined : inv.balanceDue} value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="CASH">Cash</option>
                            <option value="POS">POS Terminal</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="WALLET">Wallet</option>
                        </select>
                    </div>
                    {method !== 'WALLET' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Discount Amount (Optional ₦)</label>
                            <p className="text-xs text-slate-500 mb-2">Apply an on-the-spot discount to reduce the balance due.</p>
                            <Input type="number" min={0} value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="0" />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Record Payment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
