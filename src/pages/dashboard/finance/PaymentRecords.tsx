import { useViewPreference } from '../../../hooks/useViewPreference';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { Pagination } from '../../../components/shared/Pagination';
import ReceiptPrintModal from './components/ReceiptPrintModal';
import { Printer, Send } from 'lucide-react';

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    PROCESSING: { label: 'Processing', color: 'bg-[#1E4DA6]/10 text-[#173F8C]', icon: Clock },
    SUCCESSFUL: { label: 'Successful', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500', icon: XCircle },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-[#1E4DA6]/10 text-[#173F8C]', icon: Clock },
    REVERSED: { label: 'Reversed', color: 'bg-orange-100 text-orange-700', icon: ArrowUpCircle },
};

const METHOD_COLORS: Record<string, string> = {
    PAYSTACK: 'bg-indigo-100 text-indigo-700',
    BANK_TRANSFER: 'bg-[#1E4DA6]/10 text-[#173F8C]',
    CASH: 'bg-green-100 text-green-700',
    POS: 'bg-teal-100 text-teal-700',
    WALLET: 'bg-[#1E4DA6]/10 text-[#173F8C]',
    MANUAL_ADJUSTMENT: 'bg-slate-100 text-slate-600',
};

export default function PaymentRecords() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalCollected, setTotalCollected] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25); // was hardcoded at 10
    const [view, setView] = useViewPreference('paymentrecords');
    const [filters, setFilters] = useState({ status: '', method: '', from: '', to: '', isSent: '', isPrinted: '' });
    const [failedTx, setFailedTx] = useState<any[]>([]);
    const [showFailed, setShowFailed] = useState(false);
    const [printReceiptTx, setPrintReceiptTx] = useState<any | null>(null);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        axios.get('/api/v1/finance-v2/settings', { withCredentials: true })
            .then(r => setSettings(r.data))
            .catch(() => {});
    }, []);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
            const { data } = await axios.get(`/api/v1/finance-v2/transactions?${params}`, { withCredentials: true });
            setTransactions(data.transactions || []);
            setTotal(data.total || 0);
            setTotalCollected(data.totalCollected || 0);
        } catch {
            toast.error('Failed to load payment records');
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    useEffect(() => {
        axios.get('/api/v1/finance-v2/transactions?status=FAILED&limit=20', { withCredentials: true })
            .then(r => setFailedTx(r.data.transactions || []))
            .catch(() => {});
    }, []);

    const successfulCount = transactions.filter(t => t.status === 'SUCCESSFUL').length;
    const pendingCount = transactions.filter(t => t.status === 'UNDER_REVIEW' || t.status === 'PENDING').length;

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fd-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fd-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="relative z-10 mx-auto max-w-full space-y-6">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Payment Records</span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-500 shadow-lg shadow-emerald-200">
                            <ArrowDownCircle className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Payment Records</h1>
                            <p className="mt-0.5 text-sm text-slate-500">Full payment history and reconciliation</p>
                        </div>
                    </div>

            {/* Failed Payments Widget */}
            {failedTx.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
                    <button
                        onClick={() => setShowFailed(s => !s)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-red-100 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            {failedTx.length} Failed / Flagged Payment{failedTx.length !== 1 ? 's' : ''} — Follow Up Required
                        </div>
                        {showFailed ? <ChevronUp className="h-4 w-4 text-red-600" /> : <ChevronDown className="h-4 w-4 text-red-600" />}
                    </button>
                    {showFailed && (
                        <div className="border-t border-red-200 divide-y divide-red-100 bg-white">
                            {failedTx.map(tx => (
                                <div key={tx.id} className="px-5 py-3 flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-800">{tx.student?.user?.name || 'Unknown Student'}</p>
                                        <p className="text-xs font-mono text-slate-500">{tx.reference}</p>
                                        <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">₦{Number(tx.amount).toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{tx.method?.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'Total Collected', value: `₦${totalCollected.toLocaleString()}`, icon: <ArrowDownCircle className="h-4 w-4" />, c: 'emerald' },
                            { label: 'Total Records',   value: total.toString(),                     icon: <CheckCircle2 className="h-4 w-4" />,    c: 'blue'    },
                            { label: 'Confirmed',       value: successfulCount.toString(),            icon: <CheckCircle2 className="h-4 w-4" />,    c: 'green'   },
                            { label: 'Awaiting Review', value: pendingCount.toString(),              icon: <Clock className="h-4 w-4" />,           c: 'amber'   },
                        ].map(s => (
                            <div key={s.label} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-${s.c}-50 text-${s.c}-600`}>{s.icon}</div>
                                <p className="mono wrap-break-word text-base font-black leading-tight text-slate-900 sm:text-xl lg:text-2xl" title={s.value}>{s.value}</p>
                                <p className="mono mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

            {/* Filters */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.status} onChange={e => setFilters(s => ({ ...s, status: e.target.value }))}>
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.method} onChange={e => setFilters(s => ({ ...s, method: e.target.value }))}>
                            <option value="">All Methods</option>
                            {Object.keys(METHOD_COLORS).map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                        </select>
                        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.isSent} onChange={e => setFilters(s => ({ ...s, isSent: e.target.value }))}>
                            <option value="">Any Receipt Sent Status</option>
                            <option value="true">Sent</option>
                            <option value="false">Not Sent</option>
                        </select>
                        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.isPrinted} onChange={e => setFilters(s => ({ ...s, isPrinted: e.target.value }))}>
                            <option value="">Any Receipt Print Status</option>
                            <option value="true">Printed</option>
                            <option value="false">Not Printed</option>
                        </select>
                        <div className="w-full flex flex-col md:flex-row items-center gap-2">
                            <div className='w-full flex items-center gap-2'>
                                <span className="text-xs text-slate-500">From</span>
                                <Input type="date" className="w-auto" value={filters.from} onChange={e => setFilters(s => ({ ...s, from: e.target.value }))} />
                            </div>
                            <div className='w-full flex items-center gap-2'>
                                <span className="text-xs text-slate-500">To</span>
                                <Input type="date" className="w-auto" value={filters.to} onChange={e => setFilters(s => ({ ...s, to: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <Button variant="outline" onClick={() => { setFilters({ status: '', method: '', from: '', to: '', isSent: '', isPrinted: '' }); setPage(1); }}>Clear</Button>
                            <Button variant="outline" onClick={() => {
                                const csv = ['Reference,Student,Method,Status,Receipt,Date,Amount'].concat(
                                    transactions.map(tx => `${tx.reference},"${tx.student?.user?.name || ''}",${tx.method},${tx.status},${tx.receipt?.receiptNumber || ''},${new Date(tx.createdAt).toLocaleDateString()},${tx.amount}`)
                                ).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'payment_records.csv';
                                a.click();
                            }} className="flex items-center gap-2">
                                Export CSV
                            </Button>
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                title="Rows per page"
                            >
                                {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n} / page</option>)}
                            </select>
                            <ViewToggle view={view} onChange={setView} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : transactions.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
                    <p className="font-medium text-slate-500">No payment records found</p>
                </div>
            ) : (
                <div className="flex flex-col min-h-0">
                    {view === 'table' && (
                        <Card className="border-slate-200 shadow-sm overflow-hidden mb-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Reference', 'Student', 'Amount', 'Method', 'Status', 'Receipt', 'Date'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map(tx => {
                                    const statusCfg = STATUS_CONFIG[tx.status] || { label: tx.status, color: 'bg-slate-100 text-slate-600', icon: Clock };
                                    const StatusIcon = statusCfg.icon;
                                    return (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{tx.reference}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                {tx.student?.user?.name}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">
                                                ₦{tx.amount?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${METHOD_COLORS[tx.method] || 'bg-slate-100 text-slate-600'}`}>
                                                    {tx.method?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold w-fit ${statusCfg.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {tx.receipt?.receiptNumber ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <button onClick={() => setPrintReceiptTx(tx)} className="text-[#1E4DA6] hover:text-[#122F69] flex items-center gap-1 font-medium bg-[#1E4DA6]/5 px-2 py-1 rounded-lg">
                                                            <Printer className="h-3 w-3" />
                                                            {tx.receipt.receiptNumber}
                                                        </button>
                                                        <div className="flex gap-1 ml-1">
                                                            {tx.receipt.isSent && <span title="Sent" className="text-indigo-500 bg-indigo-50 rounded-full p-1"><Send className="w-3 h-3"/></span>}
                                                            {tx.receipt.isPrinted && <span title="Printed" className="text-slate-500 bg-slate-100 rounded-full p-1"><Printer className="w-3 h-3"/></span>}
                                                        </div>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    )}

                    {view === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {transactions.map(tx => {
                                const statusCfg = STATUS_CONFIG[tx.status] || { label: tx.status, color: 'bg-slate-100 text-slate-600', icon: Clock };
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <div key={tx.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{tx.student?.user?.name}</p>
                                                <p className="font-mono text-xs text-slate-500">{tx.reference}</p>
                                            </div>
                                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase w-fit ${statusCfg.color}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {statusCfg.label}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-slate-500 mb-2 border-t border-slate-100 pt-3">
                                            <span>Method</span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${METHOD_COLORS[tx.method] || 'bg-slate-100 text-slate-600'}`}>
                                                {tx.method?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                                            <span>Amount</span>
                                            <span className="font-mono font-bold text-slate-800">₦{Number(tx.amount).toLocaleString()}</span>
                                        </div>

                                        {tx.receipt?.receiptNumber && (
                                            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                                                <span>Receipt</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        {tx.receipt.isSent && <span title="Sent" className="text-indigo-500 bg-indigo-50 rounded-full p-0.5"><Send className="w-3 h-3"/></span>}
                                                        {tx.receipt.isPrinted && <span title="Printed" className="text-slate-500 bg-slate-100 rounded-full p-0.5"><Printer className="w-3 h-3"/></span>}
                                                    </div>
                                                    <button onClick={() => setPrintReceiptTx(tx)} className="font-mono text-[#1E4DA6] hover:text-[#122F69] flex items-center gap-1 bg-[#1E4DA6]/5 px-2 py-0.5 rounded">
                                                        <Printer className="h-3 w-3" /> {tx.receipt.receiptNumber}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between text-xs text-slate-500 mt-1 pt-2 border-t border-slate-100">
                                            <span>Date</span>
                                            <span className="text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} totalRecords={total} onPageChange={setPage} />
                </div>
            )}
                </div>
            </div>

            {printReceiptTx && (
                <ReceiptPrintModal 
                    tx={printReceiptTx} 
                    settings={settings} 
                    onClose={() => setPrintReceiptTx(null)}
                    onSuccess={() => fetchTransactions()}
                />
            )}
        </>
    );
}
