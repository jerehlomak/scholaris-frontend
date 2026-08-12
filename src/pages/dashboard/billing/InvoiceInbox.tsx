import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    FileText, DollarSign, Clock, CheckCircle2, XCircle,
    AlertTriangle, ChevronDown, ChevronUp, Wallet, RefreshCw
} from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

const API = import.meta.env.VITE_API_BASE_URL || '';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    DRAFT: { bg: '#f1f5f9', text: '#64748b', icon: <Clock size={11} /> },
    SENT: { bg: '#eff6ff', text: '#3b82f6', icon: <FileText size={11} /> },
    OPEN: { bg: '#eff6ff', text: '#3b82f6', icon: <FileText size={11} /> },
    PARTIALLY_PAID: { bg: '#fff7ed', text: '#f59e0b', icon: <AlertTriangle size={11} /> },
    PAID: { bg: '#f0fdf4', text: '#16a34a', icon: <CheckCircle2 size={11} /> },
    OVERDUE: { bg: '#fef2f2', text: '#ef4444', icon: <XCircle size={11} /> },
    CANCELLED: { bg: '#f8fafc', text: '#94a3b8', icon: <XCircle size={11} /> },
};

function fmt(n: number) { return `₦${Number(n).toLocaleString()}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider"
            style={{ background: s.bg, color: s.text }}>
            {s.icon} {status.replace('_', ' ')}
        </span>
    );
}

function InvoiceDetail({ invoice, walletBalance, onPayFromWallet, onPayOnline, paying, onClose }: any) {
    const amountDue = invoice.amountDue ?? (invoice.totalAmount - invoice.amountPaid);
    const canPay = ['SENT', 'OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-mono">{invoice.invoiceNumber}</p>
                        <h2 className="text-lg font-bold text-slate-800 mt-0.5">{invoice.title}</h2>
                    </div>
                    <StatusBadge status={invoice.status} />
                </div>

                {/* Line Items */}
                {invoice.showItemizedBreakdown !== false ? (
                    <div className="rounded-xl border overflow-x-auto" style={{ borderColor: '#e4e7f0' }}>
                        <table className="w-full text-sm min-w-[400px]">
                            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="px-4 py-2 text-left">Item</th>
                                    <th className="px-4 py-2 text-right">Qty</th>
                                    <th className="px-4 py-2 text-right">Unit</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoice.items?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 text-slate-700">{item.itemName || item.label}</td>
                                        <td className="px-4 py-2 text-right text-slate-500">{item.quantity || 1}</td>
                                        <td className="px-4 py-2 text-right text-slate-500">{fmt(item.unitPrice || item.amount)}</td>
                                        <td className="px-4 py-2 text-right font-semibold">{fmt(item.total || item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-xl border p-4 text-center text-sm font-semibold text-slate-600 bg-slate-50">
                        Total School Fees: {fmt(invoice.totalAmount)}
                    </div>
                )}

                {/* Totals */}
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(invoice.amount)}</span></div>
                    {invoice.taxAmount > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>{fmt(invoice.taxAmount)}</span></div>}
                    {invoice.discountAmount > 0 && <div className="flex justify-between text-slate-500"><span>Discount</span><span className="text-emerald-600">-{fmt(invoice.discountAmount)}</span></div>}
                    <div className="flex justify-between font-bold text-slate-800 pt-1 border-t"><span>Total</span><span>{fmt(invoice.totalAmount)}</span></div>
                    {invoice.amountPaid > 0 && <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{fmt(invoice.amountPaid)}</span></div>}
                    <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>{fmt(amountDue)}</span></div>
                </div>

                <div className="text-xs text-slate-400 flex gap-4">
                    <span><span className="font-semibold">Issued:</span> {fmtDate(invoice.issuedAt)}</span>
                    <span><span className="font-semibold">Due:</span> {fmtDate(invoice.dueDate)}</span>
                </div>

                {/* Payment Options */}
                {canPay && amountDue > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Options</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                onClick={() => onPayOnline(invoice.id, 'FLUTTERWAVE')}
                                disabled={paying}
                                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                💳 Pay with Flutterwave
                            </button>
                            <button
                                onClick={() => onPayOnline(invoice.id, 'PAYSTACK')}
                                disabled={paying}
                                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                ⚡ Pay with Paystack
                            </button>
                        </div>

                        {/* Pay from School Wallet */}
                        <div className="rounded-xl border p-3.5 space-y-2" style={{ borderColor: '#e4e7f0', background: '#f8faff' }}>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-700"><Wallet size={13} /> School Wallet Balance</span>
                                <span className="font-bold text-indigo-600">{fmt(walletBalance)}</span>
                            </div>
                            {walletBalance >= amountDue ? (
                                <button
                                    onClick={() => onPayFromWallet(invoice.id)}
                                    disabled={paying}
                                    className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                                >
                                    {paying ? 'Processing…' : `Pay ${fmt(amountDue)} from Wallet`}
                                </button>
                            ) : (
                                <p className="text-[11px] text-slate-400">Wallet balance is less than invoice total.</p>
                            )}
                        </div>
                    </div>
                )}

                <button onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
}

export default function InvoiceInbox() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [paying, setPaying] = useState(false);
    const [filter, setFilter] = useState('');
    const [showItemizedBreakdown, setShowItemizedBreakdown] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [iRes, wRes] = await Promise.all([
                axios.get(`${API}/api/v1/my-invoices`, { withCredentials: true }),
                axios.get(`${API}/api/v1/wallet/my`, { withCredentials: true }),
            ]);
            setInvoices(iRes.data.invoices || []);
            setWallet(wRes.data.wallet || { balance: 0 });
            if (iRes.data.showItemizedBreakdown !== undefined) {
                setShowItemizedBreakdown(iRes.data.showItemizedBreakdown);
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to load invoices.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const payFromWallet = async (invoiceId: string) => {
        setPaying(true);
        try {
            await axios.post(`${API}/api/v1/wallet/pay-invoice/${invoiceId}`, {}, { withCredentials: true });
            toast.success('Invoice paid successfully!');
            setSelectedInvoice(null);
            await loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Payment failed.');
        } finally {
            setPaying(false);
        }
    };

    const payOnline = async (invoiceId: string, gateway: 'FLUTTERWAVE' | 'PAYSTACK') => {
        setPaying(true);
        try {
            const res = await axios.post(`${API}/api/v1/my-invoices/${invoiceId}/pay`, { gateway }, { withCredentials: true });
            if (res.data.authorizationUrl) {
                window.location.href = res.data.authorizationUrl;
            } else {
                throw new Error('Payment initialization failed.');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Payment initialization failed.');
            setPaying(false);
        }
    };

    const filtered = filter ? invoices.filter(i => i.status === filter) : invoices;
    const totalDue = invoices.reduce((s, i) => s + (i.amountDue ?? i.totalAmount - i.amountPaid), 0);

    return (
        <SettingsShell breadcrumbParent="Billing" breadcrumbCurrent="Invoice Inbox" tabLabel="Invoice Inbox" tabIcon={<FileText className="h-3.5 w-3.5" />}>
            <div className="flex flex-col gap-6">
            {selectedInvoice && (
                <InvoiceDetail 
                    invoice={{...selectedInvoice, showItemizedBreakdown}} 
                    walletBalance={wallet?.balance || 0}
                    onPayFromWallet={payFromWallet}
                    onPayOnline={payOnline}
                    paying={paying}
                    onClose={() => setSelectedInvoice(null)} 
                />
            )}

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Invoice Inbox</h1>
                    <p className="text-sm mt-1 text-slate-500">Platform invoices sent to your school.</p>
                </div>
                <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Invoices</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{invoices.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Outstanding Due</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">{fmt(totalDue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1"><Wallet size={11} /> Wallet Balance</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{fmt(wallet?.balance || 0)}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
                {['', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                        style={{
                            background: filter === s ? '#6366f1' : '#fff',
                            color: filter === s ? '#fff' : '#64748b',
                            border: '1px solid',
                            borderColor: filter === s ? '#6366f1' : '#e2e8f0',
                        }}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-14">
                        <div className="w-7 h-7 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-14 text-center text-slate-400 text-sm">
                        <FileText className="mx-auto mb-2 opacity-30" size={32} />
                        No invoices found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px] text-left">
                            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3">Invoice Details</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Due Date</th>
                                    <th className="px-5 py-3 text-right">Total Amount</th>
                                    <th className="px-5 py-3 text-right">Balance Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(inv => {
                                    const due = inv.amountDue ?? (inv.totalAmount - inv.amountPaid);
                                    return (
                                        <tr key={inv.id} onClick={() => setSelectedInvoice(inv)}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                                        <FileText size={16} className="text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{inv.title}</p>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{inv.invoiceNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <StatusBadge status={inv.status} />
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                                                {fmtDate(inv.dueDate)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-slate-800 whitespace-nowrap">
                                                {fmt(inv.totalAmount)}
                                            </td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                {due > 0 ? (
                                                    <span className="text-xs font-semibold text-red-500">{fmt(due)} due</span>
                                                ) : (
                                                    <span className="text-xs text-emerald-500 font-semibold">Paid</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </div>
        </SettingsShell>
    );
}
