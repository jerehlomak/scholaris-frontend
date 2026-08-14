import { useState, useEffect } from 'react';
import { Home as HomeIcon, ChevronRight, CreditCard, CheckCircle2, AlertCircle, Clock, Loader2, FileText, MessageSquare, Send, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

interface FeeInvoice {
    id: string;
    studentId: string;
    admNo: string;
    name: string;
    classLevel: string;
    totalFee: number;
    amountPaid: number;
    status: 'paid' | 'partial' | 'unpaid' | 'PAID' | 'PARTIALLY_PAID' | 'OPEN' | 'SENT' | 'OVERDUE' | string;
    lastPayment: string | null;
    term: string;
    year: string;
    isDisputed?: boolean;
    disputeReason?: string;
    items?: Array<{ id: string; label: string; amount: number }>;
    ledgerEntries?: Array<{ id: string; type: string; category: string; description: string; amount: number; balanceAfter: number; date: string }>;
}

interface PaymentMethod { id: string; name: string; }
interface BankAccount { id: string; bankName: string; accountName: string; accountNumber: string; displayInstructions?: string; }

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    paid: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    partial: { label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Clock className="w-3.5 h-3.5" /> },
    unpaid: { label: 'Unpaid', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    PAID: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    PARTIALLY_PAID: { label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Clock className="w-3.5 h-3.5" /> },
    OPEN: { label: 'Unpaid', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    SENT: { label: 'Unpaid', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    OVERDUE: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

function fmt(n: number | undefined | null) { return '₦' + (Number(n) || 0).toLocaleString('en-NG'); }

function PaymentModal({ 
    invoice, 
    methods, 
    bankAccounts, 
    policy,
    childrenList = [],
    onClose,
    onPaymentSuccess
}: { 
    invoice: FeeInvoice; 
    methods: PaymentMethod[]; 
    bankAccounts: BankAccount[]; 
    policy: { allowPartialPayment: boolean; allowOverpayment: boolean; allowWalletCheckout?: boolean; allowFamilyWalletSharing?: boolean };
    childrenList?: any[];
    onClose: () => void;
    onPaymentSuccess?: () => void;
}) {
    const studentData = childrenList.find(c => c.id === invoice.studentId);
    const studentWalletBal = Number(studentData?.walletBalance || 0);

    const siblingWallets = (policy.allowFamilyWalletSharing !== false)
        ? childrenList.filter(c => c.id !== invoice.studentId && Number(c.walletBalance || 0) > 0)
        : [];

    const hasWalletCredit = policy.allowWalletCheckout !== false && (studentWalletBal > 0 || siblingWallets.length > 0);

    // Initial gateway selection: if wallet has credit, allow selecting it
    const defaultGateway = hasWalletCredit && studentWalletBal > 0 
        ? 'WALLET' 
        : (methods.length > 0 ? methods[0].id : (hasWalletCredit ? 'WALLET' : ''));

    const [gateway, setGateway] = useState(defaultGateway);
    const [selectedWalletStudentId, setSelectedWalletStudentId] = useState(
        studentWalletBal > 0 ? invoice.studentId : (siblingWallets[0]?.id || invoice.studentId)
    );
    const [processing, setProcessing] = useState(false);
    const [topupMode, setTopupMode] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');
    
    const outstanding = Math.max(0, (invoice.totalFee || 0) - (invoice.amountPaid || 0));
    
    // Active wallet calculation
    const activeWalletOwner = childrenList.find(c => c.id === selectedWalletStudentId);
    const activeWalletBal = Number(activeWalletOwner?.walletBalance || 0);
    const maxWalletApplicable = Math.min(outstanding, activeWalletBal);

    const initialAmount = defaultGateway === 'WALLET' ? String(maxWalletApplicable || outstanding) : String(outstanding);
    const [paymentAmount, setPaymentAmount] = useState<string>(initialAmount);
    
    // Bank Transfer states
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
    const [senderName, setSenderName] = useState('');
    const [senderBank, setSenderBank] = useState('');
    const [transferRef, setTransferRef] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [selectedBankAcc, setSelectedBankAcc] = useState(bankAccounts.length > 0 ? bankAccounts[0].id : '');

    const numAmount = parseFloat(paymentAmount) || 0;
    const remainingAfter = Math.max(0, outstanding - numAmount);
    const isOverpayment = numAmount > outstanding;

    const handlePay = async () => {
        if (!gateway) return toast.error('No payment method selected');
        
        if (gateway === 'WALLET') {
            if (numAmount <= 0) return toast.error('Please enter a valid wallet amount');
            if (numAmount > activeWalletBal) {
                return toast.error(`Insufficient wallet balance. Available: ${fmt(activeWalletBal)}`);
            }
            if (numAmount > outstanding) {
                return toast.error(`Amount cannot exceed invoice outstanding balance (${fmt(outstanding)})`);
            }
            if (!policy.allowPartialPayment && numAmount < outstanding) {
                return toast.error(`Partial payment is disabled. Full payment of ${fmt(outstanding)} is required.`);
            }

            setProcessing(true);
            try {
                const res = await axios.post('/api/v1/finance-v2/wallet/apply', {
                    invoiceId: invoice.id,
                    studentId: selectedWalletStudentId,
                    amount: numAmount,
                    sourceType: 'STUDENT'
                }, { withCredentials: true });

                toast.success(res.data?.msg || 'Payment successful from wallet!');
                if (onPaymentSuccess) onPaymentSuccess();
                onClose();
            } catch (err: any) {
                toast.error(err.response?.data?.msg || 'Wallet payment failed');
            } finally {
                setProcessing(false);
            }
            return;
        }

        if (!topupMode) {
            if (numAmount <= 0) {
                return toast.error('Please enter a valid payment amount greater than ₦0');
            }
            if (!policy.allowOverpayment && numAmount > outstanding) {
                return toast.error(`Maximum payment allowed is ${fmt(outstanding)} (Overpayments disabled)`);
            }
            if (!policy.allowPartialPayment && numAmount < outstanding) {
                return toast.error(`Partial payment is disabled. Full payment of ${fmt(outstanding)} is required.`);
            }
        }

        setProcessing(true);

        try {
            if (gateway === 'BANK_TRANSFER') {
                if (!senderName || !evidenceFile) {
                    setProcessing(false);
                    return toast.error('Sender name and evidence file are required for Bank Transfer');
                }
                const formData = new FormData();
                formData.append('invoiceId', invoice.id);
                formData.append('studentId', invoice.studentId);
                formData.append('bankAccountId', selectedBankAcc);
                formData.append('amount', String(numAmount));
                formData.append('transferDate', new Date(transferDate).toISOString());
                formData.append('senderName', senderName);
                if (senderBank) formData.append('senderBank', senderBank);
                if (transferRef) formData.append('transferReference', transferRef);
                formData.append('evidence', evidenceFile);

                await axios.post('/api/v1/finance-v2/transfers', formData, { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Transfer submitted for review');
                if (onPaymentSuccess) onPaymentSuccess();
                onClose();
            } else if (topupMode) {
                // Wallet top-up via selected gateway
                const amount = Number(topupAmount);
                if (!amount || amount < 100) { setProcessing(false); return toast.error('Minimum top-up is ₦100'); }
                const res = await axios.post('/api/v1/finance-v2/pay/wallet-deposit', {
                    studentId: invoice.studentId,
                    amount,
                    gateway
                }, { withCredentials: true });
                if (res.data.authorizationUrl || res.data.checkoutUrl) {
                    window.location.href = res.data.authorizationUrl || res.data.checkoutUrl;
                } else {
                    throw new Error('Wallet deposit initialization failed');
                }
            } else if (['FLUTTERWAVE', 'PAYSTACK', 'MONNIFY', 'ONLINE'].includes(gateway) || !gateway) {
                const res = await axios.post('/api/v1/finance-v2/pay/initialize', {
                    invoiceId: invoice.id,
                    studentId: invoice.studentId,
                    amount: numAmount,
                    gateway
                }, { withCredentials: true });
                if (res.data.authorizationUrl || res.data.checkoutUrl) {
                    window.location.href = res.data.authorizationUrl || res.data.checkoutUrl;
                } else {
                    throw new Error(`${gateway} payment initialization failed`);
                }
            } else {
                toast.error('Payment initialization for this gateway is pending implementation.');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.msg || 'Error processing payment');
        } finally {
            setProcessing(false);
        }
    };
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm lg:max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-gray-900">Pay Fees Online</h3>
                    <p className="text-xs text-gray-400 mt-1">Complete your child's school fees.</p>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Student:</span><span className="font-bold">{invoice.name}</span>
                    </div>

                    {/* Wallet Notice if available */}
                    {hasWalletCredit && (
                        <div className="bg-[#1E4DA6]/5 border border-[#1E4DA6]/20 rounded-xl p-3.5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-[#0E2450]">Available Wallet Balance</p>
                                <p className="text-sm font-extrabold text-[#173F8C]">{fmt(studentWalletBal)} {studentWalletBal > 0 ? '(Student)' : ''}</p>
                                {siblingWallets.length > 0 && (
                                    <p className="text-[11px] text-[#1E4DA6] mt-0.5">+ {siblingWallets.length} sibling wallet(s) available for sharing</p>
                                )}
                            </div>
                            <Button 
                                type="button"
                                size="sm" 
                                variant={gateway === 'WALLET' ? 'default' : 'outline'}
                                className={gateway === 'WALLET' ? 'bg-[#1E4DA6] hover:bg-[#173F8C] text-white text-xs' : 'border-[#1E4DA6]/35 text-[#173F8C] text-xs hover:bg-[#1E4DA6]/10'}
                                onClick={() => {
                                    setGateway('WALLET');
                                    setTopupMode(false);
                                    setPaymentAmount(String(maxWalletApplicable || outstanding));
                                }}
                            >
                                {gateway === 'WALLET' ? '✓ Wallet Selected' : 'Use Wallet Credit'}
                            </Button>
                        </div>
                    )}

                    {!topupMode && (
                        policy.allowPartialPayment ? (
                            <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                <div className="flex justify-between items-center text-xs">
                                    <label className="font-bold text-slate-700">Amount to Pay (₦) *</label>
                                    <span className="text-slate-500 font-medium">Total Due: <strong className="text-slate-800">{fmt(outstanding)}</strong></span>
                                </div>
                                <Input
                                    type="number"
                                    min={1}
                                    max={gateway === 'WALLET' ? activeWalletBal : (policy.allowOverpayment ? undefined : outstanding)}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="h-11 text-base font-bold text-slate-900 bg-white border-slate-300 focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6]"
                                    placeholder="Enter amount"
                                />
                                <div className="flex justify-between items-center text-[11px] pt-1">
                                    {gateway === 'WALLET' ? (
                                        <span className="text-[#173F8C] font-medium">
                                            Wallet balance after payment: <strong>{fmt(Math.max(0, activeWalletBal - numAmount))}</strong>
                                        </span>
                                    ) : isOverpayment ? (
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                            Overpayment: +{fmt(numAmount - outstanding)} (Credited to Wallet)
                                        </span>
                                    ) : numAmount < outstanding ? (
                                        <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                                            Remaining balance after payment: <strong>{fmt(remainingAfter)}</strong>
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 font-medium">Full invoice payment</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm font-bold border-t pt-3">
                                <span className="text-red-600">Amount Due:</span><span className="text-red-600">{fmt(outstanding)}</span>
                            </div>
                        )
                    )}
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Payment Method</label>
                        <select 
                            value={gateway} 
                            onChange={(e) => {
                                setGateway(e.target.value);
                                if (e.target.value === 'WALLET') {
                                    setPaymentAmount(String(maxWalletApplicable || outstanding));
                                }
                            }} 
                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6]"
                        >
                            {hasWalletCredit && <option value="WALLET">💳 Student / Family Wallet Credit</option>}
                            {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    {/* Sibling wallet selector when WALLET is selected */}
                    {gateway === 'WALLET' && (
                        <div className="space-y-3 p-3.5 bg-[#1E4DA6]/8 border border-[#1E4DA6]/20 rounded-xl">
                            {siblingWallets.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-[#0E2450] block mb-1">Deduct Credit From:</label>
                                    <select 
                                        value={selectedWalletStudentId} 
                                        onChange={(e) => {
                                            setSelectedWalletStudentId(e.target.value);
                                            const owner = childrenList.find(c => c.id === e.target.value);
                                            const bal = Number(owner?.walletBalance || 0);
                                            setPaymentAmount(String(Math.min(outstanding, bal)));
                                        }}
                                        className="w-full border border-[#1E4DA6]/20 rounded-lg p-2 text-xs bg-white text-[#081634] font-medium"
                                    >
                                        <option value={invoice.studentId}>
                                            {invoice.name}'s Wallet (₦{studentWalletBal.toLocaleString()} available)
                                        </option>
                                        {siblingWallets.map(sib => (
                                            <option key={sib.id} value={sib.id}>
                                                {sib.name || `${sib.firstName} ${sib.lastName}`}'s Wallet (₦{Number(sib.walletBalance || 0).toLocaleString()} available - Sibling)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-[#122F69]">
                                <span>Available Credit: <strong>{fmt(activeWalletBal)}</strong></span>
                                <button 
                                    type="button" 
                                    onClick={() => setPaymentAmount(String(maxWalletApplicable))}
                                    className="font-bold underline text-[#173F8C] hover:text-[#0E2450]"
                                >
                                    Use Maximum ({fmt(maxWalletApplicable)})
                                </button>
                            </div>
                        </div>
                    )}

                    {gateway !== 'WALLET' && (
                        <div className="text-center space-y-2 pt-1">
                            <p className="text-gray-400 text-xs">— or —</p>
                            <button
                                type="button"
                                onClick={() => setTopupMode((t: boolean) => !t)}
                                className="text-xs text-[#1E4DA6] font-semibold underline hover:text-[#173F8C]"
                            >
                                {topupMode ? 'Pay invoice directly instead' : 'Top-up wallet first (pay later)'}
                            </button>
                            {topupMode && (
                                <div className="text-left mt-2">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Wallet Top-up Amount (₦)</label>
                                    <input
                                        type="number"
                                        min={100}
                                        value={topupAmount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopupAmount(e.target.value)}
                                        placeholder="e.g. 50000"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6]"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Funds will be credited to the student's wallet via Paystack.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {gateway === 'BANK_TRANSFER' && (
                        bankAccounts.length > 0 ? (
                            <div className="space-y-4 mt-2 border-t pt-2">
                                <div className="p-3 bg-[#1E4DA6]/5 border border-[#1E4DA6]/10 rounded-lg">
                                    <label className="text-xs font-bold text-[#0E2450] block mb-1">Pay Into School Bank Account:</label>
                                    <select value={selectedBankAcc} onChange={e => setSelectedBankAcc(e.target.value)} className="w-full text-xs p-2 rounded border-[#1E4DA6]/20 bg-white mb-2">
                                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.accountName})</option>)}
                                    </select>
                                    {bankAccounts.find(b => b.id === selectedBankAcc)?.displayInstructions && (
                                        <p className="text-[10px] text-[#122F69] italic">{bankAccounts.find(b => b.id === selectedBankAcc)?.displayInstructions}</p>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] uppercase font-bold text-gray-500">Sender Name *</label><Input className="h-8 text-xs" value={senderName} onChange={e => setSenderName(e.target.value)} /></div>
                                    <div><label className="text-[10px] uppercase font-bold text-gray-500">Transfer Date *</label><Input type="date" className="h-8 text-xs" value={transferDate} onChange={e => setTransferDate(e.target.value)} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] uppercase font-bold text-gray-500">Sender Bank</label><Input className="h-8 text-xs" value={senderBank} onChange={e => setSenderBank(e.target.value)} /></div>
                                    <div><label className="text-[10px] uppercase font-bold text-gray-500">Reference/Narration</label><Input className="h-8 text-xs" value={transferRef} onChange={e => setTransferRef(e.target.value)} /></div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Upload Receipt/Evidence *</label>
                                    <Input type="file" accept="image/*,.pdf" className="h-9 text-xs" onChange={e => setEvidenceFile(e.target.files ? e.target.files[0] : null)} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 mt-2">
                                The school has not provided any active bank account details for direct transfer yet. Please contact the administration.
                            </div>
                        )
                    )}
                </div>
                <div className="px-5 p-4 border-t flex gap-2 shrink-0">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button 
                        onClick={handlePay} 
                        disabled={processing || (!hasWalletCredit && methods.length === 0)} 
                        className={`flex-1 text-white ${gateway === 'WALLET' ? 'bg-[#1E4DA6] hover:bg-[#173F8C]' : 'bg-[#1E4DA6] hover:bg-[#173F8C]'}`}
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (gateway === 'WALLET' ? `Pay ${fmt(numAmount)} from Wallet` : 'Confirm Payment')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ParentFees() {
    const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [replyText, setReplyText] = useState('');
    const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [payingInvoice, setPayingInvoice] = useState<FeeInvoice | null>(null);
    const [disputingInvoice, setDisputingInvoice] = useState<FeeInvoice | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeFile, setDisputeFile] = useState<File | null>(null);
    const [submittingDispute, setSubmittingDispute] = useState(false);
    const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
    const [childrenList, setChildrenList] = useState<any[]>([]);
    
    // Gateway settings
    const [activeMethods, setActiveMethods] = useState<PaymentMethod[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [paymentPolicy, setPaymentPolicy] = useState<{ 
        allowPartialPayment: boolean; 
        allowOverpayment: boolean;
        allowWalletCheckout?: boolean;
        allowFamilyWalletSharing?: boolean;
    }>({
        allowPartialPayment: true,
        allowOverpayment: false,
        allowWalletCheckout: true,
        allowFamilyWalletSharing: true
    });

    const refreshData = async () => {
        try {
            const [invRes, dashRes] = await Promise.all([
                axios.get('/api/v1/finance/my-invoices', { withCredentials: true }),
                axios.get('/api/v1/dashboard/me', { withCredentials: true })
            ]);
            setInvoices(invRes.data.fees || []);
            setChildrenList(dashRes.data.children || []);
        } catch (err) {
            console.error('Error refreshing parent invoices', err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, dashRes, methodsRes, banksRes] = await Promise.all([
                    axios.get('/api/v1/finance/my-invoices', { withCredentials: true }),
                    axios.get('/api/v1/dashboard/me', { withCredentials: true }),
                    axios.get('/api/v1/finance-v2/payment-settings/active-methods', { withCredentials: true }).catch(() => ({ data: { methods: [] } })),
                    axios.get('/api/v1/finance-v2/bank-accounts', { withCredentials: true }).catch(() => ({ data: { accounts: [] } }))
                ]);
                
                setInvoices(invRes.data.fees);
                setChildrenList(dashRes.data.children || []);
                setActiveMethods(methodsRes.data.methods || []);
                setPaymentPolicy({
                    allowPartialPayment: methodsRes.data.allowPartialPayment ?? true,
                    allowOverpayment: methodsRes.data.allowOverpayment ?? false,
                    allowWalletCheckout: methodsRes.data.allowWalletCheckout ?? true,
                    allowFamilyWalletSharing: methodsRes.data.allowFamilyWalletSharing ?? true
                });
                setBankAccounts(banksRes.data.accounts || []);
                setSettings(dashRes.data.settings || null);
                
                if (dashRes.data.children && dashRes.data.children.length > 0) {
                    setSelectedChildId(dashRes.data.children[0].id);
                }
            } catch (error) {
                console.error("Error fetching parent data", error);
                toast.error("Failed to load fee information");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

        const handleDispute = async () => {
        if (!disputeReason && !disputeFile) {
            return toast.error('Please provide a reason or attach evidence.');
        }
        setSubmittingDispute(true);
        try {
            const formData = new FormData();
            formData.append('reason', disputeReason);
            if (disputeFile) formData.append('evidence', disputeFile);

            await axios.post('/api/v1/finance-v2/invoices/' + disputingInvoice?.id + '/dispute', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Dispute submitted successfully');
            setDisputingInvoice(null);
            setDisputeReason('');
            setDisputeFile(null);
            // Refresh data
            const invRes = await axios.get('/api/v1/finance/my-invoices', { withCredentials: true });
            setInvoices(invRes.data.fees);
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to submit dispute');
        } finally {
            setSubmittingDispute(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center p-20 w-full"><Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" /></div>;

    const uniqueChildren = childrenList.map((c: any) => ({
        id: c.id, 
        name: c.name || `${c.firstName} ${c.lastName}`, 
        class: c.classLevel?.name || 'Class Unassigned'
    }));

    const studentInvoices = invoices.filter(i => i.studentId === selectedChildId);
    
    const totalFees = studentInvoices.reduce((s, f) => s + f.totalFee, 0);
    const totalPaid = studentInvoices.reduce((s, f) => s + f.amountPaid, 0);
    const outstanding = totalFees - totalPaid;
    
    const selectedChild = childrenList.find(c => c.id === selectedChildId);
    const walletBalance = selectedChild?.walletBalance || 0;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Fees & Payments</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and pay your children's school fees</p>
                </div>
                {uniqueChildren.length > 0 && (
                    <div className="flex gap-2">
                        <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6]">
                            {uniqueChildren.map(c => <option key={c.id} value={c.id}>{c.name} ({c.class})</option>)}
                        </select>
                    </div>
                )}
            </div>

            {studentInvoices.length === 0 ? (
                <div className="p-10 text-center bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-gray-500">No fee invoices found for the selected student.</p>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-6">
                        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Total Billed</p>
                            <p className="text-2xl font-black text-gray-900">{fmt(totalFees)}</p>
                        </Card>
                        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Total Paid</p>
                            <p className="text-2xl font-black text-emerald-600">{fmt(totalPaid)}</p>
                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.round((totalPaid / (totalFees || 1)) * 100))}%` }} />
                            </div>
                        </Card>
                        <Card className={`p-4 border shadow-sm ${outstanding > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                            <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                            <p className={`text-2xl font-black ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{outstanding > 0 ? fmt(outstanding) : 'Cleared ✓'}</p>
                        </Card>
                        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Wallet Credit</p>
                            <p className="text-2xl font-black text-[#1E4DA6]">{fmt(walletBalance)}</p>
                        </Card>
                    </div>

                    {/* Notice if wallet credit is available and there is outstanding fee */}
                    {walletBalance > 0 && outstanding > 0 && studentInvoices.some(i => (i.totalFee - i.amountPaid) > 0) && (
                        <div className="p-4 rounded-xl bg-[#1E4DA6]/5 border border-[#1E4DA6]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#1E4DA6] text-white flex items-center justify-center font-bold text-lg">₦</div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#081634]">You have {fmt(walletBalance)} available in credit</h4>
                                    <p className="text-xs text-[#173F8C]">You can apply your wallet credit directly to settle outstanding invoices without debiting your bank card.</p>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white shrink-0 text-xs"
                                onClick={() => {
                                    const openInv = studentInvoices.find(i => (i.totalFee - i.amountPaid) > 0);
                                    if (openInv) setPayingInvoice(openInv);
                                }}
                            >
                                Pay Invoice with Credit
                            </Button>
                        </div>
                    )}

                    {/* Invoice List */}
                    <div className="space-y-4">
                        {studentInvoices.map((invoice) => {
                            const isExpanded = expandedInvoiceId === invoice.id;
                            const isPaid = invoice.status === 'paid' || invoice.status === 'PAID';
                            const balanceDue = invoice.totalFee - invoice.amountPaid;
                            const cfg = STATUS_CFG[invoice.status] || STATUS_CFG.unpaid;

                            return (
                                <Card key={invoice.id} className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#1E4DA6]/5 text-[#1E4DA6] flex items-center justify-center shrink-0">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900">{invoice.term} Term Fee ({invoice.year})</h3>
                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                        {cfg.icon}
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Student: <span className="font-medium text-gray-700">{invoice.name}</span> • ID: {invoice.admNo}</p>
                                                {invoice.lastPayment && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Last Payment: {new Date(invoice.lastPayment).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end w-full md:w-auto">
                                            <div className="text-right flex md:flex-col justify-between w-full md:w-auto items-center md:items-end mb-3 md:mb-0">
                                                <div>
                                                    <div className="text-xs text-gray-400">Total Billed</div>
                                                    <div className="text-lg font-black text-gray-900">{fmt(invoice.totalFee)}</div>
                                                </div>
                                                {balanceDue > 0 && (
                                                    <div className="md:mt-1">
                                                        <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">Due: {fmt(balanceDue)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-3 w-full md:w-auto">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                                                    className="text-xs text-gray-500 hover:text-gray-900"
                                                >
                                                    {isExpanded ? 'Hide Details' : 'View Breakdown'}
                                                </Button>

                                                {!isPaid && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => setPayingInvoice(invoice)}
                                                        className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white text-xs font-semibold px-4"
                                                    >
                                                        Pay Now
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown & Ledger Accordion */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-100 bg-gray-50/50 p-5"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Breakdown */}
                                                    <div>
                                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invoice Details</h5>
                                                        <div className="space-y-2">
                                                            {settings?.showItemizedBreakdown !== false ? (
                                                                <>
                                                                    {invoice.items && invoice.items.length > 0 ? invoice.items.map(item => (
                                                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                                                            <span className="text-gray-600 font-medium">{item.label}</span>
                                                                            <span className="text-gray-900 font-bold">{fmt(item.amount)}</span>
                                                                        </div>
                                                                    )) : (
                                                                        <div className="text-sm text-gray-500 italic">No item breakdown available.</div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-600 font-medium">School Fees</span>
                                                                    <span className="text-gray-900 font-bold">{fmt(invoice.totalFee)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 mt-2">
                                                                <span className="text-gray-500 font-bold">Total Formulated</span>
                                                                <span className="text-gray-900 font-black">{fmt(invoice.totalFee)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Ledger / History */}
                                                    <div>
                                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Ledger</h5>
                                                        <div className="space-y-3">
                                                            {invoice.ledgerEntries && invoice.ledgerEntries.length > 0 ? invoice.ledgerEntries.map(entry => (
                                                                <div key={entry.id} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0">
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{entry.type === 'CREDIT' ? 'PAYMENT' : 'CHARGE'}</span>
                                                                            <span className="text-slate-700 font-semibold">{entry.description}</span>
                                                                        </div>
                                                                        <div className="text-[11px] text-slate-400 mt-0.5">{new Date(entry.date).toLocaleDateString()}</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className={`font-bold ${entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                            {entry.type === 'CREDIT' ? '-' : '+'}{fmt(entry.amount)}
                                                                        </div>
                                                                        <div className="text-[10px] text-slate-400 font-semibold">Bal: {fmt(entry.balanceAfter)}</div>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="text-sm text-gray-500 italic">No ledger entries found.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            );
                        })}
                    </div>
                </>
            )}

            <AnimatePresence>
                {payingInvoice && (
                    <PaymentModal 
                        invoice={payingInvoice} 
                        methods={activeMethods} 
                        bankAccounts={bankAccounts} 
                        policy={paymentPolicy}
                        childrenList={childrenList}
                        onClose={() => setPayingInvoice(null)} 
                        onPaymentSuccess={refreshData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
