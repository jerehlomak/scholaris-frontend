import { useEffect, useState, useCallback, type ReactElement } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw, TrendingUp, Plus } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

const API = import.meta.env.VITE_API_BASE_URL || '';

const TX_ICONS: Record<string, ReactElement> = {
    CREDIT: <ArrowUpCircle size={15} className="text-emerald-500" />,
    DEBIT:  <ArrowDownCircle size={15} className="text-red-400" />,
};

const SOURCE_LABELS: Record<string, string> = {
    TOPUP:           'Top-Up',
    INVOICE_PAYMENT: 'Invoice Payment',
    ADJUSTMENT:      'Adjustment',
    REFUND:          'Refund',
};

function fmt(n: number) { return `₦${Number(n).toLocaleString()}` }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WalletPage() {
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFundModal, setShowFundModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [funding, setFunding] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/v1/wallet/my`, { withCredentials: true });
            setWallet(res.data.wallet);
            setTransactions(res.data.transactions || []);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to load wallet.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleFundWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(fundAmount);
        if (!amt || amt <= 0) return toast.error('Enter a valid amount');
        
        setFunding(true);
        try {
            const res = await axios.post(`${API}/api/v1/wallet/fund`, { amount: amt }, { withCredentials: true });
            toast.success(res.data.message || 'Wallet funded successfully!');
            setShowFundModal(false);
            setFundAmount('');
            await loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to fund wallet.');
        } finally {
            setFunding(false);
        }
    };

    const credits = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const debits  = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);

    return (
        <SettingsShell breadcrumbParent="Billing" breadcrumbCurrent="My Wallet" tabLabel="My Wallet" tabIcon={<Wallet className="h-3.5 w-3.5" />}>
            <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">My Wallet</h1>
                    <p className="text-sm mt-1 text-slate-500">Platform wallet for invoice payments and top-ups.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFundModal(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                        <Plus size={14} /> Fund Wallet
                    </button>
                    <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* Fund Wallet Modal */}
            {showFundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Fund Wallet</h3>
                        <p className="text-sm text-slate-500 mb-6">Enter the amount you wish to add to your platform wallet.</p>
                        
                        <form onSubmit={handleFundWallet}>
                            <div className="mb-5">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Amount (₦)</label>
                                <input 
                                    type="number" 
                                    value={fundAmount} 
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    placeholder="e.g. 50000"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowFundModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={funding} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 hover:shadow-lg hover:shadow-indigo-500/30" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                    {funding ? 'Processing...' : 'Pay Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center p-14">
                    <div className="w-7 h-7 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Balance Hero */}
                    <div className="rounded-2xl p-6 text-white shadow-xl"
                        style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)' }}>
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <Wallet size={16} />
                            <span className="text-sm font-semibold">Available Balance</span>
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                                style={{ background: wallet?.status === 'ACTIVE' ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.3)' }}>
                                {wallet?.status || 'ACTIVE'}
                            </span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">{fmt(wallet?.balance || 0)}</div>
                        <div className="text-xs opacity-60 mt-1">{wallet?.currency || 'NGN'}</div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <ArrowUpCircle size={18} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total In</p>
                                <p className="text-lg font-bold text-emerald-600">{fmt(credits)}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                                <ArrowDownCircle size={18} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Out</p>
                                <p className="text-lg font-bold text-red-500">{fmt(debits)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                            <TrendingUp size={15} className="text-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">Transaction History</span>
                            <span className="ml-auto text-xs text-slate-400">{transactions.length} records</span>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm">No transactions yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
                                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Transaction</th>
                                            <th className="px-5 py-3">Reference</th>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                                            {TX_ICONS[tx.type]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700">
                                                                {SOURCE_LABELS[tx.source] || tx.source}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-0.5 whitespace-normal max-w-[250px] line-clamp-1">{tx.description || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-md">{tx.reference}</span>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-slate-500">
                                                    {fmtDate(tx.createdAt)}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className={`font-bold text-sm ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {tx.type === 'CREDIT' ? '+' : '-'}{fmt(tx.amount)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
            </div>
        </SettingsShell>
    );
}
