import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldCheck, Eye, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { SettingsShell } from '../settings/shared/SettingsShell';

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    PENDING:              { color: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
    APPROVED:             { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    REJECTED:             { color: 'bg-red-100 text-red-700', label: 'Rejected' },
    CLARIFICATION_NEEDED: { color: 'bg-[#1E4DA6]/10 text-[#173F8C]', label: 'Needs Clarification' },
};

export default function TransferVerifications() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [_total, setTotal] = useState(0);
    const [filterStatus, setFilterStatus] = useState('PENDING');
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [verifiedAmount, setVerifiedAmount] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '30', ...(filterStatus && { status: filterStatus }) });
            const { data } = await axios.get(`/api/v1/finance-v2/transfers?${params}`, { withCredentials: true });
            setSubmissions(data.submissions || []);
            setTotal(data.total || 0);
        } catch {
            toast.error('Failed to load transfer submissions');
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    const handleAction = async (action: string) => {
        if (!selectedSub) return;
        if (action === 'APPROVE') {
            const parsed = parseFloat(verifiedAmount);
            if (isNaN(parsed) || parsed <= 0) {
                return toast.error('Please enter a valid verified amount greater than ₦0');
            }
        }
        setProcessing(true);
        try {
            await axios.put(
                `/api/v1/finance-v2/transfers/${selectedSub.id}/review`, 
                { 
                    action, 
                    reviewNote, 
                    verifiedAmount: action === 'APPROVE' ? parseFloat(verifiedAmount) : undefined 
                }, 
                { withCredentials: true }
            );
            toast.success(action === 'APPROVE' ? 'Transfer approved — receipt generated' : action === 'REJECT' ? 'Transfer rejected' : 'Clarification requested');
            setSelectedSub(null);
            setReviewNote('');
            setVerifiedAmount('');
            fetchSubmissions();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || e.response?.data?.message || e.message || 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

    return (
        <SettingsShell breadcrumbParent="Finance" breadcrumbCurrent="Transfer Verifications" tabLabel="Verifications" tabIcon={<ShieldCheck className="h-3.5 w-3.5" />}>
            <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transfer Verifications</h1>
                        <p className="text-sm text-slate-500">{pendingCount > 0 ? `${pendingCount} pending review` : 'Review manual bank transfers'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {['PENDING','APPROVED','REJECTED'].map(s => (
                        <Button key={s} size="sm" variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s)}
                            className={filterStatus === s ? 'bg-violet-600 hover:bg-violet-700' : ''}>
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : submissions.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
                    <ShieldCheck className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                    <p className="font-medium text-slate-500">No {filterStatus.toLowerCase()} submissions</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map(sub => {
                        const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG['PENDING'];
                        return (
                            <Card key={sub.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900">
                                                    {sub.student?.user?.name}
                                                </p>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>{sc.label}</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500">
                                                <span><strong className="text-slate-700">Amount:</strong> ₦{Number(sub.amount).toLocaleString()}</span>
                                                <span><strong className="text-slate-700">Sender:</strong> {sub.senderName}</span>
                                                <span><strong className="text-slate-700">Bank:</strong> {sub.senderBank || '—'}</span>
                                                <span><strong className="text-slate-700">Ref:</strong> {sub.transferReference || '—'}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">Submitted: {new Date(sub.createdAt).toLocaleString()}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => { setSelectedSub(sub); setReviewNote(''); setVerifiedAmount(String(sub.amount)); }}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Review
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Review Modal */}
            {selectedSub && (
                <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
                    <DialogContent className="sm:max-w-[800px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Review Transfer Submission</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Evidence Preview (Left side on desktop) */}
                            {selectedSub.evidenceUrl && (
                                <div className="rounded-lg overflow-hidden border border-slate-200 h-full min-h-[300px] max-h-[500px] flex items-center justify-center bg-slate-50">
                                    {selectedSub.evidenceUrl.includes('.pdf') ? (
                                        <a href={selectedSub.evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-4 text-sm text-[#1E4DA6] hover:text-[#122F69]">
                                            View PDF Evidence →
                                        </a>
                                    ) : (
                                        <img src={selectedSub.evidenceUrl} alt="Transfer Evidence" className="w-full h-full object-contain" />
                                    )}
                                </div>
                            )}

                            {/* Details (Right side on desktop) */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500">Student</p>
                                        <p className="font-semibold">{selectedSub.student?.user?.name}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500">Claimed Amount</p>
                                        <p className="font-semibold text-lg text-slate-800">₦{Number(selectedSub.amount).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500">Sender Name</p>
                                        <p className="font-medium">{selectedSub.senderName}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500">Transfer Reference</p>
                                        <p className="font-mono text-xs">{selectedSub.transferReference || '—'}</p>
                                    </div>
                                </div>

                                {/* Verified Amount Box */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <label className="font-bold text-emerald-900">Verified Amount Received (₦) *</label>
                                        {Number(verifiedAmount) !== Number(selectedSub.amount) && (
                                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                                Adjusted from ₦{Number(selectedSub.amount).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={verifiedAmount}
                                        onChange={(e) => setVerifiedAmount(e.target.value)}
                                        className="h-10 text-base font-bold text-emerald-950 bg-white border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                                        placeholder="Enter verified bank amount"
                                    />
                                    <p className="text-[11px] text-emerald-700">
                                        Adjust this amount if the bank slip shows a different sum than claimed.
                                    </p>
                                </div>

                                {selectedSub.note && (
                                    <div className="rounded-lg bg-[#1E4DA6]/5 p-3 text-sm text-[#122F69]">
                                        <strong>Parent Note:</strong> {selectedSub.note}
                                    </div>
                                )}

                                {/* Review Note */}
                                <div className="space-y-2 flex-1">
                                    <label className="text-xs font-medium text-slate-600">Review Note (optional for Approve, required for Reject)</label>
                                    <textarea
                                        className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="Add a note for the parent..."
                                        value={reviewNote}
                                        onChange={e => setReviewNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-2 flex-col sm:flex-row">
                            <Button variant="outline" onClick={() => handleAction('CLARIFICATION_NEEDED')} disabled={processing} className="text-[#173F8C] border-[#1E4DA6]/20 hover:bg-[#1E4DA6]/5 w-full sm:w-auto mb-2 sm:mb-0">
                                <AlertCircle className="mr-1.5 h-4 w-4" />
                                Request Clarification
                            </Button>
                            <Button onClick={() => handleAction('REJECT')} disabled={processing} variant="destructive" className="text-white w-full sm:w-auto mb-2 sm:mb-0 sm:ml-2">
                                <XCircle className="mr-1.5 h-4 w-4" />
                                Reject
                            </Button>
                            <Button onClick={() => handleAction('APPROVE')} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto sm:ml-2">
                                {processing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
                                Approve & Issue Receipt
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            </div>
        </SettingsShell>
    );
}
