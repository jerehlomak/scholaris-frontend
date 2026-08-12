import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, Wallet, ArrowUpRight, ArrowDownRight, Loader2, Check, ChevronDown, ChevronRight, Users, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import ReceiptPrintModal from './components/ReceiptPrintModal';

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200 ${className}`} />;
}

// ─── Fund Wallet Modal ────────────────────────────────────────────────────────
function FundWalletModal({ targetId, mode, onClose, onSuccess }: { targetId: string; mode: 'STUDENT' | 'FAMILY'; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('DEPOSIT');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = mode === 'STUDENT' ? { studentId: targetId } : { parentId: targetId };
            await axios.post('/api/v1/finance-v2/wallet/fund', {
                ...payload,
                amount: Number(amount),
                type,
                description: description || (type === 'DEPOSIT' ? 'Wallet Deposit' : 'Manual Adjustment')
            }, { withCredentials: true });
            toast.success('Wallet funded successfully');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to fund wallet');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Fund {mode === 'STUDENT' ? 'Student' : 'Family'} Wallet</h2>
                    <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <span className="text-xs font-bold px-1">✕</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₦)</label>
                        <Input type="number" required min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 50000" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Transaction Type</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={type} onChange={e => setType(e.target.value)}>
                            <option value="DEPOSIT">Deposit (Cash / Transfer)</option>
                            <option value="MANUAL_ADJUSTMENT">Manual Adjustment (Credit)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                        <Input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. PTA Levies Deposit" />
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                            Process Funding
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Allocate Credit Modal (Option C) ──────────────────────────────────────────
function AllocateCreditModal({ 
    targetId, 
    mode, 
    walletBalance, 
    onClose, 
    onSuccess 
}: { 
    targetId: string; 
    mode: 'STUDENT' | 'FAMILY'; 
    walletBalance: number; 
    onClose: () => void; 
    onSuccess: () => void; 
}) {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const queryParam = mode === 'STUDENT' ? `studentId=${targetId}` : `parentId=${targetId}`;
                const res = await axios.get(`/api/v1/finance-v2/wallet/invoices?${queryParam}`, { withCredentials: true });
                const openInvoices = res.data.invoices || [];
                setInvoices(openInvoices);
                if (openInvoices.length > 0) {
                    setSelectedInvoiceId(openInvoices[0].id);
                    const balDue = Math.max(0, (openInvoices[0].totalAmount || openInvoices[0].totalFee || 0) - (openInvoices[0].paidAmount || openInvoices[0].amountPaid || 0));
                    setAmount(String(Math.min(walletBalance, balDue)));
                }
            } catch (err: any) {
                toast.error(err.response?.data?.msg || 'Failed to fetch open invoices');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, [targetId, mode, walletBalance]);

    const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
    const invoiceDue = selectedInvoice 
        ? Math.max(0, (selectedInvoice.totalAmount || selectedInvoice.totalFee || 0) - (selectedInvoice.paidAmount || selectedInvoice.amountPaid || 0)) 
        : 0;
    const maxApplicable = Math.min(walletBalance, invoiceDue);

    const handleSelectInvoice = (id: string) => {
        setSelectedInvoiceId(id);
        const inv = invoices.find(i => i.id === id);
        if (inv) {
            const due = Math.max(0, (inv.totalAmount || inv.totalFee || 0) - (inv.paidAmount || inv.amountPaid || 0));
            setAmount(String(Math.min(walletBalance, due)));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) return toast.error('Please enter a valid amount');
        if (numAmount > walletBalance) return toast.error(`Amount exceeds available wallet balance (₦${walletBalance.toLocaleString()})`);
        if (numAmount > invoiceDue) return toast.error(`Amount exceeds invoice balance due (₦${invoiceDue.toLocaleString()})`);

        setSubmitting(true);
        try {
            const payload: any = {
                invoiceId: selectedInvoiceId,
                amount: numAmount,
                sourceType: mode
            };
            if (mode === 'STUDENT') payload.studentId = targetId;
            else payload.parentId = targetId;

            const res = await axios.post('/api/v1/finance-v2/wallet/apply', payload, { withCredentials: true });
            toast.success(res.data?.msg || 'Credit allocated successfully');
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to allocate credit');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="font-bold text-slate-900">Allocate Wallet Credit to Invoices</h2>
                        <p className="text-xs text-slate-500">Apply available balance across student or sibling invoices.</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <span className="text-xs font-bold px-1">✕</span>
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Wallet summary banner */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-purple-900">Available Wallet Balance</p>
                            <p className="text-xl font-black text-purple-700">₦{walletBalance.toLocaleString('en-NG')}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-purple-200 text-purple-800 rounded-md">
                            {mode === 'STUDENT' ? 'Student Wallet' : 'Family Wallet'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-purple-600" /> Finding open invoices...
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="font-medium text-slate-700">No unpaid invoices found</p>
                            <p className="text-xs text-slate-400 mt-1">All invoices for this {mode === 'STUDENT' ? 'student' : 'family'} have already been cleared.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Select Open Invoice
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {invoices.map(inv => {
                                        const due = Math.max(0, (inv.totalAmount || inv.totalFee || 0) - (inv.paidAmount || inv.amountPaid || 0));
                                        const isSelected = selectedInvoiceId === inv.id;
                                        const studentName = inv.student?.user?.name || inv.student?.firstName ? `${inv.student?.firstName} ${inv.student?.lastName}` : (inv.name || 'Student');
                                        const className = inv.student?.classLevel?.name || inv.classLevel || '';

                                        return (
                                            <div 
                                                key={inv.id}
                                                onClick={() => handleSelectInvoice(inv.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-sm text-slate-900">{studentName}</span>
                                                            {className && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{className}</span>}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{inv.term || 'Term'} Fee ({inv.year || inv.academicYear || ''}) • {inv.invoiceNumber || inv.id.slice(-6)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-red-600">Due: ₦{due.toLocaleString('en-NG')}</span>
                                                        <div className="text-[10px] text-slate-400">Total: ₦{(inv.totalAmount || inv.totalFee || 0).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedInvoice && (
                                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-700">Amount to Allocate (₦) *</label>
                                        <button
                                            type="button"
                                            onClick={() => setAmount(String(maxApplicable))}
                                            className="text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                                        >
                                            Use Maximum (₦{maxApplicable.toLocaleString('en-NG')})
                                        </button>
                                    </div>
                                    <Input 
                                        type="number" 
                                        required 
                                        min={1} 
                                        max={maxApplicable} 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)} 
                                        placeholder="e.g. 25000" 
                                        className="h-10 text-base font-bold text-slate-900 bg-white"
                                    />
                                    <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                                        <span>Wallet after allocation: <strong>₦{Math.max(0, walletBalance - (Number(amount) || 0)).toLocaleString()}</strong></span>
                                        <span>Invoice balance after: <strong>₦{Math.max(0, invoiceDue - (Number(amount) || 0)).toLocaleString()}</strong></span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-2 border-t">
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button 
                                    type="submit" 
                                    disabled={submitting || !selectedInvoiceId || Number(amount) <= 0} 
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                                >
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Confirm Allocation
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function WalletLedger() {
    const [mode, setMode] = useState<'STUDENT' | 'FAMILY'>('STUDENT');
    const [targetId, setTargetId] = useState('');
    const [loading, setLoading] = useState(false);
    const [walletData, setWalletData] = useState<any>(null);
    const [listData, setListData] = useState<any[]>([]);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const [showFundModal, setShowFundModal] = useState(false);
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [printTx, setPrintTx] = useState<any>(null);
    const [receiptSettings, setReceiptSettings] = useState<any>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        axios.get('/api/v1/finance-v2/settings', { withCredentials: true })
            .then(res => setReceiptSettings(res.data.settings))
            .catch(() => {});
    }, []);

    const openReceipt = (tx: any) => {
        const isFamilyLine = mode === 'FAMILY' && tx.account === 'FAMILY';
        setPrintTx({
            receipt: { receiptNumber: tx.reference, invoiceNumbers: [] },
            amount: tx.amount,
            createdAt: tx.createdAt,
            method: (tx.type || 'DEPOSIT').replace(/_/g, ' '),
            reference: tx.reference,
            student: {
                user: { name: isFamilyLine ? selectedTarget?.user?.name || selectedTarget?.name : (tx.studentName || selectedTarget?.user?.name || selectedTarget?.name) },
                admissionNo: isFamilyLine ? 'Family Account' : (tx.admissionNo || selectedTarget?.admissionNo || ''),
            },
        });
    };

    const loadList = () => {
        setLoadingList(true);
        const url = mode === 'STUDENT' ? '/api/v1/students/all' : '/api/v1/parents/all';
        axios.get(url, { withCredentials: true })
            .then(res => {
                setListData(mode === 'STUDENT' ? res.data.students || [] : res.data.parents || []);
            })
            .catch(() => toast.error(`Failed to load ${mode.toLowerCase()}s`))
            .finally(() => setLoadingList(false));
    };

    useEffect(() => {
        loadList();
        setTargetId('');
        setWalletData(null);
    }, [mode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchWallet = async (selectedId: string) => {
        if (!selectedId) return;
        setLoading(true);
        try {
            const url = mode === 'STUDENT' 
                ? `/api/v1/finance-v2/wallet/${selectedId}`
                : `/api/v1/finance-v2/wallet/family/${selectedId}`;
            const { data } = await axios.get(url, { withCredentials: true });
            
            if (mode === 'STUDENT') {
                if (data?.wallet) setWalletData(data);
            } else {
                if (data?.familyWallet) setWalletData(data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to load wallet data.');
            setWalletData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (selectedId: string) => {
        setTargetId(selectedId);
        setOpenDropdown(false);
        setSearchQuery(""); 
        fetchWallet(selectedId);
    };

    const selectedTarget = listData.find(s => s.id === targetId);
    const filteredList = listData.filter(s => {
        const name = (s.user?.name || s.name || '').toLowerCase();
        const ident = (s.admissionNo || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase()) || ident.includes(searchQuery.toLowerCase());
    });

    const displayBalance = mode === 'STUDENT' 
        ? walletData?.wallet?.balance 
        : walletData?.familyWalletBalance;

    const displayStatus = mode === 'STUDENT'
        ? walletData?.wallet?.status
        : walletData?.familyWallet?.status;

    const transactions = mode === 'STUDENT'
        ? walletData?.transactions || []
        : walletData?.familyWallet?.transactions || [];

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fd-root,.fd-root *{font-family:'Plus Jakarta Sans',sans-serif!important} .fd-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fd-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-full">

                    {/* Breadcrumb */}
                    <div className="mb-5 flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Wallet / Ledger</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-500 shadow-lg shadow-purple-200">
                                <Wallet className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Wallet / Ledger</h1>
                                <p className="mt-0.5 text-sm text-slate-500">Inspect student & family wallet balances and ledger logs.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    onClick={() => setMode('STUDENT')}
                                    className={`px-4 py-2 text-sm font-medium border ${mode === 'STUDENT' ? 'bg-purple-50 border-purple-200 text-purple-700 z-10 rounded-l-md' : 'bg-white border-slate-200 text-slate-700 rounded-l-md hover:bg-slate-50'}`}
                                >
                                    Student Wallet
                                </button>
                                <button
                                    onClick={() => setMode('FAMILY')}
                                    className={`px-4 py-2 text-sm font-medium border-y border-r ${mode === 'FAMILY' ? 'bg-purple-50 border-purple-200 text-purple-700 z-10 rounded-r-md' : 'bg-white border-slate-200 text-slate-700 rounded-r-md hover:bg-slate-50'}`}
                                >
                                    Family Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                
                    <div className="mb-8 flex flex-col sm:flex-row gap-4 max-w-xl">
                        <div className="relative flex-1" ref={dropdownRef}>
                            <Button 
                                variant="outline" 
                                onClick={() => setOpenDropdown(!openDropdown)}
                                className="w-full justify-between bg-white overflow-hidden text-left border-slate-300"
                            >
                                {selectedTarget ? (
                                    <span className="truncate block max-w-[250px]">
                                        {selectedTarget.user?.name || selectedTarget.name} {selectedTarget.admissionNo ? `(${selectedTarget.admissionNo})` : ''}
                                    </span>
                                ) : (
                                    <span className="text-slate-500 font-normal">Select a {mode === 'STUDENT' ? 'student' : 'parent'}...</span>
                                )}
                                <ChevronDown className={`ml-2 h-4 w-4 shrink-0 transition-transform ${openDropdown ? 'rotate-180' : ''}`} />
                            </Button>
                            
                            {openDropdown && (
                                <div className="absolute top-12 left-0 right-0 z-50 rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="text"
                                                placeholder="Search name or ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-purple-500 focus:bg-white transition-colors"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1">
                                        {loadingList ? (
                                            <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading {mode.toLowerCase()}s...
                                            </div>
                                        ) : filteredList.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-500">
                                                No {mode.toLowerCase()} found.
                                            </div>
                                        ) : (
                                            filteredList.map((item) => (
                                                <button 
                                                    key={item.id} 
                                                    onClick={() => handleSelect(item.id)}
                                                    className="w-full flex items-center justify-between rounded-md p-2 hover:bg-slate-50 text-left transition-colors"
                                                >
                                                    <div className="flex flex-col truncate pr-2">
                                                        <span className="text-sm font-medium text-slate-900 truncate">
                                                            {item.user?.name || item.name}
                                                        </span>
                                                        {mode === 'STUDENT' && <span className="text-xs text-slate-400">ID: {item.admissionNo || item.id.slice(-6)}</span>}
                                                    </div>
                                                    {targetId === item.id && <Check className="h-4 w-4 text-purple-600 shrink-0" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {targetId && (
                            <div className="flex gap-2">
                                <Button onClick={() => setShowFundModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                                    <ArrowDownRight className="mr-2 h-4 w-4" /> Fund Wallet
                                </Button>
                                {Number(displayBalance || 0) > 0 && (
                                    <Button onClick={() => setShowAllocateModal(true)} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 shadow-sm">
                                        <ArrowUpRight className="mr-2 h-4 w-4" /> Allocate to Invoices
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <Skeleton className="h-[400px] w-full rounded-2xl" />
                        </div>
                    ) : walletData ? (
                        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                            <div className="flex flex-col gap-6">
                                <Card className="h-fit bg-purple-600 border-none text-white shadow-lg overflow-hidden relative">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-[0.05] blur-xl"></div>
                                    <CardContent className="p-6">
                                        <p className="text-purple-100 text-sm font-medium">Available Balance</p>
                                        <p className="mt-2 text-4xl font-bold tracking-tight">₦{(displayBalance || 0).toLocaleString('en-NG')}</p>
                                        
                                        <div className="mt-8 pt-6 border-t border-purple-500/50">
                                            <p className="text-xs text-purple-200">Status</p>
                                            <p className="font-semibold">{displayStatus || 'ACTIVE'}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {mode === 'FAMILY' && (
                                    <Card className="h-fit border-slate-200 overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                                            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Individual Wallets</h3>
                                        </div>
                                        <CardContent className="p-0">
                                            <div className="divide-y divide-slate-100">
                                                {walletData.individualWallets?.map((sw: any) => (
                                                    <div key={sw.studentId} className="flex justify-between items-center p-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{sw.studentName}</p>
                                                            <p className="text-xs text-slate-500">{sw.admissionNo || 'N/A'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-slate-900">₦{sw.balance.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!walletData.individualWallets || walletData.individualWallets.length === 0) && (
                                                    <div className="p-4 text-center text-sm text-slate-500">No linked students found</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <Card className="border-slate-200 shadow-sm overflow-hidden h-fit">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900">Transaction Ledger</h3>
                                </div>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                                    <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                                                    <th className="px-6 py-3 font-semibold text-slate-600">Ref</th>
                                                    {mode === 'FAMILY' && <th className="px-6 py-3 font-semibold text-slate-600">Account</th>}
                                                    <th className="px-6 py-3 font-semibold text-slate-600">Description</th>
                                                    <th className="px-6 py-3 font-semibold text-slate-600 text-right">Amount</th>
                                                    <th className="px-6 py-3 font-semibold text-slate-600 text-right">Balance</th>
                                                    <th className="px-6 py-3 font-semibold text-slate-600 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {transactions.length > 0 ? (
                                                    transactions.map((tx: any) => {
                                                        const isCredit = ['DEPOSIT', 'MANUAL_ADJUSTMENT', 'OVERPAYMENT_CREDIT', 'REFUND'].includes(tx.type);
                                                        return (
                                                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                                                <td className="px-6 py-3 text-slate-600 whitespace-nowrap">
                                                                    {new Date(tx.createdAt).toLocaleDateString('en-GB')}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <span className="mono text-xs font-medium text-slate-500">{tx.reference}</span>
                                                                </td>
                                                                {mode === 'FAMILY' && (
                                                                    <td className="px-6 py-3">
                                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tx.account === 'FAMILY' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                            {tx.account === 'FAMILY' ? 'Family Account' : (tx.studentName || 'Child')}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td className="px-6 py-3 text-slate-800">
                                                                    {tx.description}
                                                                    <div className="text-[10px] uppercase text-slate-400 font-bold mt-0.5">{tx.type.replace(/_/g, ' ')}</div>
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <span className={`inline-flex items-center gap-1 font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {isCredit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                                        ₦{tx.amount.toLocaleString('en-NG')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right mono font-semibold text-slate-700 whitespace-nowrap">
                                                                    ₦{tx.balanceAfter.toLocaleString('en-NG')}
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <button
                                                                        onClick={() => openReceipt(tx)}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                                        title="Print Receipt"
                                                                    >
                                                                        <Printer className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={mode === 'FAMILY' ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                                                             No transactions found for this wallet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </div>
            </div>

            {showFundModal && (
                <FundWalletModal 
                    targetId={targetId} 
                    mode={mode}
                    onClose={() => setShowFundModal(false)} 
                    onSuccess={() => {
                        setShowFundModal(false);
                        fetchWallet(targetId);
                    }} 
                />
            )}

            {showAllocateModal && (
                <AllocateCreditModal 
                    targetId={targetId} 
                    mode={mode}
                    walletBalance={Number(displayBalance || 0)}
                    onClose={() => setShowAllocateModal(false)} 
                    onSuccess={() => {
                        setShowAllocateModal(false);
                        fetchWallet(targetId);
                    }}
                />
            )}

            {printTx && (
                <ReceiptPrintModal
                    tx={printTx}
                    settings={receiptSettings}
                    onClose={() => setPrintTx(null)}
                />
            )}
        </>
    );
}
