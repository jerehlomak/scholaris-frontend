import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-dash max-w-lg mx-auto px-4">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-500 mb-8">
                Your payment process was cancelled and no charges were made. You can attempt the payment again from your fees dashboard.
            </p>
            <button onClick={() => navigate('/parent/fees')} className="bg-[#1E4DA6] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#00287a] transition-all">
                Return to Fees
            </button>
        </div>
    );
}
