import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Wallet, ArrowUpRight, ArrowDownRight, Loader2, Users,
    PlusCircle, CreditCard, X, Zap, ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

export default function ParentWallet() {
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<any>(null);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Top-up Modal State
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupTarget, setTopupTarget] = useState<'FAMILY' | string>('FAMILY'); // 'FAMILY' or studentId
    const [topupAmount, setTopupAmount] = useState('5000');
    const [selectedGateway, setSelectedGateway] = useState<string>('FLUTTERWAVE');
    const [processingTopup, setProcessingTopup] = useState(false);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            axios.get('/api/v1/finance-v2/my-family-wallet', { withCredentials: true }),
            axios.get('/api/v1/finance-v2/payment-settings/active-methods', { withCredentials: true }).catch(() => ({ data: { methods: [] } }))
        ])
            .then(([wRes, mRes]) => {
                setWalletData(wRes.data);
                const onlineMethods = (mRes.data.methods || []).filter((m: any) => m.id !== 'BANK_TRANSFER');
                setPaymentMethods(onlineMethods);
                if (onlineMethods.length > 0) {
                    const def = onlineMethods.find((m: any) => m.isDefault) || onlineMethods[0];
                    setSelectedGateway(def.id);
                }
            })
            .catch(() => toast.error('Failed to load wallet data'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleInitiateTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(topupAmount);
        if (!amount || amount < 100) {
            return toast.error('Please enter an amount of at least ₦100');
        }

        setProcessingTopup(true);
        try {
            const isFamily = topupTarget === 'FAMILY';
            const studentId = isFamily ? undefined : topupTarget;

            const res = await axios.post('/api/v1/finance-v2/pay/wallet-deposit', {
                studentId,
                isFamilyWallet: isFamily,
                amount,
                gateway: selectedGateway
            }, { withCredentials: true });

            if (res.data.authorizationUrl || res.data.checkoutUrl) {
                toast.success('Redirecting to secure payment checkout…');
                window.location.href = res.data.authorizationUrl || res.data.checkoutUrl;
            } else {
                throw new Error('No authorization URL returned from payment provider');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || err.response?.data?.message || 'Failed to initialize deposit');
            setProcessingTopup(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
            </div>
        );
    }

    if (!walletData) {
        return (
            <div className="p-8 text-center text-slate-500">
                Failed to load wallet data.
            </div>
        );
    }

    const familyTransactions = walletData.familyWallet?.transactions || [];

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-indigo-500 shadow-lg shadow-[#1E4DA6]/20">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Family & Student Wallets</h1>
                        <p className="mt-0.5 text-sm text-slate-500">Deposit funds online and manage balances for school fees and purchases.</p>
                    </div>
                </div>

                <Button
                    onClick={() => setShowTopupModal(true)}
                    className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-bold shadow-md shadow-[#1E4DA6]/20 flex items-center gap-2"
                >
                    <PlusCircle className="h-4 w-4" />
                    Top-Up / Fund Wallet
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-[#173F8C] to-indigo-800 border-none text-white shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-[0.08] blur-xl"></div>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Family Wallet Balance</p>
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Pooled</span>
                            </div>
                            <p className="mt-2 text-4xl font-black tracking-tight">₦{(walletData.familyWalletBalance || 0).toLocaleString('en-NG')}</p>
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                                <span className="text-white/70">Usable for any enrolled child</span>
                                <button
                                    onClick={() => { setTopupTarget('FAMILY'); setShowTopupModal(true); }}
                                    className="font-bold text-white hover:underline flex items-center gap-1"
                                >
                                    + Add Funds
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Users className="h-4 w-4 text-slate-600" /> Children's Wallets</h3>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {walletData.individualWallets?.map((sw: any) => (
                                    <div key={sw.studentId} className="flex flex-col p-4 hover:bg-slate-50/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{sw.studentName}</p>
                                                <p className="text-xs text-slate-500 font-mono">{sw.admissionNo || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900">₦{sw.balance.toLocaleString('en-NG')}</p>
                                                <button
                                                    onClick={() => { setTopupTarget(sw.studentId); setShowTopupModal(true); }}
                                                    className="text-[11px] text-[#1E4DA6] font-semibold hover:underline"
                                                >
                                                    + Top Up
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {sw.transactions?.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-100/50 border-dashed">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recent Transactions</p>
                                                <div className="space-y-1">
                                                    {sw.transactions.slice(0, 3).map((tx: any) => {
                                                        const isCredit = ['DEPOSIT', 'MANUAL_ADJUSTMENT', 'OVERPAYMENT_CREDIT', 'REFUND'].includes(tx.type);
                                                        return (
                                                            <div key={tx.id} className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-500 truncate max-w-[150px]" title={tx.description}>{tx.description}</span>
                                                                <span className={`font-semibold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {isCredit ? '+' : '-'}₦{tx.amount.toLocaleString('en-NG')}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!walletData.individualWallets || walletData.individualWallets.length === 0) && (
                                    <div className="p-6 text-center text-sm text-slate-500">No children linked to this account.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-slate-200 shadow-sm h-fit">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Wallet Activity & History</h3>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Reference</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Account</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600">Description</th>
                                        <th className="px-6 py-3 font-semibold text-slate-600 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {familyTransactions.length > 0 ? (
                                        familyTransactions.map((tx: any) => {
                                            const isCredit = ['DEPOSIT', 'MANUAL_ADJUSTMENT', 'OVERPAYMENT_CREDIT', 'REFUND'].includes(tx.type);
                                            return (
                                                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-3 text-slate-600 whitespace-nowrap text-xs">
                                                        {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="mono text-xs font-semibold text-slate-600">{tx.reference}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tx.account === 'FAMILY' ? 'bg-[#1E4DA6]/10 text-[#173F8C]' : 'bg-slate-100 text-slate-600'}`}>
                                                            {tx.account === 'FAMILY' ? 'Family Pool' : (tx.studentName || 'Child')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-800">
                                                        <span className="font-medium">{tx.description}</span>
                                                        <div className="text-[10px] uppercase text-slate-400 font-bold mt-0.5">{tx.type.replace(/_/g, ' ')}</div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className={`inline-flex items-center gap-1 font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {isCredit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                            ₦{tx.amount.toLocaleString('en-NG')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                No transactions found in Family Wallet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top-up Modal */}
            {showTopupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#1E4DA6]/5 to-indigo-50">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-[#1E4DA6]" />
                                <h3 className="font-bold text-slate-900">Fund Wallet Online</h3>
                            </div>
                            <button onClick={() => setShowTopupModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInitiateTopup} className="p-6 space-y-4">
                            {/* Target Destination */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Deposit Destination</Label>
                                <select
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                                    value={topupTarget}
                                    onChange={e => setTopupTarget(e.target.value)}
                                >
                                    <option value="FAMILY">Family Wallet (Shared Pool)</option>
                                    {walletData.individualWallets?.map((sw: any) => (
                                        <option key={sw.studentId} value={sw.studentId}>
                                            {sw.studentName}'s Student Wallet
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Amount to Deposit (₦)</Label>
                                <Input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={topupAmount}
                                    onChange={e => setTopupAmount(e.target.value)}
                                    className="h-11 text-base font-bold"
                                    placeholder="Enter amount (min ₦100)"
                                    required
                                />
                                <div className="flex gap-2 pt-1">
                                    {['2000', '5000', '10000', '25000', '50000'].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setTopupAmount(val)}
                                            className="px-2 py-1 bg-slate-100 hover:bg-[#1E4DA6]/10 hover:text-[#173F8C] rounded text-[11px] font-semibold text-slate-600 transition-colors"
                                        >
                                            ₦{Number(val).toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gateway Choice */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Payment Gateway</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedGateway('FLUTTERWAVE')}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                            selectedGateway === 'FLUTTERWAVE'
                                                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="text-xs font-extrabold text-amber-900">Flutterwave</p>
                                        <p className="text-[10px] text-slate-500">Cards, USSD, Bank Transfer</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedGateway('PAYSTACK')}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                            selectedGateway === 'PAYSTACK'
                                                ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="text-xs font-extrabold text-teal-900">Paystack</p>
                                        <p className="text-[10px] text-slate-500">Cards, QR, Bank Debit</p>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={processingTopup}
                                    className="w-full h-11 bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-bold rounded-xl shadow-md shadow-[#1E4DA6]/20"
                                >
                                    {processingTopup ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Initializing Payment…
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" /> Pay ₦{Number(topupAmount || 0).toLocaleString()} Securely
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
