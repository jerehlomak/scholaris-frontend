import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Loader2, CheckCircle2, Printer } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import ReceiptPrintModal from './ReceiptPrintModal';

// Pays off a family's outstanding invoices with one combined payment, oldest
// invoice first (backend: POST /finance-v2/billing/families/:parentId/pay).
// Sits alongside the existing per-invoice "Pay" buttons in FamilyPaymentView —
// those stay, this is an additional option for paying everything at once.
export default function PayFamilyTotalModal({
    parentId, familyName, totalOutstanding, onClose, onSuccess
}: { parentId: string; familyName: string; totalOutstanding: number; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState(totalOutstanding.toString());
    const [method, setMethod] = useState('CASH');
    const [discountAmount, setDiscountAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successReceipt, setSuccessReceipt] = useState<any>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    React.useEffect(() => {
        axios.get('/api/v1/finance-v2/settings', { withCredentials: true })
            .then(res => setSettings(res.data.settings))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await axios.post(`/api/v1/finance-v2/billing/families/${parentId}/pay`, {
                amount: Number(amount),
                method,
                discountAmount: discountAmount ? Number(discountAmount) : 0
            }, { withCredentials: true });
            toast.success('Family payment recorded successfully');
            if (res.data?.receipt) {
                setSuccessReceipt(res.data.receipt);
            } else {
                onSuccess();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (showPrintModal && successReceipt) {
        const txObj = {
            receipt: successReceipt,
            amount: successReceipt.amountPaid,
            createdAt: successReceipt.createdAt || new Date().toISOString(),
            method: successReceipt.method,
            student: { name: familyName, school: { name: 'School' } }
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
                    <p className="text-slate-500 mb-8">The payment of ₦{Number(amount).toLocaleString()} has been securely recorded across {familyName}'s invoices.</p>
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
                    <h2 className="font-bold text-slate-900">Pay Family Total</h2>
                    <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-sm">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Family</p>
                        <p className="font-bold text-slate-900">{familyName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Total Outstanding</p>
                        <p className="font-bold text-red-600">₦{totalOutstanding.toLocaleString()}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 -mt-1">
                        Applied oldest-invoice-first across every child. Any amount left over after everything is paid off is credited back as a balance for this family.
                    </p>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Paid (₦)</label>
                        <Input type="number" required min={1} value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="CASH">Cash</option>
                            <option value="POS">POS Terminal</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Discount Amount (Optional ₦)</label>
                        <p className="text-xs text-slate-500 mb-2">Apply an on-the-spot discount to reduce the total owed.</p>
                        <Input type="number" min={0} value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="0" />
                    </div>
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
