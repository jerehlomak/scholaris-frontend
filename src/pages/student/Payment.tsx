/**
 * Payment.tsx — Student fee status, outstanding balance, and payment history
 */
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Home as HomeIcon, ChevronRight, CreditCard, CheckCircle2, Clock, AlertCircle, Download, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface InvoiceItem {
    id: string;
    label: string;
    amount: number;
    unitPrice: number;
    quantity: number;
}

interface FinanceInvoice {
    id: string;
    invoiceNumber: string;
    term: string;
    academicYear: string;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    status: string;
    dueDate: string | null;
    items: InvoiceItem[];
}

interface PaymentRecord {
    id: string;
    reference: string;
    amount: number;
    paidAt: string;
    method: string;
    status: string;
    receipt?: { receiptNumber: string };
}

interface WalletData {
    balance: number;
    status: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PAID: { label: 'Paid', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    PARTIAL: { label: 'Partial', color: 'text-[#ff9800]', bg: 'bg-[#ff9800]/10', icon: <Clock className="w-3.5 h-3.5" /> },
    OPEN: { label: 'Unpaid', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    SENT: { label: 'Sent', color: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    OVERDUE: { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

function fmt(n: number) { return '₦' + (n || 0).toLocaleString('en-NG'); }
function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Payment() {
    const [invoices, setInvoices] = useState<FinanceInvoice[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, payRes, walRes] = await Promise.all([
                axios.get('/api/v1/student-finance/my-invoices', { withCredentials: true }).catch(() => ({ data: { invoices: [] } })),
                axios.get('/api/v1/student-finance/my-payments', { withCredentials: true }).catch(() => ({ data: { payments: [] } })),
                axios.get('/api/v1/student-finance/my-wallet', { withCredentials: true }).catch(() => ({ data: { wallet: null } }))
            ]);
            setInvoices(invRes.data.invoices || []);
            setPayments(payRes.data.payments || []);
            setWallet(walRes.data.wallet || null);
        } catch (err) {
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const totalFees = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((s, inv) => s + inv.amountPaid, 0);
    const outstanding = invoices.reduce((s, inv) => s + inv.balanceDue, 0);
    const progress = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 100;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1E4DA6] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Fees & Payments</h1>
                    <div className="flex items-center text-xs text-slate-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/student" className="hover:text-[#1E4DA6] transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Fees & Payments</span>
                    </div>
                </div>
                {outstanding > 0 && (
                    <Button className="bg-[#ff9800] hover:bg-[#f57c00] text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Pay Outstanding Balance
                    </Button>
                )}
            </div>

            {/* Wallet Balance Widget */}
            {wallet && (
                <div className="mb-6 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between"
                    style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)' }}>
                    <div>
                        <div className="flex items-center gap-2 mb-1 opacity-90">
                            <Wallet size={18} />
                            <span className="text-sm font-semibold">My Wallet Balance</span>
                        </div>
                        <div className="text-3xl font-bold tracking-tight">{fmt(wallet.balance)}</div>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                        <span className="text-xs px-3 py-1 rounded-full font-bold"
                            style={{ background: wallet.status === 'ACTIVE' ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.3)' }}>
                            {wallet.status}
                        </span>
                        <p className="text-xs opacity-70 mt-2">Funds can be applied to unpaid invoices.</p>
                    </div>
                </div>
            )}

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <Card className="p-5 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Fees Billed</p>
                        <p className="text-3xl font-black text-gray-900">{fmt(totalFees)}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Sum of all generated invoices</p>
                </Card>
                <Card className="p-5 bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Amount Paid</p>
                        <p className="text-3xl font-black text-[#10b981]">{fmt(totalPaid)}</p>
                    </div>
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Overall Progress</span><span>{progress}%</span></div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#10b981] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </Card>
                <Card className={`p-5 border shadow-sm flex flex-col justify-between ${outstanding > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Outstanding Balance</p>
                        <p className={`text-3xl font-black ${outstanding > 0 ? 'text-red-600' : 'text-[#10b981]'}`}>{outstanding > 0 ? fmt(outstanding) : 'Cleared ✓'}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{outstanding > 0 ? `${invoices.filter(i => i.balanceDue > 0).length} invoice(s) pending payment` : 'All invoices cleared!'}</p>
                </Card>
            </div>

            {/* Fee schedule / Invoices */}
            <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">My Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3 text-left">Invoice #</th>
                                <th className="px-5 py-3 text-left">Term / Year</th>
                                <th className="px-5 py-3 text-right">Total</th>
                                <th className="px-5 py-3 text-right">Paid</th>
                                <th className="px-5 py-3 text-right">Balance</th>
                                <th className="px-5 py-3 text-center">Due Date</th>
                                <th className="px-5 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-gray-500">No invoices generated yet.</td>
                                </tr>
                            ) : invoices.map(inv => {
                                const cfg = STATUS_CFG[inv.status === 'PARTIAL' ? 'PARTIAL' : inv.status] || STATUS_CFG['OPEN'];
                                return (
                                    <tr key={inv.id} className="hover:bg-gray-50/40 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-[#173F8C] font-mono">{inv.invoiceNumber}</td>
                                        <td className="px-5 py-3.5 text-gray-700 text-xs">
                                            {inv.term?.replace(/_/g, ' ')} <br/><span className="text-gray-400">{inv.academicYear}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-gray-900">{fmt(inv.totalAmount)}</td>
                                        <td className="px-5 py-3.5 text-right text-[#10b981] font-semibold">{fmt(inv.amountPaid)}</td>
                                        <td className={`px-5 py-3.5 text-right font-bold ${inv.balanceDue > 0 ? 'text-red-600' : 'text-gray-300'}`}>{inv.balanceDue > 0 ? fmt(inv.balanceDue) : '—'}</td>
                                        <td className="px-5 py-3.5 text-center text-gray-500 text-xs">{fmtDate(inv.dueDate)}</td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${cfg.bg} ${cfg.color}`}>{cfg.icon}{cfg.label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Payment history */}
            <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Payment History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3 text-left">Reference</th>
                                <th className="px-5 py-3 text-left">Method</th>
                                <th className="px-5 py-3 text-right">Amount</th>
                                <th className="px-5 py-3 text-center">Date</th>
                                <th className="px-5 py-3 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-gray-500">No payment records found.</td>
                                </tr>
                            ) : payments.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                                    <td className="px-5 py-3 font-mono font-semibold text-slate-600">{p.reference}</td>
                                    <td className="px-5 py-3">
                                        <span className="px-2 py-0.5 bg-[#1E4DA6]/5 text-[#1E4DA6] text-[10px] uppercase font-bold rounded-full">{p.method}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-[#10b981]">{fmt(p.amount)}</td>
                                    <td className="px-5 py-3 text-center text-gray-500 text-xs">{fmtDate(p.paidAt)}</td>
                                    <td className="px-5 py-3 text-center">
                                        {p.receipt?.receiptNumber ? (
                                            <span className="text-xs text-[#1E4DA6] font-medium hover:underline cursor-pointer">{p.receipt.receiptNumber}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
