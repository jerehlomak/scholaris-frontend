import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Wallet, CreditCard, Receipt } from 'lucide-react';
import axios from 'axios';

interface VerifyResult {
    status: string;
    amount: number;
    method: string;
    paidAt: string | null;
    note: string | null;
    studentName: string | null;
    receiptNumber: string | null;
}

const METHOD_LABEL: Record<string, string> = {
    FLUTTERWAVE: 'Flutterwave',
    PAYSTACK: 'Paystack',
    MONNIFY: 'Monnify',
    CASH: 'Cash',
    POS: 'POS Terminal',
    BANK_TRANSFER: 'Bank Transfer',
    WALLET: 'Wallet Credit',
};

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const ref = searchParams.get('ref') || searchParams.get('tx_ref') || searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('paymentReference') || searchParams.get('transaction_id');
    const type = searchParams.get('type'); // 'wallet' or null

    const [loading, setLoading] = useState(!!ref);
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ref) {
            // No ref — just show a generic success with redirect
            const t = setTimeout(() => navigate('/parent/fees'), 5000);
            return () => clearTimeout(t);
        }

        // Poll up to 6× (3 seconds between attempts) waiting for webhook to process
        let attempts = 0;
        const maxAttempts = 6;

        const verify = async () => {
            try {
                const { data } = await axios.get(
                    `/api/v1/finance-v2/payment-verify?ref=${ref}`,
                    { withCredentials: true }
                );

                if (data.status === 'PENDING' && attempts < maxAttempts) {
                    attempts++;
                    setTimeout(verify, 3000);
                    return;
                }

                setResult(data);
                setLoading(false);

                if (data.status === 'SUCCESSFUL') {
                    setTimeout(() => navigate(type === 'wallet' ? '/parent/fees' : '/parent/fees'), 8000);
                }
            } catch (err: any) {
                setError(err.response?.data?.msg || 'Unable to verify payment.');
                setLoading(false);
            }
        };

        verify();
    }, [ref, navigate, type]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-dash max-w-lg mx-auto px-4">
                <div className="w-20 h-20 bg-[#1E4DA6]/5 text-[#1E4DA6] rounded-full flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Confirming Payment…</h1>
                <p className="text-gray-500 text-sm">
                    Waiting for gateway confirmation. This may take a few seconds.
                </p>
            </div>
        );
    }

    if (error || (result && result.status !== 'SUCCESSFUL')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-dash max-w-lg mx-auto px-4">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Not Confirmed</h1>
                <p className="text-gray-500 mb-6 text-sm">
                    {error || `Status: ${result?.status}. If you completed the payment, it will be reflected shortly.`}
                </p>
                <button
                    onClick={() => navigate('/parent/fees')}
                    className="bg-[#1E4DA6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#00287a] transition-all"
                >
                    Back to Fees
                </button>
            </div>
        );
    }

    // Generic success (no ref)
    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-dash max-w-lg mx-auto px-4">
                <div className="w-20 h-20 bg-[#10b981]/10 text-[#10b981] rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-500 mb-8 text-sm">
                    Your payment has been processed. Your invoice will be updated shortly.
                </p>
                <button onClick={() => navigate('/parent/fees')} className="bg-[#1E4DA6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#00287a] transition-all">
                    Return to Fees
                </button>
            </div>
        );
    }

    const isWalletDeposit = result.note === 'WALLET_DEPOSIT' || type === 'wallet';

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] font-dash max-w-md mx-auto px-4 py-10">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-[#10b981]/10 text-[#10b981] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                <CheckCircle2 className="w-12 h-12" />
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-1 text-center">
                {isWalletDeposit ? 'Wallet Topped Up!' : 'Payment Successful!'}
            </h1>
            <p className="text-gray-500 text-sm mb-8 text-center">
                {isWalletDeposit
                    ? 'Your wallet has been credited. You can now use it to pay invoices.'
                    : 'Your fees have been paid. A receipt has been generated.'}
            </p>

            {/* Receipt Card */}
            <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden mb-6">
                <div className="bg-[#1E4DA6] px-6 py-4 flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-white/70" />
                    <div>
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Receipt</p>
                        <p className="text-white font-bold text-lg">{result.receiptNumber || ref}</p>
                    </div>
                </div>

                <div className="p-5 space-y-3">
                    {result.studentName && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Student</span>
                            <span className="font-bold text-gray-900">{result.studentName}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount {isWalletDeposit ? 'Credited' : 'Paid'}</span>
                        <span className="font-black text-[#10b981] text-base">
                            ₦{result.amount.toLocaleString('en-NG')}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Method</span>
                        <span className="font-semibold text-gray-900 flex items-center gap-1">
                            {isWalletDeposit ? <Wallet className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            {METHOD_LABEL[result.method] || result.method}
                        </span>
                    </div>
                    {result.paidAt && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date & Time</span>
                            <span className="font-semibold text-gray-700">
                                {new Date(result.paidAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => navigate('/parent/fees')}
                className="bg-[#1E4DA6] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00287a] transition-all w-full"
            >
                {isWalletDeposit ? 'View My Wallet' : 'Back to Fees'}
            </button>
            <p className="text-xs text-gray-400 mt-4">Redirecting automatically in 8 seconds…</p>
        </div>
    );
}
