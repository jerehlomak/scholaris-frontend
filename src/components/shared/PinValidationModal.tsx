import { useState } from 'react';
import axios from 'axios';
import { KeyRound, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface PinValidationModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    title?: string;
    description?: string;
    pinType?: string;
    usageContext?: string;
    action?: string;
    metadata?: any;
}

export default function PinValidationModal({ 
    isOpen, 
    onSuccess,
    title = 'Secure Access',
    description = 'Please enter a valid prepaid scratch card PIN to securely access this resource.',
    pinType = 'RESULT_CHECKING',
    usageContext = 'RESULT_VERIFICATION',
    action = 'VIEWED_TERM_RESULT',
    metadata = {}
}: PinValidationModalProps) {
    const { user } = useAuth();
    const [pinCode, setPinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pinCode.trim().length < 8) {
            setError('PIN code is too short. Please check your card.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/v1/pins/validate', {
                pinCode: pinCode.trim(),
                studentId: user?.id,
                pinType,
                usageContext,
                action,
                metadata
            }, { withCredentials: true });
            
            toast.success('PIN successfully validated!');
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred while validating the PIN.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div 
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
                style={{ animation: 'dashRise 0.3s ease-out' }}
            >
                {/* Header Graphic */}
                <div className="relative h-32 bg-gradient-to-br from-[#173F8C] to-indigo-800 p-6 flex flex-col justify-end overflow-hidden">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                    
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md shadow-inner">
                            <KeyRound size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                            <p className="text-sm font-medium text-white/80">{description}</p>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Prepaid Scratch Card PIN
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                                placeholder="e.g. BTNX-1234-ABCD"
                                disabled={loading}
                                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 pl-11 font-mono text-lg font-bold tracking-widest text-slate-800 transition-colors focus:border-[#1E4DA6] focus:bg-white focus:outline-none disabled:opacity-50"
                                maxLength={24}
                            />
                            <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                        </div>
                        {error && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p className="font-medium leading-tight">{error}</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !pinCode}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E4DA6] px-4 py-3.5 text-sm font-bold tracking-wider text-white transition-all hover:bg-[#173F8C] active:scale-95 disabled:pointer-events-none disabled:opacity-50 shadow-md shadow-[#1E4DA6]/20 hover:shadow-lg"
                    >
                        {loading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Verifying Secure PIN...</>
                        ) : (
                            <><KeyRound className="h-4 w-4" /> Unlock Access</>
                        )}
                    </button>
                    <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
                        This PIN will be permanently linked to your Student Profile upon successful validation.
                    </p>
                </form>
            </div>
            <style>{`
                @keyframes dashRise {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
